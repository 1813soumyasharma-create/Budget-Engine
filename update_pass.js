const Database = require('better-sqlite3');
const db = new Database('./db/be_database.db');
const hash = '$2a$10$c3Zzpa8TQaHeNGlWNz6X3uuLlmTJIMHl4aDlEZUyz0xwGiuex/GDO';
db.prepare('UPDATE users SET password_hash = ? WHERE username = ?').run(hash, 'admin');
console.log('Password successfully updated in database.');
