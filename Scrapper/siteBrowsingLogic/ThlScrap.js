const AbstractSiteScrap = require("./AbstractSiteScrap.js");

class ThlScrap extends AbstractSiteScrap {
    constructor(configIndex) {
        super(configIndex);
        this.cookie = this.interpreter.getConfigElement(configIndex, "cookie");
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

module.exports = ThlScrap;