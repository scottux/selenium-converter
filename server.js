const fs = require("fs");
const path = require("path");
const args = process.argv;
// https://github.com/SeleniumHQ/selenium/blob/07a116aa32e6b464567a331ed9d1c4ffbee104bb/ide/main/src/content/xhtml-entities.js
const XhtmlEntities = require("./lib/XhtmlEntities");
const TestCase = require("./src/TestCase");
const Command = require("./src/Command");
const Comment = require("./src/Comment");
const CSharpWebdriver = require("./src/formats/cs-wd");
let formatter = new CSharpWebdriver();

let inputDirectory = args[2] || "./input/";
let outputDirectory = args[3] || "./output/";

let WDAPI = require("./src/WDApi");

WDAPI.setFormatter(formatter);
// https://github.com/SeleniumHQ/selenium/blob/07a116aa32e6b464567a331ed9d1c4ffbee104bb/ide/main/src/content/formats/html.js#L310
let options = {
    commandLoadPattern: "<tr\s*[^>]*>" +
    "\\s*(<!--[\\d\\D]*?-->)?" +
    "\\s*<td\s*[^>]*>\\s*([\\w]*?)\\s*</td>" +
    "\\s*<td\s*[^>]*>([\\d\\D]*?)</td>" +
    "\\s*(<td\s*/>|<td\s*[^>]*>([\\d\\D]*?)</td>)" +
    "\\s*</tr>\\s*",
    commentLoadPattern: "<!--([\\d\\D]*?)-->\\s*",
    escapeDollar: "false"
};



function filewalker(dir, done) {
    let results = [];

    fs.readdir(dir, function(err, list) {
        if (err) return done(err);

        let pending = list.length;

        if (!pending) return done(null, results);

        list.forEach(function(file){
            file = path.resolve(dir, file);

            fs.stat(file, function(err, stat){
                // If directory, execute a recursive call
                if (stat && stat.isDirectory()) {
                    // Add directory to array [comment if you need to remove the directories from the array]
                    results.push(file);

                    filewalker(file, function(err, res){
                        results = results.concat(res);
                        if (!--pending) done(null, results);
                    });
                } else {
                    results.push(file);

                    if (!--pending) done(null, results);
                }
            });
        });
    });
}



filewalker(inputDirectory, (err, filenames) => {
    if (err) {
        throw err;
    }

    filenames.forEach((filename) => {

        // only read html files
        if (filename.substr(-4) === "html") {
            fs.readFile(filename, "utf-8", (err, testHtml) => {
                if (err) {
                    throw err;
                }
                filename = filename.replace(/\.html/g, "");
                writeFile(outputDirectory, filename.replace(inputDirectory, ''), testHtml);
            });
        }
    });
});

/**
 *
 * @param {String} outputDirectory
 * @param {String} filename
 * @param {String} testHtml
 */
function writeFile(outputDirectory, filename, testHtml) {
    let file = outputDirectory + filename + formatter.testcaseExtension;


    let folders = (outputDirectory + filename).split(path.sep);
    folders.pop();
    folders.reduce((prevPath, folder) => {
            console.log(prevPath, folder);
            const currentPath = path.join(prevPath, folder, path.sep);
            console.log("making dir: ", currentPath);
            fs.mkdir(currentPath, err => {
                if (err && !(err.code === "EEXIST" || err.code === "EISDIR")) { console.log((outputDirectory + filename), err); throw "up"; }
            });
            return currentPath;
        }, '');



    fs.access(file, fs.constants.R_OK | fs.constants.W_OK, (err2) => {
        console.log("Reading File", filename);
        fs.writeFile(file, createTestCase(testHtml, filename), (err) => {
            if (err) {
                throw err;
            }
            console.log(err2 ? "New file generated:" : "File already exists! Existing file will be overwritten:");
            console.log("-> " + file);
        });
    });

}

/**
 *
 * @param {String} testHtml
 * @param {String} filename
 * @returns {String}
 */
