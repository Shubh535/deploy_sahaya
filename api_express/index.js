// Load environment variables
require('dotenv').config({ path: '../.env.local' });

// Express API Gateway for Sahay
const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());

// Add request logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`, req.body);
  next();
});

// Modular routes
console.log('Loading routes...');
const routes = require('./routes');
app.use('/api', routes);
console.log('Routes loaded successfully');

app.get('/', (req, res) => {
  res.send('Sahay API Gateway is running.');
});

// Test route directly in main server
app.get('/test-direct', (req, res) => {
  console.log('Direct test route hit!');
  res.json({ message: 'Direct route working!' });
});

// Add soundscape route directly
app.post('/api/soundscape/recommend', (req, res) => {
  console.log('Direct soundscape recommend route hit!');
  res.json({ message: 'Direct soundscape route working!', recommendations: [] });
});

const PORT = process.env.PORT || 4001;
app.listen(PORT, () => {
  console.log(`Sahay API running on port ${PORT}`);
});
