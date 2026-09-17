import assert from 'node:assert/strict';
import test from 'node:test';

import { resolveCircleCollision } from '../src/scripts/skill-physics.ts';

function circle(overrides = {}) {
	return {
		x: 0,
		y: 0,
		vx: 0,
		vy: 0,
		radius: 10,
		inverseMass: 1,
		material: 'marble',
		...overrides,
	};
}

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
