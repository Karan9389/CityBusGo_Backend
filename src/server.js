import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import driverRoutes from './routes/driverRoutes.js';
import busRoutes from './routes/busRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import { setupTrackingSocket } from './sockets/trackingSocket.js';

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();
const port = process.env.PORT || 5000;
const frontendOrigin = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';

const allowedOrigins = [
  frontendOrigin,
  'http://localhost:5173',
  'http://localhost:3000',
  'https://citybusgo.netlify.app'
];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
};

app.use(cors(corsOptions));
app.use(express.json());

// Register API Routes
app.use('/api/auth', authRoutes);
app.use('/api/driver', driverRoutes);
app.use('/api/buses', busRoutes);
app.use('/api/admin', adminRoutes);

// Basic Health Check & Welcome Endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'CityBusGo Backend Server is running' });
});

app.get('/', (req, res) => {
  res.send('Welcome to the CityBus-Go API !');
});

// Socket.io Setup
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Attach Socket Tracking Logic
setupTrackingSocket(io);

// Start Listening
server.listen(port, () => {
  console.log(`🚀 Server is running at http://localhost:${port}`);
});
