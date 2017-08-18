const _ = require('lodash');
const Runway = require('./dal/models/runway.model');
const Plane = require('./dal/models/plane.model');
const Message = require('./message');
const RunwayRepository = require('./dal/repository/runway.repository');
const AirportRepository = require('./dal/repository/airport.repository');
const PlaneRepository = require('./dal/repository/plane.repository');

const TERMINAL_WAIT_DELAY_MAX = 10000;
const TERMINAL_WAIT_DELAY_MIN = 0;

class Airport {

    //our constructor we start the runways 
    constructor(airportData) {

        this.inProsses = false;

        this.airportData = airportData;
        this.messages = Array();

        this.interval = null;

        //helping data stracher for runways
        this.runways = {}// airportData.runways;
        this.runways[1] = _.find(this.airportData.runways, { tag: 1 });
        this.runways[2] = _.find(this.airportData.runways, { tag: 2 });
        this.runways[3] = _.find(this.airportData.runways, { tag: 3 });
        this.runways[4] = _.find(this.airportData.runways, { tag: 4 });
        this.runways[5] = _.find(this.airportData.runways, { tag: 5 });
        this.runways[6] = _.find(this.airportData.runways, { tag: 6 });
        this.runways[7] = _.find(this.airportData.runways, { tag: 7 });
        this.runways[8] = _.find(this.airportData.runways, { tag: 8 });

        this.exitTerminalRunways = [this.runways[6], this.runways[7]];
        //helping data stracher for runways - END

        //we create a connect graph 
        //populate graph using map and lodash to go over each runway.connectdTo ids and pull runway model  
        let runwaysArray = this.airportData.runways.toObject();
        for (let i in runwaysArray) {
            let runway = runwaysArray[i];

            // Note: Populate connectedTo with map
            // runway.conectedTo = runway.conectedTo.map((runwayId) => {
            //     return _.find(airportData.runways, function (o) { return o._id.equals(runwayId); });
            // });

            let populateConnectedTo = [];
            let conectedToArrayId = runway.conectedTo.toObject();
            for (let j in conectedToArrayId) {
                let runwayId = conectedToArrayId[j];
                populateConnectedTo.push(_.find(airportData.runways, function (o) {
                    return o._id.equals(runwayId);
                }));
            }
            runway.conectedTo = populateConnectedTo;
        }



        //start terminal array 
        this.terminal = this.airportData.terminal.toObject().map((planeId) => {
            _.find(airportData.planes, (o) => { return o._id === planeId });
        });


        this._onInit();
    }

    _onInit() {
        this.start();
    }

    //recurecive message (action q) handleing
    handelMessages(messages) {
        return new Promise((resolve, reject) => {

            if (messages.length) {
                let message = messages.pop();
                let handledActionPromise;

                switch (message.type) {
                    case Message.TYPE.ADD_PLANE:
                        handledActionPromise = this._addPlaneAction(message)
                            .catch((err) => {
                                console.error('Unable to add plaine to the ariport');
                                return null; //resolve promise
                            });
                        break;
                    case Message.TYPE.MOVE:
                        handledActionPromise = this._moveAction(message)
                            .catch((err)=>{
                                console.error('unable to move planes');
                                return null;
                            })
                        break;
                    // case Message.TYPE.MOVE_TO_TERMINAL:
                    //     handledActionPromise = this._moveToTerminalAction(message)
                    //     break;
                    // case Message.TYPE.TAKE_OFF:
                    //     handledActionPromise = this._takeOffAction(message)
                    //     break;
                    // case Message.TYPE.EXIT_TERMINAL:
                    //     handledActionPromise = this._exitFromTerminalAction(message)
                    //     break;
                }

                if (!handledActionPromise) {
                    console.warn('Unable to resolve action type ' + message.type, message)
                    resolve(this.handelMessages(messages));
                }
                else {
                    handledActionPromise
                        .then(() => {
                            resolve(this.handelMessages(messages));
                        })
                }

            }
            //Recuersion end
            else {
                resolve();
            }
        })


    }

