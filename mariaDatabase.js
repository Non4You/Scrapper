const mysql = require('mysql2/promise');
const stringManager = require("./utils/StringManager");

// Database configuration
//const dbConfig = {
   // host: '192.168.1.99',        // Replace with your database host
    //user: 'root',    // Replace with your database username
    //password: 'daboudu91009',// Replace with your database password
  //  database: 'KuroNeko' // Replace with your database name
//};

const dbConfig = {
    host: process.env.DB_HOST,        // Replace with your database host
    user: process.env.DB_USER,    // Replace with your database username
    password: process.env.DB_PASSWORD,// Replace with your database password
    database: process.env.DB_DATABASE // Replace with your database name
};

class MariaDatabase {
    // Singleton
    constructor() {
        if (MariaDatabase.instance) {
            return MariaDatabase.instance;
        }
        this.stringCleaner = new stringManager();
        MariaDatabase.instance = this; 
        this.connection = null;
        this.transactionMangaUpdateList = [];
    }

    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Basic connection Operation
    async openConnection() {
        try {
            this.connection = await mysql.createConnection(dbConfig);
            console.log('Connected to the database');
        } catch (error) {
            console.error('Database query error:', error);
            throw error;
        }
    }

    async endConnection() {
        if (connection) {
            await connection.end();
        }
    }

    // initiate manga_site
    async insertMangaSite(config) {
        for (let i = 0; i < config["sites"].length; i++) {
            await this.connection.execute("INSERT INTO manga_site (Nom, fullScrapped, LastAccess) SELECT ?,0,NOW()" +
            " WHERE NOT EXISTS (SELECT 1 FROM manga_site WHERE Nom = ?);", [config["sites"][i]["SiteName"], config["sites"][i]["SiteName"]]);
        }
    }

    // manga_site table operation
    async getMangaSiteData() {
        const [results, ] = await this.connection.execute('SELECT * FROM manga_site', null);
        return (results);
    }

    async getSiteName(siteId) {
        const [results, ] = await this.connection.query('SELECT * FROM manga_site WHERE id = ?', [siteId]);
        // console.log("sitename: ", results,results[0],results[0].Nom);
        return (results[0].Nom);
    }

    async getIsFullscrapped(siteId) {
        const [results, ] = await this.connection.execute('SELECT * FROM manga_site WHERE id = ' + siteId, null);
        return (results[0].fullScrapped);
    }
    
    async setFullScrappedOnMangaSite(siteId) {
        var updateQ = "UPDATE manga_site SET fullScrapped = ? WHERE id = ?";
        const [updateRes] = await this.connection.query(updateQ, [1, siteId]);
        console.log("setFullScrapped: ",updateRes);
    }

    // Site Icon and manga Icon operation
    async saveIconFromSite(siteId, iconData) {
        var selectQ = 'SELECT * FROM manga_site_icon WHERE manga_site_id=?;';
        var insertQ = 'INSERT INTO manga_site_icon (manga_site_id, data, registered, size) VALUES (?,?,?,?);';
        var updateQ = 'UPDATE manga_site_icon SET size = ?, data = ?, registered = ? WHERE id = ?;';

        const [results, ] = await this.connection.query(selectQ, [siteId]);
        if (results.length === 0) {
            const [res, ] = await this.connection.query(insertQ, [siteId, iconData, 0, iconData.length]);
            console.log("new icon saved: ",res);
            return (res.insertId);
        } else if (results[0].size !== iconData.length) {
            const [res, ] = await this.connection.query(updateQ, [iconData.length, iconData, 0, results[0].id]);
            console.log("new icon upadted: ",res);
        }
    }

    async isIconSaved(siteId) {
        var selectQ = 'SELECT * FROM manga_site_icon WHERE manga_site_id=?;';
        const [results, ] = await this.connection.query(selectQ, [siteId]);
        if (results.length !== 0) {
            return ([results[0].id,results[0].url]);
        }
        return (null);
    }

