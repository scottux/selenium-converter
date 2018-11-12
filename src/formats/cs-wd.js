const Webdriver = require("./webdriver");

/**
 * Formatter for C#/Webdriver
 * @constructor
 * @extends Webdriver
 */
function CSharpWebdriver() {
    this.options = {
        receiver: "driver",
        showSelenese: 'false',
        namespace: "SeleniumTests",
        indent: '4',
        initialIndents:  '3',
        header:
        'using System;\n' +
        'using System.Text;\n' +
        'using System.Text.RegularExpressions;\n' +
        'using System.Threading;\n' +
        'using NUnit.Framework;\n' +
        'using OpenQA.Selenium;\n' +
        'using OpenQA.Selenium.Firefox;\n' +
        'using OpenQA.Selenium.Support.UI;\n' +
        '\n' +
        'namespace ${namespace}\n' +
        '{\n' +
        '    [TestFixture]\n' +
        '    public class ${className}\n' +
        '    {\n' +
        '        private IWebDriver driver;\n' +
        '        private StringBuilder verificationErrors;\n' +
        '        private string baseURL;\n' +
        "        private bool acceptNextAlert = true;\n" +
        '        \n' +
        '        [SetUp]\n' +
        '        public void SetupTest()\n' +
        '        {\n' +
        '            ${receiver} = new FirefoxDriver();\n' +
        '            baseURL = "${baseURL}";\n' +
        '            verificationErrors = new StringBuilder();\n' +
        '        }\n' +
        '        \n' +
        '        [TearDown]\n' +
        '        public void TeardownTest()\n' +
        '        {\n' +
        '            try\n' +
        '            {\n' +
        '                ${receiver}.Quit();\n' +
        '            }\n' +
        '            catch (Exception)\n' +
        '            {\n' +
        '                // Ignore errors if unable to close the browser\n' +
        '            }\n' +
        '            Assert.AreEqual("", verificationErrors.ToString());\n' +
        '        }\n' +
        '        \n' +
        '        [Test]\n' +
        '        public void ${methodName}()\n' +
        '        {\n',
        footer:
        '        }\n' +
        "        private bool IsElementPresent(By by)\n" +
        "        {\n" +
        "            try\n" +
        "            {\n" +
        "                driver.FindElement(by);\n" +
        "                return true;\n" +
        "            }\n" +
        "            catch (NoSuchElementException)\n" +
        "            {\n" +
        "                return false;\n" +
        "            }\n" +
        "        }\n" +
        '        \n' +
        "        private bool IsAlertPresent()\n" +
        "        {\n" +
        "            try\n" +
        "            {\n" +
        "                driver.SwitchTo().Alert();\n" +
        "                return true;\n" +
        "            }\n" +
        "            catch (NoAlertPresentException)\n" +
        "            {\n" +
        "                return false;\n" +
        "            }\n" +
        "        }\n" +
        '        \n' +
        "        private string CloseAlertAndGetItsText() {\n" +
        "            try {\n" +
        "                IAlert alert = driver.SwitchTo().Alert();\n" +
        "                string alertText = alert.Text;\n" +
        "                if (acceptNextAlert) {\n" +
        "                    alert.Accept();\n" +
        "                } else {\n" +
        "                    alert.Dismiss();\n" +
        "                }\n" +
        "                return alertText;\n" +
        "            } finally {\n" +
        "                acceptNextAlert = true;\n" +
        "            }\n" +
        "        }\n" +
        '    }\n' +
        '}\n',
        defaultExtension: "cs"
    };
    this.configForm = '<description>Variable for Selenium instance</description>' +
        '<textbox id="options_receiver" />' +
        '<description>Namespace</description>' +
        '<textbox id="options_namespace" />' +
        '<checkbox id="options_showSelenese" label="Show Selenese"/>';

    this.name = "C# (WebDriver)";
    this.testcaseExtension = ".cs";
    this.suiteExtension = ".cs";
    this.webdriver = true;

    this.formatComment = function (comment) {
        return comment.comment.replace(/.+/mg, (str) => {
            return "// " + str;
        });
    };

    this.testClassName = function (testName) {
        return testName.split(/[^0-9A-Za-z]+/).map(
            function (x) {
                return capitalize(x);
            }).join('');
    };

    this.testMethodName = function (testName) {
        return "The" + capitalize(testName) + "Test";
    };

    this.nonBreakingSpace = function () {
        return "\"\\u00a0\"";
    };

    this.pause = function (milliseconds) {
        return "Thread.Sleep(" + parseInt(milliseconds, 10) + ");";
    };

    this.echo = function (message) {
        return "Console.WriteLine(" + this.xlateArgument(message) + ");";
    };

    this.keyVariable = function (key) {
        return "Keys." + key;
    };

    this.assignToVariable = function (type, variable, expression) {
        return capitalize(type) + " " + variable + " = " + expression.toString();
    };

    this.statement = function (expression) {
        return expression.toString() + ';';
    };

    this.assertTrue = function (expression) {
        return "Assert.IsTrue(" + expression.toString() + ");";
    };

    this.assertFalse = function (expression) {
        return "Assert.IsFalse(" + expression.toString() + ");";
    };

    this.waitFor = function (expression) {
        return "for (int second = 0;; second++) {\n" +
            this.indents(1) + 'if (second >= 60) Assert.Fail("timeout");\n' +
            this.indents(1) + "try\n" +
            this.indents(1) + "{\n" +
            (expression.setup ? this.indents(2) + expression.setup() + "\n" : "") +
            this.indents(2) + "if (" + expression.toString() + ") break;\n" +
            this.indents(1) + "}\n" +
            this.indents(1) + "catch (Exception)\n" +
            this.indents(1) + "{}\n" +
            this.indents(1) + "Thread.Sleep(1000);\n" +
            "}";
    };

    this.sendKeysMapping = {
        BKSP: "Backspace",
        BACKSPACE: "Backspace",
        TAB: "Tab",
        ENTER: "Enter",
        SHIFT: "Shift",
        CONTROL: "Control",
        CTRL: "Control",
        ALT: "Alt",
        PAUSE: "Pause",
        ESCAPE: "Escape",
        ESC: "Escape",
        SPACE: "Space",
        PAGE_UP: "PageUp",
        PGUP: "PageUp",
        PAGE_DOWN: "PageDown",
        PGDN: "PageDown",
        END: "End",
        HOME: "Home",
        LEFT: "Left",
        UP: "Up",
        RIGHT: "Right",
        DOWN: "Down",
        INSERT: "Insert",
        INS: "Insert",
        DELETE: "Delete",
        DEL: "Delete",
        SEMICOLON: "Semicolon",
        EQUALS: "Equal",

        NUMPAD0: "NumberPad0",
        N0: "NumberPad0",
        NUMPAD1: "NumberPad1",
        N1: "NumberPad1",
        NUMPAD2: "NumberPad2",
        N2: "NumberPad2",
        NUMPAD3: "NumberPad3",
        N3: "NumberPad3",
        NUMPAD4: "NumberPad4",
        N4: "NumberPad4",
        NUMPAD5: "NumberPad5",
        N5: "NumberPad5",
        NUMPAD6: "NumberPad6",
        N6: "NumberPad6",
        NUMPAD7: "NumberPad7",
        N7: "NumberPad7",
        NUMPAD8: "NumberPad8",
        N8: "NumberPad8",
        NUMPAD9: "NumberPad9",
        N9: "NumberPad9",
        MULTIPLY: "Multiply",
        MUL: "Multiply",
        ADD: "Add",
        PLUS: "Add",
        SEPARATOR: "Separator",
        SEP: "Separator",
        SUBTRACT: "Subtract",
        MINUS: "Subtract",
        DECIMAL: "Decimal",
        PERIOD: "Decimal",
        DIVIDE: "Divide",
        DIV: "Divide",

        F1: "F1",
        F2: "F2",
        F3: "F3",
        F4: "F4",
        F5: "F5",
        F6: "F6",
        F7: "F7",
        F8: "F8",
        F9: "F9",
        F10: "F10",
        F11: "F11",
        F12: "F12",

        META: "Meta",
        COMMAND: "Command"
    };
}

