import '../../components/colors/colors.js';
import '../../components/icons/icon-custom.js';
import { css, html, LitElement } from 'lit-element/lit-element';
import ResizeObserver from 'resize-observer-polyfill/dist/ResizeObserver.es.js';
import { RtlMixin } from '../../mixins/rtl-mixin.js';
import { styleMap } from 'lit-html/directives/style-map.js';

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

const desktopMinSize = 320;

const keyCodes = Object.freeze({
	LEFT: 37,
	UP: 38,
	RIGHT: 39,
	DOWN: 40
});

function isMobile() {
	return matchMedia('only screen and (max-width: 768px)').matches;
}

function clamp(val, min, max) {
	return Math.max(min, Math.min(val, max));
}

class Resizer {

	constructor(isRtl) {
		this.contentRect = null;
		this.contentBounds = null;
		this.isMobile = false;
		this.panelSize = 0;
		this.isRtl = isRtl;
	}

	clampHeight(height) {
		return clamp(height, this.contentBounds.minHeight, this.contentBounds.maxHeight);
	}

	clampWidth(width) {
		return clamp(width, this.contentBounds.minWidth, this.contentBounds.maxWidth);
	}

	dispatchResize(size, animateResize) {
		if (this._onResizeCallback) {
			this._onResizeCallback({ size, animateResize: !!animateResize });
		}
	}

	onResize(callback) {
		this._onResizeCallback = callback;
	}

	onResizeEnd(callback) {
		this._onResizeEndCallback = callback;
	}

	onResizeStart(callback) {
		this._onResizeStartCallback = callback;
	}
}

class DesktopKeyboardResizer extends Resizer {

	constructor(isRtl) {
		super(isRtl);
		this._onKeyDown = this._onKeyDown.bind(this);
		this._leftKeyCode = this.isRtl ? keyCodes.RIGHT : keyCodes.LEFT;
		this._rightKeyCode = this.isRtl ? keyCodes.LEFT : keyCodes.RIGHT;
	}

	connect(target) {
		target.addEventListener('keydown', this._onKeyDown);
		this._target = target;
	}

	disconnect() {
		this._target.removeEventListener('keydown', this._onKeyDown);
	}

	_onKeyDown(e) {
		if (this.isMobile) {
			return;
		}
		if (e.keyCode !== this._leftKeyCode && e.keyCode !== this._rightKeyCode) {
			return;
		}
		let secondaryWidth;
		if (this.panelSize === 0) {
			if (e.keyCode === this._leftKeyCode) {
				secondaryWidth = this.contentBounds.minWidth;
			} else {
				secondaryWidth = 0;
			}
		} else {
			const delta = (this.contentBounds.maxWidth - this.contentBounds.minWidth) / 6;
			const direction = e.keyCode === this._leftKeyCode ? 1 : -1;
			const desiredWidth = this.panelSize + delta * direction;
			const desiredSteppedWidth = this.contentBounds.minWidth + delta * Math.round((desiredWidth - this.contentBounds.minWidth) / delta);

			const actualSecondaryWidth = this.clampWidth(desiredSteppedWidth);
			if (desiredSteppedWidth < actualSecondaryWidth) {
				secondaryWidth = 0;
			} else {
				secondaryWidth = actualSecondaryWidth;
			}
		}
		this.dispatchResize(secondaryWidth, true);
	}
}

class DesktopMouseResizer extends Resizer {

	constructor(isRtl) {
		super(isRtl);
		this._onTouchStart = this._onTouchStart.bind(this);
		this._onMouseDown = this._onMouseDown.bind(this);
		this._onTouchMove = this._onTouchMove.bind(this);
		this._onMouseMove = this._onMouseMove.bind(this);
		this._onResizeEnd = this._onResizeEnd.bind(this);
		this._target = null;
	}

	connect(target) {
		target.addEventListener('touchstart', this._onTouchStart);
		target.addEventListener('touchmove', this._onTouchMove);
		target.addEventListener('touchend', this._onResizeEnd);
		target.addEventListener('mousedown', this._onMouseDown);
		window.addEventListener('mousemove', this._onMouseMove);
		window.addEventListener('mouseup', this._onResizeEnd);
		this._target = target;
	}

