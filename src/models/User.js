const FileStore = require('./FileStore');

const userStore = new FileStore('users');

module.exports = userStore;
