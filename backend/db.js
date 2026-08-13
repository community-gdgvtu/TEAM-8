const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const config = require('./config');
const User = require('./models/User');

const demoUsers = [
  {
    name: 'System Administrator',
    email: 'admin@wms.com',
    password: 'admin123',
    role: 'admin',
    phone: '+1-555-0101',
    assignedArea: 'City Center'
  },
  {
    name: 'Operations Manager',
    email: 'manager@wms.com',
    password: 'manager123',
    role: 'manager',
    phone: '+1-555-0102',
    assignedArea: 'Downtown'
  },
  {
    name: 'Collection Staff',
    email: 'staff@wms.com',
    password: 'staff123',
    role: 'staff',
    phone: '+1-555-0103',
    assignedArea: 'Industrial Area'
  },
  {
    name: 'John Citizen',
    email: 'citizen@wms.com',
    password: 'citizen123',
    role: 'citizen',
    phone: '+1-555-0104',
    assignedArea: 'Residential Area'
  }
];

const normalizeEmail = (email = '') => String(email).trim().toLowerCase();

const connectDB = async () => {
  const mongoUri = config.mongodb.uri;
  console.log('Attempting to connect to MongoDB...');
  try {
    await mongoose.connect(mongoUri);
    console.log('MongoDB connected successfully');
    return;
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    // If in development, fall back to an in-memory MongoDB instance
    if ((process.env.NODE_ENV || 'development') === 'development') {
      try {
        console.log('Falling back to in-memory MongoDB for development...');
        // lazy-require to avoid loading in production
        const { MongoMemoryServer } = require('mongodb-memory-server');
        const mongod = await MongoMemoryServer.create();
        const uri = mongod.getUri();
        await mongoose.connect(uri);
        console.log('Connected to in-memory MongoDB');
        return;
      } catch (memErr) {
        console.error('In-memory MongoDB startup error:', memErr.message);
      }
    }

    console.error('Please ensure MongoDB is running and the connection string is correct');
    process.exit(1);
  }
};

const ensureDemoUsers = async () => {
  try {
    if (mongoose.connection.readyState === 0) {
      await connectDB();
    }

    const userCount = await User.countDocuments();
    if (userCount > 0) {
      return await User.find({}, 'email role name').lean();
    }

    const usersToCreate = await Promise.all(
      demoUsers.map(async (userData) => ({
        ...userData,
        email: normalizeEmail(userData.email),
        password: await bcrypt.hash(userData.password, 10)
      }))
    );

    const created = await User.insertMany(usersToCreate);
    console.log('Created demo users for local login testing.');
    return created;
  } catch (error) {
    console.error('Demo user seeding failed:', error.message);
    throw error;
  }
};

module.exports = { connectDB, ensureDemoUsers };
module.exports.default = connectDB;
