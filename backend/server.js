const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// Socket.io Setup
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

app.set('io', io);

io.on('connection', (socket) => {
  console.log('⚡ Realtime CRM Client Connected:', socket.id);
  socket.on('disconnect', () => {
    console.log('🔌 Client disconnected:', socket.id);
  });
});

// Helper middleware to expose socket.io to controllers easily
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database Connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB Connected'))
.catch(err => console.error('❌ MongoDB Connection Error:', err));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/customers', require('./routes/customers'));
app.use('/api/leads', require('./routes/leads'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/employees', require('./routes/employees'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/ai', require('./routes/ai'));

// Root welcome handler
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Trishul CRM Backend API Service Serverless Endpoint',
    status: 'Operational',
    health: '/api/health'
  });
});

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Trishul CRM API is running with Socket.IO Realtime' });
});

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// Start Server if run directly, or export for Serverless deployment
const PORT = process.env.PORT || 5000;
if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`🚀 Server with Socket.IO running on port ${PORT}`);
  });
}

module.exports = app;
