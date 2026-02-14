const express = require('express');
const router = express.Router();
const { getSummary, getMonthlyTrends, getSavingTips, getBudgetComparison } = require('../controllers/summaryController');
const authenticate = require('../middleware/auth');

router.use(authenticate);

router.get('/', getSummary);
router.get('/trends', getMonthlyTrends);
router.get('/tips', getSavingTips);
router.get('/budget/:month', getBudgetComparison);

module.exports = router;