CSharpWebdriver.prototype = new Webdriver();

module.exports = CSharpWebdriver;

function capitalize(string) {
    return string.replace(/^[a-z]/, (str) => {
        return str.toUpperCase();
    });
}

let WDAPI = require("../WDApi");

WDAPI.Driver = function () {
    this.ref = WDAPI.formatter.options.receiver;
};

WDAPI.Driver.searchContext = function (locatorType, locator) {
    let locatorString = WDAPI.formatter.xlateArgument(locator);
    switch (locatorType) {
        case 'xpath':
            return 'By.XPath(' + locatorString + ')';
        case 'css':
            return 'By.CssSelector(' + locatorString + ')';
        case 'id':
            return 'By.Id(' + locatorString + ')';
        case 'link':
            return 'By.LinkText(' + locatorString + ')';
        case 'name':
            return 'By.Name(' + locatorString + ')';
        case 'tag_name':
            return 'By.TagName(' + locatorString + ')';
    }
    throw 'Error: unknown strategy [' + locatorType + '] for locator [' + locator + ']';
};

WDAPI.Driver.prototype.back = function () {
    return this.ref + ".Navigate().Back()";
};

WDAPI.Driver.prototype.close = function () {
    return this.ref + ".Close()";
};

WDAPI.Driver.prototype.findElement = function (locatorType, locator) {
    return new WDAPI.Element(this.ref + ".FindElement(" + WDAPI.Driver.searchContext(locatorType, locator) + ")");
};

