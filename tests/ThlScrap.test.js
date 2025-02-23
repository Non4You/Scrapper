const createSiteScrapClass = require("./../Scrapper/siteBrowsingLogic/SiteScrapBuilder.js");
const BasicActionBrowser = require("./../Scrapper/basicActionBrowser.js");
const HeadLessBrowser = require("./../headlessBrowser.js");

jest.setTimeout(20000);
describe("THLTranslation Class", () => {
    let asuraScrap;
    let basicActionBrowser;
    let headLessBrowser;

    beforeEach(async () => {
        asuraScrap = createSiteScrapClass("LHTranslation", 2);
        basicActionBrowser = new BasicActionBrowser();
        headLessBrowser = new HeadLessBrowser();
        await headLessBrowser.launchBrowser();
    });

    afterEach(async () => {
        await headLessBrowser.closeBrowser();
    });

    test("test access main THL page", async () => {
        expect(asuraScrap.mainUrl).not.toBe("");
        await expect(await basicActionBrowser.accessPage(asuraScrap.mainUrl)).toBe(200);
    });

    test("test THL site Icon", async () => {
        await basicActionBrowser.accessPage(asuraScrap.mainUrl)
        var iconUrl = await headLessBrowser.evaluateAndGetAllValuesOnSelector(asuraScrap.siteIcon[0], asuraScrap.siteIcon[1]);
        // expect(iconUrl).toBe("https://asuracomic.net/images/logo.webp");
        var icon = await asuraScrap.reduceImageQualityAndSave(iconUrl[0], "");
        expect(icon.length).not.toBe(0);
    });

    test("test THL check get manga links", async () => {
        await basicActionBrowser.accessPage(asuraScrap.mainUrl)
        var allMangaSources = await headLessBrowser.getDataEvaluateLoop(asuraScrap.mangaInfo[0], asuraScrap.mangaInfo[1]);
        expect(allMangaSources).not.toBe([]);
        expect(allMangaSources.length).toBe(20);
    });

    test("test THL check pagination", async () => {
        await basicActionBrowser.accessPage(asuraScrap.mainUrl)
        var allMangaSources1 = await headLessBrowser.getDataEvaluateLoop(asuraScrap.mangaInfo[0], asuraScrap.mangaInfo[1]);
        expect(allMangaSources1).not.toBe([]);
        await headLessBrowser.evaluateAndclickOnSelectorIf(asuraScrap.pagination[0], asuraScrap.pagination[1], asuraScrap.pagination[2], "Next Page Error :");
        await basicActionBrowser.wait(1000);
        var allMangaSources2 = await headLessBrowser.getDataEvaluateLoop(asuraScrap.mangaInfo[0], asuraScrap.mangaInfo[1]);
        console.log(allMangaSources1[0][0]);
        if (asuraScrap.paginationMethod === 1) {
            expect(allMangaSources1[0][0]).not.toBe(allMangaSources2[0][0]);
        } else {
            expect(allMangaSources2.length).toBeGreaterThan(allMangaSources1.length);
        }
    });

    test("test THL check manga", async () => {
        await basicActionBrowser.accessPage(asuraScrap.mainUrl);
        var allMangaSources = await headLessBrowser.getDataEvaluateLoop(asuraScrap.mangaInfo[0], asuraScrap.mangaInfo[1]);
        var res = await basicActionBrowser.accessPage(allMangaSources[0][1]);
        expect(res).toBe(200);
    });

    test("test THL check manga info", async () => {
        var mangaInfoSources, mangaGenreSources, mangaChaptersSources;
        await basicActionBrowser.accessPage(asuraScrap.mainUrl);
        var allMangaSources = await headLessBrowser.getDataEvaluateLoop(asuraScrap.mangaInfo[0], asuraScrap.mangaInfo[1]);
        var res = await basicActionBrowser.accessPage(allMangaSources[0][1]);
        if (asuraScrap.mangaChaptersGatheringMethod === 1) {
            [mangaInfoSources, mangaGenreSources, mangaChaptersSources] = await basicActionBrowser.gatherMangaDataChunk(asuraScrap.mangaPageInfo,
                asuraScrap.mangaGenreInfo, asuraScrap.mangaChaptersInfo, asuraScrap.mangaChaptersType);
        } else {
            [mangaInfoSources, mangaGenreSources, mangaChaptersSources] = await basicActionBrowser.gatherMangaDataUnlockChapters(asuraScrap.mangaPageInfo,
                asuraScrap.mangaGenreInfo, asuraScrap.mangaChaptersInfo, asuraScrap.mangaChaptersButton, asuraScrap.mangaChaptersType);
        }
        expect(mangaInfoSources[0][0]).not.toBe("");
        expect(mangaInfoSources[0][1]).not.toBe("");
        expect(parseFloat(asuraScrap.extractNumber(mangaInfoSources[0][2]))).toBeGreaterThan(0);
        expect(parseFloat(asuraScrap.extractNumber(mangaInfoSources[0][2]))).toBeLessThan(10);
        expect(mangaInfoSources[0][3]).not.toBe("");
        expect(mangaInfoSources[0][4]).not.toBe("");
        expect(mangaGenreSources.length).not.toBe(0);
        expect(mangaChaptersSources.length).not.toBe(0);
    });

    test("test THL check access manga chapter", async () => {
        await basicActionBrowser.accessPage(asuraScrap.mainUrl);
        var allMangaSources = await headLessBrowser.getDataEvaluateLoop(asuraScrap.mangaInfo[0], asuraScrap.mangaInfo[1]);
        await basicActionBrowser.accessPage(allMangaSources[0][1]);
        if (asuraScrap.mangaChaptersGatheringMethod === 1) {
            [mangaInfoSources, mangaGenreSources, mangaChaptersSources] = await basicActionBrowser.gatherMangaDataChunk(asuraScrap.mangaPageInfo,
                asuraScrap.mangaGenreInfo, asuraScrap.mangaChaptersInfo, asuraScrap.mangaChaptersType);
        } else {
            [mangaInfoSources, mangaGenreSources, mangaChaptersSources] = await basicActionBrowser.gatherMangaDataUnlockChapters(asuraScrap.mangaPageInfo,
                asuraScrap.mangaGenreInfo, asuraScrap.mangaChaptersInfo, asuraScrap.mangaChaptersButton, asuraScrap.mangaChaptersType);
        }
        var res = await basicActionBrowser.accessPage(mangaChaptersSources[0][0]);
        expect(res).toBe(200);
    });

    test("test THL check manga chapter images", async () => {
        await basicActionBrowser.accessPage(asuraScrap.mainUrl);
        var allMangaSources = await headLessBrowser.getDataEvaluateLoop(asuraScrap.mangaInfo[0], asuraScrap.mangaInfo[1]);
        await basicActionBrowser.accessPage(allMangaSources[0][1]);
        if (asuraScrap.mangaChaptersGatheringMethod === 1) {
            [mangaInfoSources, mangaGenreSources, mangaChaptersSources] = await basicActionBrowser.gatherMangaDataChunk(asuraScrap.mangaPageInfo,
                asuraScrap.mangaGenreInfo, asuraScrap.mangaChaptersInfo, asuraScrap.mangaChaptersType);
        } else {
            [mangaInfoSources, mangaGenreSources, mangaChaptersSources] = await basicActionBrowser.gatherMangaDataUnlockChapters(asuraScrap.mangaPageInfo,
                asuraScrap.mangaGenreInfo, asuraScrap.mangaChaptersInfo, asuraScrap.mangaChaptersButton, asuraScrap.mangaChaptersType);
        }
        await basicActionBrowser.accessPage(mangaChaptersSources[0][0]);
        if (asuraScrap.scrollImagesChapterConf === true)
            await headLessBrowser.scrollPage();
        await basicActionBrowser.wait(1000);
        var res;
        if (asuraScrap.imagesChapterType === 1)
            res = await headLessBrowser.getDataEvaluateLoop(asuraScrap.imagesChapter[0], asuraScrap.imagesChapter[1], "gathering url chapter image");
        else if (asuraScrap.imagesChapterType === 2)
            res = await headLessBrowser.evaluateAndGetAllValuesOnSelector(asuraScrap.imagesChapter[0], asuraScrap.imagesChapter[1], "gathering url chapter image");
        console.log(res, asuraScrap.imagesChapter[0], asuraScrap.imagesChapter[1], );    
        res = res.flatMap(x => x);
        expect(res.length).not.toBe(0);
        for (let i = 0; i < res.length; i++) {
            expect(res[0]).not.toBe("");            
        }
    });
});