    async saveMangaIcon(mangaId, image) {
        if (image === undefined)
            return;
        var selectQ = "SELECT * FROM manga_icon WHERE manga_id=?;";
        var insertQ = "INSERT INTO manga_icon (manga_id,image_size,registered,image) VALUES (?,?,?,?);";
        var updateQ = "UPDATE manga_icon SET image_size = ?, registered = ?, image = ? WHERE id = ?;";
        const [sqRes, ] = await this.connection.query(selectQ, [mangaId]);
        if (sqRes.length === 0) {
            const [iqRes, ] = await this.connection.query(insertQ, [mangaId, image.length, 0, image]);
        } else if (sqRes[0].image_size !== image.length) {
            const [uqRes, ] = await this.connection.query(updateQ, [image.length, 0, image, sqRes[0].id]);
        }
    }

    // make the manga last_updated in order
    async saveMangaOrder() {
        try {
            var mangaOrder = this.transactionMangaUpdateList.reverse()
            await this.connection.beginTransaction();
            for (let i = 0; i < mangaOrder.length; i++) {
                console.log("test save last update: ",mangaOrder[i][1]+1, mangaOrder[i][0]);
                await this.connection.query(
                    "UPDATE manga SET last_updated = ? WHERE id = ?;",
                    [this.stringCleaner.parseDate(mangaOrder[i][1])+i, mangaOrder[i][0]]
                );
                await this.connection.query("UPDATE manga_ref SET last_updated = ? WHERE id IN ( " +
                        "SELECT mr.id FROM manga m " +
                        "INNER JOIN manga_ref_link mrl ON mrl.manga_id = m.id " +
                        "INNER JOIN manga_ref mr ON mr.id = mrl.manga_ref_id " +
                        "WHERE m.id = ?);",
                    [this.stringCleaner.parseDate(mangaOrder[i][1])+i, mangaOrder[i][0]]
                );
                this.wait(1100);
            }
            await this.connection.commit();
        } catch (error) {
            console.error("Erreur lors de l'exécution des mises à jour:", error);
            await this.connection.rollback();
        } finally {
            this.transactionMangaUpdateList = [];
            console.log("Order manga updated");
        }
    }

    // operation on manga, manga_info, manga_genre and manga_chapter tables
    async saveMangaFromSite(siteId, mangaName, url, lastChapterDate) {
        var selectQ = 'SELECT * FROM manga WHERE site_id=? AND name=?;';
        var insertQ = 'INSERT INTO manga (site_id,name,name_lower,uri,to_scrap,scrap_in_progress,last_updated) VALUES (?,?,?,?,?,0,?);';
        var updateQ = 'UPDATE manga SET uri = ?, last_updated = ? WHERE id = ?;';
        const [results, ] = await this.connection.query(selectQ, [siteId, mangaName]);
        if (results.length === 0) {
            const [res, ] = await this.connection.query(insertQ, [siteId, mangaName, mangaName.toLowerCase(), url, 0, this.stringCleaner.parseDate(lastChapterDate)]);
            // console.log("new manga saved: ",res);
            // this.transactionMangaUpdateList.push(res.insertId);
            return (res.insertId);
        } else if (results[0].uri !== url) {
            const [res, ] = await this.connection.query(updateQ, [url, this.stringCleaner.parseDate(lastChapterDate), results[0].id]);
        }
        return (results[0].id);
    }

    async saveInfoFromManga(mangaId, synopsis, notation, status) {
        var selectQ = "SELECT * FROM manga_info WHERE manga_id=?;";
        var insertQ = 'INSERT INTO manga_info (manga_id,synopsis,notation,status) VALUES (?,?,?,?);';
        var updateQ = 'UPDATE manga_info SET status = ?, synopsis = ?, notation=? WHERE id = ?;';
        const [results, ] = await this.connection.query(selectQ, [mangaId]);
        // console.log("result: ",results)
        if (results.length === 0) {
            const [res, ] = await this.connection.query(insertQ, [mangaId, synopsis, notation, status]);
            // console.log("insert res: ",res)
            return (res.insertId);
        }
        if (results[0].status !== status || results[0].image_stored === "KO") {
            const [res, ] = await this.connection.query(updateQ, [status,synopsis,notation,results[0].id]);
            console.log("Update: ", res);
        }
    }

