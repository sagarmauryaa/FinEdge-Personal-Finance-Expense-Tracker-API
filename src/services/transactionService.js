const transactionStore = require('../models/Transaction');
const { generateId, now, autoCategorize } = require('../utils/helpers');
const { NotFoundError, ValidationError } = require('../utils/errors');
const cacheService = require('../utils/cache');


const create = async (userId, data) => {
    const category = data.category || autoCategorize(data.description || '');

    const transaction = {
        id: generateId(),
        userId,
        type: data.type,
        category,
        amount: data.amount,
        description: data.description || '',
        date: data.date || now().split('T')[0],
        createdAt: now(),
        updatedAt: now(),
    };

    const result = await transactionStore.create(transaction);

    cacheService.invalidateByPrefix(`summary_${userId}`);
    cacheService.invalidateByPrefix(`analytics_${userId}`);

    return result;
};

const getAll = async (userId, filters = {}) => {
    let transactions = await transactionStore.findWhere((t) => t.userId === userId);

    if (filters.category) {
        transactions = transactions.filter(
            (t) => t.category.toLowerCase() === filters.category.toLowerCase()
        );
    }
    if (filters.type) {
        transactions = transactions.filter(
            (t) => t.type.toLowerCase() === filters.type.toLowerCase()
        );
    }
    if (filters.startDate) {
        transactions = transactions.filter((t) => t.date >= filters.startDate);
    }
    if (filters.endDate) {
        transactions = transactions.filter((t) => t.date <= filters.endDate);
    }

    transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

    return transactions;
};


const getById = async (userId, transactionId) => {
    const transaction = await transactionStore.findById(transactionId);
    if (!transaction || transaction.userId !== userId) {
        throw new NotFoundError('Transaction', transactionId);
    }
    return transaction;
};

const update = async (userId, transactionId, updates) => {
    const transaction = await transactionStore.findById(transactionId);
    if (!transaction || transaction.userId !== userId) {
        throw new NotFoundError('Transaction', transactionId);
    }

    if (updates.description && !updates.category) {
        updates.category = autoCategorize(updates.description);
    }

    const updated = await transactionStore.update(transactionId, updates);

    cacheService.invalidateByPrefix(`summary_${userId}`);
    cacheService.invalidateByPrefix(`analytics_${userId}`);

    return updated;
};

const remove = async (userId, transactionId) => {
    const transaction = await transactionStore.findById(transactionId);
    if (!transaction || transaction.userId !== userId) {
        throw new NotFoundError('Transaction', transactionId);
    }

    const result = await transactionStore.delete(transactionId);

    cacheService.invalidateByPrefix(`summary_${userId}`);
    cacheService.invalidateByPrefix(`analytics_${userId}`);

    return result;
};

module.exports = { create, getAll, getById, update, delete: remove };
