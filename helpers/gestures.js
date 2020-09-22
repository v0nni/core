const maxTime = 2000;
const minDistance = 30;

const maxMomentumTime = 0.3;
const acceleration = -980;

export function registerGestureSwipe(node) {
	node.addEventListener('touchstart', handleTouchStart);
}

export function registerGestureTouchMomentum(node) {
	node.addEventListener('touchstart', handleMomentumTouchStart);
}

function handleMomentumTouchStart(e) {
	const node = this; /* eslint-disable-line no-invalid-this */

	let tracking = {
		prev: null,
		cur: {
			time: performance.now(),
			x: e.touches[0].clientX,
			y: e.touches[0].clientY,
		}
	};

	const reset = () => {
		tracking = null;
		node.removeEventListener('touchend', handleTouchEnd);
		node.removeEventListener('touchmove', handleTouchMove);
		node.removeEventListener('touchcancel', handleTouchCancel);
	};

	const handleTouchCancel = () => {
		reset();
		return;
	};

	const handleTouchEnd = () => {

		if (!tracking || !tracking.cur || !tracking.prev) {
			return;
		}
		const elapsedTime = (tracking.cur.time - tracking.prev.time) / 1000;
		const distanceX = tracking.cur.x - tracking.prev.x;
		const distanceY = tracking.cur.y - tracking.prev.y;

		if (elapsedTime > maxMomentumTime) {
			reset();
			return;
		}
		const theta = Math.PI + Math.atan2(-distanceX, distanceY);
		const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY); // px
		const velocity = distance / elapsedTime; // px / s

		const amplitude = velocity;
		console.log(tracking.cur.y, tracking.cur.y + distanceY);
		const targetPosition = tracking.cur.y + distanceY;
		const timestamp = Date.now();

		const tick = () => {
			const elapsed = Date.now() - timestamp;
			const position = targetPosition - amplitude * Math.exp(-elapsed / 325);
			console.log('wow: ', position);
			requestAnimationFrame(tick);
		};
		requestAnimationFrame(tick);

		/*let prevTime = tracking.cur.time; // ms
		let prevX = tracking.cur.x;
		let prevY = tracking.cur.y;
		const step = () => {

			const curTime = performance.now(); // ms
			const deltaTime = (curTime - prevTime) / 1000; // s
			prevTime = curTime; // ms

			const magnitude = velocity * deltaTime; // px
			const x = prevX + magnitude * Math.cos(theta);
			const y = prevY + magnitude * Math.sin(theta);

			node.dispatchEvent(new CustomEvent('d2l-gesture-momentum', {
				detail: { x, y }
			}));
			prevX = x;
			prevY = y;
			// velocity in pixels / sec
			// we know prev position
			// need position from here
			velocity += acceleration * deltaTime;
			if (velocity > 0) {
				requestAnimationFrame(step);
			} else {
				reset();
			}
		};
		requestAnimationFrame(step);*/

		// reset();
	};

	const handleTouchMove = (e) => {
		if (!tracking) {
			return;
		}
		tracking.prev = tracking.cur;
		tracking.cur = {
			time: performance.now(),
			x: e.touches[0].clientX,
			y: e.touches[0].clientY,
		};
	};

	node.addEventListener('touchend', handleTouchEnd);
	node.addEventListener('touchmove', handleTouchMove);
	node.addEventListener('touchcancel', handleTouchCancel);
}

function handleTouchStart(e) {

	const node = this; /* eslint-disable-line no-invalid-this */

	let tracking = {
		start: {
			time: performance.now(),
			x: e.touches[0].clientX,
			y: e.touches[0].clientY
		}
	};

	const reset = () => {
		tracking = null;
		node.removeEventListener('touchend', handleTouchEnd);
		node.removeEventListener('touchmove', handleTouchMove);
		node.removeEventListener('touchcancel', handleTouchCancel);
	};

	const handleTouchCancel = () => {
		reset();
		return;
	};

	const handleTouchEnd = () => {

		if (!tracking || !tracking.end) {
			return;
		}

		const elapsedTime = performance.now() - tracking.start.time;
		if (elapsedTime > maxTime) {
			reset();
			return;
		}

		const distanceX = tracking.end.x - tracking.start.x;
		const distanceY = tracking.end.y - tracking.start.y;

		const theta = computeAngle(distanceX, distanceY);

		let horizontal = 'none';
		if (Math.abs(distanceX) >= minDistance) {
			if (theta > 205 && theta < 335) {
				horizontal = 'left';
			} else if (theta > 25 && theta < 155) {
				horizontal = 'right';
			}
		}

		let vertical = 'none';
		if (Math.abs(distanceY) >= minDistance) {
			if (theta > 295 || theta < 65) {
				vertical = 'up';
			} else if (theta > 115 && theta < 245) {
				vertical = 'down';
			}
		}

		node.dispatchEvent(new CustomEvent('d2l-gesture-swipe', {
			detail: {
				distance: {
					x: distanceX,
					y: distanceY
				},
				direction: {
					angle: theta,
					horizontal: horizontal,
					vertical: vertical
				},
				duration: elapsedTime
			}
		}));

		reset();
	};

	const handleTouchMove = (e) => {
		if (!tracking) {
			return;
		}
		e.preventDefault();
		tracking.end = {
			x: e.touches[0].clientX,
			y: e.touches[0].clientY
		};
	};

	node.addEventListener('touchend', handleTouchEnd);
	node.addEventListener('touchmove', handleTouchMove);
	node.addEventListener('touchcancel', handleTouchCancel);

}

function computeAngle(distanceX, distanceY) {
	// angle of right-angle tri from y (radians)
	let theta = Math.atan(Math.abs(distanceX) / Math.abs(distanceY));

	// angle of arc from y (deg)
	if (distanceY > 0 && distanceX > 0) {
		// swipe down and right
		theta = (Math.PI - theta) * 57.3;
	} else if (distanceY > 0 && distanceX < 0) {
		// swipe down and left
		theta = (Math.PI + theta) * 57.3;
	} else if (distanceY < 0 && distanceX > 0) {
		// swipe up and right
		theta = theta * 57.3;
	} else if (distanceY < 0 && distanceX < 0) {
		// swipe up and left
		theta = ((2 * Math.PI) - theta) * 57.3;
	}
	return theta;
}
