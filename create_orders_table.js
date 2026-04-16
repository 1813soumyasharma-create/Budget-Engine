const Database = require('better-sqlite3');
const db = new Database('db/be_database.db');
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      vendor_id        INTEGER NOT NULL,
      stock_id         INTEGER NOT NULL,
      quantity         REAL    NOT NULL DEFAULT 1,
      unit_price       REAL    NOT NULL,
      total_amount     REAL    NOT NULL,
      status           TEXT    DEFAULT 'pending',
      order_date       DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (vendor_id) REFERENCES users(id),
      FOREIGN KEY (stock_id)  REFERENCES stocks(id)
    );
  `);
  console.log('Orders table created successfully.');
} catch (err) {
  console.error('Error:', err.message);
} finally {
  db.close();
}
