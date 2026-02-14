const summaryService = require('../services/summaryService');

/**
 * GET /summary — Get income-expense summary.
 * Query params: month (optional, format: YYYY-MM)
 */
const getSummary = async (req, res, next) => {
    try {
        const summary = await summaryService.getSummary(req.user.id, {
            month: req.query.month,
        });
        const response = {
            success: true,
            data: summary,
        };
        res.status(200).json(response);
    } catch (error) {
        next(error);
    }
}

/**
 * GET /summary/trends — Get monthly trends.
 */
const getMonthlyTrends = async (req, res, next) => {
    try {
        const trends = await summaryService.getMonthlyTrends(req.user.id);
        const response = {
            success: true,
            data: trends,
        };
        res.status(200).json(response);
    } catch (error) {
        next(error);
    }
}

/**
 * GET /summary/tips — Get AI-based saving tips.
 */
const getSavingTips = async (req, res, next) => {
    try {
        const tips = await summaryService.getSavingTips(req.user.id);
        const response = {
            success: true,
            data: tips,
        };
        res.status(200).json(response);
    } catch (error) {
        next(error);
    }
}

/**
 * GET /summary/budget/:month — Get budget vs actual comparison.
 */
const getBudgetComparison = async (req, res, next) => {
    try {
        const comparison = await summaryService.getBudgetComparison(
            req.user.id,
            req.params.month
        );
        const response = {
            success: true,
            data: comparison,
        };
        res.status(200).json(response);
    } catch (error) {
        next(error);
    }
}

module.exports = { getSummary, getMonthlyTrends, getSavingTips, getBudgetComparison };