WDAPI.Driver.prototype.findElements = function (locatorType, locator) {
    return new WDAPI.ElementList(this.ref + ".FindElements(" + WDAPI.Driver.searchContext(locatorType, locator) + ")");
};

WDAPI.Driver.prototype.getCurrentUrl = function () {
    return this.ref + ".Url";
};

WDAPI.Driver.prototype.get = function (url) {
    if (url.length > 1 && (url.substring(1,8) === "http://" || url.substring(1,9) === "https://")) { // url is quoted
        return this.ref + ".Navigate().GoToUrl(" + url + ")";
    } else {
        return this.ref + ".Navigate().GoToUrl(baseURL + " + url + ")";
    }
};

WDAPI.Driver.prototype.getTitle = function () {
    return this.ref + ".Title";
};

WDAPI.Driver.prototype.getAlert = function () {
    return "CloseAlertAndGetItsText()";
};

WDAPI.Driver.prototype.chooseOkOnNextConfirmation = function () {
    return "acceptNextAlert = true";
};

WDAPI.Driver.prototype.chooseCancelOnNextConfirmation = function () {
    return "acceptNextAlert = false";
};

WDAPI.Driver.prototype.refresh = function () {
    return this.ref + ".Navigate().Refresh()";
};

WDAPI.Element = function (ref) {
    this.ref = ref;
};

WDAPI.Element.prototype.clear = function () {
    return this.ref + ".Clear()";
};

WDAPI.Element.prototype.click = function () {
    return this.ref + ".Click()";
};

WDAPI.Element.prototype.getAttribute = function (attributeName) {
    return this.ref + ".GetAttribute(" + WDAPI.formatter.xlateArgument(attributeName) + ")";
};

WDAPI.Element.prototype.getText = function () {
    return this.ref + ".Text";
};

WDAPI.Element.prototype.isDisplayed = function () {
    return this.ref + ".Displayed";
};

WDAPI.Element.prototype.isSelected = function () {
    return this.ref + ".Selected";
};

WDAPI.Element.prototype.sendKeys = function (text) {
    return this.ref + ".SendKeys(" + WDAPI.formatter.xlateArgument(text) + ")";
};

WDAPI.Element.prototype.submit = function () {
    return this.ref + ".Submit()";
};

WDAPI.Element.prototype.select = function (selectLocator) {
    if (selectLocator.type === 'index') {
        return "new SelectElement(" + this.ref + ").SelectByIndex(" + selectLocator.string + ")";
    }
    if (selectLocator.type === 'value') {
        return "new SelectElement(" + this.ref + ").SelectByValue(" + WDAPI.formatter.xlateArgument(selectLocator.string) + ")";
    }
    return "new SelectElement(" + this.ref + ").SelectByText(" + WDAPI.formatter.xlateArgument(selectLocator.string) + ")";
};

WDAPI.ElementList = function (ref) {
    this.ref = ref;
};

WDAPI.ElementList.prototype.getItem = function (index) {
    return this.ref + "[" + index + "]";
};

WDAPI.ElementList.prototype.getSize = function () {
    return this.ref + ".Count";
};

WDAPI.ElementList.prototype.isEmpty = function () {
    return this.ref + ".Count == 0";
};

WDAPI.Utils = function () {
};

WDAPI.Utils.isElementPresent = function (how, what) {
    return "IsElementPresent(" + WDAPI.Driver.searchContext(how, what) + ")";
};

WDAPI.Utils.isAlertPresent = function () {
    return "IsAlertPresent()";
};
