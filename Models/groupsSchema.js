const mongoose = require('mongoose');

const groups = new mongoose.Schema({
    "groupName":{type:String, required:true},
    "createdBy":{type:String, required:true},
    "members":[{type:String,required:true}],
    "createdAt":{type:Date,default:Date.now},
});
const groupModel = mongoose.model("groups",groups);
module.exports = groupModel;