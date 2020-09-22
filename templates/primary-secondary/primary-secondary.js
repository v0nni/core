import '../../components/colors/colors.js';
import { css, html, LitElement } from 'lit-element/lit-element';
import { styleMap } from 'lit-html/directives/style-map.js';
import { registerGestureTouchMomentum } from '../../helpers/gestures.js';

const dividerWidth = 5;
const minPanelWidth = 320;
const collapseWidth = minPanelWidth / 2;

const keyCodes = Object.freeze({
	LEFT: 37,
	RIGHT: 39
});

/**
 * A two panel (primary and secondary) page template with header and optional footer
 * @slot header - Page header content
 * @slot footer - Page footer content
 * @slot primary - Main page content
 * @slot secondary - Supplementary page content
 */
class TemplatePrimarySecondary extends LitElement {

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
			 * Whether content fills the screen or not
			 * @type {'fullscreen'|'normal'}
			 */
			widthType: { type: String, attribute: 'width-type', reflect: true },
			_isCollapsed: { type: Boolean },
			_hasFooter: { type: Boolean },
			_height: { type: Number }
		};
	}

	static get styles() {
		return css`
			:host {
				display: block;
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
				display: grid;
				grid-template-areas:
					"header"
					"content"
					"footer";
				grid-template-columns: auto;
				grid-template-rows: auto 1fr auto;
				height: 100vh;
			}
			header {
				grid-area: header;
				z-index: 2;
			}
			.d2l-template-primary-secondary-content {
				display: grid;
				grid-template-areas: "primary divider secondary";
				overflow: hidden;
				z-index: auto;
			}
			.d2l-template-primary-secondary-content[data-is-collapsed] {
				grid-template-areas: "primary divider";
			}
			[data-is-collapsed] aside {
				display: none;
			}
			main {
				grid-area: primary;
				overflow-x: hidden;
				transition: width 400ms cubic-bezier(0, 0.7, 0.5, 1);
			}
			[data-is-resizing] main {
				transition: none;
			}

			:host([primary-overflow="hidden"]) main {
				overflow: hidden;
			}
			[data-background-shading="primary"] > main,
			[data-background-shading="secondary"] > aside {
				background-color: var(--d2l-color-gypsum);
			}
			.d2l-template-primary-secondary-divider {
				position: relative;
				width: ${dividerWidth}px;
				background-color: var(--d2l-color-mica);
				grid-area: divider;
			}
			aside {
				grid-area: secondary;
				overflow-y: auto;
			}
			footer {
				background-color: #ffffff;
				box-shadow: 0 -2px 4px rgba(73, 76, 78, 0.2); /* ferrite */
				grid-area: footer;
				padding: 0.75rem 1rem;
				z-index: 2; /* ensures the footer box-shadow is over main areas with background colours set */
			}

			.d2l-template-primary-secondary-divider-handle {
				top: calc(50% - 30px);
				left: calc(-5px);
				position: absolute;
				width: 15px;
				height: 60px;
				background-color: var(--d2l-color-mica);
				border-radius: 5px;
				cursor: ew-resize; /*resizer cursor*/
			}

			.d2l-template-primary-secondary-divider-handle:focus {
				box-shadow: 0 0 0 2px #ffffff, 0 0 0 4px var(--d2l-color-celestine);
				outline:none;
			}

			@media only screen and (max-width: 929px) {
				.d2l-template-primary-secondary-container {
				}
				.d2l-template-primary-secondary-content {
					grid-template-areas:
						"primary"
						"divider"
						"secondary";
					grid-template-columns: auto;
				}
				.d2l-template-primary-secondary-divider {
					position: relative;
					width: 100%;
					height: ${dividerWidth}px;
					background-color: var(--d2l-color-mica);
					grid-area: divider;
				}
				.d2l-template-primary-secondary-divider-handle {
					left: calc(50% - 30px);
					top: calc(-5px);
					position: absolute;
					height: 15px;
					width: 60px;
					cursor: ns-resize; /*resizer cursor*/
				}
			}
		`;
	}

	constructor() {
		super();
		this._onMouseMove = this._onMouseMove.bind(this);
		this._onMouseUp = this._onMouseUp.bind(this);
		this._onTouchMove = this._onTouchMove.bind(this);
		this._onTouchEnd = this._onTouchEnd.bind(this);

		this.widthType = 'fullscreen';
		this.backgroundShading = 'none';
	}

	connectedCallback() {
		super.connectedCallback();
		window.addEventListener('mousemove', this._onMouseMove);
		window.addEventListener('mouseup', this._onMouseUp);
		window.addEventListener('touchmove', this._onTouchMove, { passive: false });
		window.addEventListener('touchend', this._onTouchEnd);

	}

	firstUpdated(changedProperties) {
		super.firstUpdated(changedProperties);
		const secondaryPanel = this.shadowRoot.querySelector('aside');
		registerGestureTouchMomentum(secondaryPanel);
		this.updateComplete.then(() => {
			const contentArea = this.shadowRoot.querySelector('.d2l-template-primary-secondary-content');
			const contentHeight = contentArea.offsetHeight;
			this._height = (contentHeight - dividerWidth) * (2 / 3);
		});
	}

	render() {
		const primaryStyles = !this._isCollapsed ? { height: `${this._height}px` } : {};
		return html`
			<div class="d2l-template-primary-secondary-container">
				<header><slot name="header"></slot></header>
				<div class="d2l-template-primary-secondary-content" data-background-shading="${this.backgroundShading}" ?data-is-collapsed=${this._isCollapsed} ?data-is-resizing=${this._isResizing}>
					<main style="${styleMap(primaryStyles)}"><slot name="primary"></slot></main>
					<div class="d2l-template-primary-secondary-divider">
						<div tabindex="0" class="d2l-template-primary-secondary-divider-handle" @mousedown=${this._onMouseDown} @keydown="${this._onKeyDown}">
						</div>
					</div>
					<aside @touchstart=${this._onTouchStart} @d2l-gesture-momentum=${this._onMomentum}><slot name="secondary"></slot></aside>
				</div>
				<footer ?hidden="${!this._hasFooter}">
					<div class="d2l-template-primary-secondary-footer"><slot name="footer" @slotchange="${this._handleFooterSlotChange}"></div></slot>
				</footer>
			</div>
		`;
	}
	_clampWidth(width, contentWidth) {
		if (contentWidth === undefined) {
			const contentArea = this.shadowRoot.querySelector('.d2l-template-primary-secondary-content');
			contentWidth = contentArea.offsetWidth;
		}
		return Math.max(minPanelWidth, Math.min(width, contentWidth - dividerWidth - minPanelWidth));
	}

	_computeMaxHeight() {
		const contentArea = this.shadowRoot.querySelector('.d2l-template-primary-secondary-content');
		const contentHeight = contentArea.offsetHeight - dividerWidth;

		return contentHeight * (2 / 3);
	}

	_computeMinHeight() {
		const contentArea = this.shadowRoot.querySelector('.d2l-template-primary-secondary-content');
		const secondaryPanel = this.shadowRoot.querySelector('aside');
		const contentHeight = contentArea.offsetHeight - dividerWidth;

		return Math.max(contentHeight * (1 / 3), contentHeight - secondaryPanel.scrollHeight);
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

	_onKeyDown(e) {

	}

	_onMomentum(e) {
		const delta = e.detail.y - this._touchStart;
		console.log('moment delta', e.detail.y);

		const minHeight = this._computeMinHeight();
		const maxHeight = this._computeMaxHeight();

		const secondaryPanel = this.shadowRoot.querySelector('aside');
		if (delta > 0) {
			const desiredScroll = this._scrollStart - delta;
			secondaryPanel.scrollTop = desiredScroll;

			const desiredHeight = desiredScroll - secondaryPanel.scrollTop;
			this._height = Math.min(Math.max(this._heightStart - desiredHeight, minHeight), maxHeight);
		} else {
			const desiredHeight = this._heightStart + delta;
			this._height = Math.min(Math.max(desiredHeight, minHeight), maxHeight);

			const desiredScroll = desiredHeight - this._height;
			secondaryPanel.scrollTop = this._scrollStart - desiredScroll;
		}
	}

	_onMouseDown() {
		this._isResizing = true;
	}

	_onMouseMove(e) {
		if (this._isResizing) {
			e.preventDefault();
			// this._updateWidth(e.pageX);
		}
	}

	_onMouseUp(e) {
		if (this._isResizing) {
			this._updateWidth(e.pageX);
			// this._isResizing = false;
		}
	}

	_onTouchEnd() {
		this._isSliding = false;

	}

	_onTouchMove(e) {
		if (this._isSliding) {
			const touch = e.touches[0];
			const delta = touch.clientY - this._touchStart;
			console.log('delta', touch.clientY);

			const minHeight = this._computeMinHeight();
			const maxHeight = this._computeMaxHeight();

			e.preventDefault();
			const secondaryPanel = this.shadowRoot.querySelector('aside');
			if (delta > 0) {
				const desiredScroll = this._scrollStart - delta;
				secondaryPanel.scrollTop = desiredScroll;

				const desiredHeight = desiredScroll - secondaryPanel.scrollTop;
				this._height = Math.min(Math.max(this._heightStart - desiredHeight, minHeight), maxHeight);
			} else {
				const desiredHeight = this._heightStart + delta;
				this._height = Math.min(Math.max(desiredHeight, minHeight), maxHeight);

				const desiredScroll = desiredHeight - this._height;
				secondaryPanel.scrollTop = this._scrollStart - desiredScroll;
			}
		}

	}

	_onTouchStart(e) {
		const secondaryPanel = this.shadowRoot.querySelector('aside');
		const touch = e.touches[0];
		this._heightStart = this._height;
		this._touchStart = touch.clientY;
		this._scrollStart = secondaryPanel.scrollTop;
		this._isSliding = true;
	}

	_updateWidth(desiredWidth) {
		const contentArea = this.shadowRoot.querySelector('.d2l-template-primary-secondary-content');
		const contentWidth = contentArea.offsetWidth;

		const secondaryPanelWidth = contentWidth - desiredWidth - dividerWidth;
		this._isCollapsed = secondaryPanelWidth <= collapseWidth;
		this._width = this._clampWidth(desiredWidth, contentWidth);
	}

}

customElements.define('d2l-template-primary-secondary', TemplatePrimarySecondary);
