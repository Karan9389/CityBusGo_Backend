import express from 'express';
import { registerDriver, loginDriver } from '../controllers/authController.js';

const router = express.Router();

//Define the routes
//Post /api/auth/register

router.post('/register', registerDriver);

//POST /api/auth/login
router.post('/login', loginDriver);

export default router;