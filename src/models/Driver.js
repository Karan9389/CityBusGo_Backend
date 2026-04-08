import mongoose from "mongoose";
//This is the Schema of the Driver that is used to authentication.
const driverSchema = new mongoose.Schema({
    name : {
        type : String,
        required : true,
        trim : true
    },
    phone : {
        type : String,
        unique: true, // Prevent two driver from using the same phone number.
        required : true,
        trim : true
    },
    password : {
        type : String,
        required : true
    }
}, {timestamps : true});

//create and export the model
const Driver = mongoose.model('Driver',driverSchema);
export default Driver;