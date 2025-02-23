const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());
const MainLogicScrapper = require('./Scrapper/MainLogicScrapper.js');

(async () => {
    const mainLogicScrapper = new MainLogicScrapper();
    await mainLogicScrapper.ScrapAll();
})();