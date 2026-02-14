const { v4: uuidv4 } = require('uuid');

/**
 * Generate a unique ID.
 */
const generateId = () => uuidv4();

/**
 * Get the current ISO timestamp.
 */
const now = () => new Date().toISOString();

/**
 * Simple keyword-based auto-categorization for expenses.
 * Maps common keywords to expense categories.
 */
const CATEGORY_KEYWORDS = {
    food: ['restaurant', 'food', 'pizza', 'burger', 'coffee', 'lunch', 'dinner', 'breakfast', 'cafe', 'snack', 'meal', 'grocery', 'groceries', 'supermarket'],
    transport: ['uber', 'lyft', 'taxi', 'bus', 'train', 'metro', 'fuel', 'gas', 'petrol', 'diesel', 'parking', 'toll', 'flight', 'airline'],
    shopping: ['amazon', 'flipkart', 'mall', 'clothes', 'shoes', 'electronics', 'gadget', 'fashion', 'store', 'shop'],
    entertainment: ['movie', 'netflix', 'spotify', 'concert', 'game', 'theatre', 'park', 'club', 'party', 'subscription'],
    health: ['hospital', 'doctor', 'medicine', 'pharmacy', 'gym', 'fitness', 'yoga', 'medical', 'dental', 'insurance'],
    utilities: ['electricity', 'water', 'internet', 'phone', 'mobile', 'recharge', 'bill', 'rent', 'maintenance'],
    education: ['course', 'book', 'tuition', 'school', 'college', 'university', 'class', 'training', 'certification'],
    salary: ['salary', 'paycheck', 'wage', 'bonus', 'stipend', 'freelance', 'payment', 'commission'],
    investment: ['stock', 'mutual fund', 'sip', 'dividend', 'interest', 'investment', 'crypto', 'returns'],
};

/**
 * Auto-categorize a transaction based on keyword matching in its description.
 */
const autoCategorize = (description) => {
    if (!description) return 'other';
    const lower = description.toLowerCase();

    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
        for (const keyword of keywords) {
            if (lower.includes(keyword)) {
                return category;
            }
        }
    }
    return 'other';
};

/**
 * Generate saving tips based on spending patterns.
 */
const generateSavingTips = (transactions) => {
    const tips = [];
    const expenses = transactions.filter((t) => t.type === 'expense');
    const incomes = transactions.filter((t) => t.type === 'income');

    const totalExpense = expenses.reduce((sum, t) => sum + t.amount, 0);
    const totalIncome = incomes.reduce((sum, t) => sum + t.amount, 0);

    if (totalIncome === 0 && totalExpense === 0) {
        return ['Start tracking your income and expenses to get personalized saving tips!'];
    }

    // Savings rate tip
    if (totalIncome > 0) {
        const savingsRate = ((totalIncome - totalExpense) / totalIncome) * 100;
        if (savingsRate < 20) {
            tips.push(`⚠️ Your savings rate is ${savingsRate.toFixed(1)}%. Aim for at least 20% to build a healthy financial cushion.`);
        } else {
            tips.push(`✅ Great job! Your savings rate is ${savingsRate.toFixed(1)}%. Keep it up!`);
        }
    }

    // Category-wise analysis
    const categoryTotals = {};
    expenses.forEach((t) => {
        const cat = t.category || 'other';
        categoryTotals[cat] = (categoryTotals[cat] || 0) + t.amount;
    });

    const sortedCategories = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);

    if (sortedCategories.length > 0) {
        const [topCategory, topAmount] = sortedCategories[0];
        const percentage = totalExpense > 0 ? ((topAmount / totalExpense) * 100).toFixed(1) : 0;
        tips.push(`💡 Your highest spending category is "${topCategory}" at ₹${topAmount.toFixed(2)} (${percentage}% of total expenses). Consider setting a budget limit for this category.`);
    }

    if (categoryTotals.food && totalExpense > 0 && (categoryTotals.food / totalExpense) > 0.3) {
        tips.push('🍕 Food expenses are over 30% of your total spending. Try meal prepping to cut costs!');
    }

    if (categoryTotals.entertainment && totalExpense > 0 && (categoryTotals.entertainment / totalExpense) > 0.15) {
        tips.push('🎬 Entertainment costs are above 15%. Look for free or low-cost alternatives for fun activities.');
    }

    if (categoryTotals.shopping && totalExpense > 0 && (categoryTotals.shopping / totalExpense) > 0.25) {
        tips.push('🛍️ Shopping makes up over 25% of your expenses. Try the 24-hour rule — wait a day before making non-essential purchases.');
    }

    if (tips.length === 0) {
        tips.push('📊 Your spending looks balanced. Keep tracking to maintain good financial health!');
    }

    return tips;
};

module.exports = {
    generateId,
    now,
    autoCategorize,
    generateSavingTips,
    CATEGORY_KEYWORDS,
};
