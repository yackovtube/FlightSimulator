const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const runwaySchema = mongoose.Schema({
    //runway number
    tag : Number,
    //what runways is this runway connected to
    conectedTo:  [{ type:Schema.Types.ObjectId, ref: 'Runway'}],
    //type of runway
    type: Number,
    //plane if any
    plane: {type:Schema.Types.ObjectId, ref: 'Plane'},
    //status
    status: { type: Number, default : 0 }
});

const Runway = mongoose.model('Runway', runwaySchema);

Runway.STATUS_TYPE = {
    OPEN : 0,
    CLOSED: 1
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
