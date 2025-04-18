const express = require('express');
const router = express.Router();
const UserImageModel = require('../Models/userImageSchema');
const UserDetailsModel = require('../Models/userDetailsSchema');
const multer = require('multer');

// Configure Multer for file uploads
const storage = multer.memoryStorage(); // Store files in memory as buffers
const upload = multer({ storage: storage });

// Upload profile picture
router.post('/uploadProfilePic', upload.single('profilePic'), async (req, res) => {
    try { 
        const { user } = req.body;
        const file = req.file; // Access the uploaded file

        if (!file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        let image;
        const existingImage = await UserImageModel.findOne({ username: user });

        if (existingImage) {
            // Update the existing image
            existingImage.filename = file.originalname;
            existingImage.contentType = file.mimetype;
            existingImage.data = file.buffer;
            await existingImage.save();
            image = existingImage;
        } else {
            // Create a new image entry
            const newImage = new UserImageModel({
                username: user,
                filename: file.originalname,
                contentType: file.mimetype,
                data: file.buffer,
            });
            await newImage.save();
            image = newImage;
        }

        // Update the user's profile picture in the database
        const profilePicUrl = `/api/userImage/${image.username}`;

        res.status(200).json({ 
            message: "Profile picture updated successfully", 
            profilePic: profilePicUrl 
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

// Retrieve profile picture by username
router.get('/userImage/:username', async (req, res) => {
    try {
        const username = req.params.username;

        // Find the image by username
        const image = await UserImageModel.findOne({ username });
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