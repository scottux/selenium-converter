/**
 *
 * @param {String} name
 * @constructor
 */
function CommandDefinition(name) {
    this.name = name;
    this.params = [];
}

/**
 *
 * @param {String} command
 * @returns {String}
 */
CommandDefinition.prototype.getReferenceFor = function (command) {
    let paramNames = [];
    for (let i = 0; i < this.params.length; i++) {
        paramNames.push(this.params[i].name);
    }
    let originalParamNames = paramNames.join(", ");
    if (this.name.match(/^is|get/)) { // accessor
        if (command.command) {
            if (command.command.match(/^store/)) {
                paramNames.push("variableName");
            } else if (command.command.match(/^(assert|verify|waitFor)/)) {
                if (this.name.match(/^get/)) {
                    paramNames.push("pattern");
                }
            }
        }
    }
    let note = "";
    if (command.command && command.command !== this.name) {
        note = "<dt>Generated from <strong>" + this.name + "(" +
            originalParamNames + ")</strong></dt>";
    }
    let params = "";
    if (this.params.length) {
        params += "<div>Arguments:</div><ul>";
        for (let i = 0; i < this.params.length; i++) {
            params += "<li>" + this.params[i].name + " - " + this.params[i].description + "</li>";
        }
        params += "</ul>";
    }
    let returns = "";
    if (this.returnDescription) {
        returns += "<dl><dt>Returns:</dt><dd>" + this.returnDescription + "</dd></dl>";
    }
    let deprecated = "";
    if (this.deprecated) {
        deprecated += '<div class="deprecated">This command is deprecated. ' + this.deprecated + "</div>";
        if (this.alternatives) {
            deprecated = deprecated.replace("${alternatives}", "<strong>" + CommandDefinition.getAlternative(command.command, this.alternatives) + "</strong>");
        }
    }

    return "<dl><dt><strong>" + (command.command || this.name) + "(" +
        paramNames.join(", ") + ")</strong></dt>" +
        deprecated + note +
        '<dd style="margin:5px;">' +
        params + returns +
        this.comment + "</dd></dl>";
};

/**
 *
 * @returns {CommandDefinition}
 */
CommandDefinition.prototype.negativeAccessor = function () {
    let def = new CommandDefinition(this.name);

    for (let name in this) {
        def[name] = this[name];
    }
    def.isAccessor = true;
    def.negative = true;

    return def;
};

/**
 * Figure out the correct alternative command to use based on the current command flavour
 * @param {String} command - e.g. "waitForTextNotPresent"
 * @param {String} alternative - e.g. "Text
 * @returns {String}
 */
CommandDefinition.getAlternative = function (command, alternative) {
    if (command === null) return '';
    let alt = alternative;
    let r = /^(.*?)(AndWait)?$/.exec(command);
    let commandName = r[1];
    let prefix = '';
    let suffix = r[2] ? r[2] : '';
    let negate = false;

    r = /^(assert|verify|store|waitFor)(.*)$/.exec(commandName);
    if (r) {
        prefix = r[1];
        let commandName = r[2];

        if ((r = /^(.*)NotPresent$/.exec(commandName)) !== null) {
            negate = true;
        } else if ((r = /^Not(.*)$/.exec(commandName)) !== null) {
            negate = true;
        }
        if (negate) {
            if (alt.match(/Present$/)) {
                alt = alt.replace(/Present$/, 'NotPresent');
            } else {
                prefix += 'Not';
            }
        }
    }

    return prefix + (prefix.length > 0 ? alt.charAt(0).toUpperCase() : alt.charAt(0).toLowerCase()) + alt.substr(1) + suffix;
};

module.exports = CommandDefinition;
