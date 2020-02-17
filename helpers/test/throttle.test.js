import { assert, expect } from '@open-wc/testing';
import { spy, stub, useFakeTimers } from 'sinon';
import { Throttle } from '../throttle';

describe('Throttle', () => {
	describe('validation', () => {
		it('fails if not provided a callback function', () => {
			try {
				new Throttle('foo', 500);
				assert(false, 'should have thrown');
			} catch (e) {
				expect(e.message).to.equal('Callback must be a function (received: string)');
			}
		});

		it('fails if throttleInterval is negative', () => {
			try {
				new Throttle(stub(), -1);
				assert(false, 'should have thrown');
			} catch (e) {
				expect(e.message).to.equal('\'throttleInterval\' must not be negative (received: -1)');
			}
		});
	});

	describe('throttling', () => {
		beforeEach(function() {
			this.clock = useFakeTimers(new Date());
		});

		afterEach(function() {
			this.clock.restore();
		});

		it('calls the throttled function immediately on single tap when immediate=true', () => {
			const cb = spy();
			const throttle = new Throttle(cb, 500);

			throttle.tap();

			expect(cb.calledOnce).to.be.true;
		});

		it('calls the throttle function after the correct interval after a single tap when immediate=false', function() {
			const cb = spy();
			const throttle = new Throttle(cb, {
				throttleInterval: 500,
				immediate: false,
			});

			throttle.tap();

			expect(cb.notCalled).to.be.true;

			this.clock.tick(500);

			expect(cb.calledOnce).to.be.true;
		});

		it('calls the throttled function with arguments after the correct interval after a single tap', function() {
			const cb = spy();
			const throttle = new Throttle(cb, {
				throttleInterval: 500,
				immediate: false,
			});

			throttle.tap('foo', 'bar', 100);

			this.clock.tick(500);

			expect(cb.calledOnce).to.be.true;
			expect(cb.getCall(0).calledWith('foo', 'bar', 100)).to.be.true;
		});

		[{
			immediate: false,
			expectedCalls: 4,
		}, {
			immediate: true,
			expectedCalls: 5,
		}].forEach(ctx => it(`throttles multiple calls over time (immediate=${ctx.immediate})`, function() {
			const cb = spy();
			const throttle = new Throttle(cb, {
				throttleInterval: 500,
				immediate: ctx.immediate,
			});

			for (let i = 0; i < 20; i++) {
				throttle.tap();
				this.clock.tick(100);
			}

			this.clock.tick(500);

			expect(cb.callCount).to.equal(ctx.expectedCalls);
		}));

		it('calls the throttled function with the most recent arguments after multiple taps', function() {
			const cb = spy();

			const throttle = new Throttle(cb, {
				throttleInterval: 500,
				immediate: false,
			});

			for (let i = 1; i <= 10; i++) {
				throttle.tap(i);
				this.clock.tick(10);
			}

			this.clock.tick(500);

			expect(cb.callCount).to.equal(1);
			expect(cb.getCall(0).calledWith(10)).to.be.true;
		});

		it('does not call a pending throttled function when cancel() is called', function() {
			const throttle = new Throttle(stub().throws(), {
				throttleInterval: 500,
				immediate: false,
			});

			throttle.tap();
			throttle.cancel();

			this.clock.tick(1000);
		});
	});
});
