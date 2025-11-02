// Modular route handlers for Sahay API
const express = require('express');
const router = express.Router();
// router.use('/fit', require('./routes/fit'));

console.log('Loading individual routes...');

// Placeholder routes for each feature
router.use('/auth', require('./routes/auth'));
router.use('/journal', require('./routes/journal'));
router.use('/chat', require('./routes/chat'));
router.use('/nudge', require('./routes/nudge'));

console.log('Loading mitra route in main routes...');
router.use('/mitra', require('./routes/mitra'));
console.log('Mitra route loaded in main routes');
router.use('/imagen', require('./routes/imagen'));

console.log('Loading soundscape route...');
try {
  const soundscapeRouter = require('./routes/soundscape');
  router.use('/soundscape', soundscapeRouter);
  console.log('Soundscape route loaded successfully');
} catch (error) {
  console.error('Error loading soundscape route:', error);
}

router.use('/practice', require('./routes/practice'));
router.use('/security', require('./routes/security'));

router.use('/wellness', require('./routes/wellness'));

router.use('/digital-twin', require('./routes/digital-twin'));
router.use('/digital-twin', require('./routes/digital-twin-analyze'));
router.use('/health', require('./routes/health'));

router.use('/dhwani', require('./routes/dhwani'));

console.log('Loading entertainment route...');
try {
  const entertainmentRouter = require('./routes/entertainment');
  router.use('/entertainment', entertainmentRouter);
  console.log('Entertainment route loaded successfully');
} catch (error) {
  console.error('Error loading entertainment route:', error);
}

// Test route
router.post('/soundscape-test', (req, res) => {
  console.log('Soundscape test route hit!');
  res.json({ message: 'Soundscape test route working!' });
});

module.exports = router;
