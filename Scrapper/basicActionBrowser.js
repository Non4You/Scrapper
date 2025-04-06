const HeadLessBrowser = require("./../headlessBrowser.js");
const fs = require('fs');
const path = require('path');
const MariaDatabase = require("../mariaDatabase.js");

class BasicActionBrowser {
    constructor() {
        this.headLessBrowser = new HeadLessBrowser();
        this.mariaDB = new MariaDatabase();
        this.lol = 1;
    }

    async accessPage(page, maxRetries = 3, retryDelay = 1000) {
        let attempts = 0;
    
        while (attempts < maxRetries) {
            try {
                var response = await this.headLessBrowser.goToPage(page);
                await this.wait(1000);
                if (response.status() >= 400)
                    throw new Error("Access to Website on " + page + " denied Error " + response.status());
                return (response.status());
            } catch (error) {
                attempts++;
                console.error(`Erreur lors du chargement de la page : ${error.message}. Tentative ${attempts}/${maxRetries}`);
                
                if (attempts >= maxRetries) {
                    throw new Error(`Impossible de charger la page après ${maxRetries} tentatives : ${url}`);
                }
                await new Promise(resolve => setTimeout(resolve, retryDelay));
            }
        }
        // console.log("access url: " + page);
        // var response = await this.headLessBrowser.goToPage(page);
        // await this.wait(1000);
        // if (response.status() >= 400)
        //     throw new Error("Access to Website on " + page + " denied Error " + response.status());
        // return (response.status());
    }

    // async checkIcon(siteId, iconInfo) {
    //     var iconUrl = await this.headLessBrowser.evaluateAndGetAllValuesOnSelector(iconInfo[0], iconInfo[1]);
    //     console.log("icon Url: ", iconUrl, siteId);
    //     const viewSource = await this.headLessBrowser.openAndGoTo(iconUrl[0]);
    //     await this.wait(1000);
    //     const imagebase64Data = await viewSource.buffer();
    //     this.headLessBrowser.closeCurrentPage();
    //     await this.wait(1000);
    //     await this.mariaDB.saveIconFromSite(siteId, imagebase64Data);
    //     // fs.writeFileSync(path.join(__dirname, siteId+'.jpg'), imagebase64Data);
    //     // console.log('Image enregistrée localement en tant que '+siteId+'.jpg');
    //     // await this.headLessBrowser.goBack();
    // }

    // async downloadImage(url) {
    //     console.log("url: ", url);
    //     const viewSource = await this.headLessBrowser.openAndGoTo(url);
    //     await this.wait(1000);
    //     const imagebase64Data = await viewSource.buffer();
    //     // fs.writeFileSync(path.join(__dirname, this.lol+'.jpg'), imagebase64Data);
    //     this.lol = this.lol +1;
    //     this.headLessBrowser.closeCurrentPage();
    //     await this.wait(1000);
    //     return (imagebase64Data)
    // }

    async recordChapterImages(urlList) {

    }

    async listMangasFromPage(mangaListInfo, runCheck) {
        var retries = 3;
        var allMangaSources;
        do {
            try {
                allMangaSources = await this.headLessBrowser.getDataEvaluateLoop(mangaListInfo[0], mangaListInfo[1]);
            } catch (error) {
                console.log("Listing manga error: ", error)
            }
	    await this.wait(2000);
            retries--;
        } while (retries > 0 && allMangaSources.length === 0)
        if (allMangaSources.length === 0 && runCheck)
            throw new Error("Error: Listing mangas did not return anything.");
        return (allMangaSources);
    }

    checkInfoSources(infoSources) {
        if (infoSources[0][3] === null) {
            infoSources[0][3] = "Ongoing";
        }
        return (infoSources);
    }

    async gatherChaptersDataType(mangaChaptersInfo, mangaChaptersType) {
        var chaptersSources;
        
        if (mangaChaptersType === 1) {
            chaptersSources = await this.headLessBrowser.getDataEvaluateLoop(mangaChaptersInfo[0], mangaChaptersInfo[1]);
        } else if (mangaChaptersType === 2) {
            var [mangaChapterLinkConf, mangaChapterNameConf, mangaChapterDateConf] = mangaChaptersInfo;
            var chaptersLink = await this.headLessBrowser.evaluateAndGetAllValuesOnSelector(mangaChapterLinkConf[0], mangaChapterLinkConf[1]);
            var chaptersName = await this.headLessBrowser.evaluateAndGetAllValuesOnSelector(mangaChapterNameConf[0], mangaChapterNameConf[1]);
            var chaptersDate = await this.headLessBrowser.evaluateAndGetAllValuesOnSelector(mangaChapterDateConf[0], mangaChapterDateConf[1]);
            chaptersSources = chaptersLink.map((_,i) => [chaptersLink[i], chaptersName[i], chaptersDate[i]])
        }
        if (chaptersSources.length === 0)
            throw new Error("Error: Listing chapters from manga did not return anything.");
        return (chaptersSources);
    }

    async gatherMangaDataChunk(mangaPageInfo, mangaGenreInfo, mangaChaptersInfo, mangaChaptersType) {
        var GenreSources = null;
        var ChaptersSources;
        var InfoSources = await this.headLessBrowser.getDataEvaluateLoop(mangaPageInfo[0], mangaPageInfo[1]);
        InfoSources = this.checkInfoSources(InfoSources);
        if (mangaGenreInfo !== null)
            GenreSources = await this.headLessBrowser.evaluateAndGetAllValuesOnSelector(mangaGenreInfo[0], mangaGenreInfo[1]);
        if (mangaChaptersInfo !== null) {
            ChaptersSources = await this.gatherChaptersDataType(mangaChaptersInfo, mangaChaptersType);
        }
        // console.log("info sources: ",InfoSources);
        return ([InfoSources, GenreSources, ChaptersSources]);
    }

