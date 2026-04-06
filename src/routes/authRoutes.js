import express from 'express';
import { registerDriver, logindriver } from '../controllers/authController';

const router = express.Router();

//Define the routes
//Post /api/auth/register

router.post('/register', registerDriver);

//POST /api/auth/login
router.post('/login', logindriver);

export default router;