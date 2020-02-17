import { debounce, throttle } from '../debounce';
import { spy, stub, useFakeTimers } from 'sinon';
import { expect } from '@open-wc/testing';

describe('debounce/throttle', () => {
	describe('debounce', () => {
		beforeEach(function() {
			this.clock = useFakeTimers();
		});

		afterEach(function() {
			this.clock.restore();
		});

		it('calls the debounced function after the correct interval after a single call', function() {
			const cb = spy();
			const debouncedFunc = debounce(cb, 500);

			debouncedFunc();

			expect(cb.notCalled).to.be.true;

			this.clock.tick(500);

			expect(cb.callCount).to.equal(1);
		});

		it('calls the debounced function with correct args', function() {
			const cb = spy();
			const debouncedFunc = debounce(cb, 500);

			debouncedFunc('foo', 'bar', 100);

			this.clock.tick(500);

			expect(cb.callCount).to.equal(1);
			expect(cb.getCall(0).calledWith('foo', 'bar', 100)).to.be.true;
		});

		it('restarts the debounce interval on successive calls within the debounce window', function() {
			const cb = spy();
			const debouncedFunc = debounce(cb, 500);

			for (let i = 0; i < 5; i++) {
				debouncedFunc();
				this.clock.tick(200);
			}

			expect(cb.notCalled).to.be.true;

			this.clock.tick(500);

			expect(cb.callCount).to.equal(1);
		});

		it('calls the debounced function with the most recent arguments after multiple calls', function() {
			const cb = spy();
			const debouncedFunc = debounce(cb, 500);

			for (let i = 1; i <= 10; i++) {
				debouncedFunc(i);
				this.clock.tick(200);
			}

			this.clock.tick(500);

			expect(cb.callCount).to.equal(1);
			expect(cb.getCall(0).calledWith(10)).to.be.true;
		});

		it('does not call a pending debounced function when cancel() is called', function() {
			const debouncedFunc = debounce(stub().throws(), 500);

			debouncedFunc();
			debouncedFunc.cancel();

			this.clock.tick(1000);
		});

		it('calls a pending debounced function immediately after flush() is called', function() {
			const cb = spy();
			const debouncedFunc = debounce(cb, 500);

			debouncedFunc();

			expect(cb.callCount).to.equal(0);

			debouncedFunc.flush();

			expect(cb.callCount).to.equal(1);

			this.clock.tick(1000);
			expect(cb.callCount).to.equal(1);
		});
	});

	describe('throttle', () => {
		beforeEach(function() {
			this.clock = useFakeTimers(new Date());
		});

		afterEach(function() {
			this.clock.restore();
		});

		it('calls the throttled function immediately on single call when rising=true', () => {
			const cb = spy();
			const throttledFunc = throttle(cb, 500);

			throttledFunc();

			expect(cb.callCount).to.equal(1);
		});

		it('calls the throttle function after the correct interval after a single call when rising=false', function() {
			const cb = spy();
			const throttledFunc = throttle(cb, {
				throttleInterval: 500,
				rising: false,
			});

			throttledFunc();

			expect(cb.notCalled).to.be.true;

			this.clock.tick(500);

			expect(cb.callCount).to.equal(1);
		});

		it('calls the throttled function with arguments after the correct interval after a single call', function() {
			const cb = spy();
			const throttledFunc = throttle(cb, {
				throttleInterval: 500,
				rising: false,
			});

			throttledFunc('foo', 'bar', 100);

			this.clock.tick(500);

			expect(cb.callCount).to.equal(1);
			expect(cb.getCall(0).calledWith('foo', 'bar', 100)).to.be.true;
		});

		[{
			rising: false,
			expectedCalls: 4,
		}, {
			rising: true,
			expectedCalls: 5,
		}].forEach(ctx => it(`throttles multiple calls over time (rising=${ctx.rising})`, function() {
			const cb = spy();
			const throttledFunc = throttle(cb, {
				throttleInterval: 500,
				rising: ctx.rising,
			});

			for (let i = 0; i < 20; i++) {
				throttledFunc();
				this.clock.tick(100);
			}

			this.clock.tick(500);

			expect(cb.callCount).to.equal(ctx.expectedCalls);
		}));

		it('calls the throttled function with the most recent arguments after multiple calls', function() {
			const cb = spy();

			const throttledFunc = throttle(cb, {
				throttleInterval: 500,
				rising: false,
			});

			for (let i = 1; i <= 10; i++) {
				throttledFunc(i);
				this.clock.tick(10);
			}

			this.clock.tick(500);

			expect(cb.callCount).to.equal(1);
			expect(cb.getCall(0).calledWith(10)).to.be.true;
		});

		it('does not call a pending throttled function when cancel() is called', function() {
			const throttledFunc = throttle(stub().throws(), {
				throttleInterval: 500,
				rising: false,
			});

			throttledFunc();
			throttledFunc.cancel();

			this.clock.tick(1000);
		});

		it('calls a pending throttled function immediately after flush() is called', function() {
			const cb = spy();
			const throttledFunc = throttle(cb, {
				throttleInterval: 500,
				rising: false,
			});

			throttledFunc();
			expect(cb.callCount).to.equal(0);

			throttledFunc.flush();
			expect(cb.callCount).to.equal(1);

			this.clock.tick(1000);
			expect(cb.callCount).to.equal(1);
		});
	});
});
