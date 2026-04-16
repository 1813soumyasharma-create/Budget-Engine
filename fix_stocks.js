const Database = require('better-sqlite3');
const db = new Database('db/be_database.db');
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS stocks (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      name             TEXT    NOT NULL,
      price            REAL    NOT NULL DEFAULT 0,
      description      TEXT,
      category         TEXT    DEFAULT 'General',
      unit             TEXT    DEFAULT 'kg',
      status           TEXT    DEFAULT 'active',
      created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at       DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  
  const seed = db.prepare("INSERT OR IGNORE INTO stocks (name, price, description, category, unit) VALUES (?, ?, ?, ?, ?)");
  seed.run('PCE Powder (High Grade)', 450, 'High performance PCE powder for admixtures', 'Raw Material', 'kg');
  seed.run('SNF Liquid (40% Solids)', 85, 'Standard SNF liquid for regular concrete', 'Raw Material', 'kg');
  seed.run('Defoamer - Silicone Based', 320, 'Antifoaming agent for concrete mixes', 'Additive', 'litre');
  seed.run('Lignosulfonate Powder', 65, 'Water reducing agent', 'Raw Material', 'kg');
  seed.run('VMA (Viscosity Modifying Agent)', 580, 'For self-compacting concrete', 'Additive', 'kg');

  console.log('Stocks table created and seeded successfully.');
} catch (err) {
  console.error('Error:', err.message);
} finally {
  db.close();
}
