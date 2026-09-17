import assert from 'node:assert/strict';
import test from 'node:test';

import {
	applyFloorFriction,
	calculateCircleInverseMass,
	resolveCircleCollision,
	SKILL_PHYSICS_TUNING,
	stabilizePhysicsCircle,
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
