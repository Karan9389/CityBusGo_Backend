import Admin from '../models/Admin.js';
import Driver from '../models/Driver.js';
import Route from '../models/Route.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// Admin Login
export const adminLogin = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required.' });
    }

    const envAdminUser = process.env.ADMIN_USERNAME || 'admin';
    const envAdminPass = process.env.ADMIN_PASSWORD || 'admin123';

    let isAdminValid = false;
    let adminPayload = null;

    if (username === envAdminUser && password === envAdminPass) {
      isAdminValid = true;
      adminPayload = { username: envAdminUser, role: 'admin' };
    } else {
      const admin = await Admin.findOne({ username: username.trim() });
      if (admin) {
        const isMatch = await bcrypt.compare(password, admin.password);
        if (isMatch) {
          isAdminValid = true;
          adminPayload = { id: admin._id, username: admin.username, role: 'admin' };
        }
      }
    }

    if (!isAdminValid) {
      return res.status(400).json({ message: 'Invalid admin credentials' });
    }

    const jwtSecret = process.env.JWT_SECRET || 'super_secret_fallback_key';
    const token = jwt.sign(adminPayload, jwtSecret, { expiresIn: '7d' });

    res.status(200).json({
      message: 'Admin login successful',
      token,
      admin: adminPayload
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ message: 'Server error during admin login' });
  }
};

// Get all drivers with their route details
export const getAllDrivers = async (req, res) => {
  try {
    const drivers = await Driver.find().select('-password').sort({ createdAt: -1 });
    const routes = await Route.find();

    const routeMap = new Map();
    routes.forEach(r => {
      routeMap.set(r.driver.toString(), {
        routeId: r.routeId,
        startTime: r.startTime,
        endTime: r.endTime,
        stops: r.stops,
        isLive: r.isLive,
        lastLocation: r.lastLocation
      });
    });

    const result = drivers.map(driver => ({
      id: driver._id,
      name: driver.name,
      phone: driver.phone,
      createdAt: driver.createdAt,
      routeConfig: routeMap.get(driver._id.toString()) || null
    }));

    res.status(200).json(result);
  } catch (error) {
    console.error('Error fetching drivers for admin:', error);
    res.status(500).json({ message: 'Server error while fetching drivers' });
  }
};

// Get specific driver details by ID
export const getDriverById = async (req, res) => {
  try {
    const { id } = req.params;
    const driver = await Driver.findById(id).select('-password');
    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    const route = await Route.findOne({ driver: id });

    res.status(200).json({
      id: driver._id,
      name: driver.name,
      phone: driver.phone,
      createdAt: driver.createdAt,
      routeConfig: route ? {
        routeId: route.routeId,
        startTime: route.startTime,
        endTime: route.endTime,
        stops: route.stops,
        isLive: route.isLive,
        lastLocation: route.lastLocation
      } : null
    });
  } catch (error) {
    console.error('Error fetching driver by ID:', error);
    res.status(500).json({ message: 'Server error while fetching driver' });
  }
};

// Admin create new driver
export const createDriver = async (req, res) => {
  try {
    const { name, phone, password, routeId, startTime, endTime, stops } = req.body;

    if (!name || !phone || !password) {
      return res.status(400).json({ message: 'Name, phone, and password are required.' });
    }

    const existingDriver = await Driver.findOne({ phone: phone.trim() });
    if (existingDriver) {
      return res.status(400).json({ message: 'Driver with this phone number already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password.trim(), salt);

    const newDriver = new Driver({
      name: name.trim(),
      phone: phone.trim(),
      password: hashedPassword
    });
    await newDriver.save();

    let routeConfig = null;
    if (routeId && startTime && endTime && stops && Array.isArray(stops)) {
      const newRoute = new Route({
        routeId: routeId.trim(),
        driver: newDriver._id,
        startTime,
        endTime,
        stops: stops.map(s => s.trim())
      });
      await newRoute.save();
      routeConfig = {
        routeId: newRoute.routeId,
        startTime: newRoute.startTime,
        endTime: newRoute.endTime,
        stops: newRoute.stops
      };
    }

    res.status(201).json({
      message: 'Driver created successfully',
      driver: {
        id: newDriver._id,
        name: newDriver.name,
        phone: newDriver.phone,
        routeConfig
      }
    });
  } catch (error) {
    console.error('Error creating driver:', error);
    res.status(500).json({ message: 'Server error while creating driver' });
  }
};

// Admin update driver and route
export const updateDriver = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, password, routeId, startTime, endTime, stops } = req.body;

    const driver = await Driver.findById(id);
    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    if (phone) {
      const existing = await Driver.findOne({ phone: phone.trim(), _id: { $ne: id } });
      if (existing) {
        return res.status(400).json({ message: 'Phone number already in use.' });
      }
      driver.phone = phone.trim();
    }
    if (name) driver.name = name.trim();
    if (password && password.trim().length > 0) {
      const salt = await bcrypt.genSalt(10);
      driver.password = await bcrypt.hash(password.trim(), salt);
    }
    await driver.save();

    let route = await Route.findOne({ driver: id });

    if (routeId && startTime && endTime && stops && Array.isArray(stops)) {
      if (route) {
        route.routeId = routeId.trim();
        route.startTime = startTime;
        route.endTime = endTime;
        route.stops = stops.map(s => s.trim());
        await route.save();
      } else {
        route = new Route({
          routeId: routeId.trim(),
          driver: id,
          startTime,
          endTime,
          stops: stops.map(s => s.trim())
        });
        await route.save();
      }
    }

    res.status(200).json({
      message: 'Driver updated successfully',
      driver: {
        id: driver._id,
        name: driver.name,
        phone: driver.phone,
        routeConfig: route ? {
          routeId: route.routeId,
          startTime: route.startTime,
          endTime: route.endTime,
          stops: route.stops
        } : null
      }
    });
  } catch (error) {
    console.error('Error updating driver:', error);
    res.status(500).json({ message: 'Server error while updating driver' });
  }
};

// Admin delete driver
export const deleteDriver = async (req, res) => {
  try {
    const { id } = req.params;
    const driver = await Driver.findByIdAndDelete(id);

    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    await Route.deleteMany({ driver: id });

    res.status(200).json({ message: 'Driver and associated route configuration deleted successfully.' });
  } catch (error) {
    console.error('Error deleting driver:', error);
    res.status(500).json({ message: 'Server error while deleting driver' });
  }
};
