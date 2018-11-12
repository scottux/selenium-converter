const SeleneseMapper = require("../SeleneseMapper");
const CallSelenium = require("../CallSelenium");
const Comment = require("../Comment");
const formatOnly = require('./formatOnly');

/**
 * Formatter for Webdriver, extend for use.
 * @constructor
 * @extends formatOnly
 */
function Webdriver() {
    /**
     *
     * @type {boolean}
     */
    this.remoteControl = true;

    /**
     *
     * @type {boolean}
     */
    this.playable = false;

    /**
     *
     * @type {Object}
     */
    this.sendKeysMapping = {};


    /* @override
     * This function filters the command list and strips away the commands we no longer need
     * or changes the command to another one.
     * NOTE: do not change the existing command directly or it will also change in the test case.
     */
    this.postFilter = function (originalCommands) {
        let commands = [];
        let commandsToSkip = {
            waitForPageToLoad : 1,
            pause: 1
        };
        let rc;

        originalCommands.forEach(c => {
            if (c.type === 'command') {
                if (commandsToSkip[c.command] && commandsToSkip[c.command] === 1) {
                    //Skip
                } else if (rc = SeleneseMapper.remap(c)) {  //Yes, this IS an assignment
                    //Remap
                    commands.push.apply(commands, rc);
                } else {
                    commands.push(c);
                }
            } else {
                commands.push(c);
            }
        });

        return commands;
    };

    /**
     *
     * @param {TestCase} testCase
     * @returns {String}
     */
    this.formatHeader = function (testCase) {
        let className = testCase.getTitle();
        if (!className) {
            className = "NewTest";
        }
        className = this.testClassName(className);
        let formatLocal = testCase.formatLocal(this.name);
        let methodName = this.testMethodName(className.replace(/Test$/i, "").replace(/^Test/i, "").replace(/^[A-Z]/, (str) => {
            return str.toLowerCase();
        }));
        let header = (this.options.getHeader ? this.options.getHeader() : this.options.header).
            replace(/\${className}/g, className).
            replace(/\${methodName}/g, methodName).
            replace(/\${baseURL}/g, testCase.getBaseURL()).
            replace(/\${([a-zA-Z0-9_]+)}/g, (str, name) => {
                return this.options[name];
            });
        this.lastIndent = this.indents(parseInt(this.options.initialIndents, 10));
        formatLocal.header = header;

        return formatLocal.header;
    };

    /**
     *
     * @param {TestCase} testCase
     * @returns {String}
     */
    this.formatFooter = function (testCase) {
        let formatLocal = testCase.formatLocal(this.name);

        formatLocal.footer = this.options.footer;

        return formatLocal.footer;
    };

    /**
     *
     * @param {Command|Comment} command
     * @returns {String}
     */
    this.formatCommand = function (command) {
        let line = null;

        try {
            let call;
            let i;
            let eq;
            let method;
            if (command.type === 'command') {
                let def = command.getDefinition();
                if (def && def.isAccessor) {
                    call = new CallSelenium(def.name);
                    //console.log(call);
                    for (i = 0; i < def.params.length; i++) {
                        call.rawArgs.push(command.getParameterAt(i));
                        call.args.push(this.xlateArgument(command.getParameterAt(i)));
                    }
                    let extraArg = command.getParameterAt(def.params.length);
                    if (def.name.match(/^is/)) { // isXXX
                        if (command.command.match(/^assert/) ||
                            (this.assertOrVerifyFailureOnNext && command.command.match(/^verify/))) {
                            line = (def.negative ? this.assertFalse : this.assertTrue)(call);
                        } else if (command.command.match(/^verify/)) {
                            line = (def.negative ? this.verifyFalse : this.verifyTrue)(call);
                        } else if (command.command.match(/^store/)) {
                            this.addDeclaredVar(extraArg);
                            line = this.statement(this.assignToVariable('boolean', extraArg, call));
                        } else if (command.command.match(/^waitFor/)) {
                            line = this.waitFor(def.negative ? call.invert() : call);
                        }
                    } else { // getXXX
                        if (command.command.match(/^(verify|assert)/)) {
                            eq = this.seleniumEquals(def.returnType, extraArg, call);
                            if (def.negative) eq = eq.invert();
                            method = (!this.assertOrVerifyFailureOnNext && command.command.match(/^verify/)) ? 'verify' : 'assert';
                            line = eq[method]();
                        } else if (command.command.match(/^store/)) {
                            this.addDeclaredVar(extraArg);
                            line = this.statement(this.assignToVariable(def.returnType, extraArg, call));
                        } else if (command.command.match(/^waitFor/)) {
                            eq = this.seleniumEquals(def.returnType, extraArg, call);
                            if (def.negative) { eq = eq.invert(); }
                            line = this.waitFor(eq);
                        }
                    }
                } else if (this.pause && 'pause' === command.command) {
                    line = this.pause(command.target);
                } else if (this.echo && 'echo' === command.command) {
                    line = this.echo(command.target);
                } else if ('store' === command.command) {
                    this.addDeclaredVar(command.value);
                    line = this.statement(this.assignToVariable('String', command.value, this.xlateArgument(command.target)));
                } else if (this.set && command.command.match(/^set/)) {
                    line = this.set(command.command, command.target); // no fn in C#
                } else if (command.command.match(/^(assert|verify)Selected$/)) {
                    console.log("assert or verify selected");
                } else if (def) {
                    if (def.name.match(/^(assert|verify)(Error|Failure)OnNext$/)) {
                        this.assertOrVerifyFailureOnNext = true;
                        this.assertFailureOnNext = def.name.match(/^assert/);
                        this.verifyFailureOnNext = def.name.match(/^verify/);
                    } else {
                        call = new CallSelenium(def.name);
                        if ("open" === def.name && this.options.urlSuffix && !command.target.match(/^\w+:\/\//)) {
                            // urlSuffix is used to translate core-based test
                            call.rawArgs.push(this.options.urlSuffix + command.target);
                            call.args.push(this.xlateArgument(this.options.urlSuffix + command.target));
                        } else {
                            for (i = 0; i < def.params.length; i++) {
                                call.rawArgs.push(command.getParameterAt(i));
                                call.args.push(this.xlateArgument(command.getParameterAt(i)));
                            }
                        }
                        line = this.statement(call, command);
                    }
                } else {
                    //console.warn("Unknown command: <" + command.command + ">");
                    throw 'Unknown command [' + command.command + ']';
                }
            }
        } catch(e) {
            console.error("Caught exception: <" + e + ">");
            line = this.formatComment(new Comment('ERROR: Caught exception [' + e + ']'));
        }

        return line;
    };

    /**
     *
     * @param {Number} num
     * @returns {String}
     */
    this.indents = function (num) {
        try {
            let indent = this.options.indent;
            // tabs v spaces
            if ('tab' === indent) {
                return repeat("\t", num);
            } else {
                return repeat(" ", num * parseInt(this.options.indent, 10));
            }
        } catch (error) {
            return repeat(" ", 0);
        }

        /**
         *
         * @param {String} c
         * @param {Number} n
         * @returns {String}
         */
        function repeat(c, n) {
            let str = "";

            for (let i = 0; i < n; i++) {
                str += c;
            }

            return str;
        }
    };

    /**
     *
     * @param {String} variable
     * @returns {String|null}
     */
    this.xlateKeyVariable = function (variable) {
        let r;

        if ((r = /^KEY_(.+)$/.exec(variable))) {
            let key = this.sendKeysMapping[r[1]];

            if (key) {
                return this.keyVariable(key);
            }
        }
        return null;
    };

    /**
     *
     * @param {String} value
     * @param {String} type
     * @returns {String|CallSelenium}
     */
    this.xlateArgument = function (value, type) {
        value = value.replace(/^\s+/, '');
        value = value.replace(/\s+$/, '');
        let r;
        let r2;
        let parts = [];
        if ((r = /^javascript{([\d\D]*)}$/.exec(value))) {
            let js = r[1];
            let prefix = "";
            while ((r2 = /storedVars\['(.*?)']/.exec(js))) {
                parts.push(this.string(prefix + js.substring(0, r2.index) + "'"));
                parts.push(this.variableName(r2[1]));
                js = js.substring(r2.index + r2[0].length);
                prefix = "'";
            }
            parts.push(this.string(prefix + js));
            return new CallSelenium("getEval", [this.concatString(parts)]);
        } else if ((r = /\${/.exec(value))) {
            let regexp = /\${(.*?)}/g;
            let lastIndex = 0;
            while (r2 = regexp.exec(value)) {
                let key = this.xlateKeyVariable(r2[1]);
                if (key || (this.declaredVars && this.declaredVars[r2[1]])) {
                    if (r2.index - lastIndex > 0) {
                        parts.push(this.string(value.substring(lastIndex, r2.index)));
                    }
                    parts.push(key ? key : this.variableName(r2[1]));
                    lastIndex = regexp.lastIndex;
                } else if (r2[1] === "nbsp") {
                    if (r2.index - lastIndex > 0) {
                        parts.push(this.string(value.substring(lastIndex, r2.index)));
                    }
                    parts.push(this.nonBreakingSpace());
                    lastIndex = regexp.lastIndex;
                }
            }
            if (lastIndex < value.length) {
                parts.push(this.string(value.substring(lastIndex, value.length)));
            }
            return (type && type.toLowerCase() === 'args') ? this.toArgumentList(parts) : this.concatString(parts);
        } else if (type && type.toLowerCase() === 'number') {
            return value;
        } else {
            return this.string(value);
        }
    };

    /**
     *
     * @param {String} variable
     */
    this.addDeclaredVar = function (variable) {
        if (this.declaredVars === null) {
            this.declaredVars = {};
        }
        this.declaredVars[variable] = true;
    };

    /**
     *
     * @param {*} value
     * @returns {*}
     */
    this.variableName = function (value) {
        return value;
    };

    /**
     *
     * @param {String} value
     * @returns {String}
     */
    this.string = function (value) {
        if (value !== null) {
            //value = value.replace(/^\s+/, '');
            //value = value.replace(/\s+$/, '');
            value = value.replace(/\\/g, '\\\\');
            value = value.replace(/"/g, '\\"');
            value = value.replace(/\r/g, '\\r');
            value = value.replace(/\n/g, '\\n');
            return '"' + value + '"';
        } else {
            return '""';
        }
    };

    /**
     * Join with +
     * @param {Array} array
     * @returns {String}
     */
    this.concatString = function (array) {
        return array.join(" + ");
    };

    /**
     * Join with ,
     * @param {Array} array
     * @returns {String}
     */
    this.toArgumentList = function (array) {
        return array.join(", ");
    };
}

Webdriver.prototype = formatOnly;

module.exports = Webdriver;
