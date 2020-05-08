import { css, html, LitElement } from 'lit-element/lit-element.js';
import ResizeObserver from 'resize-observer-polyfill/dist/ResizeObserver.es.js';
import { styleMap } from 'lit-html/directives/style-map.js';

class ExpandCollapse extends LitElement {

	static get properties() {
		return {
			expanded: { type: Boolean, reflect: true },
			_height: { type: Number }
		};
	}

	static get styles() {
		return css`
			:host {
				display: block;
				overflow: hidden;
			}

			:host([hidden]) {
				display: none;
			}

			:host([expanded]) {
				overflow: visible;
			}

			.d2l-expand-collapse {
				height: 0px;
				transition: height 400ms cubic-bezier(0, 0.7, 0.5, 1);
			}

			@media (prefers-reduced-motion: reduce) {
				.d2l-expand-collapse {
					transition: none;
				}
			}
		`;
	}

	constructor() {
		super();
		this._onContentResize = this._onContentResize.bind(this);
		this.expanded = false;
	}

	get expanded() {
		return this._expanded;
	}

	set expanded(val) {
		const oldVal = this._expanded;
		if (oldVal !== val) {
			this._expanded = val;
			this.requestUpdate('expanded', oldVal);
			this._expandedChanged(val);
		}
	}

	firstUpdated() {
		super.firstUpdated();

		const content = this.shadowRoot.querySelector('.d2l-expand-collapse-content');
		this._resizeObserver = new ResizeObserver(this._onContentResize);
		this._resizeObserver.observe(content);
	}

	expand() {
		this._height = this.scrollHeight;
	}

	collapse() {
		this._height = null;
	}

	_expandedChanged(val) {
		if (val) {
			this.expand();
		} else {
			this.collapse();
		}
	}

	render() {
		const styles = {
			height: this.expanded ? `${this._height}px` : null
		};
		return html`
			<div class="d2l-expand-collapse" style=${styleMap(styles)}>
				<div class="d2l-expand-collapse-content">
					<slot></slot>
				</div>
			</div>
		`;
	}

	_onContentResize() {
		if (!this.expanded) {
			return;
		}
		const content = this.shadowRoot.querySelector('.d2l-expand-collapse-content');
		this._height = content.scrollHeight;
	}

}
customElements.define('d2l-expand-collapse', ExpandCollapse);
