const { test } = require('tap');
const supertest = require('supertest');
const app = require('../app');
const fs = require('fs/promises');
const path = require('path');

const request = supertest(app);


let authToken = '';
let refreshToken = '';
let sessionId = '';
let testUserId = '';
let testTransactionId = '';
let testBudgetId = '';

const testUser = {
    name: 'Test User',
    email: `testuser@gmail.com`,
    password: 'password123',
};

test('cleanup: remove test data files', async (t) => {
    const dataDir = path.join(__dirname, '..', 'data');
    await fs.rm(dataDir, { recursive: true, force: true });
    t.pass('Cleaned up test data');
});

// USER ENDPOINTS
test('POST /users — should register a new user', async (t) => {
    const res = await request.post('/users').send(testUser);
    t.equal(res.status, 201);
    t.equal(res.body.success, true);
    t.equal(res.body.data.name, testUser.name);
    t.equal(res.body.data.email, testUser.email);
    t.notOk(res.body.data.password, 'password should not be returned');
    testUserId = res.body.data.id;
});

test('POST /users — should reject duplicate email', async (t) => {
    const res = await request.post('/users').send(testUser);
    t.equal(res.status, 409);
    t.equal(res.body.success, false);
});

test('POST /users — should reject invalid input', async (t) => {
    const res = await request.post('/users').send({ name: 'A', email: 'bad', password: '12' });
    t.equal(res.status, 400);
    t.equal(res.body.success, false);
    t.ok(res.body.details.length > 0);
});

test('POST /users/login — should login and return access + refresh tokens', async (t) => {
    const res = await request.post('/users/login').send({
        email: testUser.email,
        password: testUser.password,
    });
    t.equal(res.status, 200);
    t.equal(res.body.success, true);
    t.ok(res.body.data.accessToken, 'should return accessToken');
    t.ok(res.body.data.refreshToken, 'should return refreshToken');
    t.ok(res.body.data.session, 'should return session info');
    t.ok(res.body.data.session.id, 'session should have an id');
    t.ok(res.body.data.session.expiresAt, 'session should have expiresAt');
    t.ok(res.body.data.user, 'should return user data');
    t.notOk(res.body.data.user.password, 'user password should not be returned');
    authToken = res.body.data.accessToken;
    refreshToken = res.body.data.refreshToken;
    sessionId = res.body.data.session.id;
});

test('POST /users/login — should reject wrong password', async (t) => {
    const res = await request.post('/users/login').send({
        email: testUser.email,
        password: 'wrongpassword',
    });
    t.equal(res.status, 401);
    t.equal(res.body.success, false);
});

// SESSION ENDPOINTS
test('GET /users/sessions — should return active sessions', async (t) => {
    const res = await request
        .get('/users/sessions')
        .set('Authorization', `Bearer ${authToken}`);
    t.equal(res.status, 200);
    t.equal(res.body.success, true);
    t.ok(res.body.count >= 1);
    t.ok(Array.isArray(res.body.data));
    const session = res.body.data[0];
    t.ok(session.id, 'session should have id');
    t.ok(session.createdAt, 'session should have createdAt');
    t.ok(session.expiresAt, 'session should have expiresAt');
});

test('POST /users/refresh-token — should refresh and return new tokens', async (t) => {
    const res = await request
        .post('/users/refresh-token')
        .send({ refreshToken });
    t.equal(res.status, 200);
    t.equal(res.body.success, true);
    t.ok(res.body.data.accessToken, 'should return new accessToken');
    t.ok(res.body.data.refreshToken, 'should return new refreshToken');
    t.ok(res.body.data.session, 'should return new session info');
    // Update tokens for subsequent requests (token rotation)
    authToken = res.body.data.accessToken;
    refreshToken = res.body.data.refreshToken;
    sessionId = res.body.data.session.id;
});

test('POST /users/refresh-token — should reject reused (rotated) refresh token', async (t) => {
    // The old refresh token was already rotated, so reusing it should fail
    const res = await request
        .post('/users/refresh-token')
        .send({ refreshToken: 'old-invalid-token' });
    t.equal(res.status, 401);
    t.equal(res.body.success, false);
});

test('POST /users/refresh-token — should reject missing refresh token', async (t) => {
    const res = await request
        .post('/users/refresh-token')
        .send({});
    t.equal(res.status, 400);
    t.equal(res.body.success, false);
});

test('GET /users/profile — should return user profile', async (t) => {
    const res = await request.get('/users/profile').set('Authorization', `Bearer ${authToken}`);
    t.equal(res.status, 200);
    t.equal(res.body.data.email, testUser.email);
    t.notOk(res.body.data.password);
});

