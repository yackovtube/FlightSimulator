const Airport = require('./airport');
const Simulator = require('./simulator');
const Plane = require('./dal/models/plane.model')
const mongoose = require('mongoose');
const AirportRPS = require('./dal/repository/airport.repository');


//add epress
//add socet.io

class App {
    constructor() {
        this.airport = null;
        this.simulator = new Simulator;
    }

    connectToDb() {

        return new Promise((resolve, reject) => {

            mongoose.connect('mongodb://localhost/airport');
            var db = mongoose.connection;

            db.on('error', (err) => {
                console.error('connection error:', err);
                reject(err);
            });

            db.once('open', function () {
                console.log('Conected to DB !')
                resolve(db);
            })

        });
    }

    loadAirport() {
        return AirportRPS.findAll()
            .then((docs) => {
                if (docs[0]) {
                    return docs[0];
                }

                return AirportRPS.create();
            });
    }

    run() {

        //step 1: conect to db
        this.connectToDb()
            .then(() => {
                //step 2: load airport
                return this.loadAirport();
            })
            .then((airportData) => {
            
                //step 3: init logic (airport)
                this.airport = new Airport(airportData);

                //step 4: run simulator

                this.simulator.start((e) => {

                    if (e.type == Simulator.EVENT.ADD_PLANE) {

                        this.airport.addPlane((error) => {
                            console.error('Unable to add plane to airport');
                        });
                    }
                });

            })
            .catch((err) => {
                process.exit(1);
            })




    }
}


module.exports = App;