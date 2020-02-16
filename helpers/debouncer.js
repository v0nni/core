/**
 * @typedef {object} DebouncerOpts
 * @prop {number} [timeoutMs] The debounce window, in milliseconds.
 */

/**
 * @description
 * A class which allows for multiple actions to be coalesced within a given
 * time window.
 *
 * @template {Function} T The type of the provided callback.
 */
export class Debouncer {
	/**
	 * @param {T} callback - The function to call once any pending debounce interval expires.
	 * @param {number | DebouncerOpts} [timeoutOrOpts] - Debounce timeout in milliseconds, or options
	 */
	constructor(callback, timeoutOrOpts) {
		if (typeof callback !== 'function') {
			throw new Error(`Callback must be a function (received: ${typeof callback})`);
		}

		this._callback = callback;

		/** @type {DebouncerOpts} */
		let inOpts = {};

		if (typeof timeoutOrOpts === 'number') {
			inOpts.timeoutMs = timeoutOrOpts;
		} else if (typeof timeoutOrOpts === 'object') {
			inOpts = {
				...timeoutOrOpts,
			};
		}

		if (typeof inOpts.timeoutMs === 'number' && inOpts.timeoutMs < 0) {
			throw new Error(`opts.timeoutMs must not be negative (received: ${inOpts.timeoutMs})`);
		} else if (typeof inOpts.timeoutMs !== 'undefined' && typeof inOpts.timeoutMs !== 'number') {
			throw new Error(`If provided, opts.timeoutMs must be number (received: ${typeof inOpts.timeoutMs}})`);
		}

		this._opts = {
			timeoutMs: 0,
			...inOpts,
		};
	}

	/**
	 * Provides a new set of values for the debounced function,
	 * and resets the debounce timer.
	 *
	 * @param {Parameters<T>} args The new set of values to pass to the callback.
	 */
	tap(...args) {
		this.cancel();

		this._args = args;

		this.run();
	}

	/**
	 * Cancels the pending job, if it exists.
	 */
	cancel() {
		clearTimeout(this._timeoutID);
		this._timeoutID = null;
	}

	/**
	 * Forces the pending job to be called immediately, if it exists.
	 */
	flush() {
		if (this._timeoutID) {
			this.cancel();
			this._callback(...this._args);
		}
	}

	/**
	 * @private
	 */
	run() {
		if (typeof this._timeoutID === 'number') {
			throw new Error('run() called while job pending; previous job should have been canceled');
		}

		this._timeoutID = setTimeout(() => {
			this.cancel();

			this._callback(...this._args);
		}, this._opts.timeoutMs);
	}
}
