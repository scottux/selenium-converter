const Command = require("./Command");
const Comment = require("./Comment");

/* SeleneseMapper changes one Selenese command to another that is more suitable for WebDriver export
 */
function SeleneseMapper() {
}

SeleneseMapper.remap = function (cmd) {
    /*
     for (var mapper in SeleneseMapper) {
     if (SeleneseMapper.hasOwnProperty(mapper) && typeof SeleneseMapper.mapper.isDefined === 'function'  && typeof SeleneseMapper.mapper.convert === 'function') {
     if (SeleneseMapper.mapper.isDefined(cmd)) {
     return SeleneseMapper.mapper.convert(cmd);
     }
     }
     }
     */
    // NOTE The above code is useful if there are more than one mappers, since there is just one, it is more efficient to call it directly
    if (SeleneseMapper.IsTextPresent.isDefined(cmd)) {
        return SeleneseMapper.IsTextPresent.convert(cmd);
    }
    return null;
};

SeleneseMapper.IsTextPresent = {
    isTextPresentRegex: /^(assert|verify|waitFor)Text(Not)?Present$/,
    isPatternRegex: /^(regexp|regexpi|regex):/,
    exactRegex: /^exact:/,

    isDefined:function (cmd) {
        return this.isTextPresentRegex.test(cmd.command);
    },

    convert:function (cmd) {
        if (this.isTextPresentRegex.test(cmd.command)) {
            let pattern = cmd.target;
            if (!this.isPatternRegex.test(pattern)) {
                if (this.exactRegex.test(pattern)) {
                    //TODO how to escape wildcards in an glob pattern?
                    pattern = pattern.replace(this.exactRegex, 'glob:*') + '*';
                } else {
                    //glob
                    pattern = pattern.replace(/^(glob:)?\*?/, 'glob:*');
                    if (!/\*$/.test(pattern)) {
                        pattern += '*';
                    }
                }
            }
            let remappedCmd = new Command(cmd.command.replace(this.isTextPresentRegex, "$1$2Text"), 'css=BODY', pattern);

            remappedCmd.remapped = cmd;
            return [new Comment('Warning: ' + cmd.command + ' may require manual changes'), remappedCmd];
        }
    }
};

module.exports = SeleneseMapper;
