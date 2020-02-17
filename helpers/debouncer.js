/**
 * A class which allows for multiple actions to be coalesced within a given
 * time window.
 *
 * @template {Function} T The type of the provided callback.
 */
export class Debouncer {
	/**
	 * @param {T} callback - The function to call once any pending debounce interval expires.
	 * @param {number} [debounceWindow] - Debounce window in milliseconds, or options object
	 */
	constructor(callback, debounceWindow) {
		if (typeof callback !== 'function') {
			throw new Error(`Callback must be a function (received: ${typeof callback})`);
		}

		if (typeof debounceWindow === 'number' && debounceWindow < 0) {
			throw new Error(`'debounceWindow' must not be negative (received: ${debounceWindow})`);
		} else if (typeof debounceWindow !== 'undefined' && typeof debounceWindow !== 'number') {
			throw new Error(`If provided, 'debounceWindow' must be number (received: ${typeof debounceWindow}})`);
		}

		this._callback = callback;
		this._debounceWindow = debounceWindow || 0;
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
		this._timeoutID = setTimeout(() => {
			this.cancel();

			this._callback(...this._args);
		}, this._debounceWindow);
	}
}