	disconnect() {
		this._target.removeEventListener('touchstart', this._onTouchStart);
		this._target.removeEventListener('touchmove', this._onTouchMove);
		this._target.removeEventListener('touchend', this._onResizeEnd);
		this._target.removeEventListener('mousedown', this._onMouseDown);
		window.removeEventListener('mousemove', this._onMouseMove);
		window.removeEventListener('mouseup', this._onResizeEnd);
		this._target = null;
	}

	_computeContentX(clientX) {
		const x = clientX - this.contentRect.left;
		return this.isRtl ? x : this.contentRect.width - x;
	}

	_onMouseDown(e) {
		this._resizeStart(e.clientX);
	}

	_onMouseMove(e) {
		if (!this._isResizing) {
			return;
		}
		e.preventDefault();
		this._resize(e.clientX);
	}

	_onResizeEnd() {
		if (this._isResizing) {
			this._isResizing = false;
		}
	}

	_onTouchMove(e) {
		if (!this._isResizing) {
			return;
		}
		e.preventDefault();
		const touch = e.touches[0];
		this._resize(touch.clientX);
	}

	_onTouchStart(e) {
		const touch = e.touches[0];
		this._resizeStart(touch.clientX);
	}

	_resize(clientX) {
		let actualSecondaryWidth;
		const x = this._computeContentX(clientX);
		const collapseThreshold = this.contentBounds.minWidth / 2;
		const desiredSecondaryWidth = x + this._offset;
		if (desiredSecondaryWidth < collapseThreshold) {
			actualSecondaryWidth = 0;
		} else {
			actualSecondaryWidth = this.clampWidth(desiredSecondaryWidth);
		}
		const animateResize = desiredSecondaryWidth < actualSecondaryWidth || actualSecondaryWidth === 0;
		this.dispatchResize(actualSecondaryWidth, animateResize);
	}

	_resizeStart(clientX) {
		if (!this.isMobile) {
			const x = this._computeContentX(clientX);
			this._offset = this.panelSize - x;
			this._isResizing = true;
		}
	}

}

class MobileKeyboardResizer extends Resizer {

	constructor(isRtl) {
		super(isRtl);
		this._steps = 3;
		this._onKeyDown = this._onKeyDown.bind(this);
	}

	connect(target) {
		target.addEventListener('keydown', this._onKeyDown);
		this._target = target;
	}

	disconnect() {
		this._target.removeEventListener('keydown', this._onKeyDown);
	}

	_onKeyDown(e) {
		if (!this.isMobile) {
			return;
		}
		if (e.keyCode !== keyCodes.UP && e.keyCode !== keyCodes.DOWN) {
			return;
		}
		let secondaryHeight;
		if (this.panelSize === 0) {
			if (e.keyCode === keyCodes.UP) {
				secondaryHeight = this.contentBounds.minHeight;
			} else {
				secondaryHeight = 0;
			}
		} else {
			const delta = (this.contentBounds.maxHeight - this.contentBounds.minHeight) / (this._steps - 1);
			const direction = e.keyCode === keyCodes.UP ? 1 : -1;
			const desiredHeight = this.panelSize + delta * direction;
			const desiredSteppedHeight = this.contentBounds.minHeight + delta * Math.round((desiredHeight - this.contentBounds.minHeight) / delta);

			const actualSecondaryHeight = this.clampHeight(desiredSteppedHeight);
			if (desiredSteppedHeight < actualSecondaryHeight) {
				secondaryHeight = 0;
			} else {
				secondaryHeight = actualSecondaryHeight;
			}
		}
		this.dispatchResize(secondaryHeight, true);
	}
}

class MobileMouseResizer extends Resizer {

	constructor(isRtl) {
		super(isRtl);
		this._onMouseDown = this._onMouseDown.bind(this);
		this._onMouseMove = this._onMouseMove.bind(this);
		this._onMouseUp = this._onMouseUp.bind(this);
		this._target = null;
	}

	connect(target) {
		target.addEventListener('mousedown', this._onMouseDown);
		window.addEventListener('mousemove', this._onMouseMove);
		window.addEventListener('mouseup', this._onMouseUp);
		this._target = target;
	}

	disconnect() {
		this._target.removeEventListener('mousedown', this._onMouseDown);
		window.removeEventListener('mousemove', this._onMouseMove);
		window.removeEventListener('mouseup', this._onMouseUp);
		this._target = null;
	}

	_onMouseDown(e) {
		if (this.isMobile) {
			const y = e.clientY - this.contentRect.top;
			this._offset = y - (this.contentRect.height - this.panelSize);
			this._isResizing = true;
		}
	}

