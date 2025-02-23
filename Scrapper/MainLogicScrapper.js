const MariaDatabase = require("./../mariaDatabase.js");
const ConfigInterpreter = require('./../configInterpreter.js');
const HeadLessBrowser = require("./../headlessBrowser.js");
const BasicActionBrowser = require("./basicActionBrowser.js");
const ScrapperScheduler = require("./ScrapperScheduler.js");
const StringManager = require("./../utils/StringManager.js");
const createSiteScrapClass = require("./siteBrowsingLogic/SiteScrapBuilder.js");
const config = require('./../config.json');

class MainLogicScrapper {
    constructor() {
        this.mariaDatabase = new MariaDatabase();
        this.interpreter = new ConfigInterpreter();
        this.headLessBrowser = new HeadLessBrowser();
        this.basicActionBrowser = new BasicActionBrowser();
        this.scrapperScheduler = new ScrapperScheduler();
        this.stringManager = new StringManager();
    }

    async initiate() {
        await this.mariaDatabase.openConnection();
        await this.mariaDatabase.insertMangaSite(config);     
    }

    async ScrapAll() {
        var scrapInstance;
        await this.initiate();
        const data = await this.mariaDatabase.getMangaSiteData();
        const totalEntry = this.interpreter.getTotalMangaConfig();

        for (let i = 0; i < totalEntry; i++) {
            for (let y = 0; y < data.length; y++) {
                if (data[y].Nom === this.interpreter.getNbSiteNameConfig(i)) {
                    scrapInstance = createSiteScrapClass(data[y].Nom, i);
                    if (scrapInstance != null)
                        this.scrapperScheduler.registerScrapper(data[y].Nom, scrapInstance, data[y].id);
                        // await scrapInstance.launch(data[y].fullScrapped, data[y].id);
                }
            }
        }
        await this.scrapperScheduler.runScrapper(1800000);
    }
}

module.exports = MainLogicScrapper;