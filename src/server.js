import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { error } from 'console';
import authRoutes from './routes/authRoutes.js';



//Loadind environment variable
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const frontendOrigin = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';

//setting up middeleware
app.use(cors({
    origin : frontendOrigin,
    methods : ['GET', 'POST', 'PUT', 'DELETE']
}));
app.use(express.json());

app.use('/api/auth', authRoutes);
const server = http.createServer(app);

//initialize Scoket.io
const io = new Server(server, {
    cors : {
        origin : 'https://citybusgo.netlify.app/',
        methods : ['GET', 'POST']
    }
});

//--- MongoDB Connection --- 
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Successfully connected to MongoDB!'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

//Basic Test
app.get('/api/health', (req, res) => {
    res.json({status : 'ok', message : 'CityBusGo js Server is running'});
})
app.get('/', (req, res) => {
    res.send('Welcome to the CityBus-Go API !');
})

//Realtime Bus Tracking and Socket logic
io.on('connection', (socket) => {
    console.log(`New device connected: ${socket.id}`);

    socket.on('driver_update_location', (data) => {
        io.to(`rout_${routId}`.emit('bus_location_change', data));
    });
    //when the commuter open the app for the bus
    socket.on('commuter_join_tracking', (routId) => {
        socket.join(`route_${routId}`);
        console.log(`Device joined tracking room for route: ${routeId}`);

        socket.on('disconnect', () => {
            console.log(`Device disconnected: ${socket.id}`);
        });
    });
});

//start Listening
server.listen(port, () => {
    console.log(`server is running at http://localhost:${port}`);
});
