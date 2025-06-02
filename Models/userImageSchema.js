const mongoose = require('mongoose');

const userImageSchema = new mongoose.Schema({
    userName: { type: String, required: true }, // Store the username instead of userId
    filename: { type: String, required: true }, // Original filename
    contentType: { type: String, required: true }, // MIME type (e.g., image/jpeg)
    data: { type: Buffer, required: true }, // Binary file data
    uploadDate: { type: Date, default: Date.now },
})
const userImageModel = mongoose.model('userimage',userImageSchema);
module.exports = userImageModel;