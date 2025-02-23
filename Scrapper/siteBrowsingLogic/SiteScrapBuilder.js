const AsuraScrap = require("./AsuraScrap.js");
const ReaperScrap = require("./ReaperScrap.js");
const ThlScrap = require("./ThlScrap.js");
const MangaBTT = require("./MangaBTTScrap.js");

function createSiteScrapClass(className, configIndex) {
    var ChildClass;
    switch (className) {
        case "Asura Toon":
            ChildClass = new AsuraScrap(configIndex);
            break;
        case "ReaperScan":
            ChildClass = new ReaperScrap(configIndex);
            break;
        case "LHTranslation":
            ChildClass = new ThlScrap(configIndex);
            break;
        case "MangaBTT":
            ChildClass = new MangaBTT(configIndex);
            break;
    }
    return ChildClass;
}

module.exports = createSiteScrapClass;