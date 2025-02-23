const dateFns = require("date-fns");
const { enUS } = require("date-fns/locale");

const { parse, format, differenceInDays, sub, isValid, getTime, addHours } = dateFns;

class StringManager {
    constructor() {
        this.strToReplace = [
            ['"', '\\"'],
            ["'", "\\'"]
        ]
        this.genreToRefuse = [
            " ",
            "H0Ta",
            " Seinen",
            "18 ",
            "4 koma",
            "Action  fantasy",
            "Action Adventure",
            "Action Manhua",
            "adventure comedy",
            "Adventure System",
            "Amagishi Hisaya",
            "Ancient Art",
            "Another chance",
            "Another World",
            "AWARD WINNING",
            "Based On A Novel",
            "Battle Royale",
            "BOYS  LOVE",
            "Calm Protagonist",
            "Cheat Ability",
            "Cheat Systems",
            "Childhood Friends",
            "COMEDY ADVENTURE",
            "Coming Soon",
            "Crazy MC",
            "d Returner",
            "Dark Lord",
            "Demon King",
            "Demonic School",
            "Devouring Infinite",
            "Drama Horror",
            "Drama Sad Supernatural",
            "Dungeons Magic",
            "ecchi 2",
            "ecchi Fantasy",
            "Endless Your World",
            "Fantasy Harem",
            "FANTASY manhua",
            "FANTASY MANHWA",
            "Fighting Reincarnation School Shounen",
            "FULL COLO",
            "Full color",
            "FULL COLOR MANHUA",
            "Fusion Fantasy",
            "future era",
            "Gal ni Yasashii Otaku kun",
            "Gender bender",
            "Genius MC",
            "Girl Power",
            "GIRLS  LOVE",
            "GIRLS  LOVE ISEKAI",
            "Gore Guns",
            "Growth Martial Arts",
            "HAREM ISEKAI",
            "Historical Romance",
            "HORROR  x0D  FANTASY",
            "Hot blood",
            "i Reincarnation",
            "i signed a contract with the ruler of underworld",
            "in the brink of death",
            "Indo Comic",
            "Indo Comics",
            "ISEKAI  FANTASY",
            "Isekai Reincarnation",
            "Kanato Oka",
            "l Cheat",
            "Lehzin Comics",
            "LICE OF LIFE",
            "Live action",
            "Long strip",
            "LONG STRIP ROMANCE",
            "MAGIC ISEKAI",
            "Magic Manga",
            "MAGICAL GIRLS",
            "Male Protagonist",
            "Manga Adaptation",
            "Manhuaga Scans",
            "Marial Arts",
            "Martial Art",
            "Martial Artrs",
            "Martial Martial arts",
            "MC System",
            "Medical System",
            "Modern Cultivation",
            "Modern Fantasy",
            "Modern Setting",
            "Monster girls",
            "Monster Tamer",
            "MONSTERS  x0D  ACTION",
            "Novel Adaptation",
            "Office Politics",
            "OFFICE WORKERS",
            "Official colored",
            "Old Era",
            "One shot",
            "op mc",
            "Parallel World s",
            "Post Apocalyptic",
            "Powered Armor",
            "Prestigious Family",
            "R 18",
            "R 8",
            "R Harem",
            "Ratan Momoko",
            "Reincarnated in the Future",
            "Reverse harem",
            "Reverse Time",
            "Royal family",
            "Ruthless Protagonist",
            "SCHOOL LIF",
            "School Life",
            "Sci fi",
            "Science Fiction",
            "Seinen M ",
            "SEXUAL VIOLENCE",
            "Shoujo Ai",
            "Shounen Ai",
            "Shounen B ",
            "Si fi",
            "Slice of lfie",
            "SLICE OF LIF",
            "Slice of Life",
            "Smart MC",
            "SUGGESTIVE REINCARNATION",
            "Super power",
            "Superpower System",
            "Superpowers System",
            "Sword and Magic",
            "The end of the world",
            "Time Loop",
            "Time Travel",
            "Time Travel  Future ",
            "Time Travel (Future)",
            "Tower Climbing",
            "Traditional Games",
            "Transported to Another World",
            "Urban abilities",
            "USER CREATED",
            "VAMPIRES  x0D   manhua",
            "Video Game",
            "Video Games",
            "Virtual Game",
            "Virtual Reality",
            "Virtual World",
            "Weak To Strong",
            "WEB COMI",
            "Web comic",
            "WUXIA I",
            "WUXIA manhua",
            "y Drama",
            "y Magic",
            "yunpaku Natsume",
            " H0Ta",
            "academy",
            "Acion",
            "ADAPTATIO",
            "Adenture",
            "Adulk",
            "ADVENTUR",
            "Adventures",
            "Advnture",
            "ALIEN",
            "anhua",
            "Animals",
            "Beasts",
            "Broadcast",
            "Bullies",
            "Bully",
            "chef",
            "child",
            "Comdey",
            "Comed",
            "ComedyReturner",
            "COMICS",
            "Crima",
            "crime",
            "Criminals",
            "CROSSDRESSING",
            "DELINQUENT",
            "disaster",
            "Dragons",
            "Dungeons",
            "Ecci",
            "EINCARNATION",
            "einen",
            "EROTICA",
            "FANTAS",
            "Fatasy",
            "Fight",
            "Fusion",
            "G0re",
            "Games",
            "genderswap",
            "goddess",
            "gods",
            "GYARU",
            "Horrror",
            "HRILLER",
            "Hunters",
            "immersive",
            "Indo",
            "Indonesian",
            "Inspection",
            "Iseka",
            "Isekaii",
            "ladies",
            "magical",
            "Mahua",
            "Manhuas",
            "ManhuaScans",
            "manhuaus",
            "Manhw",
            "Manhwa",
            "ManhwaSeinen",
            "Medicaldrama",
            "Misunderstanding",
            "Mix",
            "MMA",
            "Monsers",
            "Monster",
            "Monter",
            "Msnga",
            "Music",
            "MYSTER",
            "Nude",
            "OMANCE",
            "omedy",
            "ONSTERS",
            "OP",
            "Overpowere",
            "Philosophical",
            "phsycological",
            "Physiological",
            "Promo",
            "psyschological",
            "Rape",
            "recurrence",
            "Roamnce",
            "Roma",
            "Romace",
            "Romacne",
            "Romanc",
            "RomanceFantasy",
            "Russian",
            "science",
            "Seine",
            "Shouju",
            "Shoune",
            "Smut",
            "SUGGESTIVE",
            "Supernatu",
            "Supernatura",
            "Superpower",
            "Sword",
            "Swordfight",
            "systems",
            "teacher",
            "Time",
            "Toomics",
            "Transmigrating",
            "Twins",
            "UGGESTIVE",
            "Vampire",
            "VAMPIRES",
            "Vi0lence",
            "Webdexscan",
            "Webdexscans",
            "Xianxia",
            "Xuanhuan",
            "Youth",
            "yuri",
            "Zombie",
            "Singer",
            "Stream",
            "Action Drama Fantasy Seinen",
            "CEO",
            "Traged",
            "SEKAI",
            "Tomboy",
            "Wrestling",
            "Animal",
            "Anthology",
            "TimeTravel",
            "Gambling",
            "Showbiz",
            "Sage",
            "Adventurer",
            "Guns",
            "Modern",
            "Counterattack",
            "Mercenary",
            "Shotacon",
            "Lolicon",
            "Pets",
            "Jockey",
            "Doujinshi",
            "Gacha",
            "Colored",
            "Magician",
            "Artifact",
            "Urban",
            "Juvenile",
            "Hunter",
            "Traverse",
            "Bloody",
            "Manhhwa",
            "funny",
            "Otherworld",
            "Cartoon",
            "Shota",
            "Yakuzas",
            "Kids",
            "Player",
            "Synopsis",
            "Politics",
            "Office",
            "Building",
            "Novel",
            "Acting",
            "Gang",
            "High",
            "DramaSeinen",
            "VR",
            "VRMMO",
            "Aliens",
            "Comic",
            "Mafia",
            "Gisaeng",
            "Delinquents",
            "Mangatoon",
            "Tamer",
            "AnotherChance",
            "Webtoons",
            "SystemTower",
            "Loli",
            "Webtoon"
        ];
    }

