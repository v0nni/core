/**
 * @typedef {object} ThrottleOpts
 * @prop {number}  [throttleInterval] The throttle window, in milliseconds.
 * @prop {boolean} [immediate=true] If true, invoke callback immediately if throttle isn't active. (default: true)
 */

/**
 * A class which allows for multiple actions to be coalesced within a given
 * time window.
 *
 * @template {Function} T The type of the provided callback.
 */
export class Throttle {
	/**
	 * @param {T} callback - The function to call once any pending throttle interval expires.
	 * @param {number | ThrottleOpts} [intervalOrOpts] - Throttle window (in milliseconds), or options
	 */
	constructor(callback, intervalOrOpts) {
		if (typeof callback !== 'function') {
			throw new Error(`Callback must be a function (received: ${typeof callback})`);
		}

		this._callback = callback;
		this._hasThrottledRequests = false;
		this._prevExecTime = new Date(0);

		/** @type {ThrottleOpts} */
		let inOpts = {};

		if (typeof intervalOrOpts === 'number') {
			inOpts.throttleInterval = intervalOrOpts;
		} else if (typeof intervalOrOpts === 'object') {
			inOpts = {
				...intervalOrOpts,
			};

			if (typeof inOpts.immediate !== 'undefined' && typeof inOpts.immediate !== 'boolean') {
				throw new Error(`If provided, 'immediate' must be a boolean (received: ${typeof inOpts.immediate})`);
			}
		}

		if (typeof inOpts.throttleInterval === 'number' && inOpts.throttleInterval < 0) {
			throw new Error(`'throttleInterval' must not be negative (received: ${inOpts.throttleInterval})`);
		} else if (typeof inOpts.throttleInterval !== 'undefined' && typeof inOpts.throttleInterval !== 'number') {
			throw new Error(`If provided, 'throttleInterval' must be number (received: ${typeof inOpts.throttleInterval}})`);
		}

		this._opts = {
			throttleInterval: 0,
			immediate: true,
			...inOpts,
		};
	}

	/**
	 * Provides a new set of values for the throttled function to be used
	 * on the next execution.
	 *
	 * @param {Parameters<T>} args The new set of values to pass to the callback.
	 */
	tap(...args) {
		this._args = args;

		if (!this._timeoutID) {
			const currTime = new Date();
			const sinceLast = currTime.getTime() - this._prevExecTime.getTime();

			this.run(currTime);

			if (this._opts.immediate && (sinceLast > this._opts.throttleInterval)) {
				this._execCallback();
			} else {
				this._hasThrottledRequests = true;
			}
		} else {
			this._hasThrottledRequests = true;
		}
	}

	/**
	 * Cancels the pending job, if it exists.
	 */
	cancel() {
		this.clearTimeout();
		this._hasThrottledRequests = false;
	}

	/**
	 * @private
	 */
	clearTimeout() {
		clearTimeout(this._timeoutID);
		this._timeoutID = null;
	}

	/**
	 * Forces the pending job to be called immediately, if it exists.
	 */
	flush() {
		if (this._timeoutID) {
			this.cancel();
			this._execCallback();
		}
	}

	/**
	 * @private
	 *
	 * @param {Date} refTime Reference time to use to determine amount of time left in current interval
	 */
	run(refTime) {
		const interval = this._opts.throttleInterval;
		const sinceLast = refTime.getTime() - this._prevExecTime.getTime();
		const remainingInWindow = sinceLast > interval ? interval : interval - sinceLast;

		this._timeoutID = setTimeout(() => {
			this.clearTimeout();

			if (this._hasThrottledRequests) {
				this._hasThrottledRequests = false;

				this._execCallback();
			}
		}, remainingInWindow);
	}

	/**
	 * @private
	 */
	_execCallback() {
		this._prevExecTime = new Date();
		this._callback(...this._args);
	}
}
