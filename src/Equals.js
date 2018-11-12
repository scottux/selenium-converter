const NotEquals = require("./NotEquals");

function Equals(e1, e2) {
    this.e1 = e1;
    this.e2 = e2;
}

Equals.prototype.invert = function() {
    return new NotEquals(this.e1, this.e2);
};

module.export = Equals;
