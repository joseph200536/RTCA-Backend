const express = require('express');
const friendsModel = require('../Models/friendsSchema'); 
const router = express.Router();

router.get('/friends/:userName', async (req, res) => {
    try {
        const { userName } = req.params;
        const userFriends = await friendsModel.findOne({ userName });

        if (!userFriends) {
            return res.status(404).json({ message: "No friends found for this user." });
        }
        res.status(200).json(userFriends.friendsName);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

module.exports = router;