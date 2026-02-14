const { ValidationError } = require('../utils/errors');

/**
 * Transaction input validation middleware.
 * Validates required fields and data types for transaction creation and update.
 */
const validateTransaction = (req, res, next) => {
    const { type, amount, description, date, category } = req.body;
    const errors = [];

    // For POST (create) — type and amount are required
    if (req.method === 'POST') {
        if (!type) {
            errors.push('Field "type" is required');
        } else if (!['income', 'expense'].includes(type)) {
            errors.push('Field "type" must be either "income" or "expense"');
        }

        if (amount === undefined || amount === null) {
            errors.push('Field "amount" is required');
        } else if (typeof amount !== 'number' || amount <= 0) {
            errors.push('Field "amount" must be a positive number');
        }
    }

    // For PATCH (update) — validate only provided fields
    if (req.method === 'PATCH') {
        if (type !== undefined && !['income', 'expense'].includes(type)) {
            errors.push('Field "type" must be either "income" or "expense"');
        }

        if (amount !== undefined && (typeof amount !== 'number' || amount <= 0)) {
            errors.push('Field "amount" must be a positive number');
        }
    }

    // Optional field validations
    if (description !== undefined && typeof description !== 'string') {
        errors.push('Field "description" must be a string');
    }

    if (date !== undefined) {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(date)) {
            errors.push('Field "date" must be in YYYY-MM-DD format');
        } else if (isNaN(new Date(date).getTime())) {
            errors.push('Field "date" is not a valid date');
        }
    }

    if (category !== undefined && typeof category !== 'string') {
        errors.push('Field "category" must be a string');
    }

    if (errors.length > 0) {
        throw new ValidationError('Transaction validation failed', errors);
    }

    next();
};

/**
 * User registration validation middleware.
 */
const validateUser = (req, res, next) => {
    const { name, email, password } = req.body;
    const errors = [];

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
        errors.push('Field "name" is required and must be at least 2 characters');
    }

    if (!email || typeof email !== 'string') {
        errors.push('Field "email" is required');
    } else {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            errors.push('Field "email" must be a valid email address');
        }
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
        errors.push('Field "password" is required and must be at least 6 characters');
    }

    if (errors.length > 0) {
        throw new ValidationError('User validation failed', errors);
    }

    next();
};

/**
 * Budget validation middleware.
 */
const validateBudget = (req, res, next) => {
    const { month, monthlyGoal, savingsTarget } = req.body;
    const errors = [];

    if (!month || typeof month !== 'string') {
        errors.push('Field "month" is required (format: YYYY-MM)');
    } else {
        const monthRegex = /^\d{4}-\d{2}$/;
        if (!monthRegex.test(month)) {
            errors.push('Field "month" must be in YYYY-MM format');
        }
    }

    if (monthlyGoal === undefined || typeof monthlyGoal !== 'number' || monthlyGoal < 0) {
        errors.push('Field "monthlyGoal" is required and must be a non-negative number');
    }

    if (savingsTarget === undefined || typeof savingsTarget !== 'number' || savingsTarget < 0) {
        errors.push('Field "savingsTarget" is required and must be a non-negative number');
    }

    if (errors.length > 0) {
        throw new ValidationError('Budget validation failed', errors);
    }

    next();
};

module.exports = { validateTransaction, validateUser, validateBudget };
