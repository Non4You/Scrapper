const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());
const fs = require('fs');
const path = require('path');

class HeadLessBrowser {
    constructor() {
        if (HeadLessBrowser.instance) {
            return HeadLessBrowser.instance; // Return the already existing instance
        }
        HeadLessBrowser.instance = this;    // Save the instance
    }

    async launchBrowser() {
        const userDataDir = path.join(__dirname, "user_data");
        this.browser = await puppeteer.launch({ headless: false, userDataDir: userDataDir })
        const pages = await this.browser.pages();
        this.page = pages[pages.length - 1];
        await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
        await new Promise(resolve => setTimeout(resolve, 3000));
        // await this.page.setRequestInterception(true);
        // this.page.on('request', request => {
        //     // Vérifie si la requête est de type "document" et si elle est une redirection
        //     if (request.isNavigationRequest() && request.redirectChain().length !== 0) {
        //         console.log(`Redirection détectée vers : ${request.url()}`);
        //         request.abort(); // Bloque la requête pour empêcher la redirection
        //     } else {
        //         console.log(`Redirection détectée vers : ${request.url()}`);
        //         request.continue(); // Laisse passer toutes les autres requêtes
        //     }
        // });
    }

    async openAndGoTo(url) {
        this.page = await this.browser.newPage();
        var res = await this.page.goto(url, { waitUntil: 'networkidle2'});
        return (res);
    }

    async closeCurrentPage() {
        await this.page.close();
        const pages = await this.browser.pages();
        this.page = pages[pages.length - 1];
    }

    async goToPage(url, maxRetries = 3, retryDelay = 1000) {
        let attempts = 0;
    
        while (attempts < maxRetries) {
            try {
                const res = await this.page.goto(url, { waitUntil: 'networkidle2' });
                return res; // Succès, retourner la réponse
            } catch (error) {
                attempts++;
                console.error(`Erreur lors du chargement de la page : ${error.message}. Tentative ${attempts}/${maxRetries}`);
                
                if (attempts >= maxRetries) {
                    throw new Error(`Impossible de charger la page après ${maxRetries} tentatives : ${url}`);
                }
                await new Promise(resolve => setTimeout(resolve, retryDelay));
            }
        }
    }

    currentUrl() {
        return (this.page.url());
    }

    async goBack(maxRetries = 3, retryDelay = 1000) {
        let attempts = 0;
    
        while (attempts < maxRetries) {
            try {
                return (await this.page.goBack());
            } catch (error) {
                attempts++;
                console.error(`Erreur lors du chargement de la page : ${error.message}. Tentative ${attempts}/${maxRetries}`);
                
                if (attempts >= maxRetries) {
                    throw new Error(`Impossible de charger la page après ${maxRetries} tentatives`);
                }
                await new Promise(resolve => setTimeout(resolve, retryDelay));
            }
        }
    }

    async refresh() {
        await this.page.reload()
    }

    async scrollPage() {
        await this.page.evaluate(async () => {
            const scrollStep = 1500; // Nombre de pixels par étape
            const delay = 500;      // Délai entre chaque étape en millisecondes
    
            // Fonction pour attendre un délai donné
            function wait(ms) {
                return new Promise(resolve => setTimeout(resolve, ms));
            }
    
            let totalHeight = 0;
            var scrollHeight = document.body.scrollHeight;
    
            while (totalHeight < scrollHeight) {
                window.scrollBy(0, scrollStep);
                totalHeight += scrollStep;
                var scrollHeight = document.body.scrollHeight;
                // Attendre avant de scroller à nouveau
                await wait(delay);
            }
        });
    }

