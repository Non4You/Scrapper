const AbstractSiteScrap = require("./AbstractSiteScrap.js");

class MangaBTTScrap extends AbstractSiteScrap {
    constructor(configIndex) {
        super(configIndex);
    }

    async mangaScrap(siteId, runCheck, isFullscrapped, index) {
        var mangaInfoSources, mangaGenreSources, mangaChaptersSources;
        var nbMangaUpdated = 0;
    
        var allMangaSources = await this.basicActionBrowser.listMangasFromPage(this.mangaInfo, runCheck);
        
        for (let i = index; i < allMangaSources.length; i++) {
            let retries = 0;
            await this.basicActionBrowser.accessPage(allMangaSources[i][1]);
            while (retries <= 3) {
                try {
                    if (this.mangaChaptersGatheringMethod === 1) {
                        [mangaInfoSources, mangaGenreSources, mangaChaptersSources] =
                            await this.basicActionBrowser.gatherMangaDataChunk(
                                this.mangaPageInfo, this.mangaGenreInfo, this.mangaChaptersInfo, this.mangaChaptersType
                            );
                    } else {
                        [mangaInfoSources, mangaGenreSources, mangaChaptersSources] =
                            await this.basicActionBrowser.gatherMangaDataUnlockChapters(
                                this.mangaPageInfo, this.mangaGenreInfo, this.mangaChaptersInfo,
                                this.mangaChaptersButton, this.mangaChaptersType
                            );
                    }
                    mangaInfoSources[0][2] = 5;
                    mangaInfoSources[0][4] = await this.reduceImageQualityAndSave(mangaInfoSources[0][4], "");
    
                    var [added, updated] = await this.mariaDatabase.saveAllData(
                        siteId, [allMangaSources[i][1], ...mangaInfoSources[0]],
                        mangaGenreSources, (this.mangaChaptersOrder === 1) ? mangaChaptersSources.reverse() : mangaChaptersSources
                    );
                    retries = 0;
                    break; // Move to the next manga
                } catch (error) {
                    console.log(`Retry ${retries + 1}/3 - Error processing manga ${i}: ${error.message}`);
                    i++;
                    if (error.message.includes('Error: Listing chapters')) {
                        retries++;
                        if (retries > 6) {
                            throw new Error(`Max retries reached for manga ${i}: ${error.message}`);
                        }
                    } else {
                        throw new Error(error.message);
                    }
                }
            }
            await this.headLessBrowser.goBack();
            nbMangaUpdated = this.update(added, updated, nbMangaUpdated);
            if (isFullscrapped && nbMangaUpdated === 5) {
                return [mangaInfoSources, mangaGenreSources, true];
            }
        }
        return [mangaInfoSources, mangaGenreSources, false];
    }

    async mangaSiteScrapPaging(siteId, isFullscrapped) {
        var mangaInfoSources, mangaGenreSources, isEnd;
        var resNextPage;
        var runCheck = true;

        // for (let i = 0; i < 86; i++) {
        //     await this.basicActionBrowser.getNextMangasPage(this.pagination, runCheck);
        // }
        do {
            [mangaInfoSources, mangaGenreSources, isEnd] = await this.mangaScrap(siteId, runCheck, isFullscrapped, 0);
            resNextPage = await this.basicActionBrowser.getNextMangasPage(this.pagination, runCheck);
            console.log("check value res in case of error next page :", resNextPage);
            if (runCheck === true) {
                this.mariaDatabase.saveStatusDataRetrieval(siteId, 
                    this.basicActionBrowser.getCurrentDataRetrievalFromConfig([], [], [], [mangaInfoSources[0], mangaGenreSources], []), "OK");
            }
            if (isFullscrapped && isEnd) {
                console.log("update ended for siteId: ", siteId);
                return true;
            }
            console.log("check 2 value res in case of error next page :", resNextPage !== "OK");
            if (resNextPage !== "OK" && runCheck) {
                console.log("Couldn't complete scrap on site ", siteId);
                return false;
            }
            runCheck = false;
        } while (resNextPage === "OK");
        console.log("check 3 value res in case of error next page :", resNextPage);
        return true;
    }


    async accessMainPage(siteId, isFullscrapped) {
        var res;
        try {
            await this.basicActionBrowser.accessPage(this.mainUrl);
            // var icon = await this.reduceImageQualityAndSave(new URL(this.mainUrl).origin+'/favicon.ico', "ico");
            // await this.mariaDatabase.saveIconFromSite(siteId, icon);
            await this.saveIcon(siteId);
            // await this.basicActionBrowser.checkIcon(siteId, this.siteIcon);
            if (this.paginationMethod === 1) {
                res = await this.mangaSiteScrapPaging(siteId, isFullscrapped); 
            } else {
                res = await this.mangaSiteScrapLoading(siteId, isFullscrapped);
            }
            await this.mariaDatabase.saveMangaOrder();
            return (true);
        } catch (error) {
            this.handleError(siteId, error);
            return (false);
        }
    }
}

module.exports = MangaBTTScrap;