/**
 * @fileoverview
 *
 * Utilities for debouncing/throttling function invocations.
 */

/**
 * @typedef {object} DeferredFuncController A function which can have deferred invocations.
 * @prop {() => void} flush Invokes any pending invocation immediately.
 * @prop {() => void} cancel Cancels any pending invocation.
 *
 * @typedef {object} ThrottleOpts
 * @prop {number}  [throttleInterval] The throttle window (milliseconds).
 * @prop {boolean} [rising=true] If true, invoke callback immediately if outside of a throttle interval. (default: true)
 * @prop {boolean} [falling=true] If true, invoke throttled requests at end of interval (default: true)
 */

/**
 * Returns a decorated instance of the input function which throttles invocations.
 *
 * @param {T} callback The function to call once any pending throttle interval expires.
 * @param {number | ThrottleOpts} [intervalOrOpts] Throttle window (in milliseconds), or options
 * @returns {T & DeferredFuncController} Throttled function instance
 *
 * @template {Function} T
 */
export function throttle(callback, intervalOrOpts) {
	/** @type {Parameters<T>} */
	let nextArgs;
	/** @type {ReturnType<setTimeout> | null} */
	let timeoutId = null;
	let hasThrottledRequests = false;
	let prevExecTime = 0;

	/** @type {Required<ThrottleOpts>} */
	let opts = {
		throttleInterval: 0,
		rising: true,
		falling: true,
	};

	if (typeof intervalOrOpts === 'number') {
		opts.throttleInterval = intervalOrOpts;
	} else if (typeof intervalOrOpts === 'object') {
		opts = {
			...opts,
			...intervalOrOpts,
		};
	}

	/**
	 * @param  {Parameters<T>} args
	 */
	const throttled = function(...args) {
		nextArgs = args;

		if (!timeoutId) {
			const sinceLast = Date.now() - prevExecTime;

			throttled.schedule(sinceLast);

			if (opts.rising && (sinceLast >= opts.throttleInterval)) {
				throttled.execCallback();
			} else {
				hasThrottledRequests = true;
			}
		} else if (opts.falling) {
			hasThrottledRequests = true;
		}
	};

	/**
	* Forces the pending job to be called immediately, if it exists.
	*/
	throttled.flush = function() {
		if (timeoutId) {
			throttled.cancel();
			throttled.execCallback();
		}
	};

	/**
	* Cancels the pending job, if it exists.
	*/
	throttled.cancel = function() {
		throttled.clearTimeout();
		hasThrottledRequests = false;
	};

	throttled.clearTimeout = function() {
		clearTimeout(timeoutId);
		timeoutId = null;
	};

	/**
	 * @param {number} sinceLast Elapsed time since last invocation, in milliseconds.
	 */
	throttled.schedule = (sinceLast) => {
		const interval = opts.throttleInterval;
		const remainingInInterval = sinceLast > interval ? interval : interval - sinceLast;

		timeoutId = window.setTimeout(() => {
			throttled.clearTimeout();

			if (hasThrottledRequests) {
				hasThrottledRequests = false;

				throttled.execCallback();
			}
		}, remainingInInterval);
	};

	throttled.execCallback = () => {
		prevExecTime = Date.now();

		callback(...nextArgs);
	};

	return throttled;
}

/**
 * Returns a decorated instance of the input function which debounces invocations.
 *
 * @param {T} callback - The function to call once any pending debounce interval expires.
 * @param {number} [debounceWindow] - Debounce window (milliseconds)
 * @returns {T & DeferredFuncController} Debounced function instance
 *
 * @template {Function} T Input function type
 */
export function debounce(callback, debounceWindow = 0) {
	/**
	 * Most recent arguments captured within current debounce window.
	 * @type {Parameters<T>}
	 */
	let nextArgs;
	/**
	 * ID of the setTimout for the currently active debounce window, if any.
	 * @type {ReturnType<setTimeout> | null}
	 */
	let timeoutId = null;

	/**
	 * @param  {Parameters<T>} args
	 */
	const debounced = function(...args) {
		debounced.cancel();

		nextArgs = args;

		debounced.schedule();
	};

	/**
	 * Cancels the pending job, if it exists.
	 */
	debounced.cancel = function() {
		clearTimeout(timeoutId);

		timeoutId = null;
	};

	/**
	 * Forces the pending job to be called immediately, if it exists.
	 */
	debounced.flush = function() {
		if (timeoutId) {
			debounced.cancel();

			callback(...nextArgs);
		}
	};

	debounced.schedule = function() {
		timeoutId = window.setTimeout(() => {
			debounced.cancel();

			callback(...nextArgs);
		}, debounceWindow);
	};

	return debounced;
}