    async saveGenreFromManga(mangaId, genres) {
        var selectLinkQ = "SELECT * FROM manga_genre_link WHERE mangaId=?;";
        var selectgenreQ = "SELECT * FROM manga_genre WHERE nom=?;";
        var insertGenreQ = 'INSERT INTO manga_genre (nom) VALUES (?);';
        var insertLinkQ = 'INSERT INTO manga_genre_link (mangaId,GenreId) VALUES (?,?);';
        const [results, ] = await this.connection.query(selectLinkQ, [mangaId]);
        if (results.length < 1) {
            for (let i = 0; i < genres.length; i++) {
                if (this.stringCleaner.cleanGenreString(this.stringCleaner.removeDelimiters(genres[i]))) {
                    var [res, ] = await this.connection.query(selectgenreQ, [this.stringCleaner.removeDelimiters(genres[i])]);
                    var genreId;
                    try {
                        if (res.length === 0) {
                            var [insertRes, ] = await this.connection.query(insertGenreQ, [this.stringCleaner.removeDelimiters(genres[i])]);
                            console.log("Genre ", this.stringCleaner.removeDelimiters(genres[i]), " added.");
                            genreId = insertRes.insertId;
                        } else {
                            genreId = res[0].id;
                        }
                        var [insertRes, ] = await this.connection.query(insertLinkQ, [mangaId, genreId]);
                        console.log("Genre link id=", insertRes.insertId, " added.");
                    } catch (error) {
                        console.log(error);
                    }
                }
            }
        }
    }

    async makeChaptersFromMangaFuturDeletion(mangaId, to_lock) {
        var lockUpdateMangaQ = "UPDATE manga SET scrap_in_progress = 1 WHERE id = ?;";
        var unlockUpdateMangaQ = "UPDATE manga SET scrap_in_progress = 0 WHERE id = ?;";
        var updateQ = "UPDATE manga_chapter SET to_delete = 0 WHERE manga_id = ?;";
        if (to_lock === true) {
            await this.connection.query(lockUpdateMangaQ, [mangaId]);
            await this.connection.query(updateQ, [mangaId]);
        } else {
            await this.connection.query(unlockUpdateMangaQ, [mangaId]);
        }
    }

    async saveChaptersFromManga(mangaId, chapters) {
        var selectQ = "SELECT * FROM manga_chapter WHERE manga_id=? AND name=?;";
        var insertQ = 'INSERT INTO manga_chapter (url,name,released,manga_id,scrapped,manga_chapter.`order`,to_delete) VALUES (?,?,?,?,0,?,1);';
        var udpateQ = 'UPDATE manga_chapter SET url = ?, manga_chapter.`order` = ?, to_delete = ? WHERE id = ?;';
        var chapterAdded = 0, chapterUpdated = 0;

        await this.makeChaptersFromMangaFuturDeletion(mangaId, true);
        for (let i = 0; i < chapters.length; i++) {
            // console.log(" chapter date: ", this.stringCleaner.parseDate(chapters[i][2], "date"));
            const selectData = [mangaId, this.stringCleaner.removeDelimiters(chapters[i][1])];
            const [selectRes] = await this.connection.query(selectQ, selectData);
            if (selectRes.length < 1) {
                const insertData = [chapters[i][0], this.stringCleaner.removeDelimiters(chapters[i][1]), this.stringCleaner.parseDate(chapters[i][2], "date"), mangaId, i];
                await this.connection.query(insertQ, insertData);
                chapterAdded++;
            } 
            else if (chapters[i][0] !== selectRes[0].url) {
                const updateData = [chapters[i][0], i, 1, selectRes[0].id];
                await this.connection.query(udpateQ, updateData);
                chapterUpdated++;
            } else {
                const updateData = [chapters[i][0], i, 1, selectRes[0].id];
                await this.connection.query(udpateQ, updateData);
            }
        }
        await this.makeChaptersFromMangaFuturDeletion(mangaId, false);
        return ([chapterAdded, chapterUpdated]);
    }