	_onMouseMove(e) {
		if (!this._isResizing) {
			return;
		}
		e.preventDefault();
		const y = e.clientY - this.contentRect.top;

		let actualSecondaryHeight;
		const collapseThreshold = this.contentBounds.minHeight / 2;
		const desiredSecondaryHeight = this.contentRect.height - y + this._offset;
		if (desiredSecondaryHeight < collapseThreshold) {
			actualSecondaryHeight = 0;
		} else {
			actualSecondaryHeight = this.clampHeight(desiredSecondaryHeight);
		}
		const animateResize = desiredSecondaryHeight < actualSecondaryHeight || actualSecondaryHeight === 0;
		this.dispatchResize(actualSecondaryHeight, animateResize);
	}

	_onMouseUp() {
		if (this._isResizing) {
			this._isResizing = false;
		}
	}

}

class MobileTouchResizer extends Resizer {
	constructor(isRtl) {
		super(isRtl);
		this._onResizeStart = this._onResizeStart.bind(this);
		this._onTouchMove = this._onTouchMove.bind(this);
		this._onResizeEnd = this._onResizeEnd.bind(this);
		this._target = null;
	}

	connect(target) {
		target.addEventListener('touchstart', this._onResizeStart);
		target.addEventListener('touchmove', this._onTouchMove);
		target.addEventListener('touchend', this._onResizeEnd);
		this._target = target;
	}

	disconnect() {
		this._target.removeEventListener('touchstart', this._onResizeStart);
		this._target.removeEventListener('touchmove', this._onTouchMove);
		this._target.removeEventListener('touchend', this._onResizeEnd);
		this._target = null;
	}

	_computeTouchDirection() {
		const oldest = this._touches[0];
		const newest = this._touches[this._touches.length - 1];
		if (oldest === newest) {
			return 0;
		}
		return newest - oldest;
	}

	_onResizeEnd() {
		if (this._isResizing) {
			if (this.panelSize > this.contentBounds.minHeight && this.panelSize < this.contentBounds.maxHeight) {
				let secondaryHeight;
				const touchDirection = this._computeTouchDirection();
				if (touchDirection >= 0) {
					secondaryHeight = this.contentBounds.minHeight;
				} else {
					secondaryHeight = this.contentBounds.maxHeight;
				}
				this.dispatchResize(secondaryHeight, true);
			}
			this._isResizing = false;
		}
	}

	_onResizeStart(e) {
		if (this.isMobile) {
			const touch = e.touches[0];
			this._prevTouch = touch.screenY;
			this._isResizing = true;
			this._touches = [];
			this._trackTouch(touch);
		}
	}

	_onTouchMove(e) {
		if (!this._isResizing) {
			return;
		}
		const touch = e.touches[0];
		const curTouch = touch.screenY;
		const delta = curTouch - this._prevTouch;
		const curScroll = this._target.scrollTop;
		this._trackTouch(touch);

		let isScrollable;
		let secondaryHeight = this.panelSize;
		if (delta > 0) {
			if (curScroll === 0) {
				secondaryHeight = this.clampHeight(this.panelSize - delta);
			}
			isScrollable = curScroll > 0;
		} else if (delta < 0) {
			secondaryHeight = this.clampHeight(this.panelSize - delta);
			isScrollable = secondaryHeight === this.contentBounds.maxHeight;
		}
		if (!isScrollable && e.cancelable) {
			e.preventDefault();
		}
		this._prevTouch = curTouch;

		this.dispatchResize(secondaryHeight, false);
	}

	_trackTouch(touch) {
		if (this._touches.length === 5) {
			this._touches.shift();
		}
		this._touches.push(touch.screenY);
	}

}

/**
 * A two panel (primary and secondary) page template with header and optional footer
 * @slot header - Page header content
 * @slot footer - Page footer content
 * @slot primary - Main page content
 * @slot secondary - Supplementary page content
 */
class TemplatePrimarySecondary extends RtlMixin(LitElement) {

