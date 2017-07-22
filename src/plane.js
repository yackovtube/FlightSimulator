const uuidv1 = require('uuid/v1');

class Plane {

    constructor(prosses) {
        this.ID = uuidv1();
        this.prosses = prosses;
        this.prossesStartTime = new Date();
    }

}

Plane.PROSSES_TYPE = {
    LANDING: 0,
    TAKEOFF: 1,
    IN_TERMINAL: 2
}

module.exports = Plane; 