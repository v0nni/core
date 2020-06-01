import '../alert/alert.js';
import { bodyStandardStyles } from '../typography/styles.js';
import { css, html, LitElement } from 'lit-element/lit-element.js';
import '../expand-collapse/expand-collapse-content.js';

class ErrorSummary extends LitElement {

	static get properties() {
		return {
      buttonText: { type: String, attribute: 'button-text' },
      errorList: { type: Object, attribute: 'errors' }
		};
  }

  static get styles(){
    return [bodyStandardStyles, css`
      .d2l-error-summary-content-container {
				display: flex;
        flex: 1;
        line-height: 1;
      }
      .d2l-error-summary-text {
        flex: 1;
        display: inline;
      }
			.d2l-error-summary-expand-button {
        margin-top: -0.8rem;
        margin-right: -1rem;
        position: relative;
      }
      .d2l-error-summary-error-list {
        margin: 0px;
      }
    `];
  }

	render() {
		return html`
      <d2l-alert type="critical">
      <div class="d2l-error-summary-content-container">
          <div class="d2l-error-summary-text">
            There were 2 errors found in the information you submitted.
          </div>
          <d2l-button-icon
            class="d2l-error-summary-expand-button"
            icon="tier1:arrow-collapse"
            @click=${this.toggle}></d2l-button-icon>
        </div>
        <d2l-expand-collapse-content>
            <ul class="d2l-error-summary-error-list">
              <li>Coffee</li>
              <li>Tea</li>
              <li>Milk</li>
            </ul>
          </d2l-expand-collapse-content>
        </d2l-alert>
      `;
  }

  toggle() {
    const errorList = this.shadowRoot.querySelector('d2l-expand-collapse-content');
    errorList.expanded = !errorList.expanded;
    const button = this.shadowRoot.querySelector('d2l-button-icon');
    button.setAttribute('aria-expanded', errorList.expanded);
  }
}

customElements.define('d2l-error-summary', ErrorSummary);
