const mongoose = require('mongoose');

const friends = new mongoose.Schema({
    "userName":{type:String,unique:true,required:true},
    "friendsName":[{type:String,required:true}],
});
const friendsModel = mongoose.model("friends",friends);
module.exports = friendsModel;