const Airport = require('./airport');
const Simulator = require('./simulator');
const Plane = require('./dal/models/plane.model')
const mongoose = require('mongoose');
const AirportRPS = require('./dal/repository/airport.repository');
const http = require('http');
const socketIO = require('socket.io')


// config
const HTTP_SERVER_PORT = 80;
const SOCKET_UPDATE_INTERVAL = 2000;


class App {
    constructor() {
        this.socket = null;
        this.httpServer = null;
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

    startHttpServer() {

        return new Promise((resolve, reject) => {

            this.httpServer = http.createServer((req, res) => {
                console.log('http request')
                res.writeHead(200);
                res.end();
            });

            this.httpServer.listen(HTTP_SERVER_PORT, () => {
                console.log('Http server is running on port: ' + HTTP_SERVER_PORT);
                this.socket = socketIO(this.httpServer);
                resolve();
            });

            this.httpServer.on('error', (err) => {
                console.error('Unable to start http serve', err);
                reject(err);
            })
        })

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

                return this.startHttpServer();


            })
            .then(() => {

                //setp 5: socket API

                //update airport loop
                setInterval(() => {
                    this.socket.emit('airportUpdate', this.airport.getState())
                }, SOCKET_UPDATE_INTERVAL)


                this.socket.on('connection', (socket) => {

                    console.log('User Connected');

                    socket.on('closeRunway', (id) => {
                        this.airport.setRunwayStatus(id, 1);
                    });
                    
                    socket.on('openRunway', (id) => {
                         this.airport.setRunwayStatus(id, 0);
                    });
                });


            })
            .catch((err) => {
                process.exit(1);
            })

    }

}


module.exports = App;