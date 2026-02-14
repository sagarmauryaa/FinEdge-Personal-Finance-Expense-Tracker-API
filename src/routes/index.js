const express = require('express');
const router = express.Router();

const userRoutes = require('./userRoutes');
const transactionRoutes = require('./transactionRoutes');
const budgetRoutes = require('./budgetRoutes');
const summaryRoutes = require('./summaryRoutes');

router.use('/users', userRoutes);
router.use('/transactions', transactionRoutes);
router.use('/budgets', budgetRoutes);
router.use('/summary', summaryRoutes);

module.exports = router;