	static get properties() {
		return {
			/**
			 * Controls whether the primary and secondary panels have shaded backgrounds
			 * @type {'primary'|'secondary'|'none'}
			 */
			backgroundShading: { type: String, attribute: 'background-shading' },
			/**
			 * Controls how the primary panel's contents overflow
			 * @type {'default'|'hidden'}
			 */
			primaryOverflow: { attribute: 'primary-overflow', reflect: true, type: String },
			/**
			 * Whether the panels are user resizable. This only applies to desktop users,
			 * mobile users will always be able to resize.
			 */
			resizable: { type: Boolean, reflect: true },
			/**
			 * Whether content fills the screen or not
			 * @type {'fullscreen'|'normal'}
			 */
			widthType: { type: String, attribute: 'width-type', reflect: true },
			_animateResize: { type: Boolean, attribute: false },
			_hasFooter: { type: Boolean, attribute: false },
			_isCollapsed: { type: Boolean, attribute: false },
			_isExpanded: { type: Boolean, attribute: false },
			_isMobile: { type: Boolean, attribute: false },
			_maxPanelHeight: { type: Number, attribute: false },
			_size: { type: Number, attribute: false }
		};
	}

	static get styles() {
		return css`
			:host {
				overflow: hidden;
			}
			:host([hidden]) {
				display: none;
			}
			:host([width-type="normal"]) .d2l-template-primary-secondary-content,
			:host([width-type="normal"]) .d2l-template-primary-secondary-footer {
				margin: 0 auto;
				max-width: 1230px;
				width: 100%;
			}
			.d2l-template-primary-secondary-container {
				display: flex;
				flex-direction: column;
				position: absolute;
				top: 0;
				left: 0;
				right: 0;
				bottom: 0;
			}
			.d2l-template-primary-secondary-content {
				height: 100%;
				display: flex;
				overflow: hidden;
			}

			main {
				flex: 2 0 0;
				-webkit-overflow-scrolling: touch;
				overflow-x: hidden;
				transition: none;
			}
			:host([resizable]) main {
				flex: 1 0 0;
			}
			:host([primary-overflow="hidden"]) main {
				overflow: hidden;
			}
			.d2l-template-primary-secondary-secondary-container {
				flex: 1 0 0;
				min-width: ${desktopMinSize}px;
				overflow: hidden;
			}
			:host([resizable]) .d2l-template-primary-secondary-secondary-container {
				flex: none;
				min-width: 0;
			}
			[data-animate-resize] .d2l-template-primary-secondary-secondary-container {
				transition: width 400ms cubic-bezier(0, 0.7, 0.5, 1), height 400ms cubic-bezier(0, 0.7, 0.5, 1);
			}
			aside {
				-webkit-overflow-scrolling: touch;
				max-height: 100%;
				min-width: ${desktopMinSize}px;
				overflow-y: auto;
			}
			/* prevent margin colapse on slotted children */
			aside::before,
			aside::after {
				content: ' ';
				display: table;
			}
			[data-background-shading="primary"] > main,
			[data-background-shading="secondary"] > .d2l-template-primary-secondary-secondary-container {
				background-color: var(--d2l-color-gypsum);
			}
			[data-is-collapsed] aside {
				display: none;
			}
			.d2l-template-primary-secondary-divider,
			.d2l-template-primary-secondary-divider-handle-mobile {
				transition: background-color 200ms;
			}
			.d2l-template-primary-secondary-divider {
				background-color: var(--d2l-color-mica);
				flex: none;
				position: relative;
				width: 1px;
				z-index: 1;
			}
			.d2l-template-primary-secondary-divider-handle {
				background-color: transparent;
				border-radius: 0.05rem;
				border: none;
				display: none;
				height: 1.6rem;
				left: -0.1rem;
				padding: 0 0.2rem;
				position: absolute;
				top: calc(50% - 0.8rem);
				width: 0.65rem;
			}
			:host([resizable]) .d2l-template-primary-secondary-divider {
				background-color: var(--d2l-color-gypsum);
				cursor: ew-resize;
				width: 0.45rem;
			}
			:host([resizable]) .d2l-template-primary-secondary-divider:hover {
				background-color: var(--d2l-color-mica);
			}
			:host([resizable]) .d2l-template-primary-secondary-divider-handle {
				cursor: inherit;
				display: block;
			}
			.d2l-template-primary-secondary-divider-handle-desktop {
				display: flex;
				justify-content: space-between;
			}
			.d2l-template-primary-secondary-divider-handle-left,
			.d2l-template-primary-secondary-divider-handle-right {
				color: var(--d2l-color-celestine);
				display: none;
				position: absolute;
			}
			.d2l-template-primary-secondary-divider-handle-left {
				right: 1.225rem;
			}
			.d2l-template-primary-secondary-divider-handle-right {
				left: 1.225rem;
			}
			.d2l-template-primary-secondary-divider-handle-line {
				background-color: var(--d2l-color-galena);
				border-radius: 0.05rem;
				height: 0.9rem;
				width: 0.1rem;
			}
			.d2l-template-primary-secondary-divider-handle:focus {
				box-shadow: 0 0 0 0.1rem var(--d2l-color-celestine);
				outline: none;
			}
			.d2l-template-primary-secondary-divider-handle:focus .d2l-template-primary-secondary-divider-handle-right,
			.d2l-template-primary-secondary-divider-handle:focus .d2l-template-primary-secondary-divider-handle-left {
				display: block;
			}
			:host(:not([dir="rtl"])) [data-is-expanded] .d2l-template-primary-secondary-divider-handle-left {
				display: none;
			}
			:host([dir="rtl"]) [data-is-expanded] .d2l-template-primary-secondary-divider-handle-right {
				display: none;
			}
			d2l-icon {
				display: none;
			}

			footer {
				background-color: white;
				box-shadow: 0 -2px 4px rgba(73, 76, 78, 0.2); /* ferrite */
				padding: 0.75rem 1rem;
			}
			header, footer {
				z-index: 2; /* ensures the footer box-shadow is over main areas with background colours set */
			}
			@media only screen and (max-width: 768px) {

				.d2l-template-primary-secondary-content {
					flex-direction: column;
				}

				main {
					flex: 1 0 0;
				}
				.d2l-template-primary-secondary-secondary-container {
					flex: none;
				}

				.d2l-template-primary-secondary-divider-handle-desktop {
					display: none;
				}
				/* Attribute selector is only used to increase specificity */
				:host([resizable]) .d2l-template-primary-secondary-divider,
				:host(:not([resizable])) .d2l-template-primary-secondary-divider {
					background-color: var(--d2l-color-celestine);
					cursor: ns-resize; /*resizer cursor*/
					height: 0.1rem;
					width: 100%;
				}
				:host([resizable]) .d2l-template-primary-secondary-divider:hover {
					background-color: var(--d2l-color-celestine-minus-1);
				}
				.d2l-template-primary-secondary-divider-handle {
					border-radius: 0;
					bottom: 0.1rem;
					display: block;
					left: auto;
					overflow: hidden;
					right: calc(17px + 0.2rem);
					top: auto;
				}
				.d2l-template-primary-secondary-divider-handle-mobile {
					align-items: center;
					background-color: var(--d2l-color-celestine);
					border-radius: 0.25rem 0.25rem 0 0;
					bottom: 0;
					display: flex;
					justify-content: center;
					position: absolute;
					right: 0;
				}
				.d2l-template-primary-secondary-divider-handle-mobile:hover {
					background-color: var(--d2l-color-celestine-minus-1);
				}
				.d2l-template-primary-secondary-divider-handle,
				.d2l-template-primary-secondary-divider-handle-mobile {
					height: 1.0rem;
					width: 2.2rem;
				}
				.d2l-template-primary-secondary-divider-handle:focus {
					box-shadow: none;
					height: 1.2rem;
					right: 17px;
					width: 2.6rem;
				}
				d2l-icon {
					display: block;
					color: white;
				}
				.d2l-template-primary-secondary-divider-handle:focus .d2l-template-primary-secondary-divider-handle-mobile {
					right: 0.2rem;
					box-shadow: 0 0 0 0.1rem white, 0 0 0 0.2rem var(--d2l-color-celestine);
				}
			}
		`;
	}

