/**
 *
 * @param {String} tempTitle
 * @constructor
 */
function TestCase(tempTitle) {
    if (!tempTitle) {
        tempTitle = "Untitled";
    }
    /**
     *
     * @type {String}
     */
    this.tempTitle = tempTitle;
    /**
     *
     * @type {Object}
     */
    this.formatLocalMap = {};
    /**
     *
     * @type {Array}
     */
    this.commands = [];
    //this.recordModifiedInCommands();
    /**
     *
     * @type {String}
     */
    this.baseURL = "";
}

/**
 * Store variables specific to each format in this hash.
 * @param {String} formatName
 * @returns {Object}
 */
TestCase.prototype.formatLocal = function (formatName) {
    let scope = this.formatLocalMap[formatName];

    if (!scope) {
        scope = {};
        this.formatLocalMap[formatName] = scope;
    }

    return scope;
};

/**
 *
 * @returns {String|null}
 */
TestCase.prototype.getTitle = function () {
    if (this.title) {
        return this.title;
    } else if (this.file && this.file.leafName) {
        return this.file.leafName.replace(/\.\w+$/,'');
    } else if (this.tempTitle) {
        return this.tempTitle;
    } else {
        return null;
    }
};

/**
 *
 * @param {String} baseURL
 */
TestCase.prototype.setBaseURL = function (baseURL) {
    this.baseURL = baseURL;
};

/**
 *
 * @returns {String}
 */
TestCase.prototype.getBaseURL = function () {
    if (!this.baseURL || this.baseURL === "") {
        return "https://portalbeta.qlmortgageservices.com/";
    } else {
        return this.baseURL;
    }
};

module.exports = TestCase;
