const puppeteer = require('puppeteer');
const VisualDiff = require('@brightspace-ui/visual-diff');

describe('d2l-calendar', function() {

	const visualDiff = new VisualDiff('calendar', __dirname);

	let browser, page;

	const firstCalendarOfPage = '#no-selected';

	before(async() => {
		browser = await puppeteer.launch();
		page = await browser.newPage();
		await page.setViewport({width: 500, height: 800, deviceScaleFactor: 2});
		await page.goto(`${visualDiff.getBaseUrl()}/components/calendar/test/calendar.visual-diff.html`, {waitUntil: ['networkidle0', 'load']});
		await page.bringToFront();
	});

	after(() => browser.close());

	it('selects today when no selected-value specified', async function() {
		const rect = await visualDiff.getRect(page, '#no-selected');
		await visualDiff.screenshotAndCompare(page, this.test.fullTitle(), { clip: rect });
	});

	it('emphasizes today when different date in same month selected', async function() {
		const rect = await visualDiff.getRect(page, '#contains-today-diff-selected');
		await visualDiff.screenshotAndCompare(page, this.test.fullTitle(), { clip: rect });
	});

	it('selects today when today specified as selected-value', async function() {
		const rect = await visualDiff.getRect(page, '#today-selected');
		await visualDiff.screenshotAndCompare(page, this.test.fullTitle(), { clip: rect });
	});

	it('month with first row entirely current month days and last row containing next month days', async function() {
		const rect = await visualDiff.getRect(page, '#dec-2019');
		await visualDiff.screenshotAndCompare(page, this.test.fullTitle(), { clip: rect });
	});

	it('month with first row containing previous month days and last row entirely current month', async function() {
		const rect = await visualDiff.getRect(page, '#nov-2019');
		await visualDiff.screenshotAndCompare(page, this.test.fullTitle(), { clip: rect });
	});

	describe('selection', () => {
		afterEach(async() => {
			await page.reload();
		});

		it('selects a new date by clicking on it', async function() {
			await page.$eval(firstCalendarOfPage, (calendar) => {
				const date = calendar.shadowRoot.querySelector('div[data-date="20"]');
				date.click();
			});
			const rect = await visualDiff.getRect(page, firstCalendarOfPage);
			await visualDiff.screenshotAndCompare(page, this.test.fullTitle(), { clip: rect });
		});

		it('selects a new date by pressing enter on it', async function() {
			await tabToDates();
			await page.keyboard.press('ArrowRight');
			await page.keyboard.press('Enter');
			await page.keyboard.press('ArrowRight');
			const rect = await visualDiff.getRect(page, firstCalendarOfPage);
			await visualDiff.screenshotAndCompare(page, this.test.fullTitle(), { clip: rect });
		});

		it('selects a new date by pressing space on it', async function() {
			await tabToDates();
			await page.keyboard.press('ArrowRight');
			await page.keyboard.press('Space');
			await page.keyboard.press('ArrowRight');
			const rect = await visualDiff.getRect(page, firstCalendarOfPage);
			await visualDiff.screenshotAndCompare(page, this.test.fullTitle(), { clip: rect });
		});

		it('focuses on the correct date when right arrow then click a date then right arrow', async function() {
			await tabToDates();
			await page.keyboard.press('ArrowRight');
			await page.$eval(firstCalendarOfPage, (calendar) => {
				const date = calendar.shadowRoot.querySelector('div[data-date="20"]');
				date.click();
			});
			await page.keyboard.press('ArrowRight');
			const rect = await visualDiff.getRect(page, firstCalendarOfPage);
			await visualDiff.screenshotAndCompare(page, this.test.fullTitle(), { clip: rect });
		});
	});

	describe('navigation', () => {
		afterEach(async() => {
			await page.reload();
		});

		it('navigates to next month when clicking on the right arrow', async function() {
			await page.$eval('#contains-today-diff-selected', (calendar) => {
				const arrow = calendar.shadowRoot.querySelector('d2l-button-icon[text="Show March"]');
				arrow.click();
			});
			const rect = await visualDiff.getRect(page, '#contains-today-diff-selected');
			await visualDiff.screenshotAndCompare(page, this.test.fullTitle(), { clip: rect });
		});

		it('navigates to the previous month when clicking the left arrow', async function() {
			await page.$eval('#contains-today-diff-selected', (calendar) => {
				const arrow = calendar.shadowRoot.querySelector('d2l-button-icon[text="Show January"]');
				arrow.click();
			});
			const rect = await visualDiff.getRect(page, '#contains-today-diff-selected');
			await visualDiff.screenshotAndCompare(page, this.test.fullTitle(), { clip: rect });
		});

		it('navigates to the next month in the next year', async function() {
			await page.$eval('#dec-2019', (calendar) => {
				const arrow = calendar.shadowRoot.querySelector('d2l-button-icon[text="Show January"]');
				arrow.click();
			});
			const rect = await visualDiff.getRect(page, '#dec-2019');
			await visualDiff.screenshotAndCompare(page, this.test.fullTitle(), { clip: rect });
		});

		describe('arrow key navigation of dates', () => {
			it('starts from focus date on selected dates month', async function() {
				await tabToDates();
				const rect = await visualDiff.getRect(page, firstCalendarOfPage);
				await visualDiff.screenshotAndCompare(page, this.test.fullTitle(), { clip: rect });
			});

			it('starts from selected date on non-selected dates month', async function() {
				// e.g., if selected = feb 12th, in next month the arrow key nav should begin on march 12th
				await page.$eval(firstCalendarOfPage, (calendar) => {
					const arrow = calendar.shadowRoot.querySelector('d2l-button-icon[text="Show March"]');
					arrow.click();
				});
				await tabToDates();
				const rect = await visualDiff.getRect(page, firstCalendarOfPage);
				await visualDiff.screenshotAndCompare(page, this.test.fullTitle(), { clip: rect });
			});

			it('navigates to previous month when up arrow pressed enough times', async function() {
				await tabToDates();
				await page.keyboard.press('ArrowUp');
				await page.keyboard.press('ArrowUp');
				const rect = await visualDiff.getRect(page, firstCalendarOfPage);
				await visualDiff.screenshotAndCompare(page, this.test.fullTitle(), { clip: rect });
			});

			it('navigates to previous month when left arrow pressed enough times', async function() {
				await tabToDates();
				for (let i = 0; i < 12; i++) {
					await page.keyboard.press('ArrowLeft');
				}
				const rect = await visualDiff.getRect(page, firstCalendarOfPage);
				await visualDiff.screenshotAndCompare(page, this.test.fullTitle(), { clip: rect });
			});

			it('navigates to next month when down arrow pressed enough times', async function() {
				await tabToDates();
				await page.keyboard.press('ArrowDown');
				await page.keyboard.press('ArrowDown');
				await page.keyboard.press('ArrowDown');
				const rect = await visualDiff.getRect(page, firstCalendarOfPage);
				await visualDiff.screenshotAndCompare(page, this.test.fullTitle(), { clip: rect });
			});

			it('navigates to next month when right arrow pressed enough times', async function() {
				await tabToDates();
				for (let i = 0; i < 17; i++) {
					await page.keyboard.press('ArrowRight');
				}
				const rect = await visualDiff.getRect(page, firstCalendarOfPage);
				await visualDiff.screenshotAndCompare(page, this.test.fullTitle(), { clip: rect });
			});
		});

		describe('other key navigation', () => {
			// the selected day is the monday with first day of week sunday
			it('navigates to the end of the week when on the first day of the week and END key pressed', async function() {
				await tabToDates();
				await page.keyboard.press('ArrowLeft');
				await page.keyboard.press('End');
				const rect = await visualDiff.getRect(page, firstCalendarOfPage);
				await visualDiff.screenshotAndCompare(page, this.test.fullTitle(), { clip: rect });
			});

			it('navigates to the end of the week when on the last day of the week and END key pressed', async function() {
				await tabToDates();
				await page.keyboard.press('ArrowLeft');
				await page.keyboard.press('ArrowRight');
				await page.keyboard.press('ArrowRight');
				await page.keyboard.press('ArrowRight');
				await page.keyboard.press('ArrowRight');
				await page.keyboard.press('ArrowRight');
				await page.keyboard.press('End');
				const rect = await visualDiff.getRect(page, firstCalendarOfPage);
				await visualDiff.screenshotAndCompare(page, this.test.fullTitle(), { clip: rect });
			});

			it('navigates to the start of the week when on the first day of the week and HOME key pressed', async function() {
				await tabToDates();
				await page.keyboard.press('ArrowLeft');
				await page.keyboard.press('Home');
				const rect = await visualDiff.getRect(page, firstCalendarOfPage);
				await visualDiff.screenshotAndCompare(page, this.test.fullTitle(), { clip: rect });
			});

			it('navigates to the start of the week when on the last day of the week and HOME key pressed', async function() {
				await tabToDates();
				await page.keyboard.press('ArrowLeft');
				await page.keyboard.press('ArrowRight');
				await page.keyboard.press('ArrowRight');
				await page.keyboard.press('ArrowRight');
				await page.keyboard.press('ArrowRight');
				await page.keyboard.press('ArrowRight');
				await page.keyboard.press('Home');
				const rect = await visualDiff.getRect(page, firstCalendarOfPage);
				await visualDiff.screenshotAndCompare(page, this.test.fullTitle(), { clip: rect });
			});

		});
	});

	const tabToDates = async function() {
		await page.keyboard.press('Tab');
		await page.keyboard.press('Tab');
		await page.keyboard.press('Tab');
	};

});
