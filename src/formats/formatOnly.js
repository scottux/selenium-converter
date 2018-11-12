const Command = require("../Command");

/**
 * Base object for formatters.
 * @type {{format: module.exports.format, formatCommands: module.exports.formatCommands, filterForRemoteControl: module.exports.filterForRemoteControl, addIndent: module.exports.addIndent, indent: module.exports.indent, updateIndent: module.exports.updateIndent}}
 */
module.exports = {
    /**
     *
     * @param {TestCase} testCase
     * @param {String} name
     * @returns {String}
     */
    format: function (testCase, name) {
        //console.log("formatting testCase: " + name);
        let result = '';
        let header = "";
        let footer = "";

        this.commandCharIndex = 0;
        if (this.formatHeader) {
            header = this.formatHeader(testCase);
        }
        result += header;
        this.commandCharIndex = header.length;
        testCase.formatLocal(this.name).header = header;
        result += this.formatCommands(testCase.commands);
        if (this.formatFooter) {
            footer = this.formatFooter(testCase);
        }
        result += footer;
        testCase.formatLocal(this.name).footer = footer;

        return result;
    },

    /**
     *
     * @param {Command[]} commands
     * @returns {String}
     */
    formatCommands: function (commands) {
        commands = this.filterForRemoteControl(commands);
        if (this.lastIndent === null) {
            this.lastIndent = '';
        }
        let result = '';

        commands.forEach((command) => {
            let line = null;

            if (command.type === 'line') {
                line = command.line;
            } else if (command.type === 'command') {
                line = this.formatCommand(command);
                if (line !== null) {
                    line = this.addIndent(line);
                }
                command.line = line;
            } else if (command.type === 'comment' && this.formatComment) {
                line = this.formatComment(command);
                if (line !== null) {
                    line = this.addIndent(line);
                }
                command.line = line;
            }
            command.charIndex = this.commandCharIndex;
            if (line !== null) {
                this.updateIndent(line);
                line = line + "\n";
                result += line;
                this.commandCharIndex += line.length;
            }
        });

        return result;
    },

    /**
     *
     * @param {Command[]} originalCommands
     * @returns {Command[]}
     */
    filterForRemoteControl: function (originalCommands) {
        if (this.remoteControl) {
            let commands = [];

            originalCommands.forEach(c => {
                if (c.type === 'command' && c.command.match(/AndWait$/)) {
                    let c1 = c.createCopy();
                    c1.command = c.command.replace(/AndWait$/, '');
                    commands.push(c1);
                    commands.push(new Command("waitForPageToLoad", this.options['global.timeout'] || "30000"));
                } else {
                    commands.push(c);
                }
            });
            if (this.postFilter) {
                // formats can inject command list post-processing here
                commands = this.postFilter(commands);
            }
            return commands;
        } else {
            return originalCommands;
        }
    },

    /**
     *
     * @param {String} lines
     * @returns {String}
     */
    addIndent: function (lines) {
        let self = this;

        return lines.replace(/.+/mg, (str) => {
            return self.indent() + str;
        });
    },

    /**
     *
     * @returns {String}
     */
    indent: function () {
        return this.lastIndent || '';
    },

    /**
     *
     * @param {String} line
     */
    updateIndent: function (line) {
        let r = /^(\s*)/.exec(line);

        if (r) {
            this.lastIndent = r[1];
        }
    }
};
