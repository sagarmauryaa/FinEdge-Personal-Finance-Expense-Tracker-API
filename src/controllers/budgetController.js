const budgetService = require('../services/budgetService');

/**
 * POST /budgets — Create or update a budget.
 */
const upsertBudget = async (req, res, next) => {
    try {
        const budget = await budgetService.upsert(req.user.id, req.body);
        const response = {
            success: true,
            message: 'Budget saved successfully',
            data: budget,
        };
        res.status(201).json(response);
    } catch (error) {
        next(error);
    }
}

/**
 * GET /budgets — Get all budgets.
 */
const getBudgetsAll = async (req, res, next) => {
    try {
        const budgets = await budgetService.getAll(req.user.id);
        const response = {
            success: true,
            count: budgets.length,
            data: budgets,
        };
        res.status(200).json(response);
    } catch (error) {
        next(error);
    }
}

/**
 * GET /budgets/:month — Get budget for a specific month.
 */
const getBudgetsByMonth = async (req, res, next) => {
    try {
        const budget = await budgetService.getByMonth(req.user.id, req.params.month);
        const response = {
            success: true,
            data: budget,
        };
        res.status(200).json(response);
    } catch (error) {
        next(error);
    }
}

/**
 * DELETE /budgets/:id — Delete a budget.
 */
const deleteBudget = async (req, res, next) => {
    try {
        await budgetService.delete(req.user.id, req.params.id);
        const response = {
            success: true,
            message: 'Budget deleted successfully',
        };
        res.status(200).json(response);
    } catch (error) {
        next(error);
    }
}

module.exports = { upsertBudget, getBudgetsAll, getBudgetsByMonth, deleteBudget };