const mongoose = require('mongoose');

const friendsMessage = new mongoose.Schema({
    "from":{type:String,required:true},
    "to":{type:String,required:true},
    "message":{type:String,required:true},
    "time":{type:Date,default:Date.now}
});
const friendsMessageModel = mongoose.model("friendsMessage",friendsMessage);
module.exports = friendsMessageModel;