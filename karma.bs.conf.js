/* eslint-env node */
const { createDefaultConfig } = require('@open-wc/testing-karma');
const merge = require('deepmerge');

const defaultPattern = '+(components|helpers|mixins|templates)/**/*.test.js';
const customLaunchers = {
	chrome: {
		base: 'BrowserStack',
		browser: 'chrome',
		browser_version: 'latest',
		os: 'OS X',
		os_version: 'Catalina'
	},
	firefox: {
		base: 'BrowserStack',
		browser: 'firefox',
		browser_version: 'latest',
		os: 'OS X',
		os_version: 'Catalina'
	},
	safari: {
		base: 'BrowserStack',
		browser: 'safari',
		browser_version: 'latest',
		os: 'OS X',
		os_version: 'Catalina'
	},
	edge: {
		base: 'BrowserStack',
		browser: 'Edge',
		browser_version: 'latest',
		os: 'Windows',
		os_version: '10'
	},
	edge_legacy: {
		base: 'BrowserStack',
		browser: 'Edge',
		browser_version: '18.0',
		os: 'Windows',
		os_version: '10'
	}
};

module.exports = config => {
	const defaultConfig = createDefaultConfig(config);
	defaultConfig.browsers = []; // remove ChromeHeadless
	config.set(
		merge(defaultConfig, {
			browserStack: {
				username: process.env.BROWSERSTACK_USERNAME,
				accessKey: process.env.BROWSERSTACK_ACCESS_KEY,
				build: process.env.TRAVIS_BUILD_NUMBER,
				project: 'Brightspace UI Core Unit Tests',
			},
			files: [
				// runs all files ending with .test in the test folder,
				// can be overwritten by passing a --grep flag. examples:
				//
				// npm run test -- --grep test/foo/bar.test.js
				// npm run test -- --grep test/bar/*
				{ pattern: config.grep ? config.grep : defaultPattern, type: 'module' },
			],
			// see the karma-esm docs for all options
			esm: {
				// if you are using 'bare module imports' you will need this option
				nodeResolve: true,
			},
			customLaunchers: customLaunchers,
			browsers: Object.keys(customLaunchers),
			reporters: ['BrowserStack'],
			browserDisconnectTimeout: 3e5, // default 2000
			browserDisconnectTolerance: 3, // default 0
			browserSocketTimeout: 1.2e5, // default 20000
			browserNoActivityTimeout: 3e5, // default 10000
			captureTimeout: 3e5, // default 60000
			client: {
				mocha: {
					timeout : 10000
				}
			}
		}),
	);
	return config;
};
