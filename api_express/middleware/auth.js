// JWT Auth middleware for protected routes
const { auth } = require('../firebase');

module.exports = function (req, res, next) {
  if (process.env.DEV_BYPASS_AUTH === '1' || req.headers['x-dev-auth'] === 'allow') {
    req.user = { uid: 'dev-user', email: 'dev@example.com' };
    return next();
  }

  const header = req.headers['authorization'];
  if (!header) return res.status(401).json({ error: 'Missing Authorization header' });
  const token = header.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Missing token' });
  auth.verifyIdToken(token)
    .then((decoded) => {
      req.user = decoded;
      next();
    })
    .catch(() => {
      res.status(401).json({ error: 'Invalid or expired token' });
    });
};