	constructor() {
		super();

		this._onContentResize = this._onContentResize.bind(this);
		this._onResize = this._onResize.bind(this);

		const isRtl = document.documentElement.getAttribute('dir') === 'rtl';
		this._desktopMouseResizer = new DesktopMouseResizer(isRtl);
		this._desktopKeyboardResizer = new DesktopKeyboardResizer(isRtl);
		this._mobileKeyboardResizer = new MobileKeyboardResizer(isRtl);
		this._mobileTouchResizer = new MobileTouchResizer(isRtl);
		this._mobileMouseResizer = new MobileMouseResizer(isRtl);

		this._resizers = [
			this._desktopMouseResizer,
			this._mobileKeyboardResizer,
			this._mobileTouchResizer,
			this._mobileMouseResizer,
			this._desktopKeyboardResizer
		];
		for (const resizer of this._resizers) {
			resizer.onResize(this._onResize);
		}

		this._size = 0;
		this._animateResize = false;
		this._isCollapsed = false;
		this._isExpanded = false;
		this.widthType = 'fullscreen';
		this.backgroundShading = 'none';
		this.resizable = false;
	}

	async connectedCallback() {
		super.connectedCallback();
		await new Promise(resolve => requestAnimationFrame(resolve));

		const secondaryPanel = this.shadowRoot.querySelector('aside');
		const divider = this.shadowRoot.querySelector('.d2l-template-primary-secondary-divider');
		const handle = this.shadowRoot.querySelector('.d2l-template-primary-secondary-divider-handle');

		this._mobileKeyboardResizer.connect(handle);
		this._desktopKeyboardResizer.connect(handle);
		this._desktopMouseResizer.connect(divider);
		this._mobileTouchResizer.connect(secondaryPanel);
		this._mobileMouseResizer.connect(divider);
	}

