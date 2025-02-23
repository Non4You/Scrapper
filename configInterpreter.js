const config = require('./config.json')

class ConfigInterpreter {
    constructor() {
        if (ConfigInterpreter.instance) {
            return ConfigInterpreter.instance; // Return the already existing instance
        }
        ConfigInterpreter.instance = this; 
    }

    getSiteNbUrl(nb) {
        return (config["sites"][nb]['SiteBaseUrl']);
    }

    getNbMangaConfig(nb) {
        return (config["sites"][nb]['site']);
    }

    getNbSiteNameConfig(nb) {
        return (config["sites"][nb]['SiteName']);
    }

    getConfigElement(nb, element) {
        if (config["sites"][nb][element] === undefined)
            return (null);
        return (config["sites"][nb][element]);
    }

    getTotalMangaConfig() {
        var i = 0;
        while (config["sites"][i] !== undefined) {
            i++;
        }
        return i;
    }
}

module.exports = ConfigInterpreter;