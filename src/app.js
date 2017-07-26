const Airport = require('./airport');
const Simulator = require('./simulator');

//add epress
//add socet.io

class App {

    constructor() {
        this.airport = new Airport;
        this.simulator = new Simulator;
    }

    run() {

        this.simulator.start((e) => {

            if (e.type == Simulator.EVENT.ADD_PLANE) {

                this.airport.addPlane((error) => {
                    console.error('Unable to add plane to airport');
                });
            }
        });

    }
}


module.exports = App;