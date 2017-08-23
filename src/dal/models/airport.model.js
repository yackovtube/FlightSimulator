const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TerminalSpotSchema = mongoose.Schema({
    plane: { type: Schema.Types.ObjectId, ref: 'Plane' },
    delay: { type: Number }
});

const AirportSchema = mongoose.Schema({
    runways: [{ type: Schema.Types.ObjectId, ref: 'Runway' }],
    terminal: [TerminalSpotSchema],
    exitTerminalRunways: [{ type: Schema.Types.ObjectId, ref: 'Runway' }],
    planes: [{ type: Schema.Types.ObjectId, ref: 'Plane' }],
    speed: Number
});
const Airport = mongoose.model('Airport', AirportSchema);

Airport.SPEED = {
    FAST: 0,
    SLOW: 1
}


module.exports = Airport;
