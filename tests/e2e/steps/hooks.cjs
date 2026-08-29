const { BeforeAll, AfterAll, Before, After, setDefaultTimeout } = require("@cucumber/cucumber");
const { chromium } = require("playwright");
const { startApp, stopApp } = require("../../support/app-under-test.cjs");

let appHandle;
let browser;

setDefaultTimeout(30000);

BeforeAll(async function() {
    appHandle = await startApp();

    try {
        browser = await chromium.launch({
            channel: process.env.PLAYWRIGHT_CHANNEL || "msedge",
            headless: true
        });
    } catch (error) {
        browser = await chromium.launch({ headless: true });
    }
});

Before(async function() {
    this.baseUrl = appHandle.baseUrl;
    this.page = await browser.newPage();
});

After(async function() {
    if (this.page) {
        await this.page.close();
    }
});

AfterAll(async function() {
    if (browser) {
        await browser.close();
    }

    await stopApp(appHandle);
});
