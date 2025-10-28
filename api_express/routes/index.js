const express = require('express');
const router = express.Router();

// Import all route modules
// const authRoutes = require('./auth');
// const chatRoutes = require('./chat');
// const dhwaniRoutes = require('./dhwani');
// const digitalTwinAnalyzeRoutes = require('./digital-twin-analyze');
// const digitalTwinRoutes = require('./digital-twin');
// const fitRoutes = require('./fit');
// const healthRoutes = require('./health');
// const imagenRoutes = require('./imagen');
// const journalRoutes = require('./journal');
// const mitraSimpleRoutes = require('./mitra-simple');
const mitraRoutes = require('./mitra');
// const nudgeRoutes = require('./nudge');
// const practiceRoutes = require('./practice');
// const securityRoutes = require('./security');
// const soundscapeRoutes = require('./soundscape');

// Mount routes
// router.use('/auth', authRoutes);
// router.use('/chat', chatRoutes);
// router.use('/dhwani', dhwaniRoutes);
// router.use('/digital-twin-analyze', digitalTwinAnalyzeRoutes);
// router.use('/digital-twin', digitalTwinRoutes);
// router.use('/fit', fitRoutes);
// router.use('/health', healthRoutes);
// router.use('/imagen', imagenRoutes);
// router.use('/journal', journalRoutes);
// router.use('/mitra-simple', mitraSimpleRoutes);
router.use('/mitra', mitraRoutes);
// router.use('/nudge', nudgeRoutes);
// router.use('/practice', practiceRoutes);
// router.use('/security', securityRoutes);
// router.use('/soundscape', soundscapeRoutes);

module.exports = router;