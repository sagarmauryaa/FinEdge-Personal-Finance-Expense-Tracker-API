const fs = require('fs/promises');
const path = require('path');
const config = require('../config');

/**
 * FileStore – JSON-file persistence layer using fs/promises.
 * Each entity type (users, transactions, budgets) gets its own JSON file.
 */
class FileStore {
    constructor(filename) {
        this._filePath = path.join(config.dataDir, `${filename}.json`);
        this._initialized = false;
    }

    /**
     * Ensure the data directory and file exist.
     */
    async _init() {
        if (this._initialized) return;

        const dir = path.dirname(this._filePath);
        try {
            await fs.access(dir);
        } catch {
            await fs.mkdir(dir, { recursive: true });
        }

        try {
            await fs.access(this._filePath);
        } catch {
            await fs.writeFile(this._filePath, JSON.stringify([], null, 2), 'utf-8');
        }

        this._initialized = true;
    }

    /**
     * Read all records from the JSON file.
     */
    async findAll() {
        await this._init();
        const data = await fs.readFile(this._filePath, 'utf-8');
        return JSON.parse(data);
    }

    /**
     * Find a single record by ID.
     */
    async findById(id) {
        const records = await this.findAll();
        return records.find((r) => r.id === id) || null;
    }

    /**
     * Find records matching a predicate.
     */
    async findWhere(predicate) {
        const records = await this.findAll();
        return records.filter(predicate);
    }

    /**
     * Create a new record.
     */
    async create(record) {
        const records = await this.findAll();
        records.push(record);
        await this._write(records);
        return record;
    }

    /**
     * Update a record by ID (partial update).
     */
    async update(id, updates) {
        const records = await this.findAll();
        const index = records.findIndex((r) => r.id === id);
        if (index === -1) return null;

        records[index] = { ...records[index], ...updates, updatedAt: new Date().toISOString() };
        await this._write(records);
        return records[index];
    }

    /**
     * Delete a record by ID.
     */
    async delete(id) {
        const records = await this.findAll();
        const index = records.findIndex((r) => r.id === id);
        if (index === -1) return false;

        records.splice(index, 1);
        await this._write(records);
        return true;
    }

    /**
     * Write data to the JSON file.
     */
    async _write(data) {
        await this._init();
        await fs.writeFile(this._filePath, JSON.stringify(data, null, 2), 'utf-8');
    }
}

module.exports = FileStore;
