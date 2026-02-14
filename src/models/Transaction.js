const FileStore = require('./FileStore');

const transactionStore = new FileStore('transactions');

module.exports = transactionStore;