    // status of the retrieval of data from sites
    async saveStatusDataRetrieval(siteId, dataStatus, errorMessage) {
        console.log("save status idsite: ", siteId, " data:", dataStatus)
        try {
            var selectQ = "SELECT * FROM site_data_retrieval_status WHERE manga_site_id=?;";
            var insertQ = "INSERT INTO site_data_retrieval_status (manga_site_id,site_access_status,"
                +"manga_listing_status,manga_name_status,manga_chapters_gathering_status,manga_info_status,"
                +"manga_genre_status,pagination_status,error_message) VALUES (?,?,?,?,?,?,?,?,?)";
            var updateQ = "UPDATE site_data_retrieval_status SET site_access_status = ?, manga_listing_status = ?,"
                +"manga_name_status = ?, manga_chapters_gathering_status = ?, manga_info_status = ?,"
                +"manga_genre_status = ?, pagination_status = ?, error_message = ? WHERE manga_site_id = ?";
            const [selectRes] = await this.connection.query(selectQ, [siteId]);
            if (selectRes.length === 0) {
                const [insertRes] = await this.connection.query(insertQ, [siteId, ...dataStatus, errorMessage]);
                console.log("data retrieval status: ", insertRes);
            } else {
                const [updateRes] = await this.connection.query(updateQ, [...dataStatus, errorMessage, siteId]);
                console.log("data retrieval status: ", updateRes);
            }
        } catch (error) {
            console.log(error)
        }
    }

    // access point for data saving for manga registering/update
    async saveAllData(siteId, mangaInfo, mangaGenre, mangaChapters) {
        // console.log("save manga");
        // console.log("date first chapter: ", mangaChapters[0][2], this.stringCleaner.parseDate(mangaChapters[0][2]));
        // console.log("date last chapter: ", mangaChapters[mangaChapters.length-1][2], this.stringCleaner.parseDate(mangaChapters[mangaChapters.length-1][2]));
        var mangaId = await this.saveMangaFromSite(siteId, this.stringCleaner.cleanString(mangaInfo[1]), mangaInfo[0], mangaChapters[mangaChapters.length-1][2]);
        // console.log("save manga info");
        await this.saveInfoFromManga(mangaId, mangaInfo[2], mangaInfo[3], mangaInfo[4]);
        // console.log("save manga Icon");
        await this.saveMangaIcon(mangaId, mangaInfo[5]);
        // console.log("save manga genre");
        if (mangaGenre !== null)
            await this.saveGenreFromManga(mangaId, mangaGenre);
        // console.log("save manga chapters");
        var [added, updated] = await this.saveChaptersFromManga(mangaId, mangaChapters);
        // console.log("save manga ref");
        if (added > 0) {
            var res = await this.saveMangaRef(this.stringCleaner.cleanString(mangaInfo[1]), siteId, mangaId, mangaChapters[mangaChapters.length-1][2]);
            // console.log("save manga ref genre");
            await this.saveMangaRefGenre(this.stringCleaner.cleanString(mangaInfo[1]), mangaGenre);
            await this.updateUserRemainingChapterManga(mangaId, siteId, added);
            await this.saveMangaRefStatus(this.stringCleaner.cleanString(mangaInfo[1]));
            if (res === 0) await this.updateNoteMangaRef(this.stringCleaner.cleanString(mangaInfo[1]), mangaInfo[3]);
            // console.log("save end");
            this.transactionMangaUpdateList.push([mangaId, mangaChapters[mangaChapters.length-1][2]]);
        }
        console.log(added + " chapter added, " + updated + " chapter updated for ", mangaInfo[0]);
        return ([added, updated]);
    } 

    // chapters images retrieval functions
    async getChapterToScrap(siteId) {
        // var selectQ = "SELECT m.Nom, mc.id, mc.url, mc.scrapped FROM manga m " +
        //     "INNER JOIN manga_chapter mc ON m.id = mc.manga_Key " +
        //     "WHERE m.FromSite = ? AND mc.scrapped = 1";
        var selectQ = "SELECT mc.id, mc.url, mc.name, mc.scrapped " +
            "FROM manga m " +
            "INNER JOIN manga_chapter mc ON mc.manga_id = m.id AND mc.scrapped != 1 " +
            "WHERE m.site_id = ? AND m.to_scrap = 1";
        const [results, ] = await this.connection.query(selectQ, [siteId]);
        return (results);
    }

