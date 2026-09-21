export type PhysicsMaterial = 'bubble' | 'marble';

export interface PhysicsCircle {
	x: number;
	y: number;
	vx: number;
	vy: number;
	angle: number;
	angularVelocity: number;
	radius: number;
	inverseMass: number;
	material: PhysicsMaterial;
}

export interface CollisionResult {
	readonly normalX: number;
	readonly normalY: number;
	readonly overlap: number;
	readonly impulse: number;
	readonly frictionImpulse: number;
}

export interface PointerKinematics {
	readonly x: number;
	readonly y: number;
	readonly vx: number;
	readonly vy: number;
}

export interface BubblePointerInfluence {
	readonly impulseX: number;
	readonly impulseY: number;
	readonly normalX: number;
	readonly normalY: number;
	readonly deformation: number;
}

export interface OscillatorState {
	readonly position: number;
	readonly velocity: number;
}

export const CIRCLE_BOUNDARY = Object.freeze({
	left: 1,
	right: 2,
	top: 4,
	bottom: 8,
});

export type AmbientBurstTrigger = 'side' | 'ceiling' | 'lifetime';

export function getAmbientBurstTrigger(
	contacts: number,
	age: number,
	lifetime: number,
): AmbientBurstTrigger | undefined {
	if (!Number.isInteger(contacts) || contacts < 0) {
		return undefined;
	}

	if (contacts & (CIRCLE_BOUNDARY.left | CIRCLE_BOUNDARY.right)) {
		return 'side';
	}

	if (contacts & CIRCLE_BOUNDARY.top) {
		return 'ceiling';
	}

	if (
		Number.isFinite(age) &&
		Number.isFinite(lifetime) &&
		age >= 0 &&
		lifetime > 0 &&
		age >= lifetime
	) {
		return 'lifetime';
	}

	return undefined;
}

export function getCircleBoundaryContacts(
	body: Pick<PhysicsCircle, 'x' | 'y' | 'radius'>,
	width: number,
	height: number,
): number {
	if (
		![body.x, body.y, body.radius, width, height].every(Number.isFinite) ||
		body.radius <= 0 ||
		width <= body.radius * 2 ||
		height <= body.radius * 2
	) {
		return 0;
	}

	let contacts = 0;
	if (body.x < body.radius) contacts |= CIRCLE_BOUNDARY.left;
	if (body.x > width - body.radius) contacts |= CIRCLE_BOUNDARY.right;
	if (body.y < body.radius) contacts |= CIRCLE_BOUNDARY.top;
	if (body.y > height - body.radius) contacts |= CIRCLE_BOUNDARY.bottom;
	return contacts;
}

interface FrictionCoefficients {
	readonly static: number;
	readonly dynamic: number;
}

export const SKILL_PHYSICS_TUNING = Object.freeze({
	gravity: 1_650,
	bubbleNetBuoyancy: 160,
	marbleRestitution: 0.58,
	bubbleRestitution: 0.22,
	mixedRestitution: 0.28,
	restingCollisionSpeed: 34,
	floorStaticFriction: 1.15,
	floorDynamicFriction: 0.92,
	floorRollingResistance: 0.085,
	marbleStaticFriction: 0.68,
	marbleDynamicFriction: 0.5,
	mixedStaticFriction: 0.1,
	mixedDynamicFriction: 0.065,
	bubbleStaticFriction: 0.025,
	bubbleDynamicFriction: 0.012,
	bubbleWobbleFrequency: 4.2,
	bubbleWobbleDamping: 0.16,
	bubbleMaximumDeformation: 0.24,
	bubbleDeformationImpulse: 32,
	maximumLinearSpeed: 1_600,
	maximumAngularSpeed: 32,
});

const FULL_ROTATION = Math.PI * 2;

function clamp(value: number, minimum: number, maximum: number): number {
	return Math.min(Math.max(value, minimum), maximum);
}

function getRestitution(left: PhysicsCircle, right: PhysicsCircle): number {
	if (left.material === 'bubble' && right.material === 'bubble') {
		return SKILL_PHYSICS_TUNING.bubbleRestitution;
	}

	if (left.material === 'marble' && right.material === 'marble') {
		return SKILL_PHYSICS_TUNING.marbleRestitution;
	}

	return SKILL_PHYSICS_TUNING.mixedRestitution;
}

function getFriction(left: PhysicsCircle, right: PhysicsCircle): FrictionCoefficients {
	if (left.material === 'marble' && right.material === 'marble') {
		return {
			static: SKILL_PHYSICS_TUNING.marbleStaticFriction,
			dynamic: SKILL_PHYSICS_TUNING.marbleDynamicFriction,
		};
	}

	if (left.material === 'bubble' && right.material === 'bubble') {
		return {
			static: SKILL_PHYSICS_TUNING.bubbleStaticFriction,
			dynamic: SKILL_PHYSICS_TUNING.bubbleDynamicFriction,
		};
	}

	return {
		static: SKILL_PHYSICS_TUNING.mixedStaticFriction,
		dynamic: SKILL_PHYSICS_TUNING.mixedDynamicFriction,
	};
}

