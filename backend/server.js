const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const bodyParser = require('body-parser');
const app = express();
const port = 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Log all requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    details: err.message
  });
});

// Ensure all responses are JSON
app.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json');
  next();
});

// Serve static files (screenshots, etc.)
app.use('/images', express.static(path.join(__dirname, 'public/images')));

// Global multer instance to be reused
const upload = multer(); // Memory storage

// Make upload available globally to routes
module.exports.upload = upload;

// Routes
const workDiaryRoutes = require('./routes/workDiary');
app.use('/api/workdiary', workDiaryRoutes);

// Debug route to verify server is running
app.get('/api/test', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Catch-all route for debugging
app.use((req, res) => {
  console.error(`No route found for ${req.method} ${req.url}`);
  res.status(404).json({
    error: 'Not Found',
    message: `No route found for ${req.method} ${req.url}`
  });
});

// Health check
app.get('/', (req, res) => {
  res.send('Server running...');
});

app.listen(port, () => {
  console.log(`✅ Server is running on http://localhost:${port}`);
  console.log('Available routes:');
  console.log('GET /api/test');
  console.log('GET /api/workdiary/ping');
  console.log('GET /api/workdiary/all');
  console.log('GET /api/workdiary/test');
});

// Add detailed request logging
app.use((req, res, next) => {
  console.log(`\n${new Date().toISOString()} - ${req.method} ${req.url}`);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  console.log('Query:', JSON.stringify(req.query, null, 2));
  console.log('Body:', JSON.stringify(req.body, null, 2));
  next();
});

// Add error logging middleware
app.use((err, req, res, next) => {
  console.error('\nError details:');
  console.error('Time:', new Date().toISOString());
  console.error('Request:', {
    method: req.method,
    url: req.url,
    headers: req.headers
  });
  console.error('Error:', err);
  console.error('Stack:', err.stack);
  
  res.status(500).json({
    error: 'Internal server error',
    details: err.message
  });
});
