import Route from '../models/Route.js';

// Search buses by starting location and destination
export const searchBuses = async (req, res) => {
  try {
    const { start, destination } = req.query;

    if (!start || !destination) {
      return res.status(400).json({ message: 'Both start and destination query parameters are required.' });
    }

    const startLower = start.toLowerCase().trim();
    const destLower = destination.toLowerCase().trim();

    const routes = await Route.find().populate('driver', 'name phone');

    const matchingBuses = routes.filter(route => {
      const stopsLower = route.stops.map(s => s.toLowerCase().trim());
      const startIndex = stopsLower.findIndex(s => s.includes(startLower) || startLower.includes(s));
      const destIndex = stopsLower.findIndex(s => s.includes(destLower) || destLower.includes(s));
      
      // Valid route if both stops exist and origin is before destination (or equal if user entered exact stop name match)
      return startIndex !== -1 && destIndex !== -1 && startIndex < destIndex;
    });

    const result = matchingBuses.map(r => ({
      routeId: r.routeId,
      startTime: r.startTime,
      endTime: r.endTime,
      stops: r.stops,
      isLive: r.isLive,
      lastLocation: r.lastLocation,
      driver: r.driver ? { name: r.driver.name, phone: r.driver.phone } : null
    }));

    res.status(200).json(result);
  } catch (error) {
    console.error('Error searching buses:', error);
    res.status(500).json({ message: 'Server error while searching buses' });
  }
};

// Get single bus details by routeId
export const getBusByRouteId = async (req, res) => {
  try {
    const { routeId } = req.params;
    const route = await Route.findOne({ routeId }).populate('driver', 'name phone');

    if (!route) {
      return res.status(404).json({ message: 'Bus route not found' });
    }

    res.status(200).json({
      routeId: route.routeId,
      startTime: route.startTime,
      endTime: route.endTime,
      stops: route.stops,
      isLive: route.isLive,
      lastLocation: route.lastLocation,
      driver: route.driver ? { name: route.driver.name, phone: route.driver.phone } : null
    });
  } catch (error) {
    console.error('Error fetching bus by routeId:', error);
    res.status(500).json({ message: 'Server error while fetching bus details' });
  }
};

// Get all buses/routes
export const getAllBuses = async (req, res) => {
  try {
    const routes = await Route.find().populate('driver', 'name phone');
    const result = routes.map(r => ({
      routeId: r.routeId,
      startTime: r.startTime,
      endTime: r.endTime,
      stops: r.stops,
      isLive: r.isLive,
      lastLocation: r.lastLocation,
      driver: r.driver ? { name: r.driver.name, phone: r.driver.phone } : null
    }));

    res.status(200).json(result);
  } catch (error) {
    console.error('Error fetching all buses:', error);
    res.status(500).json({ message: 'Server error while fetching buses' });
  }
};