    parseDate(dateStr, dateType = "int") {
        const now = new Date(); // Current date
        // console.log("err ? :", dateStr);
        dateStr = dateStr.trim().replace(/\u00A0/g, "");
        // console.log("err2 ? :", dateStr);
    
        // Case 1: "4 hours ago", "14 days ago", "one month ago", "a year ago"
        const relativeMatch = dateStr.match(/(few|\d+|one|a|an) (second|minute|hour|day|month|year)s? ago/);
        if (relativeMatch) {
            let amount = (relativeMatch[1] === "one" || relativeMatch[1] === "a" || relativeMatch[1] === "an") ? 1 : parseInt(relativeMatch[1]);
    
            let unitMap = {
                "second": "seconds",
                "minute": "minutes",
                "hour": "hours",
                "day": "days",
                "month": "months",
                "year": "years"
            };
    
            let unit = unitMap[relativeMatch[2]];
    
            if (!unit) throw new Error("Invalid unit: " + relativeMatch[2]);
    
            let subtractedDate = sub(now, { [unit]: amount });
    
            return dateType === "int"
                ? Math.floor(subtractedDate.getTime() / 1000) // Convert to UNIX timestamp
                : format(subtractedDate, "d MMMM yyyy", { locale: enUS });
        }
    
        // Case 2: "February 3rd 2025", "December 29, 2024"
        let parsedDate = parse(dateStr.replace(/(\d+)(st|nd|rd|th)/, "$1"), "MMMM d yyyy", new Date(), { locale: enUS });
        if (!isValid(parsedDate)) {
            parsedDate = parse(dateStr, "MMMM d, yyyy", new Date(), { locale: enUS });
        }
    
        // Case 3: "01/27/2025"
        if (!isValid(parsedDate)) {
            parsedDate = parse(dateStr, "MM/dd/yyyy", new Date());
        }
    
        // Return timestamp if valid
        if (isValid(parsedDate)) {
            parsedDate = addHours(parsedDate, 1);
            return dateType === "int"
                ? Math.floor(parsedDate.getTime() / 1000)
                : format(parsedDate, "d MMMM yyyy", { locale: enUS });
        }
    
        throw new Error("Invalid date format: " + dateStr);
    }

