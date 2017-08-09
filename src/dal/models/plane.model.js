const mongoose = require('mongoose');

const planeSchema = mongoose.Schema({
    mission: Number,
    missionStartTime: Date
});

const Plane = mongoose.model('Plane', planeSchema);

module.exports = Plane;