function getInverseInertia(body: PhysicsCircle): number {
	return body.inverseMass === 0 ? 0 : (2 * body.inverseMass) / (body.radius * body.radius);
}

export function calculateCircleInverseMass(radius: number, density: number): number {
	if (
		!Number.isFinite(radius) ||
		!Number.isFinite(density) ||
		radius <= 0 ||
		density <= 0
	) {
		return 0;
	}

	return 1 / (Math.PI * radius * radius * density);
}

export function calculateBubblePointerInfluence(
	body: Pick<PhysicsCircle, 'x' | 'y' | 'radius'>,
	pointer: PointerKinematics,
	rangePadding = 74,
): BubblePointerInfluence | undefined {
	if (
		![body.x, body.y, body.radius, pointer.x, pointer.y, pointer.vx, pointer.vy, rangePadding]
			.every(Number.isFinite) ||
		body.radius <= 0 ||
		rangePadding < 0
	) {
		return undefined;
	}

	const deltaX = body.x - pointer.x;
	const deltaY = body.y - pointer.y;
	const distance = Math.max(Math.hypot(deltaX, deltaY), 1);
	const range = body.radius + rangePadding;
	if (distance >= range) {
		return undefined;
	}

	const influence = 1 - distance / range;
	const normalX = deltaX / distance;
	const normalY = deltaY / distance;
	const pointerSpeed = Math.hypot(pointer.vx, pointer.vy);
	const transfer = 0.04 * influence;

	return {
		impulseX: normalX * 8 * influence + pointer.vx * transfer,
		impulseY: normalY * 8 * influence + pointer.vy * transfer,
		normalX,
		normalY,
		deformation: Math.min(0.22, influence * (0.04 + pointerSpeed / 7_500)),
	};
}

export function stepDampedOscillator(
	position: number,
	velocity: number,
	elapsed: number,
	frequency: number,
	dampingRatio: number,
): OscillatorState {
	if (
		![position, velocity, elapsed, frequency, dampingRatio].every(Number.isFinite) ||
		elapsed <= 0 ||
		frequency <= 0 ||
		dampingRatio < 0
	) {
		return { position: 0, velocity: 0 };
	}

	const angularFrequency = Math.PI * 2 * frequency;
	const acceleration =
		-angularFrequency * angularFrequency * position -
		2 * dampingRatio * angularFrequency * velocity;
	const nextVelocity = velocity + acceleration * elapsed;
	const nextPosition = position + nextVelocity * elapsed;

	if (Math.abs(nextPosition) < 0.0001 && Math.abs(nextVelocity) < 0.001) {
		return { position: 0, velocity: 0 };
	}

	return { position: nextPosition, velocity: nextVelocity };
}

export function stabilizePhysicsCircle(
	body: PhysicsCircle,
	maximumLinearSpeed = SKILL_PHYSICS_TUNING.maximumLinearSpeed,
	maximumAngularSpeed = SKILL_PHYSICS_TUNING.maximumAngularSpeed,
): boolean {
	const values = [
		body.x,
		body.y,
		body.vx,
		body.vy,
		body.angle,
		body.angularVelocity,
		body.radius,
		body.inverseMass,
	];

	if (
		values.some((value) => !Number.isFinite(value)) ||
		body.radius <= 0 ||
		body.inverseMass < 0 ||
		!Number.isFinite(maximumLinearSpeed) ||
		!Number.isFinite(maximumAngularSpeed) ||
		maximumLinearSpeed <= 0 ||
		maximumAngularSpeed <= 0
	) {
		return false;
	}

	const speed = Math.hypot(body.vx, body.vy);
	if (speed > maximumLinearSpeed) {
		const scale = maximumLinearSpeed / speed;
		body.vx *= scale;
		body.vy *= scale;
	}

	body.angularVelocity = clamp(
		body.angularVelocity,
		-maximumAngularSpeed,
		maximumAngularSpeed,
	);
	body.angle = ((body.angle % FULL_ROTATION) + FULL_ROTATION) % FULL_ROTATION;

	return true;
}

