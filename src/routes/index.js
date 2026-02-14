const express = require('express');
const router = express.Router();

const userRoutes = require('./userRoutes');
const transactionRoutes = require('./transactionRoutes');
const budgetRoutes = require('./budgetRoutes');
const summaryRoutes = require('./summaryRoutes');

// Health check route
router.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'FinEdge API is running',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
    });
});

// Mount routes
router.use('/users', userRoutes);
router.use('/transactions', transactionRoutes);
router.use('/budgets', budgetRoutes);
router.use('/summary', summaryRoutes);

module.exports = router;
