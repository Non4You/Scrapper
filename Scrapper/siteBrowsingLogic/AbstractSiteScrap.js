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
        if (typeof str !== 'string') {
            return 0;
        }
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
            await this.saveIcon(siteId);
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

    async reduceImageQualityAndSaveFromBuffer(buffer, errOnbuffer = true, quality = 80) {
        try {
            const imageBuffer = await sharp(buffer)
                .jpeg({ quality })
                .toBuffer();
            return (imageBuffer);
        } catch (error) {
            console.log("error message is:", err.message, " and buffer is :", buffer);
            if (errOnbuffer === false)
                return ("");
            if (err.message === "BUFFER_TIMEOUT") {
                console.warn("Buffer timed out.");
                return ""; // retourne une chaîne vide seulement si le buffer a expiré
            }
        }
    }

    async svgBufferToPng(svgBuffer) {
        const pngBuffer = await sharp(svgBuffer)
            .png()
            .toBuffer();
        fs.writeFileSync("out.png", pngBuffer);
        return pngBuffer;
    }

    async reduceImageQualityAndSave(imageUrl, type, errOnbuffer = true, quality = 80) {
        try {
            // console.log("9", imageUrl);
            const response = await fetch(imageUrl);
            // console.log("10", response, errOnbuffer === false && (response === undefined || response === null));
            if (errOnbuffer === false && (response === undefined || response === null)) return ("");
            if (!response.ok) throw new Error(`Failed to fetch image. Status: ${response.status}`);
            if (type === 'ico') {
                const imageBuffer = await response.buffer();
                await fs.promises.writeFile("test.png", imageBuffer);
                return (imageBuffer);
            } else if (type === 'svg') {
                return (await this.svgBufferToPng(await response.buffer()));
            } else {
                // console.log("1");
                // console.log("8", response);
                const responseBuffer = await response.buffer();
                if (responseBuffer.byteLength === 0) {
                    return ("");
                }
                // console.log("7", responseBuffer);
                const buffer = await Promise.race([
                    responseBuffer,
                    new Promise((_, reject) => setTimeout(() => reject(new Error("BUFFER_TIMEOUT")), 5000))
                ]);            
                // console.log("2", buffer.length);
                if (buffer.length === 0) return ("");
                const imageBuffer = await sharp(buffer)
                    .jpeg({ quality })
                    .toBuffer();
                // console.log("3");
                await fs.promises.writeFile("test.svg", imageBuffer);
                console.log(`✅ Image saved at ${outputPath}`);
                return (imageBuffer);
            }
        } catch (error) {
            console.log("error message is:", err.message);
            if (errOnbuffer === false)
                return ("");
            if (err.message === "BUFFER_TIMEOUT") {
                console.warn("Buffer timed out.");
                return ""; // retourne une chaîne vide seulement si le buffer a expiré
            }
        }
        // console.log("6");
    }

    async saveIcon(siteId) {
        var icon = await this.reduceImageQualityAndSave(new URL(this.mainUrl).origin+'/favicon.ico', "ico");
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
                            var urls = await this.basicActionBrowser.scrappedChaptersImages(chapters[i], this.imagesChapter, this.scrollImagesChapter, this.imagesChapterType);
                            var images = [];
                            for (let y = 0; y < urls.length; y++) {
                                images.push(await this.reduceImageQualityAndSave(urls[y], siteId+"/"+i+'.jpg', true, 75));
                                console.log(y, urls[y]);
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