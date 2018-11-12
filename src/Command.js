const CommandDefinition = require("./CommandDefinition");
const DOMParser = require('xmldom').DOMParser;
const fs = require('fs');
// load API document
let parser = new DOMParser();
let document = parser.parseFromString(fs.readFileSync("./lib/iedoc-core.xml", {encoding:"utf-8"}), "text/xml");

/**
 *
 * @param command
 * @param target
 * @param value
 * @constructor
 */
function Command(command, target, value) {
    this.command = command !== null ? command : '';
    if (target !== null && target instanceof Array) {
        if (target[0]) {
            this.target = target[0][0];
            this.targetCandidates = target;
        } else {
            this.target = "LOCATOR_DETECTION_FAILED";
        }
    } else {
        this.target = target !== null ? target : '';
    }
    this.value = value !== null ? value : '';
}

Command.apiDocuments = new Array(document);


Command.prototype.createCopy = function() {
    let copy = new Command();

    for (let prop in this) {
        copy[prop] = this[prop];
    }

    return copy;
};

Command.prototype.getRealValue = function() {
    return this.value || this.target;
};

Command.prototype.getRealTarget = function() {
    return this.value ? this.target : null;
};

Command.innerHTML = function(element) {
    let html = "";
    let nodes = element.childNodes;

    for (let i = 0; i < nodes.length; i++) {
        let node = nodes.item(i);
        switch (node.nodeType) {
            case 1: // ELEMENT_NODE
                html += "<" + node.nodeName + ">";
                html += this.innerHTML(node);
                html += "</" + node.nodeName + ">";
                break;
            case 3: // TEXT_NODE
                html += node.data;
                break;
        }
    }
    return html;
};

Command.loadAPI = function() {
    if (!this.functions) {
        let document;
        let documents = this.apiDocuments;
        let functions = {};
        // document.length will be 1 by default, but will grow with plugins
        for (let d = 0; d < documents.length; d++) {
            // set the current document. again, by default this is the iedoc-core.xml
            document = documents[d];

            // <function name="someName">
            //   <param name="targetName">description</param>
            //   <param name="valueName">description</param> -- optional
            //   <return type="string">description</return> -- optional
            //   <comment>description for ide here</comment>
            // </function>
            let functionElements = document.documentElement.getElementsByTagName("function");
            for (let i = 0; i < functionElements.length; i++) {
                let element = functionElements.item(i);
                let def = new CommandDefinition(String(element.attributes.getNamedItem('name').value));

                let returns = element.getElementsByTagName("return");
                if (returns.length) {
                    let returnType = returns.item(0).attributes.getNamedItem("type").value+"";
                    returnType = returnType.replace(/string/, "String");
                    returnType = returnType.replace(/number/, "Number");
                    def.returnType = returnType;
                    def.returnDescription = this.innerHTML(returns.item(0));
                }

                let comments = element.getElementsByTagName("comment");
                if (comments.length) {
                    def.comment = this.innerHTML(comments.item(0));
                }

                let alternatives = element.getElementsByTagName("alternatives");
                if (alternatives.length) {
                    def.alternatives = this.innerHTML(alternatives.item(0));
                }
                let deprecated = element.getElementsByTagName("deprecated");
                if (deprecated.length) {
                    def.deprecated = this.innerHTML(deprecated.item(0));
                    if (!def.deprecated.length && def.alternatives) {
                        def.deprecated = "Use the ${alternatives} command instead.";
                    }
                }

                let params = element.getElementsByTagName("param");
                for (let j = 0; j < params.length; j++) {
                    let paramElement = params.item(j);
                    let param = {};
                    param.name = String(paramElement.attributes.getNamedItem('name').value);
                    param.description = this.innerHTML(paramElement);
                    def.params.push(param);
                }

                functions[def.name] = def;

                // generate negative accessors
                if (def.name.match(/^(is|get)/)) {
                    def.isAccessor = true;
                    functions["!" + def.name] = def.negativeAccessor();
                }
                if (def.name.match(/^assert/)) { // only assertSelected should match
                    let verifyDef = new CommandDefinition(def.name);
                    verifyDef.params = def.params;
                    functions["verify" + def.name.substring(6)] = verifyDef;
                }
            }
        }
        functions['assertFailureOnNext'] = new CommandDefinition('assertFailureOnNext');
        functions['verifyFailureOnNext'] = new CommandDefinition('verifyFailureOnNext');
        functions['assertErrorOnNext'] = new CommandDefinition('assertErrorOnNext');
        functions['verifyErrorOnNext'] = new CommandDefinition('verifyErrorOnNext');
        this.functions = functions;
    }
    return this.functions;
};

Command.prototype.getDefinition = function() {
    if (this.command === null) {
        return null;
    }
    let commandName = this.command.replace(/AndWait$/, '');
    let api = Command.loadAPI();
    let r = /^(assert|verify|store|waitFor)(.*)$/.exec(commandName);
    if (r) {
        let suffix = r[2];
        let prefix = "";
        if ((r = /^(.*)NotPresent$/.exec(suffix)) !== null) {
            suffix = r[1] + "Present";
            prefix = "!";
        } else if ((r = /^Not(.*)$/.exec(suffix)) !== null) {
            suffix = r[1];
            prefix = "!";
        }
        let booleanAccessor = api[prefix + "is" + suffix];
        if (booleanAccessor) {
            return booleanAccessor;
        }
        let accessor = api[prefix + "get" + suffix];
        if (accessor) {
            return accessor;
        }
    }
    return api[commandName];
};

Command.prototype.getParameterAt = function (index) {
    switch (index) {
        case 0:
            return this.target;
        case 1:
            return this.value;
        default:
            return null;
    }
};

Command.prototype.getAPI = function () {
    return window.editor.seleniumAPI;
};

Command.prototype.type = 'command';

/**
 * The string representation of a command is the command, target, and value
 * delimited by padded pipes.
 */
Command.prototype.toString = function () {
    let s = this.command;

    if (this.target) {
        s += ' | ' + this.target;
        if (this.value) {
            s += ' | ' + this.value;
        }
    }
    return s;
};

Command.prototype.isRollup = function () {
    return /^rollup(?:AndWait)?$/.test(this.command);
};

module.exports = Command;
