import {
	applyFloorFriction,
	resolveCircleCollision,
	SKILL_PHYSICS_TUNING,
	stabilizePhysicsCircle,
	type PhysicsCircle,
	type PhysicsMaterial,
} from './skill-physics-core.ts';

export {
	applyFloorFriction,
	resolveCircleCollision,
	SKILL_PHYSICS_TUNING,
	stabilizePhysicsCircle,
} from './skill-physics-core.ts';
export type {
	CollisionResult,
	PhysicsCircle,
	PhysicsMaterial,
} from './skill-physics-core.ts';

interface RenderedCircle extends PhysicsCircle {
	readonly element: HTMLElement;
	readonly phase: number;
	readonly initialX: number;
	readonly initialY: number;
	deformation: number;
	deformationAngle: number;
	dragPointerId?: number;
	lastPointerX: number;
	lastPointerY: number;
	lastPointerTime: number;
	dragOffsetX: number;
	dragOffsetY: number;
}

const FIXED_TIME_STEP = 1 / 120;
const MAX_FRAME_TIME = 1 / 20;
const SOLVER_ITERATIONS = 5;
const DRAG_VELOCITY_SMOOTHING = 0.38;
const {
	bubbleNetBuoyancy: BUBBLE_NET_BUOYANCY,
	bubbleRestitution: BUBBLE_RESTITUTION,
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

function createCircle(
	element: HTMLElement,
	fieldWidth: number,
	fieldHeight: number,
	index: number,
): RenderedCircle {
	const bounds = element.getBoundingClientRect();
	const radius = Math.max(bounds.width / 2, 8);
	const material: PhysicsMaterial = element.dataset.physicsMaterial === 'marble' ? 'marble' : 'bubble';
	const percentageX = parseNumber(element.dataset.physicsX, 50) / 100;
	const percentageY = parseNumber(element.dataset.physicsY, 50) / 100;
	const density = material === 'marble' ? 1 : 0.055;
	const mass = Math.PI * radius * radius * density;
	const initialX = fitCoordinateToAxis(fieldWidth, radius, fieldWidth * percentageX);
	const initialY = material === 'marble'
		? fitCoordinateToAxis(fieldHeight, radius, fieldHeight - fieldHeight * percentageY - radius)
		: fitCoordinateToAxis(fieldHeight, radius, fieldHeight * percentageY);

	return {
		element,
		material,
		radius,
		x: initialX,
		y: initialY,
		vx: material === 'bubble' ? ((index % 3) - 1) * 13 : 0,
		vy: material === 'bubble' ? -9 - (index % 4) * 2 : 0,
		angle: 0,
		angularVelocity: 0,
		inverseMass: 1 / mass,
		phase: index * 1.73,
		initialX,
		initialY,
		deformation: 0,
		deformationAngle: 0,
		lastPointerX: 0,
		lastPointerY: 0,
		lastPointerTime: 0,
		dragOffsetX: 0,
		dragOffsetY: 0,
	};
}

function resetCircle(body: RenderedCircle, width: number, height: number): void {
	body.x = fitCoordinateToAxis(width, body.radius, body.initialX);
	body.y = fitCoordinateToAxis(height, body.radius, body.initialY);
	body.vx = 0;
	body.vy = 0;
	body.angle = 0;
	body.angularVelocity = 0;
	body.deformation = 0;
	body.deformationAngle = 0;
}

function constrainToField(
	body: RenderedCircle,
	width: number,
	height: number,
	elapsed = 0,
): void {
	const restitution = body.material === 'marble' ? MARBLE_RESTITUTION : BUBBLE_RESTITUTION;

	if (!Number.isFinite(width) || width <= body.radius * 2) {
		body.x = Math.max(Number.isFinite(width) ? width : 0, 0) / 2;
		body.vx = 0;
	} else if (body.x < body.radius) {
		body.x = body.radius;
		body.vx = Math.abs(body.vx) * restitution;
	} else if (body.x > width - body.radius) {
		body.x = width - body.radius;
		body.vx = -Math.abs(body.vx) * restitution;
	}

	if (!Number.isFinite(height) || height <= body.radius * 2) {
		body.y = Math.max(Number.isFinite(height) ? height : 0, 0) / 2;
		body.vy = 0;
	} else if (body.y < body.radius) {
		body.y = body.radius;
		body.vy = Math.abs(body.vy) * restitution;
	} else if (body.y > height - body.radius) {
		body.y = height - body.radius;
		body.vy = -Math.abs(body.vy) * restitution;

		if (body.material === 'marble') {
			applyFloorFriction(body, elapsed);
			if (Math.abs(body.vy) < RESTING_COLLISION_SPEED) {
				body.vy = 0;
			}
		}
	}
}

function deformBubble(
	body: RenderedCircle,
	impact: number,
	normalX: number,
	normalY: number,
): void {
	if (body.material !== 'bubble') {
		return;
	}

	body.deformation = Math.min(0.24, Math.max(body.deformation, impact));
	body.deformationAngle = Math.atan2(normalY, normalX);
}

function renderCircle(body: RenderedCircle, fieldHeight: number): void {
	body.element.style.inset = '0 auto auto 0';
	body.element.style.transform = `translate3d(${body.x - body.radius}px, ${body.y - body.radius}px, 0)`;

	if (body.material === 'bubble') {
		body.element.style.setProperty('--deform-x', String(1 + body.deformation));
		body.element.style.setProperty('--deform-y', String(1 - body.deformation * 0.72));
		body.element.style.setProperty('--deform-angle', `${body.deformationAngle}rad`);
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
		if (body.material !== 'marble') {
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
	let draggedBody: RenderedCircle | undefined;
	let pointerX = -10000;
	let pointerY = -10000;
	let previousTime = performance.now();
	let accumulator = 0;
	let animationFrame = 0;
	let isRunning = false;
	let isDestroyed = false;

	const getLocalPointer = (event: PointerEvent): { x: number; y: number } => ({
		x: event.clientX - fieldBounds.left,
		y: event.clientY - fieldBounds.top,
	});

	const onPointerDown = (event: PointerEvent): void => {
		if (!isRunning) {
			return;
		}

		fieldBounds = field.getBoundingClientRect();
		const pointer = getLocalPointer(event);
		const marble = findNearestMarble(bodies, pointer.x, pointer.y);

		if (marble) {
			event.preventDefault();
			draggedBody = marble;
			marble.dragPointerId = event.pointerId;
			marble.lastPointerX = pointer.x;
			marble.lastPointerY = pointer.y;
			marble.lastPointerTime = event.timeStamp;
			marble.dragOffsetX = marble.x - pointer.x;
			marble.dragOffsetY = marble.y - pointer.y;
			marble.vx = 0;
			marble.vy = 0;
			marble.element.classList.add('is-dragged');
			field.setPointerCapture(event.pointerId);
			return;
		}

		for (const body of bodies) {
			if (body.material !== 'bubble') {
				continue;
			}

			const deltaX = body.x - pointer.x;
			const deltaY = body.y - pointer.y;
			const distance = Math.max(Math.hypot(deltaX, deltaY), 1);
			if (distance > body.radius + 42) {
				continue;
			}

			const impulse = 115 * (1 - distance / (body.radius + 42));
			body.vx += (deltaX / distance) * impulse;
			body.vy += (deltaY / distance) * impulse;
			deformBubble(body, 0.18, deltaX / distance, deltaY / distance);
		}
	};

	const onPointerMove = (event: PointerEvent): void => {
		if (!isRunning) {
			return;
		}

		fieldBounds = field.getBoundingClientRect();
		const pointer = getLocalPointer(event);
		pointerX = pointer.x;
		pointerY = pointer.y;

		if (draggedBody?.dragPointerId === event.pointerId) {
			event.preventDefault();
			const elapsed = Math.max((event.timeStamp - draggedBody.lastPointerTime) / 1000, 1 / 240);
			const measuredVelocityX = (pointer.x - draggedBody.lastPointerX) / elapsed;
			const measuredVelocityY = (pointer.y - draggedBody.lastPointerY) / elapsed;
			draggedBody.vx +=
				(measuredVelocityX - draggedBody.vx) * DRAG_VELOCITY_SMOOTHING;
			draggedBody.vy +=
				(measuredVelocityY - draggedBody.vy) * DRAG_VELOCITY_SMOOTHING;
			draggedBody.x = pointer.x + draggedBody.dragOffsetX;
			draggedBody.y = pointer.y + draggedBody.dragOffsetY;
			draggedBody.lastPointerX = pointer.x;
			draggedBody.lastPointerY = pointer.y;
			draggedBody.lastPointerTime = event.timeStamp;
			constrainToField(draggedBody, fieldBounds.width, fieldBounds.height);
			return;
		}

		for (const body of bodies) {
			if (body.material !== 'bubble') {
				continue;
			}

			const deltaX = body.x - pointer.x;
			const deltaY = body.y - pointer.y;
			const distance = Math.max(Math.hypot(deltaX, deltaY), 1);
			const range = body.radius + 74;

			if (distance < range) {
				const force = (1 - distance / range) * 8;
				body.vx += (deltaX / distance) * force;
				body.vy += (deltaY / distance) * force;
				deformBubble(body, force * 0.015, deltaX / distance, deltaY / distance);
			}
		}
	};

	const clearDraggedBody = (pointerId?: number, releaseCapture = true): void => {
		if (!draggedBody || (pointerId !== undefined && draggedBody.dragPointerId !== pointerId)) {
			return;
		}

		const capturedPointerId = draggedBody.dragPointerId;
		stabilizePhysicsCircle(draggedBody, 1_250, MAX_ANGULAR_SPEED);
		draggedBody.element.classList.remove('is-dragged');
		draggedBody.dragPointerId = undefined;
		draggedBody = undefined;

		if (
			releaseCapture &&
			capturedPointerId !== undefined &&
			field.hasPointerCapture(capturedPointerId)
		) {
			field.releasePointerCapture(capturedPointerId);
		}
	};

	const releaseDraggedBody = (event: PointerEvent): void => {
		clearDraggedBody(event.pointerId);
	};

	const onLostPointerCapture = (event: PointerEvent): void => {
		clearDraggedBody(event.pointerId, false);
	};

	const onPointerLeave = (): void => {
		pointerX = -10000;
		pointerY = -10000;
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
		deformBubble(body, 0.12, impulse[0], impulse[1]);
	};

	const resizeObserver = new ResizeObserver(() => {
		fieldBounds = field.getBoundingClientRect();
		for (const body of bodies) {
			constrainToField(body, fieldBounds.width, fieldBounds.height);
		}
	});

	const simulate = (elapsed: number, time: number): void => {
		for (const body of bodies) {
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

				const pointerDistance = Math.hypot(body.x - pointerX, body.y - pointerY);
				if (pointerDistance < body.radius + 56) {
					deformBubble(body, 0.04, body.x - pointerX, body.y - pointerY);
				}
			}

			body.x += body.vx * elapsed;
			body.y += body.vy * elapsed;
			body.angle += body.angularVelocity * elapsed;
			body.deformation *= Math.exp(-7 * elapsed);
			if (!stabilizePhysicsCircle(body)) {
				resetCircle(body, fieldBounds.width, fieldBounds.height);
				continue;
			}
			constrainToField(body, fieldBounds.width, fieldBounds.height, elapsed);
		}

		for (let pass = 0; pass < SOLVER_ITERATIONS; pass += 1) {
			for (let leftIndex = 0; leftIndex < bodies.length; leftIndex += 1) {
				for (let rightIndex = leftIndex + 1; rightIndex < bodies.length; rightIndex += 1) {
					const left = bodies[leftIndex];
					const right = bodies[rightIndex];
					if (!left || !right) {
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
						deformBubble(left, impact, -collision.normalX, -collision.normalY);
						deformBubble(right, impact, collision.normalX, collision.normalY);
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
		if (isRunning || isDestroyed || document.hidden || reducedMotion.matches) {
			return;
		}

		isRunning = true;
		previousTime = performance.now();
		accumulator = 0;
		animationFrame = window.requestAnimationFrame(frame);
	};

	const synchronizeMotionPreference = (): void => {
		if (document.hidden || reducedMotion.matches) {
			clearDraggedBody();
			stopLoop();
		} else {
			startLoop();
		}
	};

	field.addEventListener('pointerdown', onPointerDown);
	field.addEventListener('pointermove', onPointerMove);
	field.addEventListener('pointerup', releaseDraggedBody);
	field.addEventListener('pointercancel', releaseDraggedBody);
	field.addEventListener('lostpointercapture', onLostPointerCapture);
	field.addEventListener('pointerleave', onPointerLeave);
	field.addEventListener('keydown', onKeyDown);
	document.addEventListener('visibilitychange', synchronizeMotionPreference);
	reducedMotion.addEventListener('change', synchronizeMotionPreference);
	resizeObserver.observe(field);
	startLoop();

	return () => {
		isDestroyed = true;
		clearDraggedBody();
		stopLoop();
		resizeObserver.disconnect();
		field.removeEventListener('pointerdown', onPointerDown);
		field.removeEventListener('pointermove', onPointerMove);
		field.removeEventListener('pointerup', releaseDraggedBody);
		field.removeEventListener('pointercancel', releaseDraggedBody);
		field.removeEventListener('lostpointercapture', onLostPointerCapture);
		field.removeEventListener('pointerleave', onPointerLeave);
		field.removeEventListener('keydown', onKeyDown);
		document.removeEventListener('visibilitychange', synchronizeMotionPreference);
		reducedMotion.removeEventListener('change', synchronizeMotionPreference);
		delete field.dataset.physicsReady;
	};
}