    async saveChapterImage(chapterId, images) {
        var selectQ = "SELECT * FROM chapter_image WHERE chapter_image.`order` = ? AND chapter_id = ?;";
        var insertQ = "INSERT INTO chapter_image (chapter_id, chapter_image.`order`, registered, image) VALUES (?,?,?,?);";
        var updateQ = "UPDATE chapter_image SET registered = ?, image = ? WHERE chapter_id = ? AND chapter_image.`order` = ?;";
        
        for (let i = 0; i < images.length; i++) {
            const [sqRes, ] = await this.connection.query(selectQ, [i, chapterId]);
            if (sqRes.length === 0) {
                const [iqRes] = await this.connection.query(insertQ, [chapterId, i, 1, images[i]]);
            } else {
                const [uqRes] = await this.connection.query(updateQ, [1, images[i], chapterId, i]);
            }
        }
    }

    async setChapterToScrapped(chapterId) {
        var updateQ = "UPDATE manga_chapter SET scrapped = ? WHERE id = ?;";
        const [uqRes] = await this.connection.query(updateQ, [1, chapterId]);
    }

    async checkMangaRefMatch(manga_ref_id, chapterDate) {
        var smrmq = await this.connection.query("SELECT * FROM manga_ref_match WHERE manga_ref_src_id = ? AND is_confirmed = 1;", [manga_ref_id]);
        if (smrmq[0].length === 0)
            return (false);
        await this.connection.query("UPDATE manga_ref_link SET last_updated = ? WHERE manga_ref_id = ?;", 
            [this.stringCleaner.parseDate(chapterDate), manga_ref_id]);
        return (true);
    }

    async saveMangaRef(mangaName, siteId, mangaId, lastChapterDate) {
        var selectMRQ = "SELECT * FROM manga_ref WHERE nom = ?;";
        var selectMRLQ = "SELECT * FROM manga_ref_link WHERE site_id = ? AND manga_ref_id = ?;";
        var insertQMangaRef = "INSERT INTO manga_ref (nom,views,last_updated) VALUES (?,0,?);";
        var insertQMangaRefLink = "INSERT INTO manga_ref_link (manga_id,manga_ref_id,site_id,site_name,popularity,last_updated) VALUES (?,?,?,?,0,?);";
        // var updateMRQ = "UPDATE manga_ref SET last_updated_new = ? WHERE nom = ?;";
        var updateMRLQ = "UPDATE manga_ref_link SET last_updated = ? WHERE site_id = ? AND manga_ref_id = ?;";

        var smrq = await this.connection.query(selectMRQ, [mangaName]);
        // console.log("select manga_ref id: ", smrq[0], smrq[0].length,);
        var siteName = await this.getSiteName(siteId);
        if (smrq[0].length === 0) {
            var imrq = await this.connection.query(insertQMangaRef, [mangaName, this.stringCleaner.parseDate(lastChapterDate)]);
            // console.log("insert manga_ref id:", imrq[0], imrq[0].insertId,siteName);
            await this.connection.query(insertQMangaRefLink, [mangaId, imrq[0].insertId, siteId, siteName,  this.stringCleaner.parseDate(lastChapterDate)]);
            return (0);
        } else {
            if (await this.checkMangaRefMatch(smrq[0][0].id, lastChapterDate) === true) return (1);
            var smrlq = await this.connection.query(selectMRLQ, [siteId, smrq[0][0].id]);
            // console.log("test insert not made : ",smrlq, smrlq.length);
            // await this.connection.query(updateMRQ, [this.stringCleaner.getTimestampInSeconds(), mangaName]);
            if (smrlq[0].length === 0) {
                await this.connection.query(insertQMangaRefLink, [mangaId, smrq[0][0].id, siteId, siteName, this.stringCleaner.parseDate(lastChapterDate)]);
                return (0);
            } else {
                await this.connection.query(updateMRLQ, [this.stringCleaner.parseDate(lastChapterDate), siteId, smrq[0][0].id]);
                return (1);
            }
        }
    }

