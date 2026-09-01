const express = require('express');
const cors = require('cors');
require('dotenv').config();
const mongoose = require('mongoose');

const userRoute = require('./routes/UserRoutes');
const restaurantRoutes = require('./routes/restaurantRoutes');
const orderRoutes = require('./routes/orderRoutes');
const deliveryPartnerRoutes = require('./routes/deliveryPartnerRoutes');
const deliveryRequestRoutes = require('./routes/deliveryRequestRoutes');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Delivery Management API is running');
});

app.use('/api/users', userRoute);
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/delivery-partners', deliveryPartnerRoutes);
app.use('/api/delivery-requests', deliveryRequestRoutes);

const PORT = 3000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected Sucesfully');
  })
  .catch((error) => {
    console.log('MongoDB connection failed: ', error);
  });

app.listen(PORT, () => {
  console.log(`Server is running on PORT: ${PORT}`);
});
