const AbstractSiteScrap = require("./AbstractSiteScrap.js");

class MangaKaLotScrap extends AbstractSiteScrap {
    constructor(configIndex) {
        super(configIndex);
        this.currentPage = 1;//1661
        this.urlPagination2 = "?page="; 
    }

    async mangaScrap(siteId, runCheck, isFullscrapped, index) {
        var mangaInfoSources, mangaGenreSources, mangaChaptersSources;
        var nbMangaUpdated = 0;
        var retries = 0;
        console.log("isFullscrapped", isFullscrapped);
        var allMangaSources = await this.basicActionBrowser.listMangasFromPage(this.mangaInfo, runCheck);
        for (let i = index; i < allMangaSources.length; i++) {
            await this.headLessBrowser.setDownloadImageOnpage(allMangaSources[i][1].match(/\/([^\/]+)$/)[1], allMangaSources[i][1]);
            await this.basicActionBrowser.accessPage(allMangaSources[i][1]);
            await this.headLessBrowser.unsetDownloadImageOnpage();
            try {
                if (this.mangaChaptersGatheringMethod === 1) {
                    [mangaInfoSources, mangaGenreSources, mangaChaptersSources] = await this.basicActionBrowser.gatherMangaDataChunk(this.mangaPageInfo,
                        this.mangaGenreInfo, this.mangaChaptersInfo, this.mangaChaptersType);
                } else {
                    [mangaInfoSources, mangaGenreSources, mangaChaptersSources] = await this.basicActionBrowser.gatherMangaDataUnlockChapters(this.mangaPageInfo,
                        this.mangaGenreInfo, this.mangaChaptersInfo, this.mangaChaptersButton, this.mangaChaptersType);
                }
                mangaInfoSources[0][4] = await this.headLessBrowser.getLoadedImages()[0];
                // console.log(mangaInfoSources[0][4]);
                console.log('image size: ', mangaInfoSources[0][4]);
                if (mangaInfoSources[0][4] !== undefined)
                    mangaInfoSources[0][4] = await this.reduceImageQualityAndSaveFromBuffer(mangaInfoSources[0][4], true, 100);
                mangaGenreSources[0] = mangaGenreSources[0].replace(/[\s\u200B-\u200D\uFEFF]/g, '');
                mangaInfoSources[0][3] = mangaInfoSources[0][3].slice(9)
                // mangaInfoSources[0][4] = await this.basicActionBrowser.downloadImage(mangaInfoSources[0][4]);
                var [added, updated] = await this.mariaDatabase.saveAllData(siteId, [allMangaSources[i][1], ...mangaInfoSources[0]],
                    mangaGenreSources, (this.mangaChaptersOrder === 1)?mangaChaptersSources.reverse():mangaChaptersSources);
                retries = 0;
            } catch (error) {
                console.log("retries ", retries, " message :", error);
                if (error.message.includes('Error: Listing chapters') && retries === 3) throw Error(error.message);
                else if (error.message.includes('Error: Listing chapters')) retries++;
                else throw Error(error.message);
            }
            await this.headLessBrowser.goBack();
            nbMangaUpdated = this.update(added, updated, nbMangaUpdated);
            if (isFullscrapped && nbMangaUpdated === 5)
                return ([mangaInfoSources, mangaGenreSources, true]);
        }
        return ([mangaInfoSources, mangaGenreSources, false]);
    }