function createTestCase(testHtml, filename) {
    let testCase = new TestCase(filename);

    parse(testCase, testHtml);

    return formatter.format(testCase, filename);
}

// https://github.com/SeleniumHQ/selenium/blob/07a116aa32e6b464567a331ed9d1c4ffbee104bb/ide/main/src/content/formats/html.js#L93
/**
 *
 * @param {TestCase} testCase
 * @param {String} testHtml
 */
function parse(testCase, testHtml) {
    let lastIndex;
    let commandRegexp = new RegExp(options.commandLoadPattern, 'i');
    let commentRegexp = new RegExp(options.commentLoadPattern, 'i');
    let commandOrCommentRegexp = new RegExp("((" + options.commandLoadPattern + ")|(" + options.commentLoadPattern + "))", 'ig');
    let commands = [];
    let commandFound = false;

    while (true) {
        lastIndex = commandOrCommentRegexp.lastIndex;
        let docResult = commandOrCommentRegexp.exec(testHtml);
        if (docResult) {
            if (docResult[2]) {
                //console.log("Command Found");
                let command = new Command();
                command.skip = docResult.index - lastIndex;
                command.index = docResult.index;
                let result = commandRegexp.exec(testHtml.substring(lastIndex));
                command.command = result[2];
                command.target = result[3].replace(/<datalist.*$/, ""); // Katalon adds datalist element
                command.value = result[5] || '';
                convertText(command, decodeText);
                commands.push(command);
                if (!commandFound) {
                    // remove comments before the first command or comment
                    for (let i = commands.length - 1; i >= 0; i--) {
                        if (commands[i].skip > 0) {
                            commands.splice(0, i);
                            break;
                        }
                    }
                    testCase.header = testHtml.substr(0, commands[0].index);
                    commandFound = true;
                }
            } else {
                //console.log("Comment Found");
                let comment = new Comment();
                comment.skip = docResult.index - lastIndex;
                comment.index = docResult.index;
                let result = commentRegexp.exec(testHtml.substring(lastIndex));
                comment.comment = result[1];
                commands.push(comment);
            }
        } else {
            break;
        }
        if (commands.length) {
            testCase.footer = testHtml.substring(lastIndex);
            //console.log("header=" + testCase.header);
            //console.log("footer=" + testCase.footer);
            if (testCase.header &&
                /<link\s+rel="selenium\.base"\s+href="(.*)"/.test(testCase.header)) {
                testCase.baseURL = decodeURI(RegExp.$1);
            }
            //console.log("commands.length=" + commands.length);
            testCase.commands = commands;
        } else {
            throw "No command found.";
        }
    }
}

/**
 *
 * @param {Object} command
 * @param {Function} converter
 */
function convertText(command, converter) {
    ['command', 'target', 'value'].forEach(prop => {
        command[prop] = converter(command[prop]);
    });
}

/**
 *
 * @param {String} text
 * @returns {String} Decoded text
 */
function decodeText(text) {
    if (text === null) {
        return "";
    }
    text = text.replace(/<br\s*\/?>/gi, "\n");
    text = text.replace(/&(\w+);/g, (str, p1) => {
        let c = XhtmlEntities[p1];

        return c ? String.fromCharCode(c) : str;
    });
    text = text.replace(/&#(\d+);/g, (str, p1) => {
        return String.fromCharCode(parseInt(p1));
    });
    text = text.replace(/&#x([0-9a-f]+);/gi, (str, p1) => {
        return String.fromCharCode(parseInt(p1, 16));
    });
    text = text.replace(/ +/g, " "); // truncate multiple spaces to single space
    text = text.replace(/\xA0/g, " "); // treat nbsp as space
    if ('true' === options.escapeDollar) {
        text = text.replace(/([^\\])\${/g, '$1$$$${'); // replace [^\]${...} with $${...}
        text = text.replace(/^\${/g, '$$$${'); // replace ^${...} with $${...}
        text = text.replace(/\\\${/g, '$${'); // replace \${...} with ${...}
    }

    return text;
}
