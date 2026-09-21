import {
	applyFloorFriction,
	calculateBubblePointerInfluence,
	calculateCircleInverseMass,
	resolveCircleCollision,
	SKILL_PHYSICS_TUNING,
	stabilizePhysicsCircle,
	stepDampedOscillator,
	type PhysicsCircle,
	type PhysicsMaterial,
	type PointerKinematics,
} from './skill-physics-core.ts';

export {
	applyFloorFriction,
	calculateBubblePointerInfluence,
	calculateCircleInverseMass,
	resolveCircleCollision,
	SKILL_PHYSICS_TUNING,
	stabilizePhysicsCircle,
	stepDampedOscillator,
} from './skill-physics-core.ts';
export type {
	CollisionResult,
	OscillatorState,
	PhysicsCircle,
	PhysicsMaterial,
	PointerKinematics,
} from './skill-physics-core.ts';

interface RenderedCircle extends PhysicsCircle {
	readonly element: HTMLElement;
	readonly phase: number;
	readonly density: number;
	readonly role: 'ambient' | 'skill';
	readonly initialXRatio: number;
	readonly initialYRatio: number;
	deformationModeX: number;
	deformationModeY: number;
	deformationVelocityX: number;
	deformationVelocityY: number;
	burstCount: number;
	respawnAt: number;
	isBursting: boolean;
	dragPointerId?: number;
	dragOffsetX: number;
	dragOffsetY: number;
}

interface ActivePointer {
	x: number;
	y: number;
	vx: number;
	vy: number;
	readonly pointerType: string;
	lastTime: number;
	isPressed: boolean;
}

const FIXED_TIME_STEP = 1 / 120;
const MAX_FRAME_TIME = 1 / 20;
const SOLVER_ITERATIONS = 5;
const DRAG_VELOCITY_SMOOTHING = 0.38;
const BOUNDARY_LEFT = 1;
const BOUNDARY_RIGHT = 2;
const BOUNDARY_TOP = 4;
const BOUNDARY_BOTTOM = 8;
const BURST_BOUNDARIES = BOUNDARY_LEFT | BOUNDARY_RIGHT | BOUNDARY_TOP;
const {
	bubbleNetBuoyancy: BUBBLE_NET_BUOYANCY,
	bubbleRestitution: BUBBLE_RESTITUTION,
	bubbleDeformationImpulse: BUBBLE_DEFORMATION_IMPULSE,
	bubbleMaximumDeformation: BUBBLE_MAXIMUM_DEFORMATION,
	bubbleWobbleDamping: BUBBLE_WOBBLE_DAMPING,
	bubbleWobbleFrequency: BUBBLE_WOBBLE_FREQUENCY,
	gravity: GRAVITY,
	marbleRestitution: MARBLE_RESTITUTION,
	maximumAngularSpeed: MAX_ANGULAR_SPEED,
	restingCollisionSpeed: RESTING_COLLISION_SPEED,
} = SKILL_PHYSICS_TUNING;

function clamp(value: number, minimum: number, maximum: number): number {
	return Math.min(Math.max(value, minimum), maximum);
}


function getClosingSpeed(left: PhysicsCircle, right: PhysicsCircle): number {
	const deltaX = right.x - left.x;
	const deltaY = right.y - left.y;
	const distance = Math.max(Math.hypot(deltaX, deltaY), 0.0001);
	const relativeVelocityX = right.vx - left.vx;
	const relativeVelocityY = right.vy - left.vy;

	return Math.max(
		0,
		-(relativeVelocityX * deltaX + relativeVelocityY * deltaY) / distance,
	);
}

function parseNumber(value: string | undefined, fallback: number): number {
	const parsed = Number.parseFloat(value ?? '');
	return Number.isFinite(parsed) ? parsed : fallback;
}

function fitCoordinateToAxis(size: number, radius: number, requested: number): number {
	if (!Number.isFinite(size) || size <= radius * 2) {
		return Math.max(Number.isFinite(size) ? size : 0, 0) / 2;
	}

	return clamp(requested, radius, size - radius);
}