	disconnectedCallback() {
		for (const resizer of this._resizers) {
			resizer.disconnect();
		}
	}

	async firstUpdated(changedProperties) {
		super.firstUpdated(changedProperties);

		const contentArea = this.shadowRoot.querySelector('.d2l-template-primary-secondary-content');
		this._resizeObserver = new ResizeObserver(this._onContentResize);
		this._resizeObserver.observe(contentArea);

		await this.updateComplete;
		const contentRect = contentArea.getBoundingClientRect();
		this._contentBounds = this._computeContentBounds(contentRect);
		this._isMobile = isMobile();

		if (this._isMobile) {
			this._size = this._contentBounds.minHeight;
		} else {
			const divider = this.shadowRoot.querySelector('.d2l-template-primary-secondary-divider');
			const desktopDividerSize = contentRect.width - divider.offsetWidth;
			this._size = Math.max(desktopMinSize, desktopDividerSize * (1 / 3));
		}
		this._maxPanelHeight = this._contentBounds.maxHeight;
	}

	render() {
		const secondaryPanelStyles = {};
		if (this._isResizable()) {
			secondaryPanelStyles[this._isMobile ? 'height' : 'width'] = `${this._size}px`;
		}
		const secondaryStyles = {
			height: this._isMobile ? `${this._maxPanelHeight}px` : null
		};
		return html`
			<div class="d2l-template-primary-secondary-container">
				<header><slot name="header"></slot></header>
				<div class="d2l-template-primary-secondary-content" data-background-shading="${this.backgroundShading}" ?data-animate-resize=${this._animateResize} ?data-is-collapsed=${this._isCollapsed} ?data-is-expanded=${this._isExpanded}>
					<main><slot name="primary"></slot></main>
					<div class="d2l-template-primary-secondary-divider">
						<button @click=${this._onHandleTap} @mousedown=${this._onHandleTapStart} class="d2l-template-primary-secondary-divider-handle">
							<div class="d2l-template-primary-secondary-divider-handle-desktop">
								<d2l-icon-custom size="tier1" class="d2l-template-primary-secondary-divider-handle-left">
									<svg width="18" height="18" xmlns="http://www.w3.org/2000/svg">
										<path transform="rotate(90 9.004714965820312,9.000227928161623)" d="m13.708,6.29a1.006,1.006 0 0 0 -0.708,-0.29l-7.995,0a1,1 0 0 0 -0.705,1.71l4,4a1.013,1.013 0 0 0 1.42,0l4,-4a1.01,1.01 0 0 0 -0.013,-1.42l0.001,0z" fill="#494c4e"/>
									</svg>
								</d2l-icon-custom>
								<div class="d2l-template-primary-secondary-divider-handle-line"></div>
								<div class="d2l-template-primary-secondary-divider-handle-line"></div>
								<d2l-icon-custom size="tier1" class="d2l-template-primary-secondary-divider-handle-right">
									<svg width="18" height="18" xmlns="http://www.w3.org/2000/svg">
										<path transform="rotate(-90 9.004714965820314,9.000227928161621)" d="m13.708,6.29a1.006,1.006 0 0 0 -0.708,-0.29l-7.995,0a1,1 0 0 0 -0.705,1.71l4,4a1.013,1.013 0 0 0 1.42,0l4,-4a1.01,1.01 0 0 0 -0.013,-1.42l0.001,0z" fill="#494c4e"/>
									</svg>
								</d2l-icon-custom>
							</div>
							<div class="d2l-template-primary-secondary-divider-handle-mobile">
								${this._size === 0 ? html`<d2l-icon icon="tier1:chevron-up"></d2l-icon>` : html`<d2l-icon icon="tier1:chevron-down"></d2l-icon>`}
							</div>
						</button>
					</div>
					<div style=${styleMap(secondaryPanelStyles)} class="d2l-template-primary-secondary-secondary-container" @transitionend=${this._onTransitionEnd}>
						<aside style=${styleMap(secondaryStyles)}>
							<slot name="secondary"></slot>
						</aside>
					</div>
				</div>
				<footer ?hidden="${!this._hasFooter}">
					<div class="d2l-template-primary-secondary-footer"><slot name="footer" @slotchange="${this._handleFooterSlotChange}"></div></slot>
				</footer>
			</div>
		`;
	}

