const AbstractSiteScrap = require("./AbstractSiteScrap.js");

class ReaperScrap extends AbstractSiteScrap {
    constructor(configIndex) {
        super(configIndex);
        this.failsafe = this.interpreter.getConfigElement(configIndex, "failSafe");
    }

    async failSafe() {
        while (true) {
            await this.wait(2000);
            var res = await this.headLessBrowser.evaluateAndGetAllValuesOnSelector(this.failsafe[0], this.failsafe[1], "Not an error");
            // console.log("failsafe check: ", res)
            if (res[0] && res[0].includes(this.failsafe[2])) {
                console.log("failsafe activated refresh needed !");
                await this.headLessBrowser.refresh();
                await this.wait(2000);
            } else {
                return;
            }
        }
    }

    async mangaScrap(siteId, isFullscrapped, allMangaSources, indexAllMangaSources) {
        var mangaInfoSources, mangaGenreSources, mangaChaptersSources;
        var nbMangaUpdated = 0;
        var retries = 0;

        for (let i = indexAllMangaSources; i < allMangaSources.length; i++) {
            await this.basicActionBrowser.accessPage(allMangaSources[i][1]);
            await this.failSafe();
            try {
                if (this.mangaChaptersGatheringMethod === 1) {
                    [mangaInfoSources, mangaGenreSources, mangaChaptersSources] = await this.basicActionBrowser.gatherMangaDataChunk(this.mangaPageInfo,
                        this.mangaGenreInfo, this.mangaChaptersInfo, this.mangaChaptersType);
                } else {
                    [mangaInfoSources, mangaGenreSources, mangaChaptersSources] = await this.basicActionBrowser.gatherMangaDataUnlockChapters(this.mangaPageInfo,
                        this.mangaGenreInfo, this.mangaChaptersInfo, this.mangaChaptersButton, this.mangaChaptersType);
                }
                mangaInfoSources[0][4] = await this.reduceImageQualityAndSave(mangaInfoSources[0][4], "");
                // mangaInfoSources[0][4] = await this.basicActionBrowser.downloadImage(mangaInfoSources[0][4]);
                // console.log("notation: ", mangaInfoSources[0][2], "  -  ", this.extractNumber(mangaInfoSources[0][2]));
                mangaInfoSources[0][2] = this.extractNumber(mangaInfoSources[0][2]);
                var [added, updated] = await this.mariaDatabase.saveAllData(siteId, [allMangaSources[i][1], ...mangaInfoSources[0]],
                    mangaGenreSources, mangaChaptersSources.reverse());
                nbMangaUpdated = this.update(added, updated, nbMangaUpdated);
                retries = 0;
            } catch (error) {
                console.log("retries ", retries, " message :", error.message);
                if (error.message.includes('Error: Listing chapters') && retries === 3) throw Error(error.message);
                else if (error.message.includes('Error: Listing chapters')) retries++;
                else throw Error(error.message);
            }

            await this.headLessBrowser.goBack();
            await this.failSafe();
            if (isFullscrapped && nbMangaUpdated === 3)
                return ([mangaInfoSources, mangaGenreSources, true]);
        }
        return ([mangaInfoSources, mangaGenreSources, false]);
    }
}

module.exports = ReaperScrap;