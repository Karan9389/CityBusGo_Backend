import Route from '../models/Route.js';

export const setupTrackingSocket = (io) => {
  io.on('connection', (socket) => {
    console.log(`🔌 New device connected: ${socket.id}`);

    // Driver location updates broadcast & database update
    socket.on('driver_update_location', async (data) => {
      try {
        const routeId = data.routeId || data.busId;
        if (!routeId) {
          console.warn('Received location update missing routeId');
          return;
        }

        const roomName = `route_${routeId}`;
        io.to(roomName).emit('bus_location_change', data);

        // Update database record for persistence
        if (data.lat !== undefined && data.lng !== undefined) {
          await Route.findOneAndUpdate(
            { routeId },
            { 
              isLive: true, 
              lastLocation: { 
                lat: data.lat, 
                lng: data.lng, 
                updatedAt: new Date(data.timestamp || Date.now()) 
              } 
            }
          );
        }
      } catch (err) {
        console.error('Error handling driver location update:', err.message);
      }
    });

    // Commuter joining real-time tracking for a bus route
    socket.on('commuter_join_tracking', async (routeId) => {
      if (!routeId) return;
      const roomName = `route_${routeId}`;
      socket.join(roomName);
      console.log(`📍 Device ${socket.id} joined tracking room: ${roomName}`);

      try {
        const route = await Route.findOne({ routeId });
        if (route && route.lastLocation && route.lastLocation.lat !== undefined) {
          socket.emit('bus_location_change', {
            routeId: route.routeId,
            lat: route.lastLocation.lat,
            lng: route.lastLocation.lng,
            timestamp: route.lastLocation.updatedAt ? route.lastLocation.updatedAt.getTime() : Date.now(),
            isLive: route.isLive
          });
        }
      } catch (err) {
        console.error('Error fetching initial location for commuter:', err.message);
      }
    });

    // Commuter leaving real-time tracking room
    socket.on('commuter_leave_tracking', (routeId) => {
      if (!routeId) return;
      const roomName = `route_${routeId}`;
      socket.leave(roomName);
      console.log(`🚪 Device ${socket.id} left tracking room: ${roomName}`);
    });

    // Driver stopping route tracking
    socket.on('driver_stop_tracking', async (routeId) => {
      if (!routeId) return;
      const roomName = `route_${routeId}`;
      io.to(roomName).emit('bus_status_change', { routeId, isLive: false });

      try {
        await Route.findOneAndUpdate({ routeId }, { isLive: false });
      } catch (err) {
        console.error('Error updating route live status on stop:', err.message);
      }
    });

    // Device disconnect handler
    socket.on('disconnect', () => {
      console.log(`❌ Device disconnected: ${socket.id}`);
    });
  });
};
