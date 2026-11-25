const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const authRoutes = require('./routes/auth.routes');
const ticketRoutes = require('./routes/ticket.routes');
const notificationRoutes = require('./routes/notification.routes');
const userRoutes = require('./routes/user.routes');
const { getActivity } = require('./controllers/user.controllers');
const { protect, adminOnly } = require('./middleware/auth.middleware');
require('./events/listeners.events');

const app = express();
const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

app.set('trust proxy', 1);
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: clientUrl.split(',') }));
app.use(express.json());
app.use(morgan('dev'));

app.get('/api/health', (req, res) => {
  res.json({ success: true, status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/users', userRoutes);
app.get('/api/activity', protect, adminOnly, getActivity);

app.use('/api', (req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

const clientPath = path.join(__dirname, '../../client/dist');
if (fs.existsSync(clientPath)) {
  app.use(express.static(clientPath));
  app.use((req, res) => {
    res.sendFile(path.join(clientPath, 'index.html'));
  });
}

app.use((err, req, res, next) => {
  if (err.status && err.status < 500) {
    return res.status(err.status).json({ success: false, message: 'Invalid request' });
  }
  console.log(err);
  res.status(500).json({ success: false, message: 'Something went wrong' });
});

module.exports = app;
