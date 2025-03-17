const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());
const MainLogicScrapper = require('./Scrapper/MainLogicScrapper.js');

(async () => {
    console.log(process.argv, process.argv.slice(2));
    const mainLogicScrapper = new MainLogicScrapper();
    await mainLogicScrapper.ScrapAll(process.argv.slice(2)[0]);
})();