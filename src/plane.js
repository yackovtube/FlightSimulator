const uuidv1 = require('uuid/v1');

class Plane {

    constructor(mission) {
        this.ID = uuidv1();
        this.mission = mission;
        this.missionStartTime = new Date();
    }

}

Plane.MISSION_TYPE = {
    LANDING: 0,
    TAKEOFF: 1,
    IN_TERMINAL: 2
}

module.exports = Plane; 