function getInitialCoordinates(
	material: PhysicsMaterial,
	fieldWidth: number,
	fieldHeight: number,
	radius: number,
	xRatio: number,
	yRatio: number,
): { x: number; y: number } {
	return {
		x: fitCoordinateToAxis(fieldWidth, radius, fieldWidth * xRatio),
		y: material === 'marble'
			? fitCoordinateToAxis(fieldHeight, radius, fieldHeight - fieldHeight * yRatio - radius)
			: fitCoordinateToAxis(fieldHeight, radius, fieldHeight * yRatio),
	};
}

function createCircle(
	element: HTMLElement,
	fieldWidth: number,
	fieldHeight: number,
	index: number,
): RenderedCircle {
	const bounds = element.getBoundingClientRect();
	const radius = Math.max(bounds.width / 2, 8);
	const material: PhysicsMaterial = element.dataset.physicsMaterial === 'marble' ? 'marble' : 'bubble';
	const role = element.dataset.physicsRole === 'ambient' ? 'ambient' : 'skill';
	const percentageX = parseNumber(element.dataset.physicsX, 50) / 100;
	const percentageY = parseNumber(element.dataset.physicsY, 50) / 100;
	const density = material === 'marble' ? 1 : 0.055;
	const initial = getInitialCoordinates(
		material,
		role,
		fieldWidth,
		fieldHeight,
		radius,
		percentageX,
		percentageY,
	);

	return {
		element,
		material,
		radius,
		x: initial.x,
		y: initial.y,
		vx: material === 'bubble' ? ((index % 3) - 1) * 13 : 0,
		vy: material === 'bubble' ? -9 - (index % 4) * 2 : 0,
		angle: 0,
		angularVelocity: 0,
		inverseMass: calculateCircleInverseMass(radius, density),
		phase: index * 1.73,
		density,
		initialXRatio: percentageX,
		initialYRatio: percentageY,
		deformationModeX: 0,
		deformationModeY: 0,
		deformationVelocityX: 0,
		deformationVelocityY: 0,
		burstCount: 0,
		respawnAt: 0,
		isBursting: false,
		dragOffsetX: 0,
		dragOffsetY: 0,
	};
}

function resetCircle(body: RenderedCircle, width: number, height: number): void {
	const initial = getInitialCoordinates(
		body.material,
		width,
		height,
		body.radius,
		body.initialXRatio,
		body.initialYRatio,
	);
	body.x = initial.x;
	body.y = initial.y;
	body.vx = 0;
	body.vy = 0;
	body.angle = 0;
	body.angularVelocity = 0;
	body.deformationModeX = 0;
	body.deformationModeY = 0;
	body.deformationVelocityX = 0;
	body.deformationVelocityY = 0;
	body.respawnAt = 0;
	body.isBursting = false;
	body.element.classList.remove('is-bursting');
}

function resizeCircle(
	body: RenderedCircle,
	previousWidth: number,
	previousHeight: number,
	nextWidth: number,
	nextHeight: number,
): void {
	const measuredRadius = Math.max(body.element.getBoundingClientRect().width / 2, 8);
	body.radius = measuredRadius;
	body.inverseMass = calculateCircleInverseMass(measuredRadius, body.density);

	if (previousWidth > 0 && previousHeight > 0 && nextWidth > 0 && nextHeight > 0) {
		const horizontalScale = nextWidth / previousWidth;
		const verticalScale = nextHeight / previousHeight;
		body.x *= horizontalScale;
		body.y *= verticalScale;
		body.vx *= horizontalScale;
		body.vy *= verticalScale;
	} else {
		resetCircle(body, nextWidth, nextHeight);
	}

	constrainToField(body, nextWidth, nextHeight);
}