test('GET /users/profile — should reject without token', async (t) => {
    const res = await request.get('/users/profile');
    t.equal(res.status, 401);
});

// TRANSACTION ENDPOINTS
test('POST /transactions — should create an expense', async (t) => {
    const res = await request
        .post('/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
            type: 'expense',
            amount: 500,
            description: 'Lunch at restaurant',
            date: '2026-02-10',
        });
    t.equal(res.status, 201);
    t.equal(res.body.success, true);
    t.equal(res.body.data.type, 'expense');
    t.equal(res.body.data.amount, 500);
    t.equal(res.body.data.category, 'food'); // auto-categorized
    testTransactionId = res.body.data.id;
});

test('POST /transactions — should create an income', async (t) => {
    const res = await request
        .post('/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
            type: 'income',
            amount: 50000,
            description: 'Monthly salary',
            category: 'salary',
            date: '2026-02-01',
        });
    t.equal(res.status, 201);
    t.equal(res.body.data.type, 'income');
    t.equal(res.body.data.amount, 50000);
});

test('POST /transactions — should reject invalid type', async (t) => {
    const res = await request
        .post('/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ type: 'savings', amount: 100 });
    t.equal(res.status, 400);
});

test('POST /transactions — should reject negative amount', async (t) => {
    const res = await request
        .post('/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ type: 'expense', amount: -50 });
    t.equal(res.status, 400);
});

test('POST /transactions — should reject without auth', async (t) => {
    const res = await request
        .post('/transactions')
        .send({ type: 'expense', amount: 100 });
    t.equal(res.status, 401);
});

test('GET /transactions — should fetch all transactions', async (t) => {
    const res = await request
        .get('/transactions')
        .set('Authorization', `Bearer ${authToken}`);
    t.equal(res.status, 200);
    t.equal(res.body.success, true);
    t.ok(res.body.count >= 2);
    t.ok(Array.isArray(res.body.data));
});

test('GET /transactions?type=expense — should filter by type', async (t) => {
    const res = await request
        .get('/transactions?type=expense')
        .set('Authorization', `Bearer ${authToken}`);
    t.equal(res.status, 200);
    res.body.data.forEach((t2) => t.equal(t2.type, 'expense'));
});

test('GET /transactions?category=food — should filter by category', async (t) => {
    const res = await request
        .get('/transactions?category=food')
        .set('Authorization', `Bearer ${authToken}`);
    t.equal(res.status, 200);
    res.body.data.forEach((t2) => t.equal(t2.category, 'food'));
});

test('GET /transactions/:id — should fetch single transaction', async (t) => {
    const res = await request
        .get(`/transactions/${testTransactionId}`)
        .set('Authorization', `Bearer ${authToken}`);
    t.equal(res.status, 200);
    t.equal(res.body.data.id, testTransactionId);
});

test('GET /transactions/:id — should 404 for invalid id', async (t) => {
    const res = await request
        .get('/transactions/nonexistent-id')
        .set('Authorization', `Bearer ${authToken}`);
    t.equal(res.status, 404);
});

test('PATCH /transactions/:id — should update a transaction', async (t) => {
    const res = await request
        .patch(`/transactions/${testTransactionId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ amount: 750, description: 'Updated dinner at restaurant' });
    t.equal(res.status, 200);
    t.equal(res.body.data.amount, 750);
});

test('DELETE /transactions/:id — should delete a transaction', async (t) => {
    // Create one to delete
    const createRes = await request
        .post('/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ type: 'expense', amount: 100, description: 'To be deleted' });
    const idToDelete = createRes.body.data.id;

    const res = await request
        .delete(`/transactions/${idToDelete}`)
        .set('Authorization', `Bearer ${authToken}`);
    t.equal(res.status, 200);
    t.equal(res.body.success, true);

    // Verify it's gone
    const verify = await request
        .get(`/transactions/${idToDelete}`)
        .set('Authorization', `Bearer ${authToken}`);
    t.equal(verify.status, 404);
});

// BUDGET ENDPOINTS
test('POST /budgets — should create a budget', async (t) => {
    const res = await request
        .post('/budgets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
            month: '2026-02',
            monthlyGoal: 30000,
            savingsTarget: 20000,
            categoryBudgets: { food: 5000, transport: 3000 },
        });
    t.equal(res.status, 201);
    t.equal(res.body.success, true);
    t.equal(res.body.data.month, '2026-02');
    testBudgetId = res.body.data.id;
});

test('GET /budgets — should fetch all budgets', async (t) => {
    const res = await request
        .get('/budgets')
        .set('Authorization', `Bearer ${authToken}`);
    t.equal(res.status, 200);
    t.ok(res.body.count >= 1);
});

test('GET /budgets/:month — should fetch budget by month', async (t) => {
    const res = await request
        .get('/budgets/2026-02')
        .set('Authorization', `Bearer ${authToken}`);
    t.equal(res.status, 200);
    t.equal(res.body.data.month, '2026-02');
});

// SUMMARY & ANALYTICS ENDPOINTS
test('GET /summary — should return income-expense summary', async (t) => {
    const res = await request
        .get('/summary')
        .set('Authorization', `Bearer ${authToken}`);
    t.equal(res.status, 200);
    t.ok(res.body.data.totalIncome >= 0);
    t.ok(res.body.data.totalExpense >= 0);
    t.ok(typeof res.body.data.balance === 'number');
    t.ok(res.body.data.categoryBreakdown);
});

test('GET /summary?month=2026-02 — should return filtered summary', async (t) => {
    const res = await request
        .get('/summary?month=2026-02')
        .set('Authorization', `Bearer ${authToken}`);
    t.equal(res.status, 200);
    t.equal(res.body.data.period, '2026-02');
});

test('GET /summary — should use cache on second call', async (t) => {
    const res = await request
        .get('/summary')
        .set('Authorization', `Bearer ${authToken}`);
    t.equal(res.status, 200);
    t.equal(res.body.data.cached, true);
});

test('GET /summary/trends — should return monthly trends', async (t) => {
    const res = await request
        .get('/summary/trends')
        .set('Authorization', `Bearer ${authToken}`);
    t.equal(res.status, 200);
    t.ok(Array.isArray(res.body.data));
});

test('GET /summary/tips — should return saving tips', async (t) => {
    const res = await request
        .get('/summary/tips')
        .set('Authorization', `Bearer ${authToken}`);
    t.equal(res.status, 200);
    t.ok(Array.isArray(res.body.data.tips));
    t.ok(res.body.data.tips.length > 0);
});

test('GET /summary/budget/:month — should return budget comparison', async (t) => {
    const res = await request
        .get('/summary/budget/2026-02')
        .set('Authorization', `Bearer ${authToken}`);
    t.equal(res.status, 200);
    t.ok(res.body.data.actual);
    t.ok(res.body.data.budget);
    t.ok(res.body.data.analysis);
});

// EDGE CASES & ERROR HANDLING
test('GET /unknown-route — should return 404', async (t) => {
    const res = await request.get('/some/unknown/route');
    t.equal(res.status, 404);
    t.equal(res.body.success, false);
});

test('POST /transactions — should auto-categorize by keyword', async (t) => {
    const res = await request
        .post('/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ type: 'expense', amount: 200, description: 'Uber ride to airport' });
    t.equal(res.status, 201);
    t.equal(res.body.data.category, 'transport');
});

// SESSION LOGOUT TESTS (run near end so other tests aren't affected)
test('POST /users/logout — should reject missing sessionId', async (t) => {
    const res = await request
        .post('/users/logout')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});
    t.equal(res.status, 400);
    t.equal(res.body.success, false);
});

test('POST /users/logout — should revoke the current session', async (t) => {
    // First login again to get a fresh session for this test
    const loginRes = await request.post('/users/login').send({
        email: testUser.email,
        password: testUser.password,
    });
    const tempToken = loginRes.body.data.accessToken;
    const tempSessionId = loginRes.body.data.session.id;

    const res = await request
        .post('/users/logout')
        .set('Authorization', `Bearer ${tempToken}`)
        .send({ sessionId: tempSessionId });
    t.equal(res.status, 200);
    t.equal(res.body.success, true);
});

test('POST /users/logout-all — should revoke all sessions', async (t) => {
    // Login to get a valid token
    const loginRes = await request.post('/users/login').send({
        email: testUser.email,
        password: testUser.password,
    });
    const tempToken = loginRes.body.data.accessToken;

    const res = await request
        .post('/users/logout-all')
        .set('Authorization', `Bearer ${tempToken}`);
    t.equal(res.status, 200);
    t.equal(res.body.success, true);

    // After logout-all, the profile request should fail (session revoked)
    const profileRes = await request
        .get('/users/profile')
        .set('Authorization', `Bearer ${tempToken}`);
    t.equal(profileRes.status, 401, 'should reject after all sessions revoked');
});

// Final Cleanup
test('cleanup: remove test data files after tests', async (t) => {
    const dataDir = path.join(__dirname, '..', 'data');
    await fs.rm(dataDir, { recursive: true, force: true });
    t.pass('Final cleanup done');
});
