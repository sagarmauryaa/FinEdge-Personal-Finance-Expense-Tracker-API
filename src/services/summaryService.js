const transactionService = require('./transactionService');
const budgetService = require('./budgetService');
const cacheService = require('../utils/cache');
const { generateSavingTips } = require('../utils/helpers');

const getSummary = async (userId, filters = {}) => {
    const cacheKey = `summary_${userId}_${filters.month || 'all'}`;
    const cached = cacheService.get(cacheKey);
    if (cached) return { ...cached, cached: true };

    const transactions = await transactionService.getAll(userId, {
        startDate: filters.month ? `${filters.month}-01` : undefined,
        endDate: filters.month ? `${filters.month}-31` : undefined,
    });

    const income = transactions
        .filter((t) => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

    const expense = transactions
        .filter((t) => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

    const balance = income - expense;

    const categoryBreakdown = {};
    transactions.forEach((t) => {
        const cat = t.category || 'other';
        if (!categoryBreakdown[cat]) {
            categoryBreakdown[cat] = { income: 0, expense: 0, count: 0 };
        }
        categoryBreakdown[cat][t.type] += t.amount;
        categoryBreakdown[cat].count += 1;
    });

    const summary = {
        totalIncome: parseFloat(income.toFixed(2)),
        totalExpense: parseFloat(expense.toFixed(2)),
        balance: parseFloat(balance.toFixed(2)),
        transactionCount: transactions.length,
        categoryBreakdown,
        period: filters.month || 'all-time',
        cached: false,
    };

    cacheService.set(cacheKey, summary);
    return summary;
};

const getMonthlyTrends = async (userId) => {
    const cacheKey = `analytics_${userId}_trends`;
    const cached = cacheService.get(cacheKey);
    if (cached) return cached;
    const transactions = await transactionService.getAll(userId);

    const monthlyData = {};
    transactions.forEach((t) => {
        const month = t.date.substring(0, 7);
        if (!monthlyData[month]) {
            monthlyData[month] = { month, income: 0, expense: 0, count: 0 };
        }
        monthlyData[month][t.type] += t.amount;
        monthlyData[month].count += 1;
    });

    const trends = Object.values(monthlyData)
        .map((m) => ({
            ...m,
            balance: parseFloat((m.income - m.expense).toFixed(2)),
            income: parseFloat(m.income.toFixed(2)),
            expense: parseFloat(m.expense.toFixed(2)),
        }))
        .sort((a, b) => a.month.localeCompare(b.month));

    cacheService.set(cacheKey, trends);
    return trends;
};

const getSavingTips = async (userId) => {
    const transactions = await transactionService.getAll(userId);
    const tips = generateSavingTips(transactions);
    const summary = await getSummary(userId);

    return {
        tips,
        summary: {
            totalIncome: summary.totalIncome,
            totalExpense: summary.totalExpense,
            balance: summary.balance,
        },
    };
};

const getBudgetComparison = async (userId, month) => {
    const [summary, budget] = await Promise.all([
        getSummary(userId, { month }),
        budgetService.getByMonth(userId, month).catch(() => null),
    ]);

    const result = {
        month,
        actual: {
            income: summary.totalIncome,
            expense: summary.totalExpense,
            balance: summary.balance,
        },
        budget: budget
            ? {
                monthlyGoal: budget.monthlyGoal,
                savingsTarget: budget.savingsTarget,
                categoryBudgets: budget.categoryBudgets,
            }
            : null,
    };

    if (budget) {
        result.analysis = {
            withinBudget: summary.totalExpense <= budget.monthlyGoal,
            savingsAchieved: summary.balance >= budget.savingsTarget,
            budgetUtilization: budget.monthlyGoal > 0
                ? parseFloat(((summary.totalExpense / budget.monthlyGoal) * 100).toFixed(1))
                : 0,
            savingsProgress: budget.savingsTarget > 0
                ? parseFloat(((summary.balance / budget.savingsTarget) * 100).toFixed(1))
                : 0,
        };
    }

    return result;
};

module.exports = { getSummary, getMonthlyTrends, getSavingTips, getBudgetComparison };
