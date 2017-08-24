const mongoose = require('mongoose');

const planeSchema = mongoose.Schema({
    mission: Number,
    missionStartTime: Date
});

const Plane = mongoose.model('Plane', planeSchema);


Plane.MISSION_TYPE = {
    LANDING: 0,
    TAKEOFF: 1,
    IN_TERMINAL: 2,
    EMERGENCY_LANDING: 4
}


module.exports = Plane;