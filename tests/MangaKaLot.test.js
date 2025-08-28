const createSiteScrapClass = require("./../Scrapper/siteBrowsingLogic/SiteScrapBuilder.js");
const BasicActionBrowser = require("./../Scrapper/basicActionBrowser.js");
const HeadLessBrowser = require("./../headlessBrowser.js");

jest.setTimeout(20000);
describe("AsuraScrap Class", () => {
    let mangaKaLotScrap;
    let basicActionBrowser;
    let headLessBrowser;

    beforeEach(async () => {
        mangaKaLotScrap = createSiteScrapClass("Mangakakalot", 6);
        basicActionBrowser = new BasicActionBrowser();
        headLessBrowser = new HeadLessBrowser();
        await headLessBrowser.launchBrowser();
    });

    afterEach(async () => {
        await headLessBrowser.closeBrowser();
    });

    // test("test access main MangaKaLot page", async () => {
    //     expect(mangaKaLotScrap.mainUrl).not.toBe("");
    //     await expect(await basicActionBrowser.accessPage(mangaKaLotScrap.mainUrl)).toBe(200);
    // });

    // test("test MangaKaLot site Icon", async () => {
    //     await basicActionBrowser.accessPage(mangaKaLotScrap.mainUrl); 
    //     // expect(iconUrl).toBe("https://asuracomic.net/images/logo.webp");*
    //     var icon = await mangaKaLotScrap.reduceImageQualityAndSave("https://www.mangakakalot.gg/images/favicon.ico", "ico");
    //     expect(icon.length).not.toBe(0);
    // });

    // test("test MangaKaLot check get manga links", async () => {
    //     await basicActionBrowser.accessPage(mangaKaLotScrap.mainUrl)
    //     var allMangaSources = await headLessBrowser.getDataEvaluateLoop(mangaKaLotScrap.mangaInfo[0], mangaKaLotScrap.mangaInfo[1]);
    //     expect(allMangaSources).not.toBe([]);
    //     expect(allMangaSources.length).toBe(24);
    // });

    // test("test MangaKaLot check pagination", async () => {
    //     await basicActionBrowser.accessPage(mangaKaLotScrap.mainUrl)
    //     var allMangaSources1 = await headLessBrowser.getDataEvaluateLoop(mangaKaLotScrap.mangaInfo[0], mangaKaLotScrap.mangaInfo[1]);
    //     expect(allMangaSources1).not.toBe([]);
    //     console.log(mangaKaLotScrap.mainUrl + "?page=" + 2);
    //     await basicActionBrowser.accessPage(mangaKaLotScrap.mainUrl + "?page=" + 2);
    //     // var res = await headLessBrowser.evaluateAndclickOnSelectorIf(mangaKaLotScrap.pagination[0], mangaKaLotScrap.pagination[1], mangaKaLotScrap.pagination[2], "Next Page Error :");
    //     await basicActionBrowser.wait(1000);
    //     var allMangaSources2 = await headLessBrowser.getDataEvaluateLoop(mangaKaLotScrap.mangaInfo[0], mangaKaLotScrap.mangaInfo[1]);
    //     console.log(allMangaSources1[0][0]);
    //     if (mangaKaLotScrap.paginationMethod === 1) {
    //         expect(allMangaSources1[0][0]).not.toBe(allMangaSources2[0][0]);
    //     } else {
    //         expect(allMangaSources2.length).not.toBeGreaterThan(allMangaSources1.length);
    //     }
    // });

    // test("test MangaKaLot check manga", async () => {
    //     await basicActionBrowser.accessPage(mangaKaLotScrap.mainUrl);
    //     var allMangaSources = await headLessBrowser.getDataEvaluateLoop(mangaKaLotScrap.mangaInfo[0], mangaKaLotScrap.mangaInfo[1]);
    //     var res = await basicActionBrowser.accessPage(allMangaSources[0][1]);
    //     // expect(res).toBe(200);
    //     expect(allMangaSources[0][0]).not.toBe("");
    //     expect(allMangaSources[0][1]).not.toBe("");
    //     expect(allMangaSources[0][2]).not.toBe("");
    //     expect(allMangaSources.length).not.toBe(0);
    // });

    // test("test MangaKaLot check manga info", async () => {
    //     var mangaInfoSources, mangaGenreSources, mangaChaptersSources;
    //     await basicActionBrowser.accessPage(mangaKaLotScrap.mainUrl);
    //     var allMangaSources = await headLessBrowser.getDataEvaluateLoop(mangaKaLotScrap.mangaInfo[0], mangaKaLotScrap.mangaInfo[1]);
    //     await headLessBrowser.setDownloadImageOnpage(allMangaSources[0][1].match(/\/([^\/]+)$/)[1], allMangaSources[0][1]);
    //     var res = await basicActionBrowser.accessPage(allMangaSources[0][1]);
    //     await headLessBrowser.unsetDownloadImageOnpage();
    //     if (mangaKaLotScrap.mangaChaptersGatheringMethod === 1) {
    //         [mangaInfoSources, mangaGenreSources, mangaChaptersSources] = await basicActionBrowser.gatherMangaDataChunk(mangaKaLotScrap.mangaPageInfo,
    //             mangaKaLotScrap.mangaGenreInfo, mangaKaLotScrap.mangaChaptersInfo, mangaKaLotScrap.mangaChaptersType);
    //     } else {
    //         [mangaInfoSources, mangaGenreSources, mangaChaptersSources] = await basicActionBrowser.gatherMangaDataUnlockChapters(mangaKaLotScrap.mangaPageInfo,
    //             mangaKaLotScrap.mangaGenreInfo, [mangaKaLotScrap.mangaChaptersLink, mangaKaLotScrap.mangaChaptersName, mangaKaLotScrap.mangaChaptersDate], asuraScrap.mangaChaptersButton, asuraScrap.mangaChaptersType);
    //     }
    //     mangaInfoSources[0][4] = await headLessBrowser.getLoadedImages()[0];
    //     // console.log("buffer: ", await headLessBrowser.getLoadedImages());
    //     console.log("variables: ",mangaInfoSources, mangaGenreSources[0].replace(/[\s\u200B-\u200D\uFEFF]/g, ''), mangaInfoSources[0][3].slice(9), mangaInfoSources[0][4]);
    //     expect(mangaInfoSources[0][0]).not.toBe("");
    //     expect(mangaInfoSources[0][1]).not.toBe("");
    //     expect(parseFloat(mangaInfoSources[0][2])).toBeGreaterThan(0);
    //     expect(parseFloat(mangaInfoSources[0][2])).toBeLessThan(10);
    //     expect(mangaInfoSources[0][3]).not.toBe("");
    //     expect(mangaInfoSources[0][4].length).not.toBe(0);
    //     expect(mangaGenreSources.length).not.toBe(0);
    //     expect(mangaChaptersSources.length).not.toBe(0);
    //     headLessBrowser.saveImage("test123.jpg", await mangaKaLotScrap.reduceImageQualityAndSaveFromBuffer(mangaInfoSources[0][4], true, 100));
    //     // headLessBrowser.sanityCheck();
    //     // const imageUrl = "https://img-r1.2xstorage.com/thumb/reincarnated-as-a-sword.webp";
    //     // console.log("imageUrl: ", imageUrl, mangaInfoSources[0][4]);
    //     // await headLessBrowser.downloadImageFromPage(allMangaSources[0][1].match(/\/([^\/]+)$/)[1], allMangaSources[0][1]);
    //     // console.log("response: ", response);
    // });

    // test("test Asura check access manga chapter", async () => {
    //     await basicActionBrowser.accessPage(mangaKaLotScrap.mainUrl);
    //     var allMangaSources = await headLessBrowser.getDataEvaluateLoop(mangaKaLotScrap.mangaInfo[0], mangaKaLotScrap.mangaInfo[1]);
    //     await basicActionBrowser.accessPage(allMangaSources[0][1]);
    //     if (mangaKaLotScrap.mangaChaptersGatheringMethod === 1) {
    //         [mangaInfoSources, mangaGenreSources, mangaChaptersSources] = await basicActionBrowser.gatherMangaDataChunk(mangaKaLotScrap.mangaPageInfo,
    //             mangaKaLotScrap.mangaGenreInfo, mangaKaLotScrap.mangaChaptersInfo, mangaKaLotScrap.mangaChaptersType);
    //     } else {
    //         [mangaInfoSources, mangaGenreSources, mangaChaptersSources] = await basicActionBrowser.gatherMangaDataUnlockChapters(mangaKaLotScrap.mangaPageInfo,
    //             mangaKaLotScrap.mangaGenreInfo, [mangaKaLotScrap.mangaChaptersLink, mangaKaLotScrap.mangaChaptersName, mangaKaLotScrap.mangaChaptersDate], mangaKaLotScrap.mangaChaptersButton, mangaKaLotScrap.mangaChaptersType);
    //     }
    //     var res = await basicActionBrowser.accessPage(mangaChaptersSources[0][0]);
    //     expect([200, 304]).toContain(res);
    // });

    test("test Asura check manga chapter images", async () => {
        await basicActionBrowser.accessPage(mangaKaLotScrap.mainUrl);
        var allMangaSources = await headLessBrowser.getDataEvaluateLoop(mangaKaLotScrap.mangaInfo[0], mangaKaLotScrap.mangaInfo[1]);
        await basicActionBrowser.accessPage(allMangaSources[0][1]);
        if (mangaKaLotScrap.mangaChaptersGatheringMethod === 1) {
            [mangaInfoSources, mangaGenreSources, mangaChaptersSources] = await basicActionBrowser.gatherMangaDataChunk(mangaKaLotScrap.mangaPageInfo,
                mangaKaLotScrap.mangaGenreInfo, mangaKaLotScrap.mangaChaptersInfo, mangaKaLotScrap.mangaChaptersType);
        } else {
            [mangaInfoSources, mangaGenreSources, mangaChaptersSources] = await basicActionBrowser.gatherMangaDataUnlockChapters(mangaKaLotScrap.mangaPageInfo,
                mangaKaLotScrap.mangaGenreInfo, [mangaKaLotScrap.mangaChaptersLink, mangaKaLotScrap.mangaChaptersName, mangaKaLotScrap.mangaChaptersDate], mangaKaLotScrap.mangaChaptersButton, mangaKaLotScrap.mangaChaptersType);
        }
        await headLessBrowser.setDownloadImageOnpage(allMangaSources[0][1].match(/\/([^\/]+)$/)[1], allMangaSources[0][1]);
        await basicActionBrowser.accessPage(mangaChaptersSources[0][0]);
        await headLessBrowser.unsetDownloadImageOnpage();
        if (mangaKaLotScrap.scrollImagesChapterConf === true)
            await headLessBrowser.scrollPage();
        await basicActionBrowser.wait(1000);
        // var res;
        // if (mangaKaLotScrap.imagesChapterType === 1)
        //     res = await headLessBrowser.getDataEvaluateLoop(mangaKaLotScrap.imagesChapter[0], mangaKaLotScrap.imagesChapter[1], "gathering url chapter image");
        // else if (mangaKaLotScrap.imagesChapterType === 2)
        //     res = await headLessBrowser.evaluateAndGetAllValuesOnSelector(mangaKaLotScrap.imagesChapter[0], mangaKaLotScrap.imagesChapter[1], "gathering url chapter image");
        // console.log(res, mangaKaLotScrap.imagesChapter[0], mangaKaLotScrap.imagesChapter[1], );    
        var images = await headLessBrowser.getLoadedImages();
        // res = res.flatMap(x => x);
        // expect(res.length).not.toBe(0);
        // for (let i = 0; i < res.length; i++) {
        //     expect(res[0]).not.toBe("");
        // }
        console.log("images: ", images);
    });
});