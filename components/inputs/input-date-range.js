import './input-date.js';
import './input-fieldset.js';
import '../validation/validation-custom.js';
import { css, html, LitElement } from 'lit-element/lit-element.js';
import { FormElementMixin } from '../form/form-element-mixin.js';
import { getDateFromISODate } from '../../helpers/dateTime.js';
import { ifDefined } from 'lit-html/directives/if-defined.js';
import { LocalizeCoreElement } from '../../lang/localize-core-element.js';
import { RtlMixin } from '../../mixins/rtl-mixin.js';

/**
 * A component consisting of two input-date components - one for start of range and one for end of range. Values specified for these components (through start-value and/or end-value attributes) should be localized to the user's timezone if applicable and must be in ISO 8601 calendar date format ("YYYY-MM-DD").
 * @fires change - Dispatched when a start or end date is selected or typed. "start-value" and "end-value" reflect the selected values and are in ISO 8601 calendar date format ("YYYY-MM-DD").
 */
class InputDateRange extends FormElementMixin(RtlMixin(LocalizeCoreElement(LitElement))) {

	static get properties() {
		return {
			/**
			 * Disables the inputs
			 */
			disabled: { type: Boolean, reflect: true },
			/**
			 * Label for the end date input
			 * @default "End Date"
			 */
			endLabel: { attribute: 'end-label', reflect: true, type: String },
			/**
			 * Value of the end date input
			 */
			endValue: { attribute: 'end-value', reflect: true, type: String },
			/**
			 * REQUIRED: Accessible label for the range
			 */
			label: { type: String, reflect: true },
			/**
			 * Hides the label visually
			 */
			labelHidden: { type: Boolean, attribute: 'label-hidden', reflect: true },
			/**
			 * Maximum valid date that could be selected by a user
			 */
			maxValue: { attribute: 'max-value', reflect: true, type: String },
			/**
			 * Minimum valid date that could be selected by a user
			 */
			minValue: { attribute: 'min-value', reflect: true, type: String },
			/**
			 * Label for the start date input
			 * @default "Start Date"
			 */
			startLabel: { attribute: 'start-label', reflect: true, type: String },
			/**
			 * Value of the start date input
			 */
			startValue: { attribute: 'start-value', reflect: true, type: String },
			_endLabel: { type: String },
			_startLabel: { type: String }
		};
	}

	static get styles() {
		return css`
			:host {
				display: inline-block;
				margin-bottom: -1.2rem;
				margin-right: -1.5rem;
			}
			:host([dir="rtl"]) {
				margin-left: -1.5rem;
				margin-right: 0;
			}
			:host([hidden]) {
				display: none;
			}
			d2l-input-date {
				display: inline-block;
				margin-bottom: 1.2rem;
			}
			d2l-input-date.d2l-input-date-range-start {
				margin-right: 1.5rem;
			}
			:host([dir="rtl"]) d2l-input-date.d2l-input-date-range-start {
				margin-left: 1.5rem;
				margin-right: 0;
			}
		`;
	}

	constructor() {
		super();

		this.disabled = false;
		this.labelHidden = false;

		this._endLabel = '';
		this._startLabel = '';
	}

	async firstUpdated(changedProperties) {
		super.firstUpdated(changedProperties);

		if (!this.label) {
			console.warn('d2l-input-date-range component requires label text');
		}

		this._endLabel = this.endLabel ? this.endLabel : this.localize('components.input-date-range.endDate');
		this._startLabel = this.startLabel ? this.startLabel : this.localize('components.input-date-range.startDate');
	}

	render() {
		return html`
			<d2l-validation-custom @d2l-validation-custom-validate=${this._validateRange}></d2l-validation-custom>
			<d2l-input-fieldset label="${ifDefined(this.label)}" ?label-hidden="${this.labelHidden}">
				<d2l-input-date
					@change="${this._handleChange}"
					@d2l-form-element-should-validate="${this._shouldValidate}"
					class="d2l-input-date-range-start"
					?disabled="${this.disabled}"
					?invalid="${this.validationError ? true : false}"
					label="${this._startLabel}"
					max-value="${ifDefined(this.maxValue)}"
					min-value="${ifDefined(this.minValue)}"
					value="${ifDefined(this.startValue)}">
				</d2l-input-date>
				<d2l-input-date
					@change="${this._handleChange}"
					@d2l-form-element-should-validate="${this._shouldValidate}"
					class="d2l-input-date-range-end"
					?disabled="${this.disabled}"
					?invalid="${this.validationError ? true : false}"
					label="${this._endLabel}"
					max-value="${ifDefined(this.maxValue)}"
					min-value="${ifDefined(this.minValue)}"
					value="${ifDefined(this.endValue)}">
				</d2l-input-date>
			</d2l-input-fieldset>
		`;
	}

	focus() {
		const input = this.shadowRoot.querySelector('d2l-input-date');
		if (input) input.focus();
	}

	async validate() {
		const errors = await super.validate();
		if (errors.length !== 0) {
			return errors;
		}
		return Promise.all([
			await this.shadowRoot.querySelector('.d2l-input-date-range-start').validate(),
			await this.shadowRoot.querySelector('.d2l-input-date-range-end').validate()]
		).then((res) => {
			return res.reduce((acc, errors) => [...acc, ...errors], []);
		});
	}

	get validationMessageBadInput() {
		return this.localize('components.input-date-range.errorBadInput', { startLabel: this._startLabel, endLabel: this._endLabel });
	}

	async _handleChange(e) {
		const elem = e.target;
		if (elem.classList.contains('d2l-input-date-range-start')) {
			this.startValue = elem.value;
		} else {
			this.endValue = elem.value;
		}
		this.requestValidate();
		this.dispatchEvent(new CustomEvent(
			'change',
			{ bubbles: true, composed: false }
		));
	}

	_shouldValidate(e) {
		e.preventDefault();
	}

	_validateRange(e) {
		const endDate = this.shadowRoot.querySelector('d2l-input-date.d2l-input-date-range-end');
		const startDate = this.shadowRoot.querySelector('d2l-input-date.d2l-input-date-range-start');
		const valid = !startDate.value || !endDate.value || (getDateFromISODate(endDate.value) > getDateFromISODate(startDate.value));
		this.setValidity({badInput: !valid});
		e.detail.resolve(valid);
	}

}
customElements.define('d2l-input-date-range', InputDateRange);
