function Comment(comment) {
    this.comment = comment !== null ? comment : '';
}

Comment.prototype.type = 'comment';

Comment.prototype.createCopy = function () {
    let copy = new Comment();

    for (let prop in this) {
        copy[prop] = this[prop];
    }

    return copy;
};

module.exports = Comment;