function constrainToField(
	body: RenderedCircle,
	width: number,
	height: number,
	elapsed = 0,
): number {
	const restitution = body.material === 'marble' ? MARBLE_RESTITUTION : BUBBLE_RESTITUTION;
	let contacts = 0;

	if (!Number.isFinite(width) || width <= body.radius * 2) {
		body.x = Math.max(Number.isFinite(width) ? width : 0, 0) / 2;
		body.vx = 0;
	} else if (body.x < body.radius) {
		contacts |= BOUNDARY_LEFT;
		body.x = body.radius;
		body.vx = Math.abs(body.vx) * restitution;
	} else if (body.x > width - body.radius) {
		contacts |= BOUNDARY_RIGHT;
		body.x = width - body.radius;
		body.vx = -Math.abs(body.vx) * restitution;
	}

	if (!Number.isFinite(height) || height <= body.radius * 2) {
		body.y = Math.max(Number.isFinite(height) ? height : 0, 0) / 2;
		body.vy = 0;
	} else if (body.y < body.radius) {
		contacts |= BOUNDARY_TOP;
		body.y = body.radius;
		body.vy = Math.abs(body.vy) * restitution;
	} else if (body.y > height - body.radius) {
		contacts |= BOUNDARY_BOTTOM;
		body.y = height - body.radius;
		body.vy = -Math.abs(body.vy) * restitution;

		if (body.material === 'marble') {
			applyFloorFriction(body, elapsed);
			if (Math.abs(body.vy) < RESTING_COLLISION_SPEED) {
				body.vy = 0;
			}
		}
	}

	return contacts;
}

function exciteBubbleDeformation(
	body: RenderedCircle,
	impact: number,
	normalX: number,
	normalY: number,
): void {
	if (body.material !== 'bubble' || body.role !== 'skill') {
		return;
	}

	const direction = Math.atan2(normalY, normalX) * 2;
	const velocityImpulse =
		clamp(impact, 0, BUBBLE_MAXIMUM_DEFORMATION) * BUBBLE_DEFORMATION_IMPULSE;
	body.deformationVelocityX += Math.cos(direction) * velocityImpulse;
	body.deformationVelocityY += Math.sin(direction) * velocityImpulse;

	const deformationSpeed = Math.hypot(
		body.deformationVelocityX,
		body.deformationVelocityY,
	);
	const maximumDeformationSpeed =
		BUBBLE_MAXIMUM_DEFORMATION * BUBBLE_DEFORMATION_IMPULSE * 1.35;
	if (deformationSpeed > maximumDeformationSpeed) {
		const scale = maximumDeformationSpeed / deformationSpeed;
		body.deformationVelocityX *= scale;
		body.deformationVelocityY *= scale;
	}
}

function advanceBubbleDeformation(body: RenderedCircle, elapsed: number): void {
	if (body.material !== 'bubble' || body.role !== 'skill') {
		return;
	}

	const horizontal = stepDampedOscillator(
		body.deformationModeX,
		body.deformationVelocityX,
		elapsed,
		BUBBLE_WOBBLE_FREQUENCY,
		BUBBLE_WOBBLE_DAMPING,
	);
	const diagonal = stepDampedOscillator(
		body.deformationModeY,
		body.deformationVelocityY,
		elapsed,
		BUBBLE_WOBBLE_FREQUENCY,
		BUBBLE_WOBBLE_DAMPING,
	);
	body.deformationModeX = horizontal.position;
	body.deformationVelocityX = horizontal.velocity;
	body.deformationModeY = diagonal.position;
	body.deformationVelocityY = diagonal.velocity;
	const deformation = Math.hypot(body.deformationModeX, body.deformationModeY);
	if (deformation > BUBBLE_MAXIMUM_DEFORMATION) {
		const scale = BUBBLE_MAXIMUM_DEFORMATION / deformation;
		body.deformationModeX *= scale;
		body.deformationModeY *= scale;
	}
}

function fractional(value: number): number {
	return value - Math.floor(value);
}

function burstAmbientBubble(body: RenderedCircle, contacts: number, time: number): void {
	if (body.role !== 'ambient' || body.material !== 'bubble' || body.isBursting) {
		return;
	}

	const normalX = (contacts & BOUNDARY_LEFT ? 1 : 0) -
		(contacts & BOUNDARY_RIGHT ? 1 : 0);
	const normalY = contacts & BOUNDARY_TOP ? 1 : 0;
	const variant = body.burstCount % 4;
	const duration = 300 + variant * 45;
	body.burstCount += 1;
	body.isBursting = true;
	body.respawnAt = time + duration + 120;
	body.vx = 0;
	body.vy = 0;
	body.element.style.setProperty('--burst-angle', `${Math.atan2(normalY, normalX)}rad`);
	body.element.style.setProperty('--burst-duration', `${duration}ms`);
	body.element.style.setProperty('--burst-hue', `${variant * 67}deg`);
	body.element.style.setProperty('--burst-rotation', `${35 + variant * 29}deg`);
	body.element.style.setProperty('--burst-scale', String(1.45 + variant * 0.22));
	body.element.classList.add('is-bursting');
}

