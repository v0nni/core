import '../icons/icon.js';
import '../link/link.js';
import { html, LitElement } from 'lit-element/lit-element.js';
import { RtlMixin } from '../../mixins/rtl-mixin.js';

class SampleComponent extends RtlMixin(LitElement) {

	static get properties() {
		return {
			somebool: {
				type: Boolean,
				reflect: true
			},
		};
	}
	render() {
		return html`
			<div @click=${this._onButtonClick}>
				<span> Sample Component>
				<d2l-icon icon="${this.somebool ? 'd2l-tier1:chevron-left' : 'd2l-tier1:chevron-right'}"></d2l-icon>
			</div>
		`;
	}
	updated() {
		this.somebool = false;
	}

	_onButtonClick() {
		this.somebool  = !this.somebool;
	}
}
customElements.define('d2l-sample-component', SampleComponent);
