
const mongoose = require('mongoose');

require('dotenv').config();

const mongodb_connection = mongoose.connect(process.env.MONGO_URL);

module.exports = {
    mongodb_connection
}