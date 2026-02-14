const config = require('../config');

/**
 * Simple in-memory cache service with TTL expiry.
 * Used to avoid recomputing data repeatedly (e.g., /summary endpoint).
 */

const _store = new Map();
const _defaultTTL = (config.cache.ttlSeconds || 300) * 1000;

/**
 * Get a cached value by key.
 */
const get = (key) => {
    const entry = _store.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
        _store.delete(key);
        return null;
    }

    return entry.value;
};

/**
 * Set a value in the cache.
 */
const set = (key, value, ttlMs) => {
    const ttl = ttlMs || _defaultTTL;
    _store.set(key, {
        value,
        expiresAt: Date.now() + ttl,
    });
};

/**
 * Invalidate a specific cache entry.
 */
const invalidate = (key) => {
    _store.delete(key);
};

/**
 * Invalidate all entries matching a prefix.
 */
const invalidateByPrefix = (prefix) => {
    for (const key of _store.keys()) {
        if (key.startsWith(prefix)) {
            _store.delete(key);
        }
    }
};

/**
 * Clear the entire cache.
 */
const clear = () => {
    _store.clear();
};

/**
 * Get cache stats.
 */
const stats = () => {
    let active = 0;
    let expired = 0;
    const currentTime = Date.now();
    for (const entry of _store.values()) {
        if (currentTime > entry.expiresAt) expired++;
        else active++;
    }
    return { active, expired, total: _store.size };
};

module.exports = { get, set, invalidate, invalidateByPrefix, clear, stats };
