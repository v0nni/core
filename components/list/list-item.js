import 'fastdom/fastdom.js';
import { css, html, LitElement } from 'lit-element/lit-element.js';
import ResizeObserver from 'resize-observer-polyfill';
import { RtlMixin } from '../../mixins/rtl-mixin.js';

const ro = new ResizeObserver(entries => {
	entries.forEach(entry => {
		if (!entry || !entry.target || !entry.target.resizedCallback) {
			return;
		}
		entry.target.resizedCallback(entry.contentRect && entry.contentRect.width);
	});
});

class ListItem extends RtlMixin(LitElement) {
	static get properties() {
		return {
			breakpoints: { type: Array },
			illustrationOutside: { type: Boolean, attribute: 'illustration-outside'},
			role: { type: String, reflect: true },
			_breakpoint: { type: Number }
		};
	}

	static get styles() {
		const layout = css`
			:host {
				display: block;
				margin: 1px 0;
			}
			:host[hidden] {
				display: none;
			}
			.d2l-list-item-flex {
				display: flex;
			}
			.d2l-list-item-content {
				border-bottom: var(--d2l-list-item-divider-bottom, 1px solid var(--d2l-color-mica));
				border-top: var(--d2l-list-item-divider-top, 1px solid var(--d2l-color-mica));
				box-sizing: content-box;
				margin-bottom: -1px;
				margin-top: -1px;
				padding-bottom: var(--d2l-list-item-divider-padding-bottom, 0);
				padding-top: var(--d2l-list-item-divider-padding-top, 0);
				position: relative;
				width: 100%;
			}
			.d2l-list-item-content-flex {
				display: flex;
				flex-grow: 1;
				justify-content: stretch;
				margin: 18px 0;
				padding: var(--d2l-list-item-content-padding, 0);
			}
			::slotted([slot="illustration"]){
				align-self: flex-start;
				display: flex;
				flex-grow: 0;
				flex-shrink: 0;
				margin-right: 0.9rem;
				max-height: 52px;
				max-width: 90px;
				overflow:hidden;
			}
			:host([dir="rtl"]) ::slotted([slot="illustration"]) {
				margin-left: 0.9rem;
				margin-right: 0;
			}
			:host([illustration-outside]) ::slotted([slot="illustration"]) {
				margin-bottom: 18px;
				margin-top: 18px;
			}
			::slotted([slot="actions"]) {
				align-self: flex-start;
				display: flex;
				flex-grow: 0;
			}
			.d2l-list-item-main {
				flex-grow: 1;
			}
		`;

		const breakPoint1 = css`
			.d2l-list-item-flex[breakpoint="1"] ::slotted([slot="illustration"]) {
				margin-right: 1rem;
				max-height: 71px;
				max-width: 120px;
			}
			:host([dir="rtl"]) .d2l-list-item-flex[breakpoint="1"] ::slotted([slot="illustration"]) {
				margin-left: 1rem;
				margin-right: 0;
			}
		`;

		const breakPoint2 = css`
			.d2l-list-item-flex[breakpoint="2"] ::slotted([slot="illustration"]) {
				margin-right: 1rem;
				max-height: 102px;
				max-width: 180px;
			}
			:host([dir="rtl"]) .d2l-list-item-flex[breakpoint="2"] ::slotted([slot="illustration"]) {
				margin-left: 1rem;
				margin-right: 0;
			}
		`;

		const breakPoint3 = css`
			.d2l-list-item-flex[breakpoint="3"] ::slotted([slot="illustration"]) {
				margin-right: 1rem;
				max-height: 120px;
				max-width: 216px;
			}
			:host([dir="rtl"]) .d2l-list-item-flex[breakpoint="3"] ::slotted([slot="illustration"]) {
				margin-left: 1rem;
				margin-right: 0;
			}
		`;
		return [ layout, breakPoint1, breakPoint2, breakPoint3];
	}

	constructor() {
		super();
		this._breakpoint = 0;
		this.breakpoints = [842, 636, 580, 0];
		this.role = 'listitem';
	}

	get breakpoints() {
		return this._breakpoints;
	}

	set breakpoints(val) {
		const oldVal = this._breakpoints;
		this._breakpoints = val.sort((a, b) => b - a).slice(0, 4);
		this.requestUpdate('breakpoints', oldVal);
		fastdom.measure(() => this.resizedCallback(this.offsetWidth));
	}

	render() {
		const illustrationSlot = html`<slot name="illustration"></slot>`;
		return html`
			<div class="d2l-list-item-flex d2l-visible-on-ancestor-target" breakpoint="${this._breakpoint}">
				${this.illustrationOutside ? illustrationSlot : null}
				<div class="d2l-list-item-content">
					<div class="d2l-list-item-content-flex">
						${this.illustrationOutside ? null : illustrationSlot}
						<div class="d2l-list-item-main"><slot></slot></div>
						<slot name="actions"></slot>
					</div>
				</div>
			</div>
		`;
	}

	connectedCallback() {
		super.connectedCallback();
		ro.observe(this);
	}
	disconnectedCallback() {
		super.disconnectedCallback();
		ro.unobserve(this);
	}
	resizedCallback(width) {
		const lastBreakpointIndexToCheck = 3;
		this.breakpoints.some((breakpoint, index) => {
			if (width >= breakpoint || index > lastBreakpointIndexToCheck) {
				this._breakpoint = lastBreakpointIndexToCheck - index - (lastBreakpointIndexToCheck - this.breakpoints.length + 1) * index;
				return true;
			}
		});
	}
}

customElements.define('d2l-list-item', ListItem);
