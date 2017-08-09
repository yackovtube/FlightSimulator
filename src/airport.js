const _ = require('lodash');
const Runway = require('./runway');
const Plane = require('./plane')
const Message = require('./message');

const TERMINAL_WAIT_DELAY_MAX = 10000;
const TERMINAL_WAIT_DELAY_MIN = 0;

class Airport {

    //our constructor we start the runways 
    constructor() {

        this.messages = Array();

        this.interval = null;

        this.runways = {};

        this.runways[1] = new Runway(1, Runway.TYPE.IN_BOUND);
        this.runways[2] = new Runway(2, Runway.TYPE.IN_BOUND);
        this.runways[3] = new Runway(3, Runway.TYPE.IN_BOUND);
        this.runways[4] = new Runway(4, Runway.TYPE.RUNWAY);
        this.runways[5] = new Runway(5, Runway.TYPE.POST_LANDING);
        this.runways[6] = new Runway(6, Runway.TYPE.TERMINAL_ENTRANCE);
        this.runways[7] = new Runway(7, Runway.TYPE.TERMINAL_ENTRANCE);
        this.runways[8] = new Runway(8, Runway.TYPE.PRE_TAKEOFF);

        //we create a connect graph 
        this.runways[1].conectedTo.push(this.runways[2]);
        this.runways[2].conectedTo.push(this.runways[3]);
        this.runways[3].conectedTo.push(this.runways[4]);
        this.runways[4].conectedTo.push(this.runways[5]);
        this.runways[5].conectedTo.push(this.runways[6], this.runways[7]);
        this.runways[6].conectedTo.push(this.runways[8]);
        this.runways[7].conectedTo.push(this.runways[8]);
        this.runways[8].conectedTo.push(this.runways[4]);




        //start terminal array 
        this.terminal = new Array;
        this.exitTerminalRunways = [this.runways[6], this.runways[7]]

        this._onInit();
    }

    _onInit() {
        this.start();
    }

    //take care of all the messages
    start() {
        if (!this.interval)
            this.interval = setInterval(() => {

                if (this.messages.length === 0) {
                    return;
                }

                for (let index in this.messages) {

                    let message = this.messages[index];

                    switch (message.type) {
                        case Message.TYPE.ADD_PLANE:
                            this._addPlaneAction(message);
                            break;
                        case Message.TYPE.MOVE:
                            this._moveAction(message);
                            break;
                        case Message.TYPE.MOVE_TO_TERMINAL:
                            this._moveToTerminalAction(message)
                            break;
                        case Message.TYPE.TAKE_OFF:
                            this._takeOffAction(message)
                            break;
                        case Message.TYPE.EXIT_TERMINAL:
                            this._exitFromTerminalAction(message)
                            break;
                    }

                }

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

                            for (let i in fromRunway.conectedTo) {
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

        let fromRunway = message.data.from;
        let toRunway = message.data.to;
        if (fromRunway.plane && !toRunway.plane) {
            console.log('plane ' + fromRunway.plane.ID + ' moved from ' + fromRunway.ID + ' to ' + toRunway.ID);
            toRunway.plane = fromRunway.plane;
            fromRunway.plane = null;
        }
        else {
            message.onError()
        }
    }

    //the function to resolve add plane massege
    _addPlaneAction(message) {

        let runway = this.runways[1];

        if (runway.plane) {
            message.onError(new Error('unable to exption'));
        }
        else {
            runway.plane = message.data;
            console.log('added plane ' + runway.plane.ID + ' to runway 1');
        }
    }

    initRunway(){
        
    }

    //makes a request andd adds the request to our array called messages
    addPlane(cb) {
        this.messages.push(new Message(Message.TYPE.ADD_PLANE, new Plane(Plane.MISSION_TYPE.LANDING)))
    }

    careateDesaster(type, ranwayNum) {

    }

}

module.exports = Airport;