    async getDataEvaluateLoop(selectorsSearchTab, indexSelectorAttributeTab, errorMessage) {
        try {
            // await this.page.waitForSelector(selectorsSearchTab[0], {timeout: 1000});
            var res = await this.page.evaluate((selectorsSearchTab, indexSelectorAttributeTab) => {
                function querySelectorTabOrString(doc, value) {
                    if (Array.isArray(value)) {
                        if (value[0] === -1) {
    
                        } else {
                            var docs = Array.from(doc.querySelectorAll(value[1]));
                            return (docs[value[0]]);
                        }
                    } else if (typeof value === 'string') {
                        var docs = Array.from(doc.querySelectorAll(value));
                        return (docs[0]);
                    }
                    return false; 
                }
                let links = Array.isArray(selectorsSearchTab[0]) ? 
                    Array.from(document.querySelectorAll(selectorsSearchTab[0][1])) : 
                    Array.from(document.querySelectorAll(selectorsSearchTab[0]));
                if (selectorsSearchTab.length > 1) {
                    links = Array.isArray(selectorsSearchTab[0]) ? links[selectorsSearchTab[0][0]] : links[0];
                }
                selectorsSearchTab.slice(1).forEach((selector, i) => {
                    links = Array.from(links.querySelectorAll(Array.isArray(selector) ? selector[1] : selector));
                    if (i < selectorsSearchTab.length - 2) {
                        links = Array.isArray(selector) ? links[selector[0]] : links[0];
                    }
                });
                data = [];
                for (let i = 0; i < links.length; i++) {
                    list = [];
                    for (let y = 0; y < indexSelectorAttributeTab.length; y++) {
                        if (indexSelectorAttributeTab[y] === null) {
                            list.push(null);
                        } else {
                            var elem = querySelectorTabOrString(links[i], indexSelectorAttributeTab[y][0]);
                            for (let x = 1; x < indexSelectorAttributeTab[y].length-1; x++) {
                                elem = querySelectorTabOrString(elem, indexSelectorAttributeTab[y][x]);
                                console.log("2 - next:", elem);
                            }
                            list.push(elem[indexSelectorAttributeTab[y][indexSelectorAttributeTab[y].length-1]]);
                        }

                        // console.log(elem);
                    }
                    data.push(list);             
                }
                console.log("data: ", data);
                return (data);
            }, selectorsSearchTab, indexSelectorAttributeTab);
            return (res);
        } catch (error) {
            if (errorMessage === undefined)
                console.log("Error: ", error.message);
            else
                console.log("Error: ", errorMessage, ", js msg:", error.message);
            
            return ([]);
        }
    }

    async evaluateAndGetAllValuesOnSelector(selectors, attribute, errorMessage) {
        try {
            var res = await this.page.evaluate((selectors, attribute) => {
                let links = Array.isArray(selectors[0]) ? 
                    Array.from(document.querySelectorAll(selectors[0][1])) : 
                    Array.from(document.querySelectorAll(selectors[0]));
                if (selectors.length > 1) {
                    links = Array.isArray(selectors[0]) ? links[selectors[0][0]] : links[0];
                }
                selectors.slice(1).forEach((selector, i) => {
                    links = Array.from(links.querySelectorAll(Array.isArray(selector) ? selector[1] : selector));
                    if (i < selectors.length - 2) {
                        links = Array.isArray(selector) ? links[selector[0]] : links[0];
                    }
                });
                // var links = Array.from(document.querySelectorAll(selector[0]));
                // for (let i = 1; i < selector.length; i++) {
                //     links = Array.from(links[0].querySelectorAll(selector[i]))
                // }
                var data = [];
                for (let i = 0; i < links.length; i++) {
                    data.push(links[i][attribute]);
                }
                console.log(data);
                return (data);
            }, selectors, attribute);
            return (res);
        } catch (error) {
            if (errorMessage === undefined)
                console.log("Error: ", error.message);
            else
                console.log("Error: ", errorMessage, ", js msg:", error.message);
            return ([]);
        }
    }

    async evaluateAndclickOnSelectorIf(selector, attribute, attributeValue, errorMessage) {
        try {
            var res = await this.page.evaluate((selector, attribute, attributeValue) => {
                const links = Array.from(document.querySelectorAll(selector));
                console.log(links, selector);
                for (let i = 0; i < links.length; i++) {
                    if (links[i][attribute].includes(attributeValue)) {
                        links[i].click();
                        return ("OK");
                    }
                }
                return ("KO");
            }, selector, attribute, attributeValue);
            return (res);
        } catch (error) {
            if (errorMessage === undefined)
                console.log("Error: ", error.message);
            else
                console.log("Error: ", errorMessage, ", js msg:", error.message);
            return ("KO");
        }
    }

    async evaluatePage() {
        await this.page.evaluate(() => {
            const links = Array.from(document.querySelectorAll('span'));
            console.log("3", links);
            for (let i = 0; i < links.length; i++) {
                if (links[i]["textContent"] === "AGREE") {
                    console.log("WORKED");
                    links[i].click();
                }
                
            }
            // if (link) {
            //     link.click();
            // }
        });
    }

    async closeBrowser() {
        await this.browser.close();
    }


}

module.exports = HeadLessBrowser;