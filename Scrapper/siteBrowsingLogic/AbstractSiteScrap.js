const MariaDatabase = require("./../../mariaDatabase.js");
const ConfigInterpreter = require('./../../configInterpreter.js');
const HeadLessBrowser = require("./../../headlessBrowser.js");
const BasicActionBrowser = require("./../basicActionBrowser.js");
const https = require('https');
const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage, Image } = require('canvas');
const fetch = require('node-fetch');
const sharp = require('sharp');

class AbstractSiteScrap {
    constructor(configIndex) {
        if (new.target === AbstractSiteScrap) {
            throw new Error("You cannot instantiate an abstract class directly.");
        }
        this.mariaDatabase = new MariaDatabase();
        this.interpreter = new ConfigInterpreter();
        this.headLessBrowser = new HeadLessBrowser();
        this.basicActionBrowser = new BasicActionBrowser();
        this.mainUrl = this.interpreter.getSiteNbUrl(configIndex);
        this.siteIcon = this.interpreter.getConfigElement(configIndex, "SiteIcon");
        this.mangaInfo = this.interpreter.getConfigElement(configIndex, "manga");
        this.mangaPageInfo = this.interpreter.getConfigElement(configIndex, "mangaInfo");
        this.mangaGenreInfo = this.interpreter.getConfigElement(configIndex, "mangaGenreInfo");
        this.mangaChaptersInfo = this.interpreter.getConfigElement(configIndex, "mangaChapters");
        this.mangaChaptersOrder = this.interpreter.getConfigElement(configIndex, "mangaChaptersOrder");
        this.mangaChaptersGatheringMethod = this.interpreter.getConfigElement(configIndex, "mangaChaptersGatheringMethod");
        this.mangaChaptersButton = this.interpreter.getConfigElement(configIndex, "mangaChaptersButton");
        this.mangaChaptersType = this.interpreter.getConfigElement(configIndex, "mangaChaptersType");
        this.pagination = this.interpreter.getConfigElement(configIndex, "pagination");
        this.paginationMethod = this.interpreter.getConfigElement(configIndex, "paginationMethod");
        this.scrollImagesChapter = this.interpreter.getConfigElement(configIndex, "scrollImagesChapter");
        this.imagesChapter = this.interpreter.getConfigElement(configIndex, "imagesChapter");
        this.imagesChapterType = this.interpreter.getConfigElement(configIndex, "imagesChapterType");
    }

    extractNumber(str) {
        const match = str.match(/\(([\d.]+)\)/);
        return match ? parseFloat(match[1]) : 0;
    }

    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    update(nbChapAdd, nbChapUpd, nbMangaUpdated) {
        if (nbChapAdd === 0 && nbChapUpd === 0)
            return (nbMangaUpdated+1);
        return 0;
    }