function respawnAmbientBubble(
	body: RenderedCircle,
	width: number,
	height: number,
): void {
	const horizontalSeed = fractional(Math.sin((body.burstCount + 1) * 12.9898 + body.phase) * 43_758.5453);
	const verticalSeed = fractional(Math.sin((body.burstCount + 1) * 78.233 + body.phase) * 12_345.6789);
	body.x = fitCoordinateToAxis(
		width,
		body.radius,
		body.radius + horizontalSeed * Math.max(width - body.radius * 2, 0),
	);
	body.y = fitCoordinateToAxis(
		height,
		body.radius,
		height - body.radius - verticalSeed * Math.min(height * 0.16, body.radius * 5),
	);
	body.vx = (horizontalSeed - 0.5) * 28;
	body.vy = -24 - verticalSeed * 18;
	body.respawnAt = 0;
	body.isBursting = false;
	body.element.classList.remove('is-bursting');
}

function renderCircle(body: RenderedCircle, fieldHeight: number): void {
	body.element.style.inset = '0 auto auto 0';
	body.element.style.transform = `translate3d(${body.x - body.radius}px, ${body.y - body.radius}px, 0)`;

	if (body.material === 'bubble' && body.role === 'skill') {
		const rawDeformation = Math.hypot(body.deformationModeX, body.deformationModeY);
		const deformation = Math.min(rawDeformation, BUBBLE_MAXIMUM_DEFORMATION);
		const deformationAngle = Math.atan2(body.deformationModeY, body.deformationModeX) / 2;
		body.element.style.setProperty('--deform-x', String(Math.exp(deformation)));
		body.element.style.setProperty('--deform-y', String(Math.exp(-deformation)));
		body.element.style.setProperty('--deform-angle', `${deformationAngle}rad`);
	} else {
		const floorDistance = Math.max(fieldHeight - body.y - body.radius, 0);
		const heightRatio = Math.min(floorDistance / Math.max(fieldHeight * 0.65, 1), 1);

		body.element.style.setProperty('--rotation', `${body.angle}rad`);
		body.element.style.setProperty('--shadow-offset-y', `${floorDistance}px`);
		body.element.style.setProperty('--shadow-scale', String(0.92 + heightRatio * 0.68));
		body.element.style.setProperty('--shadow-opacity', String(0.52 - heightRatio * 0.38));
		body.element.style.setProperty('--shadow-blur', `${0.28 + heightRatio * 0.55}rem`);
	}
}

function findNearestMarble(
	bodies: readonly RenderedCircle[],
	x: number,
	y: number,
): RenderedCircle | undefined {
	let nearest: RenderedCircle | undefined;
	let nearestDistance = Number.POSITIVE_INFINITY;

	for (const body of bodies) {
		if (body.material !== 'marble' || body.dragPointerId !== undefined) {
			continue;
		}

		const distance = Math.hypot(x - body.x, y - body.y);
		if (distance <= body.radius + 14 && distance < nearestDistance) {
			nearest = body;
			nearestDistance = distance;
		}
	}

	return nearest;
}

