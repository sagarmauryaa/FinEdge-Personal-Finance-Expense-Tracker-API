const FileStore = require('./FileStore');

const sessionStore = new FileStore('sessions');

module.exports = sessionStore;
