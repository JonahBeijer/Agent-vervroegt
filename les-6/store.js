import { DatabaseSync } from 'node:sqlite';
import { randomBytes, randomUUID, createHash } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { DATA } from '../les-5/config.js';
export class Store {
    constructor(directory = DATA) {
        mkdirSync(directory, { recursive: true }); this.directory = directory;
        this.db = new DatabaseSync(path.join(directory, 'app.sqlite'));
        this.db.exec('PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;');
        this.db.exec('CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY, owner TEXT UNIQUE NOT NULL, active TEXT NOT NULL); CREATE TABLE IF NOT EXISTS threads(id TEXT PRIMARY KEY, owner TEXT NOT NULL, title TEXT NOT NULL, created INTEGER NOT NULL); CREATE TABLE IF NOT EXISTS turns(id INTEGER PRIMARY KEY, thread TEXT NOT NULL, prompt TEXT NOT NULL, answer TEXT NOT NULL, detail TEXT NOT NULL, created INTEGER NOT NULL);');
    }
    session(rawToken) {
        let hash = rawToken && createHash('sha256').update(rawToken).digest('hex');
        let row = hash && this.db.prepare('SELECT * FROM sessions WHERE token=?').get(hash);
        if (row) return { ...row, rawToken: null };
        const token = randomBytes(32).toString('base64url'), owner = randomUUID(), active = randomUUID();
        hash = createHash('sha256').update(token).digest('hex');
        this.db.prepare('INSERT INTO sessions VALUES(?,?,?)').run(hash, owner, active);
        this.db.prepare('INSERT INTO threads VALUES(?,?,?,?)').run(active, owner, 'Nieuw gesprek', Date.now());
        return { token: hash, owner, active, rawToken: token };
    }
    threads(owner) { return this.db.prepare('SELECT id,title,created FROM threads WHERE owner=? ORDER BY created DESC LIMIT 30').all(owner); }
    select(session, id) {
        if (!this.db.prepare('SELECT id FROM threads WHERE id=? AND owner=?').get(id, session.owner)) return false;
        this.db.prepare('UPDATE sessions SET active=? WHERE token=?').run(id, session.token); session.active = id; return true;
    }
    newThread(session) {
        const id = randomUUID();
        this.db.prepare('INSERT INTO threads VALUES(?,?,?,?)').run(id, session.owner, 'Nieuw gesprek', Date.now());
        this.select(session, id); return id;
    }
    turns(thread) { return this.db.prepare('SELECT * FROM turns WHERE thread=? ORDER BY id').all(thread).map(row => ({ ...row, detail: JSON.parse(row.detail) })); }
    saveTurn(session, prompt, answer, detail) {
        if (!this.turns(session.active).length) this.db.prepare('UPDATE threads SET title=? WHERE id=?').run(prompt.slice(0, 60), session.active);
        this.db.prepare('INSERT INTO turns(thread,prompt,answer,detail,created) VALUES(?,?,?,?,?)').run(session.active, prompt, answer, JSON.stringify(detail), Date.now());
    }
    close() { this.db.close(); }
}
