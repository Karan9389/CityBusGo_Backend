import express from 'express';
import { searchBuses, getBusByRouteId, getAllBuses } from '../controllers/busController.js';

const router = express.Router();

router.get('/search', searchBuses);
router.get('/all', getAllBuses);
router.get('/:routeId', getBusByRouteId);
router.get('/', getAllBuses);

export default router;
