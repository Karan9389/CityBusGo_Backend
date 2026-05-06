import Driver from "../models/Driver.js";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';


//1. Register a new driver
export const registerDriver = async(req, res) => {
    try {
        const {name , phone, password} = req.body;

        //check if driver already exists
        const existingDriver = await Driver.findOne({phone});
        if(existingDriver){
            return res.status(400).json({message : 'Driver with this phone already exists'});
        }

        //hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

//create and save the new driver
        const newDriver = new Driver({
            name, 
            phone,
            password : hashedPassword
        });
        await newDriver.save();

        res.status(201).json({message : 'Driver registered successfully!'});
    }catch (error){
        console.log(error);
        res.status(500).json({message : 'Server error during registration'});
    }
};

// Login an existing driver
export const logindriver = async (req, res) => {
    try{
        const {phone, password} = req.body;

        //Find the driver
        const driver = await Driver.findOne({phone});
        if(!driver){
            return res.status(400).json({message: 'Invalid phone number or password'});
        }
        //compare ther password
        const isMatch = await bcrypt.compare(password, driver.password);
        if(!isMatch){
            return res.status(400).json({message:'Invalid phone number or password'});
        }

        //Generate a JWT Token (This keeps the driver logged in)
        //We use a fallback secret key declared in .env
        const jwtSecret = process.env.JWT_SECRET || 'super_secret_fallback_key';
        const token = jwt.sign({id : driver._id}, jwtSecret, {expiresIn: '7d'});

        //send back the token and driver info (excluding the password)
        res.status(200).json({
            message : 'Login successful',
            token,
            driver : {
                id : driver._id,
                name : driver.name,
                phone : driver.phone
            }
        });
    }catch(error){
        console.log(error);
        res.status(500).json({message : 'Server error during login'});
    }
}