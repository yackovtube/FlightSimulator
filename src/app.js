const Airport = require('./airport');


class App {

    constructor() {
        this.airport = new Airport;
    }

    run() {

        setInterval(()=>{

            this.airport.addPlane((error) => {
                console.error('Unable to add plane to airport');
            });

        }, 2000);

    }
}


module.exports = App;