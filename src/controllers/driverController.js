import Driver from '../models/Driver.js';
import Route from '../models/Route.js';
import bcrypt from 'bcrypt';

// Get profile and assigned route
export const getDriverProfile = async (req, res) => {
  try {
    const driver = req.driver;
    const route = await Route.findOne({ driver: driver._id });

    res.status(200).json({
      driver: {
        id: driver._id,
        name: driver.name,
        phone: driver.phone
      },
      routeConfig: route ? {
        routeId: route.routeId,
        startTime: route.startTime,
        endTime: route.endTime,
        stops: route.stops,
        isLive: route.isLive
      } : null
    });
  } catch (error) {
    console.error('Error fetching driver profile:', error);
    res.status(500).json({ message: 'Server error while fetching driver profile' });
  }
};

// Update driver details
export const updateDriverProfile = async (req, res) => {
  try {
    const driverId = req.driver._id;
    const { name, phone, password } = req.body;

    const updates = {};
    if (name) updates.name = name.trim();
    if (phone) {
      const existing = await Driver.findOne({ phone: phone.trim(), _id: { $ne: driverId } });
      if (existing) {
        return res.status(400).json({ message: 'Phone number is already in use by another driver.' });
      }
      updates.phone = phone.trim();
    }
    if (password && password.trim().length > 0) {
      const salt = await bcrypt.genSalt(10);
      updates.password = await bcrypt.hash(password.trim(), salt);
    }

    const updatedDriver = await Driver.findByIdAndUpdate(driverId, updates, { new: true }).select('-password');
    res.status(200).json({
      message: 'Profile updated successfully',
      driver: {
        id: updatedDriver._id,
        name: updatedDriver.name,
        phone: updatedDriver.phone
      }
    });
  } catch (error) {
    console.error('Error updating driver profile:', error);
    res.status(500).json({ message: 'Server error while updating profile' });
  }
};

// Save or update route configuration
export const saveRouteConfig = async (req, res) => {
  try {
    const driverId = req.driver._id;
    const { routeId, startTime, endTime, stops } = req.body;

    if (!routeId || !startTime || !endTime || !stops || !Array.isArray(stops) || stops.length === 0) {
      return res.status(400).json({ message: 'Please provide routeId, startTime, endTime, and at least one stop.' });
    }

    const cleanedRouteId = routeId.trim();
    const existingRoute = await Route.findOne({ routeId: cleanedRouteId, driver: { $ne: driverId } });
    if (existingRoute) {
      return res.status(400).json({ message: `Route ID '${cleanedRouteId}' is already assigned to another driver.` });
    }

    let route = await Route.findOne({ driver: driverId });

    if (route) {
      route.routeId = cleanedRouteId;
      route.startTime = startTime;
      route.endTime = endTime;
      route.stops = stops.map(s => s.trim());
      await route.save();
    } else {
      route = new Route({
        routeId: cleanedRouteId,
        driver: driverId,
        startTime,
        endTime,
        stops: stops.map(s => s.trim())
      });
      await route.save();
    }

    res.status(200).json({
      message: 'Route configuration saved successfully',
      routeConfig: {
        routeId: route.routeId,
        startTime: route.startTime,
        endTime: route.endTime,
        stops: route.stops,
        isLive: route.isLive
      }
    });
  } catch (error) {
    console.error('Error saving route configuration:', error);
    res.status(500).json({ message: 'Server error while saving route configuration' });
  }
};

// Get route config
export const getRouteConfig = async (req, res) => {
  try {
    const driverId = req.driver._id;
    const route = await Route.findOne({ driver: driverId });

    if (!route) {
      return res.status(404).json({ message: 'Route configuration not found for this driver.' });
    }

    res.status(200).json({
      routeId: route.routeId,
      startTime: route.startTime,
      endTime: route.endTime,
      stops: route.stops,
      isLive: route.isLive,
      lastLocation: route.lastLocation
    });
  } catch (error) {
    console.error('Error fetching route config:', error);
    res.status(500).json({ message: 'Server error while fetching route config' });
  }
};
