const mongoose = require('mongoose');

const userDetails =new mongoose.Schema({
    "userName":{type:String,unique:true},
    "name":{type:String},
    "about":{type:String},
    "profilePic": { type: String }
});

const UserDetailsModel = mongoose.model("userdetails",userDetails);
module.exports = UserDetailsModel;