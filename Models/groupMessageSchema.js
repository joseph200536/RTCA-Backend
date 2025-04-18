const mongoose = require('mongoose');

const groupMessage = new mongoose.Schema({
    "groupName":{type:String,required:true},
    "from":{type:String,required:true},
    "members":[{type:String,required:true}],
    "message":{type:String,required:true},
    "time":{type:Date,default:Date.now}
});
const groupMessageModel = mongoose.model("groupmessage",groupMessage);
module.exports = groupMessageModel;