const sqlite = require('better-sqlite3');
const db = new sqlite('db/be_database.db');
try {
    db.prepare("INSERT OR IGNORE INTO users (username, password_hash, firm_name, role) VALUES ('vendor', '$2a$10$c6dcOavG4m0OndBAIghdquDxIcwJPEkQ7Jw.smDEoFu1bGX0b.gHq', 'Authorized Vendor', 'vendor')").run();
    console.log('Vendor user added successfully');
} catch (err) {
    console.error('Error adding vendor user:', err.message);
} finally {
    db.close();
}
