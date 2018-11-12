const SeleniumWebDriverAdaptor = require("./SeleniumWebDriverAdaptor");

function CallSelenium(message, args, rawArgs) {
    this.message = message;
    this.args = args || [];
    this.rawArgs = rawArgs || [];
}

CallSelenium.prototype.invert = function() {
    let call = new CallSelenium(this.message);

    call.args = this.args;
    call.rawArgs = this.rawArgs;
    call.negative = !this.negative;

    return call;
};

CallSelenium.prototype.toString = function() {
    //console.log('Processing ' + this.message);
    if (this.message === 'waitForPageToLoad') {
        return '';
    }
    let result = '';
    let adaptor = new SeleniumWebDriverAdaptor(this.rawArgs);
    if (adaptor[this.message]) {
        let codeBlock = adaptor[this.message].call(adaptor);
        if (adaptor.negative) {
            this.negative = !this.negative;
        }
        if (this.negative) {
            result += notOperator();
        }
        result += codeBlock;
    } else {
        //unsupported
        throw 'ERROR: Unsupported command [' + this.message + ' | ' + (this.rawArgs.length > 0 && this.rawArgs[0] ? this.rawArgs[0] : '') + ' | ' + (this.rawArgs.length > 1 && this.rawArgs[1] ? this.rawArgs[1] : '') + ']';
    }
    return result;
};

module.exports = CallSelenium;

function notOperator() {
    return "!";
}