    async mangaSiteScrapPaging(siteId, isFullscrapped) {
        var mangaInfoSources, mangaGenreSources, isEnd;
        var resNextPage;
        var runCheck = true;
        do {
            console.log("isFullscrapped", isFullscrapped);
            [mangaInfoSources, mangaGenreSources, isEnd] = await this.mangaScrap(siteId, runCheck, isFullscrapped, 0);
            resNextPage = await this.basicActionBrowser.getNextMangasPage(this.pagination, runCheck, this.mainUrl + this.urlPagination2 + this.currentPage);
            if (runCheck === true) {
                this.mariaDatabase.saveStatusDataRetrieval(siteId, 
                    this.basicActionBrowser.getCurrentDataRetrievalFromConfig([], [], [], [mangaInfoSources[0], mangaGenreSources], []), "OK");
            }
            if (isFullscrapped && isEnd) {
                console.log("update ended for siteId: ", siteId);
                return true;
            }
            if (resNextPage !== "OK" && runCheck) {
                console.log("Couldn't complete scrap on site ", siteId);
                return false;
            }
            runCheck = false;
            this.currentPage++;
        } while (resNextPage === "OK");
        this.currentPage = 0;
        return true;
    }

    async accessMainPage(siteId, isFullscrapped) {  
        var res;
        try {
            console.log("Accessing main page for siteId: ", siteId, this.mainUrl);
            await this.basicActionBrowser.accessPage(this.mainUrl);
            await this.saveIcon(siteId);
            if (this.paginationMethod === 1) {
                res = await this.mangaSiteScrapPaging(siteId, isFullscrapped); 
            } else {
                res = await this.mangaSiteScrapLoading(siteId, isFullscrapped);
            }

            return (res);
        } catch (error) {
            this.handleError(siteId, error);
            return (false);
        }
    }

    async saveIcon(siteId, url) {
        // var iconUrl = await this.headLessBrowser.evaluateAndGetAllValuesOnSelector(this.siteIcon[0], this.siteIcon[1]);
        var icon = await this.reduceImageQualityAndSave("https://www.mangakakalot.gg/images/favicon.ico", "ico");
        await this.mariaDatabase.saveIconFromSite(siteId, icon);
    }

    async launch(siteId, mode) {
        var isFullscrapped = await this.mariaDatabase.getIsFullscrapped(siteId);
        console.log("Is Fullscrapped = ", isFullscrapped);
        try {
            if (mode === undefined || mode === "all" || mode === "info") {
                if (isFullscrapped === 0) {
                    var isOk = await this.accessMainPage(siteId, false);
                    if (isOk) await this.mariaDatabase.setFullScrappedOnMangaSite(siteId);
                } else if (isFullscrapped === 1) {
                    await this.accessMainPage(siteId, true);
                }
            } 
            if (mode === "all" || mode === "chapters") {          
                var chapters = await this.mariaDatabase.getChapterToScrap(siteId);
                if (chapters.length != 0) {
                    // console.log("chapters to Scrap: ", chapters, chapters[0].scrapped, chapters[0].scrapped === 1);
                    for (let i = 0; i < chapters.length; i++) {
                        try {
                            var urls = await this.basicActionBrowser.scrappedChaptersImagesOnPageLoad(chapters[i], "/manga\/([^\/]+)/");
                            var images = [];
                            urls.sort((a, b) => {
                                const getNum = url => {
                                    const match = url.match(/\/(\d+)\.webp$/); // capture number before .webp
                                    return match ? parseInt(match[1], 10) : 0;
                                };
                                
                                return getNum(a[0]) - getNum(b[0]);
                            });
                            for (let y = 0; y < urls.length; y++) {
                                images.push(await this.reduceImageQualityAndSaveFromBuffer(urls[y][1], true, 80));
                                console.log(y, urls[y][0]);
                            }
                            if (images.length === 0) {
                                console.log("current chapter: ", chapters[i]);
                                throw new Error("No images scrapped");
                            } 
                            await this.mariaDatabase.saveChapterImage(chapters[i].id, images);
                            await this.mariaDatabase.setChapterToScrapped(chapters[i].id);
                        } catch (error) {
                            console.log("Error : couldn't download chapter, ", error);
                        }
                    }
                }
            }    
        } catch (error) {
            console.log("error launch: ", error)
            return (false);
        }
    }
}

module.exports = MangaKaLotScrap;