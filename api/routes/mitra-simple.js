const express = require('express');
console.log('Simple mitra route loading...');

const router = express.Router();

router.get('/health', (req, res) => {
  console.log('Health check hit!');
  res.json({ status: 'Simple mitra route working!' });
});

router.post('/test', (req, res) => {
  console.log('Test route hit!');
  res.json({ status: 'Simple test route working!', body: req.body });
});

console.log('Simple mitra routes registered');
module.exports = router;