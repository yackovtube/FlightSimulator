class Runway {

    constructor(ID, type) {
        this.conectedTo = new Array();
        this.ID = ID;
        this.type = type;
        this.plane = null;
    }

}

Runway.TYPE = {
    //runway 1,2,3
    IN_BOUND: 0,
    //run way 4
    RUNWAY: 1,
    //runway 5
    POST_LANDING: 2,
    //runway 6,7
    TERMINAL_ENTRANCE: 3,
    //runway 8
    PRE_TAKEOFF: 4
}

module.exports = Runway;