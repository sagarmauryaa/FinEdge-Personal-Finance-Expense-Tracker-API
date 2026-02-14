const express = require('express');
const router = express.Router();
const { upsertBudget, getBudgetsAll, getBudgetsByMonth, deleteBudget } = require('../controllers/budgetController');
const { validateBudget } = require('../middleware/validators');
const authenticate = require('../middleware/auth');

router.use(authenticate);

router.post('/', validateBudget, upsertBudget);
router.get('/', getBudgetsAll);
router.get('/:month', getBudgetsByMonth);
router.delete('/:id', deleteBudget);

module.exports = router;
