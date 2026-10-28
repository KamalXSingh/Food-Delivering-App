const express = require('express');
const cors = require('cors');
require('dotenv').config();
const mongoose = require('mongoose');
const http = require('http');
const { Server } = require('socket.io');

const userRoute = require('./routes/UserRoutes');
const restaurantRoutes = require('./routes/restaurantRoutes');
const orderRoutes = require('./routes/orderRoutes');
const deliveryPartnerRoutes = require('./routes/deliveryPartnerRoutes');
const deliveryRequestRoutes = require('./routes/deliveryRequestRoutes');

const { processExpiredRequests } = require('./services/requestExpiryService');

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Create the shared HTTP server
const httpServer = http.createServer(app);

// Existing API route
app.get('/', (req, res) => {
  res.send('Delivery Management API is running');
});

// Existing REST APIs
app.use('/api/users', userRoute);
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/delivery-partners', deliveryPartnerRoutes);
app.use('/api/delivery-requests', deliveryRequestRoutes);

// Attach Socket.IO to the HTTP server
const io = new Server(httpServer, {
  cors: {
    origin: ['http://localhost:4200', 'http://localhost:4001'],
    methods: ['GET', 'POST'],
  },
});

// Make Socket.IO available to Express controllers
app.set('io', io);

// Handle Socket.IO connections
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  //Handle client subsribing to an order
  socket.on('join-order', (orderId) => {
    console.log('Received join-order event:', orderId);
    if (typeof orderId !== 'string') {
      return;
    }

    const roomName = `order:${orderId}`;

    socket.join(roomName);
    console.log(`${socket.id} joined ${roomName}`);
  });

  //Handle client leaving the room
  socket.on('leave-order', (orderId) => {
    if (typeof orderId !== 'string') {
      return;
    }

    socket.leave(`order:${orderId}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
  socket.on('join-restaurant', (restaurantId) => {
    if (typeof restaurantId !== 'string') return;

    const roomName = `restaurant:${restaurantId}`;

    socket.join(roomName);

    console.log(`Socket ${socket.id} joined ${roomName}`);
  });

  socket.on('leave-restaurant', (restaurantId) => {
    if (typeof restaurantId !== 'string') return;

    socket.leave(`restaurant:${restaurantId}`);
  });

  socket.on('join-partner', (partnerId) => {
    if (typeof partnerId !== 'string') return;

    const roomName = `partner:${partnerId}`;

    socket.join(roomName);

    console.log(`Socket ${socket.id} joined ${roomName}`);
  });

  socket.on('leave-partner', (partnerId) => {
    if (typeof partnerId !== 'string') return;

    socket.leave(`partner:${partnerId}`);
  });
});

//rooms for each restaurant

// Connect MongoDB, then start the server
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected successfully');

    httpServer.listen(PORT, () => {
      console.log(`Server is running on PORT ${PORT}`);

      setInterval(() => {
        processExpiredRequests();
      }, 10000);
    });
  })
  .catch((error) => {
    console.error('MongoDB connection failed:', error);
  });
