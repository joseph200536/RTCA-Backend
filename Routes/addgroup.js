const express = require('express');
const groupModel = require('../Models/groupsSchema');
const router = express.Router();

router.post('/groups/add/:userName', async (req, res) => {
    try{
        const userName = req.params.userName;
        const newGroup = await groupModel.create({groupName:req.body.groupName,members:req.body.friends,createdBy:userName});
        res.status(201).json(newGroup);
    }catch(err){
        console.error(err);
        res.status(500).json({message:"Internal Server Error"});
    }
})
module.exports = router;