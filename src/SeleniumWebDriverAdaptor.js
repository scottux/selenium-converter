let WDAPI = require("./WDApi");

function SeleniumWebDriverAdaptor(rawArgs) {
    this.rawArgs = rawArgs;
    this.negative = false;
}

// Returns locator.type and locator.string
SeleniumWebDriverAdaptor.prototype._elementLocator = function(sel1Locator) {
    let locator = parse_locator(sel1Locator);
    if (sel1Locator.match(/^\/\//) || locator.type === 'xpath') {
        locator.type = 'xpath';
        return locator;
    }
    if (locator.type === 'css') {
        return locator;
    }
    if (locator.type === 'id') {
        return locator;
    }
    if (locator.type === 'link') {
        locator.string = locator.string.replace(/^exact:/, '');
        return locator;
    }
    if (locator.type === 'name') {
        return locator;
    }
    if (sel1Locator.match(/^document/) || locator.type === 'dom') {
        throw 'Error: Dom locators are not implemented yet!';
    }
    if (locator.type === 'ui') {
        throw 'Error: UI locators are not supported!';
    }
    if (locator.type === 'identifier') {
        throw 'Error: locator strategy [identifier] has been deprecated. To rectify specify the correct locator strategy id or name explicitly.';
    }
    if (locator.type === 'implicit') {
        throw 'Error: locator strategy either id or name must be specified explicitly.';
    }
    throw 'Error: unknown strategy [' + locator.type + '] for locator [' + sel1Locator + ']';
};

// Returns locator.elementLocator and locator.attributeName
SeleniumWebDriverAdaptor.prototype._attributeLocator = function(sel1Locator) {
    let attributePos = sel1Locator.lastIndexOf("@");
    let elementLocator = sel1Locator.slice(0, attributePos);
    let attributeName = sel1Locator.slice(attributePos + 1);
    return {elementLocator: elementLocator, attributeName: attributeName};
};

SeleniumWebDriverAdaptor.prototype._selectLocator = function(sel1Locator) {
    //Figure out which strategy to use
    let locator = {type: 'label', string: sel1Locator};
    // If there is a locator prefix, use the specified strategy
    let result = sel1Locator.match(/^([a-zA-Z]+)=(.*)/);
    if (result) {
        locator.type = result[1];
        locator.string = result[2];
    }
    //alert(locatorType + ' [' + locatorValue + ']');
    if (locator.type === 'index') {
        return locator;
    }
    if (locator.type === 'label') {
        return locator;
    }
    if (locator.type === 'value') {
        return locator;
    }
    throw 'Error: unknown or unsupported strategy [' + locator.type + '] for locator [' + sel1Locator + ']';
};

// Returns an object with a toString method
SeleniumWebDriverAdaptor.SimpleExpression = function(expressionString) {
    this.str = expressionString;
};

SeleniumWebDriverAdaptor.SimpleExpression.prototype.toString = function() {
    return this.str;
};

//helper method to simplify the ifCondition
SeleniumWebDriverAdaptor.ifCondition = function(conditionString, stmtString) {
    return WDAPI.formatter.ifCondition(new SeleniumWebDriverAdaptor.SimpleExpression(conditionString), function() {
        return WDAPI.formatter.statement(new SeleniumWebDriverAdaptor.SimpleExpression(stmtString)) + "\n";
    });
};

SeleniumWebDriverAdaptor.prototype.check = function(elementLocator) {
    let locator = this._elementLocator(this.rawArgs[0]);
    let driver = new WDAPI.Driver();
    let webElement = driver.findElement(locator.type, locator.string);
    return SeleniumWebDriverAdaptor.ifCondition(notOperator() + webElement.isSelected(),
        WDAPI.formatter.indents(1) + webElement.click()
    );
};

SeleniumWebDriverAdaptor.prototype.click = function(elementLocator) {
    let locator = this._elementLocator(this.rawArgs[0]);
    let driver = new WDAPI.Driver();
    return driver.findElement(locator.type, locator.string).click();
};

SeleniumWebDriverAdaptor.prototype.close = function() {
    let driver = new WDAPI.Driver();
    return driver.close();
};

SeleniumWebDriverAdaptor.prototype.getAttribute = function(attributeLocator) {
    let attrLocator = this._attributeLocator(this.rawArgs[0]);
    let locator = this._elementLocator(attrLocator.elementLocator);
    let driver = new WDAPI.Driver();
    let webElement = driver.findElement(locator.type, locator.string);
    return webElement.getAttribute(attrLocator.attributeName);
};

SeleniumWebDriverAdaptor.prototype.getBodyText = function() {
    let driver = new WDAPI.Driver();
    return driver.findElement('tag_name', 'BODY').getText();
};

SeleniumWebDriverAdaptor.prototype.getCssCount = function(elementLocator) {
    let locator = this._elementLocator(this.rawArgs[0]);
    let driver = new WDAPI.Driver();
    return driver.findElements(locator.type, locator.string).getSize();
};

SeleniumWebDriverAdaptor.prototype.getLocation = function() {
    let driver = new WDAPI.Driver();
    return driver.getCurrentUrl();
};

SeleniumWebDriverAdaptor.prototype.getText = function(elementLocator) {
    let locator = this._elementLocator(this.rawArgs[0]);
    let driver = new WDAPI.Driver();
    return driver.findElement(locator.type, locator.string).getText();
};

SeleniumWebDriverAdaptor.prototype.getTitle = function() {
    let driver = new WDAPI.Driver();
    return driver.getTitle();
};

SeleniumWebDriverAdaptor.prototype.getAlert = function() {
    let driver = new WDAPI.Driver();
    return driver.getAlert();
};

SeleniumWebDriverAdaptor.prototype.isAlertPresent = function() {
    return WDAPI.Utils.isAlertPresent();
};

SeleniumWebDriverAdaptor.prototype.getConfirmation = function() {
    let driver = new WDAPI.Driver();
    return driver.getAlert();
};

SeleniumWebDriverAdaptor.prototype.isConfirmationPresent = function() {
    return WDAPI.Utils.isAlertPresent();
};

SeleniumWebDriverAdaptor.prototype.chooseOkOnNextConfirmation = function() {
    let driver = new WDAPI.Driver();
    return driver.chooseOkOnNextConfirmation();
};

SeleniumWebDriverAdaptor.prototype.chooseCancelOnNextConfirmation = function() {
    let driver = new WDAPI.Driver();
    return driver.chooseCancelOnNextConfirmation();
};

SeleniumWebDriverAdaptor.prototype.getValue = function(elementLocator) {
    let locator = this._elementLocator(this.rawArgs[0]);
    let driver = new WDAPI.Driver();
    return driver.findElement(locator.type, locator.string).getAttribute('value');
};

SeleniumWebDriverAdaptor.prototype.getXpathCount = function(elementLocator) {
    let locator = this._elementLocator(this.rawArgs[0]);
    let driver = new WDAPI.Driver();
    return driver.findElements(locator.type, locator.string).getSize();
};

SeleniumWebDriverAdaptor.prototype.goBack = function() {
    let driver = new WDAPI.Driver();
    return driver.back();
};

SeleniumWebDriverAdaptor.prototype.isChecked = function(elementLocator) {
    let locator = this._elementLocator(this.rawArgs[0]);
    let driver = new WDAPI.Driver();
    return driver.findElement(locator.type, locator.string).isSelected();
};

SeleniumWebDriverAdaptor.prototype.isElementPresent = function(elementLocator) {
    let locator = this._elementLocator(this.rawArgs[0]);
    //let driver = new WDAPI.Driver();
    //TODO: enough to just find element, but since this is an accessor, we will need to make a not null comparison
    //return driver.findElement(locator.type, locator.string);
    return WDAPI.Utils.isElementPresent(locator.type, locator.string);
};

SeleniumWebDriverAdaptor.prototype.isVisible = function(elementLocator) {
    let locator = this._elementLocator(this.rawArgs[0]);
    let driver = new WDAPI.Driver();
    return driver.findElement(locator.type, locator.string).isDisplayed();
};

SeleniumWebDriverAdaptor.prototype.open = function(url) {
    //TODO process the relative and absolute urls
    let absUrl = WDAPI.formatter.xlateArgument(this.rawArgs[0]);
    let driver = new WDAPI.Driver();
    return driver.get(absUrl);
};

SeleniumWebDriverAdaptor.prototype.refresh = function() {
    let driver = new WDAPI.Driver();
    return driver.refresh();
};

SeleniumWebDriverAdaptor.prototype.submit = function(elementLocator) {
    let locator = this._elementLocator(this.rawArgs[0]);
    let driver = new WDAPI.Driver();
    return driver.findElement(locator.type, locator.string).submit();
};

SeleniumWebDriverAdaptor.prototype.type = function(elementLocator, text) {
    let locator = this._elementLocator(this.rawArgs[0]);
    let driver = new WDAPI.Driver();
    let webElement = driver.findElement(locator.type, locator.string);
    return WDAPI.formatter.statement(new SeleniumWebDriverAdaptor.SimpleExpression(webElement.clear())) + "\n" + webElement.sendKeys(this.rawArgs[1]);
};

SeleniumWebDriverAdaptor.prototype.sendKeys = function(elementLocator, text) {
    let locator = this._elementLocator(this.rawArgs[0]);
    let driver = new WDAPI.Driver();
    return driver.findElement(locator.type, locator.string).sendKeys(this.rawArgs[1]);
};

SeleniumWebDriverAdaptor.prototype.uncheck = function(elementLocator) {
    let locator = this._elementLocator(this.rawArgs[0]);
    let driver = new WDAPI.Driver();
    let webElement = driver.findElement(locator.type, locator.string);
    return SeleniumWebDriverAdaptor.ifCondition(webElement.isSelected(),
        WDAPI.formatter.indents(1) + webElement.click()
    );
};

SeleniumWebDriverAdaptor.prototype.select = function(elementLocator, label) {
    let locator = this._elementLocator(this.rawArgs[0]);
    let driver = new WDAPI.Driver();
    return driver.findElement(locator.type, locator.string).select(this._selectLocator(this.rawArgs[1]));
};

module.exports = SeleniumWebDriverAdaptor;

// https://github.com/SeleniumHQ/selenium/blob/07a18746ff756e90fd79ef253a328bd7dfa9e6dc/javascript/selenium-core/scripts/htmlutils.js#L1045
/**
 * Parses a Selenium locator, returning its type and the unprefixed locator
 * string as an object.
 *
 * @param locator  the locator to parse
 */
function parse_locator(locator)
{
    let result = locator.match(/^([A-Za-z]+)=.+/);
    if (result) {
        let type = result[1].toLowerCase();
        let actualLocator = locator.substring(type.length + 1);
        return { type: type, string: actualLocator };
    }
    return { type: 'implicit', string: locator };
}