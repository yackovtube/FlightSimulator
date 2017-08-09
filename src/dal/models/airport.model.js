const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const AirportSchema = mongoose.Schema({
    runways:  [{ type:Schema.Types.ObjectId, ref: 'Runway'}],
    terminal: [{ type:Schema.Types.ObjectId, ref: 'Plane'}],
    exitTerminalRunways: [{ type:Schema.Types.ObjectId, ref: 'Runway'}]
});

const Airport = mongoose.model('Airport', AirportSchema);

module.exports = Airport;
