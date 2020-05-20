import { css, html, LitElement } from 'lit-element/lit-element.js';

class ErrorSummary extends LitElement {

	static get properties() {
		return {
			errors: { type: Array }
		};
	}

	static get styles() {
		return css``;
	}

	constructor() {
		super();
		this.errors = [];
	}

	render() {
		return html`
			<ul>
				${this.errors.map(error => html`<li>${error}</li>`)}
			</ul>
		`;
	}

}
customElements.define('d2l-error-summary', ErrorSummary);
