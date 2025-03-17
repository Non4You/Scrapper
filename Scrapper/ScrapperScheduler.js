const AbstractSiteScrap = require("./siteBrowsingLogic/AbstractSiteScrap.js");
const HeadLessBrowser = require("./../headlessBrowser.js");
const MariaDatabase = require("./../mariaDatabase.js");
const StringManager = require("./../utils/StringManager.js");

class ScrapperScheduler {
    constructor() {
        this.headLessBrowser = new HeadLessBrowser();
        this.scrapTask = [];
        this.stringManager = new StringManager();
        this.mariaDatabase = new MariaDatabase();
    }

    async patch() {
        for (let i = 0; i < this.stringManager.genreToRefuse.length; i++) {
            const element = this.stringManager.genreToRefuse[i];
            // console.log("test", element);
            const mGenre = await this.mariaDatabase.doQuery("SELECT * FROM manga_genre WHERE nom = '"+element+"';", []);
            if (mGenre[0] && mGenre[0][0]) {
                console.log("test", mGenre[0][0]);
                await this.mariaDatabase.doQuery("DELETE FROM manga_genre_link WHERE GenreId = "+mGenre[0][0].id+";", []);
                await this.mariaDatabase.doQuery("DELETE FROM manga_ref_genre_link WHERE genre_id = "+mGenre[0][0].id+";", []);
                await this.mariaDatabase.doQuery("DELETE FROM manga_genre WHERE id = "+mGenre[0][0].id+";", []);
            }
        }
    }

    async patch2() {
        var mrStatus = await this.mariaDatabase.doQuery("SELECT * FROM manga_ref WHERE status = null OR status = 'Đang cập nhật';");
        
        for (let i = 0; i < mrStatus[0].length; i++) {
            console.log("status : ", mrStatus[0][i].status, " id :", mrStatus[0][i].id);
            await this.mariaDatabase.doQuery("UPDATE manga_ref SET status = 'Ongoing' WHERE id = ?;", [mrStatus[0][i].id]);
        }
        mrStatus = await this.mariaDatabase.doQuery("SELECT * FROM manga_info WHERE status = null OR status = 'Đang cập nhật';");
        for (let i = 0; i < mrStatus[0].length; i++) {
            console.log("status : ", mrStatus[0][i].status, " id :", mrStatus[0][i].id);
            await this.mariaDatabase.doQuery("UPDATE manga_info SET status = 'Ongoing' WHERE id = ?;", [mrStatus[0][i].id]);
        }
    }

    registerScrapper(name, scrapper, id, mode) {
        this.scrapTask.push([name, scrapper, id, mode]);
    }

    async runScrapper(interval) {
        const startTime = new Date().getTime();
        await this.headLessBrowser.launchBrowser();
        console.log(`Starting scrap at ${new Date().toLocaleTimeString()}`);
        for (let i = 0; i < this.scrapTask.length; i++) {
            const [name, scrapper, id, mode] = this.scrapTask[i];
            try {
                console.log(`Starting ${name} at ${new Date().toLocaleTimeString()}`);
                await scrapper["launch"](id, mode);
                console.log(`Completed ${name} at ${new Date().toLocaleTimeString()}`);
            } catch (error) {
                console.error(`Error in ${name}:`, error);
            }
        }
        await this.headLessBrowser.closeBrowser();
        const execTime = new Date().getTime() - startTime;
        console.log(`Will Rerun in  ${(interval - execTime)/1000/60} min`);
        await this.patch();
        await this.patch2();
        setTimeout(() => this.runScrapper(interval), interval - execTime);
    }
}

module.exports = ScrapperScheduler;