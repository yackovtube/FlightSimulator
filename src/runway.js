class Runway {

    constructor(ID,type) {
        this.conectedTo = new Array();
        this.ID = ID;
        this.type = type;
        this.plane = null;
    }

}

Runway.TYPE = {
    IN_BOUND: 0,
    RUNWAY: 1,
    POST_LANDING: 2,
    TERMINAL_ENTRANCE: 3,
    PRE_TAKEOFF: 4
}

module.exports = Runway;