	get _size() {
		return this.__size;
	}

	set _size(val) {
		const oldHeight = this.__size;
		this.__size = val;
		for (const resizer of this._resizers) {
			resizer.panelSize = val;
		}
		this.requestUpdate('_size', oldHeight);
	}

	_computeContentBounds(contentRect) {
		const divider = this.shadowRoot.querySelector('.d2l-template-primary-secondary-divider');
		const desktopDividerSize = divider.offsetWidth;
		const mobileDividerSize = divider.offsetHeight;
		return {
			minWidth: desktopMinSize,
			maxWidth: contentRect.width - desktopMinSize - desktopDividerSize,
			minHeight: (contentRect.height - mobileDividerSize) * (1 / 3),
			maxHeight: (contentRect.height - mobileDividerSize) * (2 / 3)
		};
	}

	async _getUpdateComplete() {
		const fontsPromise = document.fonts ? document.fonts.ready : Promise.resolve();
		await super._getUpdateComplete();
		/* wait for the fonts to load because browsers have a font block period
		 where they will render an invisible fallback font face that may result in
		 improper width calculations before the real font is loaded */
		await fontsPromise;
	}

	_handleFooterSlotChange(e) {
		const nodes = e.target.assignedNodes();
		this._hasFooter = (nodes.length !== 0);
	}

	_isResizable() {
		return this.resizable || this._isMobile;
	}

	_onContentResize(entries) {
		const entry = entries[0];
		const contentRect = entry.target.getBoundingClientRect();
		this._contentBounds = this._computeContentBounds(contentRect);
		this._maxPanelHeight = this._contentBounds.maxHeight;
		this._isMobile = isMobile();

		if (this._size !== 0) {
			if (this._isMobile) {
				this._size = clamp(this._size, this._contentBounds.minHeight, this._contentBounds.maxHeight);
			} else {
				this._size = clamp(this._size, this._contentBounds.minWidth, this._contentBounds.maxWidth);
			}
			this._isExpanded = this._size === this._contentBounds.maxWidth;
		}
		for (const resizer of this._resizers) {
			resizer.contentRect = contentRect;
			resizer.contentBounds = this._contentBounds;
			resizer.isMobile = this._isMobile;
		}
	}

	_onHandleTap() {
		if (!this._isMobile || !this._isHandleTap) {
			return;
		}
		if (this._size === 0) {
			this._size = this._restoreSize || this._contentBounds.minHeight;
			this._isCollapsed = false;
		} else {
			this._isCollapsed = reduceMotion;
			this._restoreSize = this._size;
			this._size = 0;
		}
		this._animateResize = !reduceMotion;
		this._isHandleTap = false;
	}

	_onHandleTapStart() {
		this._isHandleTap = true;
	}

	_onResize(e) {
		if (this._isResizable()) {
			if (e.size > 0) {
				this._isCollapsed = false;
			} else if (reduceMotion) {
				this._isCollapsed = true;
			}
			this._isExpanded = e.size === this._contentBounds.maxWidth;
			this._animateResize = !reduceMotion && e.animateResize;
			this._isHandleTap = false;
			this._size = e.size;
		}
	}

	_onTransitionEnd() {
		if (this._size === 0) {
			this._isCollapsed = true;
		}
		this._animateResize = false;
	}
}

customElements.define('d2l-template-primary-secondary', TemplatePrimarySecondary);
