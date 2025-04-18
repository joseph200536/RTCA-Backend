const express = require('express');
const router = express.Router();
const UserImageModel = require('../Models/userImageSchema');

router.get('/userImage/:imageId', async (req, res) => {
    try {
        const imageId = req.params.imageId;

        const image = await UserImageModel.findById(imageId);
        if (!image) {
            return res.status(404).json({ message: "Image not found" });
        }

        // Set the appropriate content type
        res.set('Content-Type', image.contentType);
        res.send(image.data); // Send the binary file data
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Internal Server Error" });
    }
});
module.exports = router;