const AbstractSiteScrap = require("./AbstractSiteScrap.js");

class AsuraScrap extends AbstractSiteScrap {
    constructor(configIndex) {
        super(configIndex);
        this.cookie = this.interpreter.getConfigElement(configIndex, "cookie");
    }

    async accessMainPage(siteId, isFullscrapped) {  
        var res;
        // await this.mariaDatabase.CreateMangaRef();

        try {
            await this.basicActionBrowser.accessPage(this.mainUrl);
            await this.saveIcon(siteId);
            // var icon = await this.reduceImageQualityAndSave(new URL(this.mainUrl).origin+'/favicon.ico', "ico");
            // await this.mariaDatabase.saveIconFromSite(siteId, icon);
            // await this.basicActionBrowser.checkIcon(siteId, this.siteIcon);
            if (this.cookie !== null)
                await this.headLessBrowser.evaluateAndclickOnSelectorIf(this.cookie[0], this.cookie[1], this.cookie[2]);
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
        var iconUrl = await this.headLessBrowser.evaluateAndGetAllValuesOnSelector(this.siteIcon[0], this.siteIcon[1]);
        // console.log(iconUrl);
        var icon = await this.reduceImageQualityAndSave(iconUrl[0], "");
        // console.log("icon data: ",icon);
        await this.mariaDatabase.saveIconFromSite(siteId, icon);
    }
}

module.exports = AsuraScrap;