    async gatherMangaDataUnlockChapters(mangaPageInfo, mangaGenreInfo, mangaChaptersInfo, mangaChaptersButton, mangaChaptersType) {
        var mangaChaptersSources = [];
        var GenreSources = null;
        var InfoSources = await this.headLessBrowser.getDataEvaluateLoop(mangaPageInfo[0], mangaPageInfo[1]);
        InfoSources = this.checkInfoSources(InfoSources);
        if (mangaGenreInfo !== null)
            GenreSources = await this.headLessBrowser.evaluateAndGetAllValuesOnSelector(mangaGenreInfo[0], mangaGenreInfo[1]);
        do {
            let chapters = await this.gatherChaptersDataType(mangaChaptersInfo, mangaChaptersType);
            mangaChaptersSources = mangaChaptersSources.concat(chapters);
            var resbtn = await this.clickOnButton(mangaChaptersButton, false);
        } while (resbtn === "OK");
        return ([InfoSources, GenreSources, mangaChaptersSources]);
    }

    async getNextMangasPage(pagination, ErrorCheck, url = "", retries = 3) {
        let attempts = retries; // Store the initial retry count
    
        while (attempts >= 0) {
            try {
                let currentUrl = this.headLessBrowser.currentUrl();
                // await this.wait(2000);
		let res;
		if (url !== "") {
		    await this.headLessBrowser.goToPage(url);
		    res = "OK";
		} else {
                    res = await this.headLessBrowser.evaluateAndclickOnSelectorIf(
			pagination[0], pagination[1], pagination[2], "Next Page Error :"
                    );
		}
		console.log("res click next page : ", res);
		//await this.headLessBrowser.waitNavig();
                await this.wait(4000);
                let newUrl = this.headLessBrowser.currentUrl();
                console.log(`Attempt ${retries - attempts + 1}, res : `, { currentUrl, newUrl }, res);
                if (currentUrl === newUrl) {
                    console.log(`Retrying... attempts left: ${attempts}`);
		    await this.headLessBrowser.refresh();
                    if (attempts === 0) return "KO"; // Stop after last retry
                } else if (res === "KO" && ErrorCheck) {
                    throw new Error("Error: Pagination not working properly");
                } else if (currentUrl !== newUrl) {
                    return "OK"
                } else {
                    return res; // Success case
                }
            } catch (error) {
                console.log(`Error on attempt ${retries - attempts + 1}:`, error.message);
                if (error.message.includes('Next Page') && attempts === 0) return "KO";
                if (!error.message.includes('Next Page')) throw error; // If it's not a pagination issue, rethrow
            } finally {
                attempts--; // Decrement retry count
            }
        }
    
        return res; // Fallback return if all retries fail
    }

    async clickOnButton(element, ErrorCheck) {
        var res = await this.headLessBrowser.evaluateAndclickOnSelectorIf(element[0], element[1], element[2], "Next Page Error :");
        await this.wait(1000);
        if (res === "KO" && ErrorCheck === true)
            throw new Error("Error: Pagination not working properly");
        return (res);
    }

    async scrappedChaptersImages(chapterData, chapterConf, scrollImagesChapterConf, chapterTypeConf) {
        await this.accessPage(chapterData.url);
        if (scrollImagesChapterConf === true)
            await this.headLessBrowser.scrollPage();
        await this.wait(1000);
        var res;
        if (chapterTypeConf === 1)
            res = await this.headLessBrowser.getDataEvaluateLoop(chapterConf[0], chapterConf[1], "gathering url chapter image");
        else if (chapterTypeConf === 2)
            res = await this.headLessBrowser.evaluateAndGetAllValuesOnSelector(chapterConf[0], chapterConf[1], "gathering url chapter image");
        res = res.flatMap(x => x);
        console.log(res);
        return (res);
    }

    getCurrentDataRetrievalFromConfig(mainPageAccess, mangaListing, mangaName, mangaInfoGathering, pagination) {
        if (mainPageAccess === null) {
            return (["KO", "UNK", "UNK", "UNK", "UNK", "UNK", "UNK"]);
        } else if (mangaListing === null) {
            return (["OK", "KO", "UNK", "UNK", "UNK", "UNK", "UNK"]);
        } else if (mangaName === null) {
            return (["OK", "OK", "KO", "UNK", "UNK", "UNK", "UNK"]);
        } else if (mangaInfoGathering === null) {
            return (["OK", "OK", "OK", "KO", "UNK", "UNK", "UNK"]);
        } else if (pagination === null) {
            return (["OK", "OK", "OK", "OK", "UNK", "UNK", "KO"]);
        } else {
            var mangaInfoStatusIssue = mangaInfoGathering[0].some(str => !str) ? 'KO' : 'OK';
            var mangaGenreStatusIssue = (mangaInfoGathering[1] === null || mangaInfoGathering[1].length === 0) ?
                'KO' : "OK";
            return (["OK", "OK", "OK", "OK", mangaInfoStatusIssue, mangaGenreStatusIssue, "OK"]);
        }
    }

    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = BasicActionBrowser;