    //take care of all the messages
    start() {
        if (!this.interval)
            this.interval = setInterval(() => {

                //semaphore
                if (this.inProsses) {
                    return;
                }

                if (this.messages.length === 0) {
                    return;
                }

                this.inProsses = true;
                this.handelMessages(this.messages)
                    .then(() => {

                        this.inProsses = false;

                        this.messages = new Array;
                        let now = Date.now();


                        //trminal logic (chack planes that need to take of)
                        let canExitTerminal = true;
                        for (let i in this.exitTerminalRunways) {
                            let runway = this.exitTerminalRunways[i];
                            if (runway.plane && runway.plane.prosses == Plane.MISSION_TYPE.TAKEOFF) {
                                canExitTerminal = false;
                                break;
                            }
                        }

                        if (canExitTerminal) {
                            for (let i in this.terminal) {
                                let plane = this.terminal[i].plane;
                                let delay = this.terminal[i].delay;
                                let exitTime = plane.prossesStartTime.getTime() + delay;
                                if (now < exitTime)
                                    this.messages.push(new Message(Message.TYPE.EXIT_TERMINAL, plane));

                            }
                        }
                        let freeRunwaires = _.clone(this.runways);

                        if (this.runways[8].plane && this.runways[3].plane) {
                            _.remove(freeRunwaires, function (runway) {
                                return runways.ID == runway[3].ID;
                            })
                        }


                        //run way logic
                        for (let ID in freeRunwaires) {
                            let fromRunway = freeRunwaires[ID];

                            //if we have a plane in the runway
                            if (fromRunway.plane) {

                                if (fromRunway.type == Runway.TYPE.TERMINAL_ENTRANCE && fromRunway.plane.prosses == Plane.MISSION_TYPE.LANDING) {
                                    this.messages.push(new Message(Message.TYPE.MOVE_TO_TERMINAL, fromRunway));
                                }
                                else if (fromRunway.type == Runway.TYPE.RUNWAY && fromRunway.plane.prosses == Plane.MISSION_TYPE.TAKEOFF) {
                                    this.messages.push(new Message(Message.TYPE.TAKE_OFF, fromRunway));
                                }
                                else {

                                    for (let i = 0; i < fromRunway.conectedTo.length; ++i) {
                                        let toRunway = fromRunway.conectedTo[i];
                                        if (!toRunway.plane) {

                                            this.messages.push(new Message(Message.TYPE.MOVE, {
                                                from: fromRunway,
                                                to: toRunway
                                            }));
                                            break;
                                        }

                                    }
                                }


                            }

                        }

                    })
            }, 1000);
    }

    stop() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }

    _exitFromTerminalAction(message) {
        let plane = message.data;

        for (let i in this.exitTerminalRunways) {
            let runway = this.exitTerminalRunways[i];

            if (!runway.plane) {
                runway.plane = plane;

                _.remove(this.terminal, function (p) {
                    return plane.ID == p.ID;
                })
                console.log('Plane ' + plane.ID + ' is exiting the terminal and moved to runway ' + runway.ID)
                plane.prosses = Plane.MISSION_TYPE.TAKEOFF;
                plane.prossesStartTime = new Date();
                break;
            }
        }


    }

    _takeOffAction(message) {
        let runway = message.data;
        console.log('plane ' + runway.plane.ID + ' took off from ' + runway.ID);
        runway.plane = null;
    }

    _moveToTerminalAction(message) {
        let runway = message.data;
        runway.plane.prosses = Plane.MISSION_TYPE.IN_TERMINAL;
        runway.plane.prossesStartTime = new Date();
        console.log('plane ' + runway.plane.ID + ' moved from ' + runway.ID + ' to terminal')

        this.terminal.push({
            plane: runway.plane,
            delay: Math.floor((Math.random() * TERMINAL_WAIT_DELAY_MAX) + TERMINAL_WAIT_DELAY_MIN)
        });

        runway.plane = null;
    }

    _moveAction(message) {
        return new Promise((resolve, reject) => {


            let fromRunway = message.data.from;
            let toRunway = message.data.to;
            if (fromRunway.plane && !toRunway.plane) {
                //update DB

                Promise.all([
                    RunwayRepository.update(toRunway._id, { plane: fromRunway.plane }),
                    RunwayRepository.update(fromRunway._id, { plane: null }
                    )])
                    //update current instance
                    .then(() => {
                        console.log('plane ' + fromRunway.plane + ' moved from ' + fromRunway.tag + ' to ' + toRunway.tag);
                        toRunway.plane = fromRunway.plane;
                        fromRunway.plane = null;
                        resolve();
                    })
                    .catch((err) => {
                        reject(err);
                    })

            }
            else {
                reject(new Error('invalid message unable to move plane'));
            }
        })
    }

    //the function to resolve add plane massege
    _addPlaneAction(message) {

        return new Promise((resolve, reject) => {

            let runway = this.runways[1];

            if (runway.plane) {
                reject(new Error('unable to exption'));
            }
            else {

                let _plane;

                //create plane 
                PlaneRepository.create(message.data)
                    .then((plane) => {
                        _plane = plane
                        console.log('Plane ' + plane._id + ' was created');

                        //update runway
                        return Promise.all([
                            RunwayRepository.update(runway._id, { plane: plane._id }),
                            AirportRepository.addPlane(this.airportData._id, plane)
                        ])

                    })
                    .then(() => {
                        //update curent instances
                        runway.plane = _plane._id;
                        this.airportData.planes.push(_plane);

                        resolve();
                    })
                    .catch((err) => {
                        reject(err);
                    })

            }
        });
    }

    initRunway() {

    }

    //makes a request andd adds the request to our array called messages
    addPlane(cb) {
        this.messages.push(new Message(Message.TYPE.ADD_PLANE, new Plane(Plane.MISSION_TYPE.LANDING)))
    }

    careateDesaster(type, ranwayNum) {

    }

}

module.exports = Airport;