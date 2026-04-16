const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'db', 'be_database.db');
const db = new Database(dbPath);

try {
  const result = db.prepare("INSERT INTO expenses (date, amount) VALUES (?, ?)").run('2026-04-15', 100);
  console.log('lastInsertRowid type:', typeof result.lastInsertRowid);
  console.log('lastInsertRowid value:', result.lastInsertRowid);

  const record = db.prepare('SELECT * FROM expenses WHERE id = ?').get(result.lastInsertRowid);
  console.log('Record ID type:', typeof record.id);
  
  try {
    JSON.stringify(record);
    console.log('JSON.stringify SUCCESS');
  } catch (e) {
    console.error('JSON.stringify FAILED:', e.message);
  }

} catch (err) {
  console.error('Error:', err.message);
} finally {
  db.close();
}
