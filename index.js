/**
 * Author: Azrial Galih Prasetyo
 * Instagram: @al.sebirumatahari_
 * Telegram: @sbmshop
 * 
 * GhostDB - Karena skema itu mitos, dan migrasi itu buang waktu.
 * Simpen data jadi JSON, panggil, beres. 
 */

const fs = require('fs');
const path = require('path');

class GhostDB {
    constructor(dbPath = './database') {
        this.dbPath = path.resolve(dbPath);
        if (!fs.existsSync(this.dbPath)) {
            fs.mkdirSync(this.dbPath, { recursive: true });
        }
    }

    _getFile(collection) {
        return path.join(this.dbPath, `${collection}.json`);
    }

    _read(collection) {
        const file = this._getFile(collection);
        if (!fs.existsSync(file)) return {};
        try {
            return JSON.parse(fs.readFileSync(file, 'utf8'));
        } catch (e) {
            console.error(`[GhostDB] R.I.P file ${collection}.json. Isinya corrupt/bukan JSON.`);
            return {};
        }
    }

    _write(collection, data) {
        fs.writeFileSync(this.getFile(collection), JSON.stringify(data, null, 2));
    }

    // Fix _write typo internal call
    _writeInternal(collection, data) {
        fs.writeFileSync(this._getFile(collection), JSON.stringify(data, null, 2));
    }

    /** Masukin data. Timpa kalo ID udah ada. */
    set(collection, id, data) {
        const db = this._read(collection);
        db[id] = { id, ...data, _updatedAt: Date.now() };
        this._writeInternal(collection, db);
        return db[id];
    }

    /** Ambil 1 data by ID */
    get(collection, id) {
        const db = this._read(collection);
        return db[id] || null;
    }

    /** Ambil semua data di collection */
    all(collection) {
        const db = this._read(collection);
        return Object.values(db);
    }

    /** Cari data pake fungsi filter */
    find(collection, predicate) {
        return this.all(collection).filter(predicate);
    }

    /** Hapus data */
    delete(collection, id) {
        const db = this._read(collection);
        if (!db[id]) return false;
        delete db[id];
        this._writeInternal(collection, db);
        return true;
    }
    /** Update partial data. Kalo gaada, return null */
    update(collection, id, data) {
        const db = this._read(collection);
        if (!db[id]) return null;
        db[id] = { ...db[id], ...data, _updatedAt: Date.now() };
        this._writeInternal(collection, db);
        return db[id];
    }

    /** Cek ada data nggak by ID */
    has(collection, id) {
        return !!this._read(collection)[id];
    }

    /** Cari 1 doang yg match (biar hemat performa) */
    first(collection, predicate) {
        return this.all(collection).find(predicate) || null;
    }

    /** Itung jumlah data */
    count(collection) {
        return Object.keys(this._read(collection)).length;
    }

    /** Kiamat kecil buat 1 collection */
    clear(collection) {
        this._writeInternal(collection, {});
        return true;
    }
}
module.exports = GhostDB;
