const fetch = require('node-fetch');

async function testDownload() {
  const url = 'http://localhost:3000/api/expenses/export';
  // We need a token. I'll get it from the DB for the admin.
  const Database = require('better-sqlite3');
  const jwt = require('jsonwebtoken');
  const db = new Database('db/be_database.db');
  
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get('admin');
  const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, 'be_budget_engine_secret_2024');

  console.log('Testing export with token...');
  
  try {
    const res = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('Response Status:', res.status);
    console.log('Content-Type:', res.headers.get('content-type'));
    
    if (res.ok) {
        const buffer = await res.buffer();
        console.log('Downloaded bytes:', buffer.length);
        if (buffer.length > 1000) {
            console.log('Download seems valid.');
        } else {
            console.error('Download too small or empty.');
        }
    } else {
        const text = await res.text();
        console.error('Error response:', text);
    }
  } catch (err) {
    console.error('Fetch error:', err.message);
  } finally {
    db.close();
  }
}

testDownload();
