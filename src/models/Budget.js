const FileStore = require('./FileStore');

const budgetStore = new FileStore('budgets');

module.exports = budgetStore;