    cleanGenreString(str) {
        for (let i = 0; i < this.genreToRefuse.length; i++) {
            if (str === this.genreToRefuse[i][0]) {
                console.log("genre denied: '", str, "', '",this.genreToRefuse[i][0],"'");
                return (false);
            }
        }
        return (true);
    }

    cleanString(str) {
        // Supprimer les espaces en début et fin de la chaîne
        str = str.trim();
        
        // Supprimer les tabulations, espaces multiples et autres caractères de contrôle
        str = str.replace(/[\t\n\r]+/g, ' '); // Remplacer \t, \n, \r par un espace
        str = str.replace(/\s+/g, ' ');       // Remplacer les espaces multiples par un seul espace
        
        return str;
    }

    removeDelimiters(input) {
        // Liste des délimiteurs communs
        input = input.trim();
        const delimiters = /[\/\\,;:\.\s\+\-\*\&\@\!\#\$\%\^\(\)\[\]\{\}\|<>?="']/g;
        input = input.replace(/[\t\n\r]+/g, ' '); // Remplacer \t, \n, \r par un espace
        input = input.replace(/\s+/g, ' ');
        return input.replace(delimiters, ' ');
    }

    fixStringForDB(str) {
        for (let i = 0; i < this.strToReplace.length; i++) {
            str = str.replaceAll(this.strToReplace[i][0], this.strToReplace[i][1]);  
        }
        return str;
    }

    getTimestampInSeconds() {
        return (Math.floor(Date.now() / 1000));
    }
}

module.exports = StringManager;