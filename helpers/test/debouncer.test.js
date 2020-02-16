import { assert, expect } from '@open-wc/testing';
import { spy, stub, useFakeTimers } from 'sinon';
import { Debouncer } from '../debouncer.js';

describe('Debouncer', () => {
	describe('validation', () => {
		it('fails if not provided a callback function', () => {
			try {
				new Debouncer('foo', 1000);
				assert(false, 'should have thrown');
			} catch (e) {
				expect(e.message).to.equal('Callback must be a function (received: string)');
			}
		});

		it('fails if timeoutMs is negative', () => {
			try {
				new Debouncer(stub(), -1);
				assert(false, 'should have thrown');
			} catch (e) {
				expect(e.message).to.equal('opts.timeoutMs must not be negative (received: -1)');
			}
		});
	});

	describe('debouncing', () => {
		beforeEach(function() {
			this.clock = useFakeTimers();
		});

		afterEach(function() {
			this.clock.restore();
		});

		it('calls the debounced function after the correct interval after a single tap', function() {
			const cb = spy();
			const debouncer = new Debouncer(cb, 500);

			debouncer.tap();

			expect(cb.notCalled).to.be.true;

			this.clock.tick(600);

			expect(cb.calledOnce).to.be.true;
		});

		it('calls the debounced function with arguments after the correct interval after a single tap', function() {
			const cb = spy();

			const debouncer = new Debouncer(cb, 500);

			debouncer.tap('foo', 'bar', 100);

			this.clock.tick(500);

			expect(cb.calledOnce).to.be.true;
			expect(cb.getCall(0).calledWith('foo', 'bar', 100)).to.be.true;
		});

		it('resets the debounce interval on successive taps', function() {
			const cb = spy();
			const debouncer = new Debouncer(cb, 500);

			for (let i = 0; i < 5; i++) {
				debouncer.tap();
				this.clock.tick(200);
			}

			expect(cb.notCalled).to.be.true;

			this.clock.tick(500);

			expect(cb.calledOnce).to.be.true;
		});

		it('calls the debounced function with the most recent arguments after multiple taps', function() {
			const cb = spy();

			const debouncer = new Debouncer(cb, 500);

			for (let i = 1; i <= 10; i++) {
				debouncer.tap(i);
				this.clock.tick(10);
			}

			this.clock.tick(500);

			expect(cb.calledOnce).to.be.true;
			expect(cb.getCall(0).calledWith(10)).to.be.true;
		});

		it('does not call a pending debounced function when cancel() is called', function() {
			const debouncer = new Debouncer(stub().throws(), 500);

			debouncer.tap();
			debouncer.cancel();

			this.clock.tick(1000);
		});
	});
});
