import express from 'express';
import { 
  adminLogin, 
  getAllDrivers, 
  getDriverById, 
  createDriver, 
  updateDriver, 
  deleteDriver 
} from '../controllers/adminController.js';
import { verifyAdminToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Public admin login
router.post('/login', adminLogin);

// Protected admin routes
router.get('/drivers', verifyAdminToken, getAllDrivers);
router.get('/drivers/:id', verifyAdminToken, getDriverById);
router.post('/drivers', verifyAdminToken, createDriver);
router.put('/drivers/:id', verifyAdminToken, updateDriver);
router.delete('/drivers/:id', verifyAdminToken, deleteDriver);

export default router;
