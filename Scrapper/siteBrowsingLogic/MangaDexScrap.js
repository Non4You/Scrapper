const AbstractSiteScrap = require("./AbstractSiteScrap.js");

class MangaDexScrap extends AbstractSiteScrap {
    constructor(configIndex) {
        super(configIndex);
        this.cookie = this.interpreter.getConfigElement(configIndex, "cookie");
    }

    async accessMainPage(siteId, isFullscrapped) {  
        var res;
        try {
            await this.basicActionBrowser.accessPage(this.mainUrl);
            await this.saveIcon(siteId);
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
        var icon = await this.reduceImageQualityAndSave(iconUrl[0], "");
        await this.mariaDatabase.saveIconFromSite(siteId, icon);
    }
}

module.exports = MangaDexScrap;