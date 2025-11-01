// Load environment variables (optional for production)
const path = require('path');
console.log('Loading environment variables...');
try {
  require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });
  console.log('Loaded .env.local');
} catch (error) {
  console.log('Could not load .env.local, using environment variables:', error.message);
}

if (process.env.GOOGLE_APPLICATION_CREDENTIALS && !path.isAbsolute(process.env.GOOGLE_APPLICATION_CREDENTIALS)) {
  process.env.GOOGLE_APPLICATION_CREDENTIALS = path.resolve(
    __dirname,
    '..',
    process.env.GOOGLE_APPLICATION_CREDENTIALS
  );
  console.log('Resolved GOOGLE_APPLICATION_CREDENTIALS to', process.env.GOOGLE_APPLICATION_CREDENTIALS);
}

if (process.env.VERTEX_SERVICE_ACCOUNT_PATH && !path.isAbsolute(process.env.VERTEX_SERVICE_ACCOUNT_PATH)) {
  process.env.VERTEX_SERVICE_ACCOUNT_PATH = path.resolve(
    __dirname,
    '..',
    process.env.VERTEX_SERVICE_ACCOUNT_PATH
  );
  console.log('Resolved VERTEX_SERVICE_ACCOUNT_PATH to', process.env.VERTEX_SERVICE_ACCOUNT_PATH);
}

console.log('Environment variables loaded');

console.log('Starting Sahay API Gateway...');

// Express API Gateway for Sahay
const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json({ limit: '15mb' }));

console.log('Express app created');

// Add request logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('Request body:', req.body);
  }
  next();
});

console.log('Request logging middleware added');

// Modular routes - temporarily disabled for debugging
console.log('Loading routes...');
try {
  const routes = require('./routes');
  app.use('/api', routes);
  console.log('Routes loaded successfully');
} catch (error) {
  console.error('Error loading routes:', error);
  process.exit(1);
}

app.get('/', (req, res) => {
  res.send('Sahay API Gateway is running.');
});

// Test route directly in main server
app.get('/test-direct', (req, res) => {
  console.log('Direct test route hit!');
  res.json({ message: 'Direct route working!' });
});

const PORT = process.env.PORT || 4001;
console.log(`Attempting to start server on port ${PORT}`);

try {
  console.log('Calling app.listen...');
  const server = app.listen(PORT, () => {
    console.log('Inside listen callback');
    console.log(`Sahay API running on port ${PORT}`);
    console.log('Server started successfully, waiting for requests...');
  });

  console.log('app.listen called, server object:', !!server);

  // Handle server errors
  server.on('error', (error) => {
    console.error('Server error:', error);
    process.exit(1);
  });

  server.on('listening', () => {
    console.log('Server is now listening');
  });

  console.log('Server listen call completed');
} catch (error) {
  console.error('Error in app.listen:', error);
  process.exit(1);
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

console.log('Server setup completed');

// Keep the process alive
setInterval(() => {
  console.log('Server still running...');
}, 10000);