    async mangaScrap(siteId, runCheck, isFullscrapped, index) {
        var mangaInfoSources, mangaGenreSources, mangaChaptersSources;
        var nbMangaUpdated = 0;
        var retries = 0;

        var allMangaSources = await this.basicActionBrowser.listMangasFromPage(this.mangaInfo, runCheck);
        for (let i = index; i < allMangaSources.length; i++) {
            await this.basicActionBrowser.accessPage(allMangaSources[i][1]);
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
                var [added, updated] = await this.mariaDatabase.saveAllData(siteId, [allMangaSources[i][1], ...mangaInfoSources[0]],
                    mangaGenreSources, (this.mangaChaptersOrder === 1)?mangaChaptersSources.reverse():mangaChaptersSources);
                retries = 0;
            } catch (error) {
                console.log("retries ", retries, " message :", error.message);
                if (error.message.includes('Error: Listing chapters') && retries === 3) throw Error(error.message);
                else if (error.message.includes('Error: Listing chapters')) retries++;
                else throw Error(error.message);
            }
            await this.headLessBrowser.goBack();
            nbMangaUpdated = this.update(added, updated, nbMangaUpdated);
            if (isFullscrapped && nbMangaUpdated === 4)
                return ([mangaInfoSources, mangaGenreSources, true]);
        }
        return ([mangaInfoSources, mangaGenreSources, false]);
    }

    async mangaSiteScrapPaging(siteId, isFullscrapped) {
        var mangaInfoSources, mangaGenreSources, isEnd;
        var resNextPage;
        var runCheck = true;

        do {
            [mangaInfoSources, mangaGenreSources, isEnd] = await this.mangaScrap(siteId, runCheck, isFullscrapped, 0);
            resNextPage = await this.basicActionBrowser.getNextMangasPage(this.pagination, runCheck);
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
        } while (resNextPage === "OK");
        return true;
    }

    async mangaSiteScrapLoading(siteId, isFullscrapped) {
        var mangaInfoSources, mangaGenreSources, isEnd;
        var resNextPage;
        var runCheck = true;
        var currentIndex = 0;
        var allMangaSources = await this.basicActionBrowser.listMangasFromPage(this.mangaInfo, runCheck);
        var nextIndex = allMangaSources.length;

        do {
            [mangaInfoSources, mangaGenreSources, isEnd] = await this.mangaScrap(siteId, isFullscrapped, allMangaSources, currentIndex);
            resNextPage = await this.basicActionBrowser.clickOnButton(this.pagination, runCheck);
            currentIndex = nextIndex;
            allMangaSources = await this.basicActionBrowser.listMangasFromPage(this.mangaInfo, runCheck);
            nextIndex = allMangaSources.length;
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
        } while (currentIndex !== nextIndex);
        return true;
    }

    async accessMainPage(siteId, isFullscrapped) {
        var res;
        try {
            await this.basicActionBrowser.accessPage(this.mainUrl);
            // var icon = await this.reduceImageQualityAndSave(new URL(this.mainUrl).origin+'/favicon.ico', "ico");
            // console.log("icon data: ",icon);
            // await this.mariaDatabase.saveIconFromSite(siteId, icon);
            await this.saveIcon(siteId);
            // await this.basicActionBrowser.checkIcon(siteId, this.siteIcon);
            if (this.paginationMethod === 1) {
                res = await this.mangaSiteScrapPaging(siteId, isFullscrapped); 
            } else {
                res = await this.mangaSiteScrapLoading(siteId, isFullscrapped);
            }
            await this.mariaDatabase.saveMangaOrder();
            return (res);
        } catch (error) {
            this.handleError(siteId, error);
            return (false);
        }
    }

    async reduceImageQualityAndSave(imageUrl, type, quality = 80) {
        try {
            // console.log("image url: ", imageUrl);
            const response = await fetch(imageUrl);
            if (!response.ok) throw new Error(`Failed to fetch image. Status: ${response.status}`);
            if (type === 'ico') {
                return (response.buffer());
            } else {
                const imageBuffer = await sharp(await response.buffer())
                    .jpeg({ quality })
                    .toBuffer();
                return (imageBuffer);
            }
        } catch (error) {
            console.error('Error processing the image:', error);
        }
    }

    async saveIcon(siteId) {
        var icon = await this.reduceImageQualityAndSave(new URL(this.mainUrl).origin+'/favicon.ico', "ico");
        // console.log("icon data: ",icon);
        await this.mariaDatabase.saveIconFromSite(siteId, icon);
        // await this.basicActionBrowser.checkIcon(siteId, this.siteIcon);
    }

    async launch(siteId, mode) {
        var isFullscrapped = await this.mariaDatabase.getIsFullscrapped(siteId);
        console.log("Is Fullscrapped = ", isFullscrapped);
        try {
            if (mode === undefined) {
                if (isFullscrapped === 0) {
                    var isOk = await this.accessMainPage(siteId, false);
                    if (isOk) await this.mariaDatabase.setFullScrappedOnMangaSite(siteId);
                } else if (isFullscrapped === 1) {
                    await this.accessMainPage(siteId, true);
                }
            } else {          
                var chapters = await this.mariaDatabase.getChapterToScrap(siteId);
                if (chapters.length != 0) {
                    console.log("chapters to Scrap: ", chapters, chapters[0].scrapped, chapters[0].scrapped === 1);
                    for (let i = 0; i < chapters.length; i++) {
                        try {
                            var urls = await this.basicActionBrowser.scrappedChaptersImages(chapters[i], this.imagesChapter, this.scrollImagesChapter, this.imagesChapterType);
                            var images = [];
                            for (let y = 0; y < urls.length; y++) {
                                images.push(await this.reduceImageQualityAndSave(urls[y], siteId+"/"+i+'.jpg', 75));
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

    handleError(siteId, error) {
        console.log("fullScrap on siteId: ",siteId, " because of: ", error);
        if (error.message.includes('Access to Website')) {
            this.mariaDatabase.saveStatusDataRetrieval(siteId, 
                this.basicActionBrowser.getCurrentDataRetrievalFromConfig(null, null, null, null, null), error.message);
        } else if (error.message.includes('Error: Listing mangas')) {
            this.mariaDatabase.saveStatusDataRetrieval(siteId, 
                this.basicActionBrowser.getCurrentDataRetrievalFromConfig([], null, null, null, null), error.message);
        } else if (error.message.includes('Error: Naming manga')) {
            this.mariaDatabase.saveStatusDataRetrieval(siteId, 
                this.basicActionBrowser.getCurrentDataRetrievalFromConfig([], [], null, null, null), error.message);
        } else if (error.message.includes('Error: Listing chapters')) {
            this.mariaDatabase.saveStatusDataRetrieval(siteId, 
                this.basicActionBrowser.getCurrentDataRetrievalFromConfig([], [], [], null, null), error.message);
        } else if (error.message.includes('Error: Pagination')) {
            this.mariaDatabase.saveStatusDataRetrieval(siteId, 
                this.basicActionBrowser.getCurrentDataRetrievalFromConfig([], [], [], [], null), error.message);
        }
    }
}

module.exports = AbstractSiteScrap;