export function startSkillPhysics(field: HTMLElement): () => void {
	if (field.dataset.physicsReady === 'true') {
		return () => undefined;
	}

	const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
	field.dataset.physicsReady = 'true';
	const elements = Array.from(
		field.querySelectorAll<HTMLElement>('[data-physics-object]'),
	);
	let fieldBounds = field.getBoundingClientRect();
	const bodies = elements.map((element, index) =>
		createCircle(element, fieldBounds.width, fieldBounds.height, index),
	);
	const bodiesByElement = new Map(bodies.map((body) => [body.element, body]));
	const activePointers = new Map<number, ActivePointer>();
	const draggedBodies = new Map<number, RenderedCircle>();
	let previousTime = performance.now();
	let accumulator = 0;
	let animationFrame = 0;
	let isRunning = false;
	let isDestroyed = false;
	let isIntersecting = true;

	const getLocalPointer = (event: PointerEvent): { x: number; y: number } => ({
		x: event.clientX - fieldBounds.left,
		y: event.clientY - fieldBounds.top,
	});

	const updateActivePointer = (
		event: PointerEvent,
		position: { x: number; y: number },
		isPressed?: boolean,
	): ActivePointer => {
		const previous = activePointers.get(event.pointerId);
		const elapsed = previous
			? Math.max((event.timeStamp - previous.lastTime) / 1000, 1 / 240)
			: 0;
		const measuredVelocityX = previous && elapsed > 0
			? (position.x - previous.x) / elapsed
			: 0;
		const measuredVelocityY = previous && elapsed > 0
			? (position.y - previous.y) / elapsed
			: 0;
		const pointer: ActivePointer = {
			x: position.x,
			y: position.y,
			vx: previous
				? previous.vx + (measuredVelocityX - previous.vx) * 0.45
				: measuredVelocityX,
			vy: previous
				? previous.vy + (measuredVelocityY - previous.vy) * 0.45
				: measuredVelocityY,
			pointerType: event.pointerType,
			lastTime: event.timeStamp,
			isPressed: isPressed ?? previous?.isPressed ?? false,
		};
		activePointers.set(event.pointerId, pointer);
		return pointer;
	};

	const applyPointerToBubbles = (
		pointer: ActivePointer,
		rangePadding: number,
		strength = 1,
	): void => {
		for (const body of bodies) {
			if (body.material !== 'bubble' || body.isBursting) {
				continue;
			}

			const influence = calculateBubblePointerInfluence(body, pointer, rangePadding);
			if (!influence) {
				continue;
			}

			body.vx += influence.impulseX * strength;
			body.vy += influence.impulseY * strength;
			exciteBubbleDeformation(
				body,
				Math.min(0.24, influence.deformation * Math.max(strength, 1)),
				influence.normalX,
				influence.normalY,
			);
		}
	};

	const onPointerDown = (event: PointerEvent): void => {
		if (!isRunning) {
			return;
		}

		fieldBounds = field.getBoundingClientRect();
		const position = getLocalPointer(event);
		const pointer = updateActivePointer(event, position, true);
		const marble = findNearestMarble(bodies, pointer.x, pointer.y);

		if (marble) {
			event.preventDefault();
			draggedBodies.set(event.pointerId, marble);
			marble.dragPointerId = event.pointerId;
			marble.dragOffsetX = marble.x - pointer.x;
			marble.dragOffsetY = marble.y - pointer.y;
			marble.vx = 0;
			marble.vy = 0;
			marble.element.classList.add('is-dragged');
			field.setPointerCapture(event.pointerId);
			return;
		}

		applyPointerToBubbles(pointer, 42, 12);
	};

	const onPointerMove = (event: PointerEvent): void => {
		if (!isRunning) {
			return;
		}

		fieldBounds = field.getBoundingClientRect();
		const position = getLocalPointer(event);
		const pointer = updateActivePointer(event, position);
		const draggedBody = draggedBodies.get(event.pointerId);

		if (draggedBody) {
			event.preventDefault();
			draggedBody.vx +=
				(pointer.vx - draggedBody.vx) * DRAG_VELOCITY_SMOOTHING;
			draggedBody.vy +=
				(pointer.vy - draggedBody.vy) * DRAG_VELOCITY_SMOOTHING;
			draggedBody.x = pointer.x + draggedBody.dragOffsetX;
			draggedBody.y = pointer.y + draggedBody.dragOffsetY;
			constrainToField(draggedBody, fieldBounds.width, fieldBounds.height);
			return;
		}

		applyPointerToBubbles(pointer, 74, pointer.isPressed ? 1.35 : 1);
	};

	const clearDraggedBody = (pointerId?: number, releaseCapture = true): void => {
		const pointerIds = pointerId === undefined
			? Array.from(draggedBodies.keys())
			: [pointerId];

		for (const capturedPointerId of pointerIds) {
			const body = draggedBodies.get(capturedPointerId);
			if (!body) {
				continue;
			}

			stabilizePhysicsCircle(body, 1_250, MAX_ANGULAR_SPEED);
			body.element.classList.remove('is-dragged');
			body.dragPointerId = undefined;
			draggedBodies.delete(capturedPointerId);

			if (releaseCapture && field.hasPointerCapture(capturedPointerId)) {
				field.releasePointerCapture(capturedPointerId);
			}
		}
	};

	const releaseDraggedBody = (event: PointerEvent): void => {
		clearDraggedBody(event.pointerId);
		const pointer = activePointers.get(event.pointerId);
		if (pointer?.pointerType === 'mouse') {
			pointer.isPressed = false;
			pointer.vx = 0;
			pointer.vy = 0;
		} else {
			activePointers.delete(event.pointerId);
		}
	};

	const cancelPointer = (event: PointerEvent): void => {
		clearDraggedBody(event.pointerId);
		activePointers.delete(event.pointerId);
	};

	const onLostPointerCapture = (event: PointerEvent): void => {
		clearDraggedBody(event.pointerId, false);
		if (event.pointerType !== 'mouse') {
			activePointers.delete(event.pointerId);
		}
	};

	const onPointerLeave = (event: PointerEvent): void => {
		if (!draggedBodies.has(event.pointerId)) {
			activePointers.delete(event.pointerId);
		}
	};

	const onKeyDown = (event: KeyboardEvent): void => {
		if (!isRunning || !(event.target instanceof HTMLElement)) {
			return;
		}

		const element = event.target.closest<HTMLElement>('[data-physics-object]');
		const body = element ? bodiesByElement.get(element) : undefined;
		if (!body) {
			return;
		}

		const impulses: Readonly<Record<string, readonly [number, number]>> = {
			ArrowLeft: [-150, 0],
			ArrowRight: [150, 0],
			ArrowUp: [0, -180],
			ArrowDown: [0, 150],
			Enter: [body.material === 'bubble' ? 80 : 0, -220],
			' ': [body.material === 'bubble' ? -80 : 0, -220],
		};
		const impulse = impulses[event.key];

		if (!impulse) {
			return;
		}

		event.preventDefault();
		body.vx += impulse[0];
		body.vy += impulse[1];
		exciteBubbleDeformation(body, 0.12, impulse[0], impulse[1]);
	};

	const resizeObserver = new ResizeObserver(() => {
		const previousWidth = fieldBounds.width;
		const previousHeight = fieldBounds.height;
		fieldBounds = field.getBoundingClientRect();
		for (const body of bodies) {
			resizeCircle(
				body,
				previousWidth,
				previousHeight,
				fieldBounds.width,
				fieldBounds.height,
			);
		}
	});

	const simulate = (elapsed: number, time: number): void => {
		for (const body of bodies) {
			if (body.isBursting) {
				if (time >= body.respawnAt) {
					respawnAmbientBubble(body, fieldBounds.width, fieldBounds.height);
				} else {
					continue;
				}
			}

			if (body.dragPointerId !== undefined) {
				continue;
			}

			if (body.material === 'marble') {
				body.vy += GRAVITY * elapsed;
				body.vx *= Math.exp(-0.035 * elapsed);
				body.angularVelocity *= Math.exp(-0.025 * elapsed);
			} else {
				const wind = Math.sin(time * 0.0007 + body.phase) * 5.5;
				body.vx += wind * elapsed;
				body.vy -= (BUBBLE_NET_BUOYANCY + Math.cos(body.phase) * 5) * elapsed;
				body.vx *= Math.pow(0.993, elapsed * 60);
				body.vy *= Math.pow(0.995, elapsed * 60);

			}

			body.x += body.vx * elapsed;
			body.y += body.vy * elapsed;
			body.angle += body.angularVelocity * elapsed;
			advanceBubbleDeformation(body, elapsed);
			if (!stabilizePhysicsCircle(body)) {
				resetCircle(body, fieldBounds.width, fieldBounds.height);
				continue;
			}
			const contacts = constrainToField(
				body,
				fieldBounds.width,
				fieldBounds.height,
				elapsed,
			);
			if (contacts & BURST_BOUNDARIES) {
				burstAmbientBubble(body, contacts, time);
			}
		}

		for (let pass = 0; pass < SOLVER_ITERATIONS; pass += 1) {
			for (let leftIndex = 0; leftIndex < bodies.length; leftIndex += 1) {
				for (let rightIndex = leftIndex + 1; rightIndex < bodies.length; rightIndex += 1) {
					const left = bodies[leftIndex];
					const right = bodies[rightIndex];
					if (!left || !right || left.isBursting || right.isBursting) {
						continue;
					}

					const leftInverseMass = left.inverseMass;
					const rightInverseMass = right.inverseMass;
					if (left.dragPointerId !== undefined) left.inverseMass = 0;
					if (right.dragPointerId !== undefined) right.inverseMass = 0;

					const closingSpeed = getClosingSpeed(left, right);
					const collision = resolveCircleCollision(left, right);
					left.inverseMass = leftInverseMass;
					right.inverseMass = rightInverseMass;

					if (collision) {
						const relativeOverlap = collision.overlap / Math.max(Math.min(left.radius, right.radius), 1);
						const impact = Math.min(0.24, closingSpeed / 850 + relativeOverlap * 0.12);
					exciteBubbleDeformation(left, impact, -collision.normalX, -collision.normalY);
					exciteBubbleDeformation(right, impact, collision.normalX, collision.normalY);
					}
				}
			}
		}

		for (const body of bodies) {
			if (!stabilizePhysicsCircle(body)) {
				resetCircle(body, fieldBounds.width, fieldBounds.height);
			}
		}
	};

	const frame = (time: number): void => {
		const frameTime = Math.min((time - previousTime) / 1000, MAX_FRAME_TIME);
		previousTime = time;
		accumulator += frameTime;

		while (accumulator >= FIXED_TIME_STEP) {
			simulate(FIXED_TIME_STEP, time);
			accumulator -= FIXED_TIME_STEP;
		}

		for (const body of bodies) {
			renderCircle(body, fieldBounds.height);
		}

		if (isRunning) {
			animationFrame = window.requestAnimationFrame(frame);
		}
	};

	const stopLoop = (): void => {
		if (!isRunning) {
			return;
		}

		isRunning = false;
		window.cancelAnimationFrame(animationFrame);
		animationFrame = 0;
		accumulator = 0;
	};

	const startLoop = (): void => {
		if (
			isRunning ||
			isDestroyed ||
			document.hidden ||
			reducedMotion.matches ||
			!isIntersecting
		) {
			return;
		}

		isRunning = true;
		field.dataset.physicsState = 'running';
		previousTime = performance.now();
		accumulator = 0;
		animationFrame = window.requestAnimationFrame(frame);
	};

	const synchronizeActivity = (): void => {
		if (document.hidden || reducedMotion.matches || !isIntersecting) {
			clearDraggedBody();
			activePointers.clear();
			stopLoop();
			field.dataset.physicsState = reducedMotion.matches
				? 'reduced-motion'
				: document.hidden
					? 'hidden'
					: 'offscreen';
		} else {
			startLoop();
		}
	};

	const intersectionObserver = typeof IntersectionObserver === 'undefined'
		? undefined
		: new IntersectionObserver(
			(entries) => {
				const entry = entries[0];
				isIntersecting = entry?.isIntersecting ?? true;
				synchronizeActivity();
			},
			{ rootMargin: '160px 0px' },
		);

	field.addEventListener('pointerdown', onPointerDown);
	field.addEventListener('pointermove', onPointerMove);
	field.addEventListener('pointerup', releaseDraggedBody);
	field.addEventListener('pointercancel', cancelPointer);
	field.addEventListener('lostpointercapture', onLostPointerCapture);
	field.addEventListener('pointerleave', onPointerLeave);
	field.addEventListener('keydown', onKeyDown);
	document.addEventListener('visibilitychange', synchronizeActivity);
	reducedMotion.addEventListener('change', synchronizeActivity);
	resizeObserver.observe(field);
	intersectionObserver?.observe(field);
	synchronizeActivity();

	return () => {
		isDestroyed = true;
		clearDraggedBody();
		activePointers.clear();
		stopLoop();
		resizeObserver.disconnect();
		intersectionObserver?.disconnect();
		field.removeEventListener('pointerdown', onPointerDown);
		field.removeEventListener('pointermove', onPointerMove);
		field.removeEventListener('pointerup', releaseDraggedBody);
		field.removeEventListener('pointercancel', cancelPointer);
		field.removeEventListener('lostpointercapture', onLostPointerCapture);
		field.removeEventListener('pointerleave', onPointerLeave);
		field.removeEventListener('keydown', onKeyDown);
		document.removeEventListener('visibilitychange', synchronizeActivity);
		reducedMotion.removeEventListener('change', synchronizeActivity);
		delete field.dataset.physicsReady;
		delete field.dataset.physicsState;
	};
}
