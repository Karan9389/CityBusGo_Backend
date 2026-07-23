import Driver from "../models/Driver.js";
import Route from "../models/Route.js";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// 1. Register a new driver
export const registerDriver = async (req, res) => {
  try {
    const { name, phone, password } = req.body;

    if (!name || !phone || !password) {
      return res.status(400).json({ message: 'All fields (name, phone, password) are required.' });
    }

    // Check if driver already exists
    const existingDriver = await Driver.findOne({ phone: phone.trim() });
    if (existingDriver) {
      return res.status(400).json({ message: 'Driver with this phone already exists' });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create and save the new driver
    const newDriver = new Driver({
      name: name.trim(),
      phone: phone.trim(),
      password: hashedPassword
    });
    await newDriver.save();

    res.status(201).json({ message: 'Driver registered successfully!' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

// 2. Login an existing driver
export const logindriver = async (req, res) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({ message: 'Phone number and password are required.' });
    }

    // Find the driver
    const driver = await Driver.findOne({ phone: phone.trim() });
    if (!driver) {
      return res.status(400).json({ message: 'Invalid phone number or password' });
    }

    // Compare the password
    const isMatch = await bcrypt.compare(password, driver.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid phone number or password' });
    }

    // Generate JWT Token
    const jwtSecret = process.env.JWT_SECRET || 'super_secret_fallback_key';
    const token = jwt.sign({ id: driver._id, role: 'driver' }, jwtSecret, { expiresIn: '7d' });

    // Fetch existing route configuration if available
    const route = await Route.findOne({ driver: driver._id });

    res.status(200).json({
      message: 'Login successful',
      token,
      driver: {
        id: driver._id,
        name: driver.name,
        phone: driver.phone
      },
      routeConfig: route ? {
        routeId: route.routeId,
        startTime: route.startTime,
        endTime: route.endTime,
        stops: route.stops
      } : null
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};