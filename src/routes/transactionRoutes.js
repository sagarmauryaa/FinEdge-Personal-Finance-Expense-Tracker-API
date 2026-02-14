const express = require('express');
const router = express.Router();
const { createTransaction, getTransactionAll, getTransactionById, updateTransaction, deleteTransaction } = require('../controllers/transactionController');
const { validateTransaction } = require('../middleware/validators');
const authenticate = require('../middleware/auth');

router.use(authenticate);

router.post('/', validateTransaction, createTransaction);
router.get('/', getTransactionAll);
router.get('/:id', getTransactionById);
router.patch('/:id', validateTransaction, updateTransaction);
router.delete('/:id', deleteTransaction);

module.exports = router;
