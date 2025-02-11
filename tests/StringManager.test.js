const stringManager = require("./../utils/StringManager.js");

jest.setTimeout(20000);
describe("date parsing Class", () => {
    let stringCleaner;

    beforeEach(async () => {
        this.stringCleaner = new stringManager();
    });

    afterEach(async () => {

    });

    test("test asura date", async () => {
        console.log(this.stringCleaner.parseDate("February 3rd 2025"));  // ✅ Future date
        console.log(this.stringCleaner.parseDate("February 3rd 2025","date"));
        console.log(this.stringCleaner.parseDate("30 secondes ago"));       // ✅ Relative date
        console.log(this.stringCleaner.parseDate("30 secondes ago","date"));
        console.log(this.stringCleaner.parseDate("35 minutes ago"));       // ✅ Relative date
        console.log(this.stringCleaner.parseDate("35 minutes ago","date"));
        console.log(this.stringCleaner.parseDate("4 hours ago"));       // ✅ Relative date
        console.log(this.stringCleaner.parseDate("4 hours ago","date"));
        console.log(this.stringCleaner.parseDate("14 days ago"));       // ✅ Relative date
        console.log(this.stringCleaner.parseDate("14 days ago","date"));
        console.log(this.stringCleaner.parseDate("one month ago"));     // ✅ Relative date
        console.log(this.stringCleaner.parseDate("one month ago","date"));
        console.log(this.stringCleaner.parseDate("a year ago"));        // ✅ Relative date
        console.log(this.stringCleaner.parseDate("a year ago","date"));
        console.log(this.stringCleaner.parseDate("December 29, 2024")); // ✅ Formatted date
        console.log(this.stringCleaner.parseDate("December 29, 2024","date"));
        console.log(this.stringCleaner.parseDate("01/27/2025")); 
        console.log(this.stringCleaner.parseDate("01/27/2025","date"));
    });

    // test("test reaper date", async () => {

    // });
    // test("test thl date", async () => {

    // });
    // test("test MBTT date", async () => {

    // });
});