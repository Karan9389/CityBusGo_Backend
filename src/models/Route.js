import mongoose from 'mongoose';

const routeSchema = new mongoose.Schema({
  routeId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver',
    required: true
  },
  startTime: {
    type: String,
    required: true
  },
  endTime: {
    type: String,
    required: true
  },
  stops: [{
    type: String,
    required: true,
    trim: true
  }],
  isLive: {
    type: Boolean,
    default: false
  },
  lastLocation: {
    lat: { type: Number },
    lng: { type: Number },
    updatedAt: { type: Date, default: Date.now }
  }
}, { timestamps: true });

const Route = mongoose.model('Route', routeSchema);
export default Route;
