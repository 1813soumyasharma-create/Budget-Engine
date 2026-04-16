const Database = require('better-sqlite3');
const db = new Database('db/be_database.db');
try {
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  console.log('Tables found:', tables.map(t => t.name).join(', '));
  
  if (tables.some(t => t.name === 'stocks')) {
    const count = db.prepare("SELECT COUNT(*) as count FROM stocks").get().count;
    console.log(`Stocks table has ${count} records.`);
  } else {
    console.log('Stocks table NOT found!');
  }
} catch (err) {
  console.error('Error:', err.message);
} finally {
  db.close();
}
