import express from 'express';
import { 
  getDriverProfile, 
  updateDriverProfile, 
  saveRouteConfig, 
  getRouteConfig,
  deleteRouteConfig
} from '../controllers/driverController.js';
import { verifyDriverToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(verifyDriverToken);

router.get('/profile', getDriverProfile);
router.put('/profile', updateDriverProfile);
router.post('/route', saveRouteConfig);
router.get('/route', getRouteConfig);
router.delete('/route', deleteRouteConfig);

export default router;
