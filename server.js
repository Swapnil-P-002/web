// server.js
require('dotenv').config();
const express     = require('express');
const mysql       = require('mysql2');
const bodyParser  = require('body-parser');
const session     = require('express-session');
const path        = require('path');

const app = express();
const port = process.env.PORT || 3000;

// --- MIDDLEWARE ---
app.use(bodyParser.urlencoded({ extended: false }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'verysecretkey',
  resave: false,
  saveUninitialized: false
}));
app.use(express.static(path.join(__dirname))); // serve HTML/CSS

// --- DATABASE CONNECTION ---
const db = mysql.createPool({
  host     : process.env.DB_HOST     || 'localhost',
  user     : process.env.DB_USER     || 'root',
  password : process.env.DB_PASSWORD || '',
  database : process.env.DB_NAME     || 'student_portal'
});

// --- ROUTES ---
// Serve login & register pages
app.get('login.html',    (req, res) => res.sendFile(path.join(__dirname, 'login.html')));
app.get('register.html', (req, res) => res.sendFile(path.join(__dirname, 'register.html')));
app.get('Project.html',(req, res) => {
  if (!req.session.userId) return res.redirect('/login.html');
  res.sendFile(path.join(__dirname, 'dashboard.html'));
});

// Registration endpoint
app.post('/register', (req, res) => {
  const { name, email, password, course } = req.body;
  // NOTE: In production, hash the password with bcrypt!
  const sql = 'INSERT INTO users (name,email,password,course) VALUES (?, ?, ?, ?)';
  db.execute(sql, [name, email, password, course], (err, result) => {
    if (err) return res.send('Error registering: ' + err.message);
    res.redirect('login.html');
  });
});

// Login endpoint
app.post('login', (req, res) => {
  const { email, password } = req.body;
  const sql = 'SELECT * FROM users WHERE email = ?';
  db.execute(sql, [email], (err, results) => {
    if (err) return res.send('Error logging in: ' + err.message);
    if (results.length === 0 || results[0].password !== password) {
      return res.send('Invalid email/password');
    }
    req.session.userId = results[0].id;
    res.redirect('Project.html');
  });
});

// Logout
app.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('login.html'));
});

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
