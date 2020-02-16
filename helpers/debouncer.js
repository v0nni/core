/**
 * @description Options to pass to Debouncer constructor.
 *
 * @typedef {object} DebouncerOpts
 * @prop {number=} timeoutMs - The debounce window
 */

/**
 * @description
 * A class which allows for multiple actions to be coalesced within a given
 * time window.
 *
 * @template {Function} T
 */
export class Debouncer {
	/**
	 * @param {T} callback - The function to call once any pending debounce interval expires.
	 * @param {DebouncerOpts} [opts]
	 */
	constructor(callback, opts) {
		if (typeof callback !== 'function') {
			throw new Error(`Callback must be function (received: ${typeof callback})`);
		}

		if (typeof opts !== 'undefined' && typeof opts !== 'object') {
			throw new Error(`If provided, opts must be an object (received: ${typeof opts})`);
		}

		if (typeof opts === 'object') {
			if (typeof opts.timeoutMs === 'number' && opts.timeoutMs < 0) {
				throw new Error(`If provided, opts.timeoutMs must not be negative (received: ${opts.timeoutMs})`);
			} else if (typeof opts.timeoutMs !== 'number') {
				throw new Error(`If provided, opts.timeoutMs must be number (received: ${typeof opts.timeoutMs}})`);
			}
		}

		this._callback = callback;
		this._opts = {
			timeoutMs: 0,
			...opts,
		};
	}

	/**
	 * Provides a new set of values for the debounced function,
	 * and resets the debounce timer.
	 *
	 * @param {Parameters<T>} args The new set of values to pass to the callback
	 */
	tap(...args) {
		this.cancel();

		this._args = args;

		this.run();
	}

	/**
	 * Cancels the currently pending job, if it exists.
	 */
	cancel() {
		clearTimeout(this._timerHandle);
		this._timerHandle = null;
	}

	/**
	 * Forces the currently pending job to be called immediately, if it exists.
	 */
	flush() {
		if (this._timerHandle) {
			this.cancel();
			this._callback(...this._args);
		}
	}

	/**
	 * @private
	 */
	run() {
		if (typeof this._timerHandle === 'number') {
			throw new Error('run() called while job pending; previous job should have been canceled');
		}

		this._timerHandle = setTimeout(() => {
			this.cancel();

			this._callback(...this._args);
		}, this._opts.timeoutMs);
	}
}