export function resolveCircleCollision(
	left: PhysicsCircle,
	right: PhysicsCircle,
): CollisionResult | undefined {
	const deltaX = right.x - left.x;
	const deltaY = right.y - left.y;
	const minimumDistance = left.radius + right.radius;
	const squaredDistance = deltaX * deltaX + deltaY * deltaY;

	if (squaredDistance >= minimumDistance * minimumDistance) {
		return undefined;
	}

	const distance = Math.max(Math.sqrt(squaredDistance), 0.0001);
	const normalX = squaredDistance === 0 ? 1 : deltaX / distance;
	const normalY = squaredDistance === 0 ? 0 : deltaY / distance;
	const overlap = minimumDistance - distance;
	const inverseMassSum = left.inverseMass + right.inverseMass;

	if (inverseMassSum === 0) {
		return { normalX, normalY, overlap, impulse: 0, frictionImpulse: 0 };
	}

	const correction = Math.max(overlap - 0.01, 0) / inverseMassSum;
	left.x -= normalX * correction * left.inverseMass;
	left.y -= normalY * correction * left.inverseMass;
	right.x += normalX * correction * right.inverseMass;
	right.y += normalY * correction * right.inverseMass;

	const relativeVelocityX = right.vx - left.vx;
	const relativeVelocityY = right.vy - left.vy;
	const normalVelocity = relativeVelocityX * normalX + relativeVelocityY * normalY;

	if (normalVelocity >= 0) {
		return { normalX, normalY, overlap, impulse: 0, frictionImpulse: 0 };
	}

	const restitution = Math.abs(normalVelocity) < SKILL_PHYSICS_TUNING.restingCollisionSpeed
		? 0
		: getRestitution(left, right);
	const impulse = (-(1 + restitution) * normalVelocity) / inverseMassSum;
	const impulseX = impulse * normalX;
	const impulseY = impulse * normalY;

	left.vx -= impulseX * left.inverseMass;
	left.vy -= impulseY * left.inverseMass;
	right.vx += impulseX * right.inverseMass;
	right.vy += impulseY * right.inverseMass;

	const tangentX = -normalY;
	const tangentY = normalX;
	const leftContactVelocityX = left.vx - left.angularVelocity * normalY * left.radius;
	const leftContactVelocityY = left.vy + left.angularVelocity * normalX * left.radius;
	const rightContactVelocityX = right.vx + right.angularVelocity * normalY * right.radius;
	const rightContactVelocityY = right.vy - right.angularVelocity * normalX * right.radius;
	const tangentialVelocity =
		(rightContactVelocityX - leftContactVelocityX) * tangentX +
		(rightContactVelocityY - leftContactVelocityY) * tangentY;
	const leftInverseInertia = getInverseInertia(left);
	const rightInverseInertia = getInverseInertia(right);
	const tangentMass =
		inverseMassSum +
		left.radius * left.radius * leftInverseInertia +
		right.radius * right.radius * rightInverseInertia;
	const unconstrainedFrictionImpulse = -tangentialVelocity / tangentMass;
	const friction = getFriction(left, right);
	const maximumStaticImpulse = friction.static * impulse;
	const frictionImpulse = Math.abs(unconstrainedFrictionImpulse) <= maximumStaticImpulse
		? unconstrainedFrictionImpulse
		: -Math.sign(tangentialVelocity) * friction.dynamic * impulse;
	const frictionImpulseX = frictionImpulse * tangentX;
	const frictionImpulseY = frictionImpulse * tangentY;

	left.vx -= frictionImpulseX * left.inverseMass;
	left.vy -= frictionImpulseY * left.inverseMass;
	right.vx += frictionImpulseX * right.inverseMass;
	right.vy += frictionImpulseY * right.inverseMass;
	left.angularVelocity -= left.radius * frictionImpulse * leftInverseInertia;
	right.angularVelocity -= right.radius * frictionImpulse * rightInverseInertia;

	return { normalX, normalY, overlap, impulse, frictionImpulse };
}

export function applyFloorFriction(
	body: PhysicsCircle,
	elapsed: number,
	gravity = SKILL_PHYSICS_TUNING.gravity,
): void {
	if (
		body.material !== 'marble' ||
		body.inverseMass === 0 ||
		!Number.isFinite(elapsed) ||
		!Number.isFinite(gravity) ||
		elapsed <= 0 ||
		gravity <= 0
	) {
		return;
	}

	const inverseInertia = getInverseInertia(body);
	const contactVelocity = body.vx - body.angularVelocity * body.radius;
	const tangentMass = body.inverseMass + body.radius * body.radius * inverseInertia;
	const unconstrainedImpulse = -contactVelocity / tangentMass;
	const normalImpulse = (gravity * elapsed) / body.inverseMass;
	const maximumStaticImpulse = SKILL_PHYSICS_TUNING.floorStaticFriction * normalImpulse;
	const frictionImpulse = Math.abs(unconstrainedImpulse) <= maximumStaticImpulse
		? unconstrainedImpulse
		: -Math.sign(contactVelocity) * SKILL_PHYSICS_TUNING.floorDynamicFriction * normalImpulse;

	body.vx += frictionImpulse * body.inverseMass;
	body.angularVelocity -= body.radius * frictionImpulse * inverseInertia;

	const rollingDeceleration =
		SKILL_PHYSICS_TUNING.floorRollingResistance * gravity * elapsed;
	if (Math.abs(body.vx) <= rollingDeceleration) {
		body.vx = 0;
		body.angularVelocity = 0;
	} else {
		body.vx -= Math.sign(body.vx) * rollingDeceleration;
	}
}
