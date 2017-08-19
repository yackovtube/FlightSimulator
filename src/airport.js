const _ = require('lodash');
const Runway = require('./dal/models/runway.model');
const Plane = require('./dal/models/plane.model');
const Message = require('./message');
const RunwayRepository = require('./dal/repository/runway.repository');
const AirportRepository = require('./dal/repository/airport.repository');
const PlaneRepository = require('./dal/repository/plane.repository');

const TERMINAL_WAIT_DELAY_MAX = 2000;
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
        // this.terminal = this.airportData.terminal.toObject().map((planeId) => {
        //     _.find(airportData.planes, (o) => { return o._id === planeId });
        // });
        this.terminal = this.airportData.terminal;


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
                            .catch((err) => {
                                console.error('unable to move planes');
                                return null;
                            })
                        break;
                    case Message.TYPE.MOVE_TO_TERMINAL:
                        handledActionPromise = this._moveToTerminalAction(message)
                            .catch((err) => {
                                console.error('unable to move plane to trminal');
                                return null;
                            })
                        break;
                    case Message.TYPE.TAKE_OFF:
                        handledActionPromise = this._takeOffAction(message)
                            .catch((err) => {
                                console.error('unable to move take off');
                                return null;
                            })
                        break;
                    case Message.TYPE.EXIT_TERMINAL:
                        handledActionPromise = this._exitFromTerminalAction(message)
                            .catch((err) => {
                                console.error('unable to move exit terminal');
                                return null;
                            })
                        break;
                }

                if (!handledActionPromise) {
                    console.warn('Unable to resolve action type ' + message.type, message)
                    resolve(this.handelMessages(messages))

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
                        for (let i = 0; i < this.exitTerminalRunways.length; ++i) {
                            let runway = this.exitTerminalRunways[i];
                            let plane = _.find(this.airportData.planes, (o) => { return o._id.equals(runway.plane) });
                            if (plane && plane.mission == Plane.MISSION_TYPE.TAKEOFF) {
                                canExitTerminal = false;
                                break;
                            }
                        }

                        if (canExitTerminal) {
                            for (let i = 0; i < this.terminal.length; ++i) {
                                let plane = _.find(this.airportData.planes, (o) => { return o._id.equals(this.terminal[i].plane) });
                                let delay = this.terminal[i].delay;
                                let exitTime = plane.missionStartTime.getTime() + delay;
                                if (now < exitTime)
                                    this.messages.push(new Message(Message.TYPE.EXIT_TERMINAL, plane._id));

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

                                let plane = _.find(this.airportData.planes, (o) => { return o._id.equals(fromRunway.plane) });

                                if (fromRunway.type == Runway.TYPE.TERMINAL_ENTRANCE && plane.mission == Plane.MISSION_TYPE.LANDING) {
                                    this.messages.push(new Message(Message.TYPE.MOVE_TO_TERMINAL, fromRunway));
                                }
                                else if (fromRunway.type == Runway.TYPE.RUNWAY && plane.mission == Plane.MISSION_TYPE.TAKEOFF) {
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
        return new Promise((resolve, reject) => {

            let plane = _.find(this.airportData.planes, (o) => { return o._id.equals(message.data) });
            let counter = 0;

            for (let i = 0; i < this.exitTerminalRunways.length; i++) {
                let runway = this.exitTerminalRunways[i];

                if (!runway.plane) {
                    runway.plane = plane;
                    let now = new Date();

                    //update db
                    Promise.all([
                        RunwayRepository.update(runway._id, { plane: plane._id }),
                        AirportRepository.removePlaneFromTerminal(this.airportData._id, plane._id),
                        PlaneRepository.update(plane, { mission: Plane.MISSION_TYPE.TAKEOFF, missionStartTime: now })])
                        .then(() => {
                            console.log('Plane ' + plane._id + ' is exiting the terminal and moved to runway ' + runway.tag);

                            _.remove(this.terminal, function (o) { return plane._id.equals(o.plane) });
                            plane.mission = Plane.MISSION_TYPE.TAKEOFF;
                            plane.missionStartTime = now;
                            runway.plane = plane._id
                            resolve();
                        })
                        .catch((err) => {
                            reject(err);
                        });
                    break;
                }
                else {
                    counter++;
                }
            }
            //no availbale runways
            if (counter == this.exitTerminalRunways.length) {
                resolve();
            }
        })


    }

    _takeOffAction(message) {
        return new Promise((resolve, reject) => {
            let runway = message.data;
            Promise.all([
                AirportRepository.removePlane(this.airportData._id, runway.plane),
                PlaneRepository.delete(runway.plane._id),
                RunwayRepository.update(runway._id, { plane: null })
            ])
                .then(() => {
                    console.log('plane ' + runway.plane + ' took off from ' + runway.tag);
                    runway.plane = null;
                    _.remove(this.airportData.planes, (o) => { return o._id.equals(runway.plane) })
                    resolve()
                }).catch((err) => {
                    reject(err);
                })
        })
    }

    _moveToTerminalAction(message) {
        return new Promise((resolve, reject) => {

            let runway = message.data;
            let plane = _.find(this.airportData.planes, (o) => { return o._id.equals(runway.plane) });
            let missionStartTime = new Date;
            let delay = Math.floor((Math.random() * TERMINAL_WAIT_DELAY_MAX) + TERMINAL_WAIT_DELAY_MIN);

            //update database 
            Promise
                .all([
                    PlaneRepository.update(plane._id, { mission: Plane.MISSION_TYPE.IN_TERMINAL, missionStartTime: missionStartTime }),
                    AirportRepository.addPlaneToTerminal(this.airportData._id, plane._id, delay),
                    RunwayRepository.update(runway._id, { plane: null })
                ])
                //update instance
                .then(() => {

                    console.log('plane ' + plane._id + ' moved from ' + runway.tag + ' to terminal');

                    plane.mission = Plane.MISSION_TYPE.IN_TERMINAL;
                    plane.missionStartTime = missionStartTime;
                    runway.plane = null;
                    this.terminal.push({ plane: plane._id, delay: delay });
                    resolve();

                })
                .catch((err) => {
                    reject(err);
                });
        })
    }

    _moveAction(message) {
        return new Promise((resolve, reject) => {


            let fromRunway = message.data.from;
            let toRunway = message.data.to;
            if (fromRunway.plane && !toRunway.plane) {
                //update DB

                Promise
                    .all([
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

    getState() {
        let terminal = this.airportData.terminal.map((o)=>{
            return{
                plane: _.find(this.airportData.planes, (p) => { return p._id.equals(o.plane)}),
                delay: o.delay
            };
        })
        let runways =  this.airportData.runways.map((o) => {

            return {
                plane: _.find(this.airportData.planes, (p) => { return p._id.equals(o.plane)}),
                tag: o.tag,
                _id: o._id,
                status: 0 // TBI
            }
        })

        return {
            runways: runways,
            terminal: terminal
        };
    }

    initRunway() {

    }

    //makes a request andd adds the request to our array called messages
    addPlane(cb) {
        this.messages.push(new Message(Message.TYPE.ADD_PLANE, { mission: Plane.MISSION_TYPE.LANDING, missionStartTime: new Date }))
    }

    careateDesaster(type, ranwayNum) {

    }

}

module.exports = Airport;