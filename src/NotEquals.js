const Equals = require("./Equals");

function NotEquals(e1, e2) {
    this.e1 = e1;
    this.e2 = e2;
    this.negative = true;
}

NotEquals.prototype.invert = function() {
    return new Equals(this.e1, this.e2);
};

module.exports = NotEquals;
