import assert from 'node:assert/strict';
import test from 'node:test';

import {
	applyFloorFriction,
	calculateBubblePointerInfluence,
	calculateCircleInverseMass,
	CIRCLE_BOUNDARY,
	getCircleBoundaryContacts,
	resolveCircleCollision,
	SKILL_PHYSICS_TUNING,
	stabilizePhysicsCircle,
	stepDampedOscillator,
} from '../src/scripts/skill-physics.ts';

function circle(overrides = {}) {
	return {
		x: 0,
		y: 0,
		vx: 0,
		vy: 0,
		angle: 0,
		angularVelocity: 0,
		radius: 10,
		inverseMass: 1,
		material: 'marble',
		...overrides,
	};
}

test('physics tuning is immutable and keeps material relationships explicit', () => {
	assert.equal(Object.isFrozen(SKILL_PHYSICS_TUNING), true);
	assert.ok(SKILL_PHYSICS_TUNING.floorStaticFriction > SKILL_PHYSICS_TUNING.floorDynamicFriction);
	assert.ok(SKILL_PHYSICS_TUNING.marbleStaticFriction > SKILL_PHYSICS_TUNING.marbleDynamicFriction);
	assert.ok(SKILL_PHYSICS_TUNING.bubbleRestitution < SKILL_PHYSICS_TUNING.marbleRestitution);
	assert.ok(SKILL_PHYSICS_TUNING.bubbleNetBuoyancy > 0);
});

test('circle mass follows area and rejects invalid geometry', () => {
	const smallInverseMass = calculateCircleInverseMass(10, 1);
	const largeInverseMass = calculateCircleInverseMass(20, 1);

	assert.ok(Math.abs(smallInverseMass / largeInverseMass - 4) < 0.0001);
	assert.equal(calculateCircleInverseMass(0, 1), 0);
	assert.equal(calculateCircleInverseMass(10, Number.NaN), 0);
});

test('pointer motion pushes and deforms nearby bubbles', () => {
	const bubble = circle({ material: 'bubble', radius: 20, x: 50, y: 50 });
	const influence = calculateBubblePointerInfluence(
		bubble,
		{ x: 40, y: 50, vx: 300, vy: 0 },
		20,
	);

	assert.ok(influence);
	assert.ok(influence.impulseX > 0);
	assert.equal(influence.impulseY, 0);
	assert.ok(influence.deformation > 0 && influence.deformation <= 0.22);
});

test('pointer influence ignores distant and malformed contacts', () => {
	const bubble = circle({ material: 'bubble', radius: 20, x: 50, y: 50 });

	assert.equal(
		calculateBubblePointerInfluence(bubble, { x: 200, y: 50, vx: 0, vy: 0 }),
		undefined,
	);
	assert.equal(
		calculateBubblePointerInfluence(bubble, { x: Number.NaN, y: 50, vx: 0, vy: 0 }),
		undefined,
	);
});

test('bubble deformation oscillates repeatedly and settles through damping', () => {
	let position = 0;
	let velocity = 8;
	let previousSign = 0;
	let signChanges = 0;
	let maximumPosition = 0;

	for (let step = 0; step < 360; step += 1) {
		const state = stepDampedOscillator(position, velocity, 1 / 120, 4.2, 0.16);
		position = state.position;
		velocity = state.velocity;
		maximumPosition = Math.max(maximumPosition, Math.abs(position));
		const sign = Math.sign(position);
		if (previousSign !== 0 && sign !== 0 && sign !== previousSign) {
			signChanges += 1;
		}
		if (sign !== 0) previousSign = sign;
	}

	assert.ok(signChanges >= 6);
	assert.ok(maximumPosition > 0.1);
	assert.ok(Math.abs(position) < 0.001);
	assert.ok(Math.abs(velocity) < 0.02);
});

test('bubble oscillator fails closed for malformed inputs', () => {
	assert.deepEqual(stepDampedOscillator(Number.NaN, 1, 1 / 120, 4.2, 0.16), {
		position: 0,
		velocity: 0,
	});
	assert.deepEqual(stepDampedOscillator(0, 1, -1, 4.2, 0.16), {
		position: 0,
		velocity: 0,
	});
});

test('circle boundary contacts identify every wall independently', () => {
	const field = { width: 200, height: 120 };
	assert.equal(
		getCircleBoundaryContacts({ x: 9, y: 60, radius: 10 }, field.width, field.height),
		CIRCLE_BOUNDARY.left,
	);
	assert.equal(
		getCircleBoundaryContacts({ x: 191, y: 60, radius: 10 }, field.width, field.height),
		CIRCLE_BOUNDARY.right,
	);
	assert.equal(
		getCircleBoundaryContacts({ x: 100, y: 9, radius: 10 }, field.width, field.height),
		CIRCLE_BOUNDARY.top,
	);
	assert.equal(
		getCircleBoundaryContacts({ x: 100, y: 111, radius: 10 }, field.width, field.height),
		CIRCLE_BOUNDARY.bottom,
	);
});

