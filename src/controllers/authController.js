import Driver from "../models/Driver.js";
import Route from "../models/Route.js";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// 1. Register a new driver with optional route configuration
export const registerDriver = async (req, res) => {
  try {
    const { name, phone, password, routeId, startTime, endTime, stops, routeData } = req.body;

    if (!name || !phone || !password) {
      return res.status(400).json({ message: 'All fields (name, phone, password) are required.' });
    }

    const cleanPhone = phone.trim();
    // Check if driver already exists
    const existingDriver = await Driver.findOne({ phone: cleanPhone });
    if (existingDriver) {
      return res.status(400).json({ message: 'Driver with this phone already exists' });
    }

    // Determine route fields if passed directly or inside routeData
    const finalRouteId = (routeId || (routeData && routeData.routeId) || '').trim();
    const finalStartTime = startTime || (routeData && routeData.startTime) || '';
    const finalEndTime = endTime || (routeData && routeData.endTime) || '';
    const rawStops = stops || (routeData && routeData.stops) || [];
    const finalStops = Array.isArray(rawStops) ? rawStops.map(s => s.trim()).filter(Boolean) : [];

    // If routeId is provided, verify uniqueness
    if (finalRouteId) {
      const existingRoute = await Route.findOne({ routeId: finalRouteId });
      if (existingRoute) {
        return res.status(400).json({ message: `Route ID / Bus Number '${finalRouteId}' is already assigned to another driver.` });
      }
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create and save the new driver
    const newDriver = new Driver({
      name: name.trim(),
      phone: cleanPhone,
      password: hashedPassword
    });
    await newDriver.save();

    let createdRoute = null;
    // Create Route record in MongoDB if route details were provided
    if (finalRouteId && finalStops.length > 0) {
      createdRoute = new Route({
        routeId: finalRouteId,
        driver: newDriver._id,
        startTime: finalStartTime,
        endTime: finalEndTime,
        stops: finalStops
      });
      await createdRoute.save();
    }

    // Generate JWT Token
    const jwtSecret = process.env.JWT_SECRET || 'super_secret_fallback_key';
    const token = jwt.sign({ id: newDriver._id, role: 'driver' }, jwtSecret, { expiresIn: '7d' });

    res.status(201).json({
      message: 'Driver registered successfully!',
      token,
      driver: {
        id: newDriver._id,
        name: newDriver.name,
        phone: newDriver.phone
      },
      routeConfig: createdRoute ? {
        routeId: createdRoute.routeId,
        startTime: createdRoute.startTime,
        endTime: createdRoute.endTime,
        stops: createdRoute.stops
      } : null
    });
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