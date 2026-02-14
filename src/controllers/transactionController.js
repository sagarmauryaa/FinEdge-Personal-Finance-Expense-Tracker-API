const transactionService = require('../services/transactionService');

/**
 * POST /transactions — Create a new transaction.
 */
const createTransaction = async (req, res, next) => {
    try {
        const transaction = await transactionService.create(req.user.id, req.body);
        const response = {
            success: true,
            message: 'Transaction created successfully',
            data: transaction,
        };
        res.status(201).json(response);
    } catch (error) {
        next(error);
    }
}

/**
 * GET /transactions — Get all transactions with optional filters.
 * Query params: category, type, startDate, endDate
 */
const getTransactionAll = async (req, res, next) => {
    try {
        const filters = {
            category: req.query.category,
            type: req.query.type,
            startDate: req.query.startDate,
            endDate: req.query.endDate,
        };

        const transactions = await transactionService.getAll(req.user.id, filters);
        const response = {
            success: true,
            count: transactions.length,
            data: transactions,
        };
        res.status(200).json(response);
    } catch (error) {
        next(error);
    }
}

/**
 * GET /transactions/:id — Get a single transaction.
 */
const getTransactionById = async (req, res, next) => {
    try {
        const transaction = await transactionService.getById(req.user.id, req.params.id);
        const response = {
            success: true,
            data: transaction,
        };
        res.status(200).json(response);
    } catch (error) {
        next(error);
    }
}

/**
 * PATCH /transactions/:id — Update a transaction.
 */
const updateTransaction = async (req, res, next) => {
    try {
        const transaction = await transactionService.update(req.user.id, req.params.id, req.body);
        const response = {
            success: true,
            message: 'Transaction updated successfully',
            data: transaction,
        };
        res.status(200).json(response);
    } catch (error) {
        next(error);
    }
}

/**
 * DELETE /transactions/:id — Delete a transaction.
 */
const deleteTransaction = async (req, res, next) => {
    try {
        await transactionService.delete(req.user.id, req.params.id);
        const response = {
            success: true,
            message: 'Transaction deleted successfully',
        };
        res.status(200).json(response);
    } catch (error) {
        next(error);
    }
}

module.exports = { createTransaction, getTransactionAll, getTransactionById, updateTransaction, deleteTransaction };