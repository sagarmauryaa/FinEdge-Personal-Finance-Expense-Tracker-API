const budgetStore = require('../models/Budget');
const { generateId, now } = require('../utils/helpers');
const { NotFoundError } = require('../utils/errors');

const upsert = async (userId, data) => {
    const existing = await budgetStore.findWhere(
        (b) => b.userId === userId && b.month === data.month
    );

    if (existing.length > 0) {
        const updated = await budgetStore.update(existing[0].id, {
            monthlyGoal: data.monthlyGoal,
            savingsTarget: data.savingsTarget,
            categoryBudgets: data.categoryBudgets || existing[0].categoryBudgets || {},
        });
        return updated;
    }

    const budget = {
        id: generateId(),
        userId,
        month: data.month,
        monthlyGoal: data.monthlyGoal,
        savingsTarget: data.savingsTarget,
        categoryBudgets: data.categoryBudgets || {},
        createdAt: now(),
        updatedAt: now(),
    };

    return await budgetStore.create(budget);
};

const getAll = async (userId) => {
    return await budgetStore.findWhere((b) => b.userId === userId);
};


const getByMonth = async (userId, month) => {
    const budgets = await budgetStore.findWhere(
        (b) => b.userId === userId && b.month === month
    );
    if (budgets.length === 0) {
        throw new NotFoundError('Budget', month);
    }
    return budgets[0];
};

const remove = async (userId, budgetId) => {
    const budget = await budgetStore.findById(budgetId);
    if (!budget || budget.userId !== userId) {
        throw new NotFoundError('Budget', budgetId);
    }
    return await budgetStore.delete(budgetId);
};

module.exports = { upsert, getAll, getByMonth, delete: remove };