    async saveMangaRefGenre(mangaName, genres) {
        var sMangaQ = "SELECT mr.id FROM manga_ref mr WHERE mr.nom = ?;";
        var sGenreQ = "SELECT mg.id FROM manga_genre mg WHERE mg.nom = ?;";
        var sLinkQ = "SELECT * FROM manga_ref_genre_link mrgl WHERE mrgl.genre_id = ? AND mrgl.manga_ref_id = ?;";
        var iLinkQ = "INSERT INTO manga_ref_genre_link (manga_ref_id,genre_id) VALUES (?,?);";

        if (genres === null) return;
        var manga = await this.connection.query(sMangaQ, [mangaName]);
        for (let i = 0; i < genres.length; i++) {
            if (this.stringCleaner.cleanGenreString(this.stringCleaner.removeDelimiters(genres[i]))) {
                var genre = await this.connection.query(sGenreQ, [this.stringCleaner.removeDelimiters(genres[i])]);
                if (genre[0].length > 0) {
                    var link = await this.connection.query(sLinkQ, [genre[0][0].id, manga[0][0].id]);
                    if (link[0].length === 0) {
                        await this.connection.query(iLinkQ, [manga[0][0].id, genre[0][0].id]);
                    }
                }
            }
        }
    }

    async saveMangaRefStatus(mangaName) {
        var sq = "SELECT mi.`status`, COUNT(mi.`status`) AS count_status FROM manga_ref mr " +
            "INNER JOIN manga_ref_link mrl ON mr.id = mrl.manga_ref_id " +
            "INNER JOIN manga_info mi ON mi.manga_id = mrl.manga_id " +
            "WHERE mr.nom = ? GROUP BY mi.`status` ORDER BY count_status DESC LIMIT 1";
        var statusR = await this.connection.query(sq, [mangaName]);
        var uq = "UPDATE manga_ref mr SET mr.`status` = ? WHERE mr.nom = ?;";
        await this.connection.query(uq, [statusR[0][0].status, mangaName]);
    }

    async updateNoteMangaRef(mangaName, note) {
        var sMangaQ = "SELECT mr.id FROM manga_ref mr WHERE mr.nom = ?;";
        var manga = await this.connection.query(sMangaQ, [mangaName]);
        var uMangaQ = "UPDATE manga_ref mr SET note = ?, total_note = ? WHERE mr.nom = ?;";
        const totalNote = manga[0].total_note === null || isNaN(manga[0].total_note) ? 1 : Number(manga[0].total_note) + 1
        await this.connection.query(uMangaQ, [note, totalNote, mangaName]);
    }

    async updateUserRemainingChapterManga(mangaId, siteId, chapterAdded) {
        var updateQ = "UPDATE favorite_manga SET chapter_left_to_read = chapter_left_to_read + ? WHERE site_id = ? AND manga_id = ?;";
        if (chapterAdded > 0) {
            await this.connection.query(updateQ, [chapterAdded, siteId, mangaId]);
        }
    }

    // async CreateMangaRef() {
    //     var selectQ = "SELECT * FROM manga m ORDER BY m.Nom;";
    //     var selectQmangaSite = "SELECT * FROM manga_site WHERE id = ?;";
    //     var insertQMangaRef = "INSERT INTO manga_ref (nom,views,last_updated,created,last_updated_new) VALUES (?,0,NOW(),NOW(),?);";
    //     var insertQMangaRefLink = "INSERT INTO manga_ref_link (manga_id,manga_ref_id,site_id,site_name,popularity,last_updated_new) VALUES (?,?,?,?,0,?);";
    //     const [sqRes] = await this.connection.query(selectQ);
    //     var currentName = "";
    //     var insertRes;
    //     for (let i = 0; i < sqRes.length; i++) {
    //         if (currentName !== sqRes[i].Nom) {
    //             insertRes = await this.connection.query(insertQMangaRef, [sqRes[i].Nom,this.stringCleaner.getTimestampInSeconds()]);

    //             currentName = sqRes[i].Nom;
    //         }
    //         var sqMangaSite = await this.connection.query(selectQmangaSite, [sqRes[i].FromSite]);
    //         console.log("site Name: ", sqMangaSite[0],sqMangaSite[0][0].Nom);
    //         await this.connection.query(insertQMangaRefLink, [sqRes[i].id, insertRes[0].insertId, sqRes[i].FromSite, sqMangaSite[0][0].Nom,this.stringCleaner.getTimestampInSeconds()]);
    //     }
    // }

    async doQuery(query, args = []) {
        return (await this.connection.query(query, args));
    }
}

// Example usage
async function main() {
    try {
        const results = await queryDatabase('SELECT * FROM users'); // Replace with your query
        console.log(results);
    } catch (error) {
        console.error('Error in main function:', error);
    }
}

if (require.main === module) {
    main();
}

module.exports = MariaDatabase;