test('circle boundary contacts fail closed for invalid geometry', () => {
	assert.equal(getCircleBoundaryContacts({ x: 0, y: 0, radius: 0 }, 100, 100), 0);
	assert.equal(getCircleBoundaryContacts({ x: 0, y: 0, radius: 10 }, 20, 100), 0);
	assert.equal(getCircleBoundaryContacts({ x: Number.NaN, y: 0, radius: 10 }, 100, 100), 0);
});

test('separated circles do not produce a collision', () => {
	const left = circle();
	const right = circle({ x: 21 });

	assert.equal(resolveCircleCollision(left, right), undefined);
});

test('overlapping marbles separate and bounce in opposite directions', () => {
	const left = circle({ vx: 100 });
	const right = circle({ x: 18, vx: -100 });
	const collision = resolveCircleCollision(left, right);

	assert.ok(collision);
	assert.ok(collision.overlap > 0);
	assert.ok(left.x < 0);
	assert.ok(right.x > 18);
	assert.ok(left.vx < 0);
	assert.ok(right.vx > 0);
});

test('a light bubble receives more velocity change than a dense marble', () => {
	const marble = circle({ vx: 80, inverseMass: 0.1 });
	const bubble = circle({ x: 18, vx: -20, inverseMass: 1, material: 'bubble' });
	const marbleVelocityBefore = marble.vx;
	const bubbleVelocityBefore = bubble.vx;

	resolveCircleCollision(marble, bubble);

	const marbleDelta = Math.abs(marble.vx - marbleVelocityBefore);
	const bubbleDelta = Math.abs(bubble.vx - bubbleVelocityBefore);
	assert.ok(bubbleDelta > marbleDelta);
});

test('coincident stationary circles are separated without non-finite values', () => {
	const left = circle();
	const right = circle();

	const collision = resolveCircleCollision(left, right);

	assert.ok(collision);
	assert.ok(Number.isFinite(left.x));
	assert.ok(Number.isFinite(right.x));
	assert.ok(left.x < right.x);
});

test('strong marble contact friction transfers tangential motion into rotation', () => {
	const left = circle({ vx: 100, vy: 200 });
	const right = circle({ x: 18, vx: -100, vy: -200 });

	const collision = resolveCircleCollision(left, right);

	assert.ok(collision);
	assert.ok(Math.abs(collision.frictionImpulse) > 60);
	assert.notEqual(left.angularVelocity, 0);
	assert.notEqual(right.angularVelocity, 0);
});

test('bubble collisions lose most of their normal rebound speed', () => {
	const left = circle({ vx: 100, material: 'bubble' });
	const right = circle({ x: 18, vx: -100, material: 'bubble' });

	resolveCircleCollision(left, right);

	assert.ok(left.vx < 0);
	assert.ok(right.vx > 0);
	assert.ok(Math.abs(left.vx) < 30);
	assert.ok(Math.abs(right.vx) < 30);
});

test('strong floor friction slows a sliding marble and starts rolling it', () => {
	const marble = circle({ vx: 240 });

	applyFloorFriction(marble, 1 / 120);

	assert.ok(marble.vx < 228);
	assert.ok(marble.angularVelocity > 0);
	assert.ok(Math.abs(marble.vx - marble.angularVelocity * marble.radius) < 240);
});

test('floor static friction brings a nearly resting marble to a full stop', () => {
	const marble = circle({ vx: 0.2, angularVelocity: 0.019 });

	applyFloorFriction(marble, 1 / 120);

	assert.equal(marble.vx, 0);
	assert.equal(marble.angularVelocity, 0);
});

test('physics stabilization caps extreme linear and angular velocities', () => {
	const marble = circle({
		vx: 3_000,
		vy: 4_000,
		angle: -Math.PI,
		angularVelocity: 80,
	});

	assert.equal(stabilizePhysicsCircle(marble, 1_000, 20), true);
	assert.ok(Math.abs(Math.hypot(marble.vx, marble.vy) - 1_000) < 0.0001);
	assert.equal(marble.angularVelocity, 20);
	assert.ok(marble.angle >= 0 && marble.angle < Math.PI * 2);
});

test('physics stabilization rejects corrupt circle state', () => {
	assert.equal(stabilizePhysicsCircle(circle({ x: Number.NaN })), false);
	assert.equal(stabilizePhysicsCircle(circle({ radius: 0 })), false);
	assert.equal(stabilizePhysicsCircle(circle({ inverseMass: -1 })), false);
	assert.equal(stabilizePhysicsCircle(circle(), Number.NaN), false);
});

test('floor friction ignores invalid time and gravity inputs without corrupting state', () => {
	const marble = circle({ vx: 120 });

	applyFloorFriction(marble, Number.NaN);
	applyFloorFriction(marble, 1 / 120, Number.NaN);

	assert.equal(marble.vx, 120);
	assert.equal(marble.angularVelocity, 0);
});
