const express = require('express');
const groupModel = require('../Models/groupsSchema');
const router = express.Router();

router.get('/groups/:userName', async (req, res) => {
    try {
        const { userName } = req.params;
        const userGroups = await groupModel.find({ members:userName });

        if (!userGroups.length) {
            return res.status(404).json({ message: "No groups found for this user." });
        }
        res.status(200).json(userGroups);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

module.exports = router;