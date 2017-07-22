const Runway = require('./runway');
const Plane = require('./plane')
const Message = require('./message');

class Airport {

    constructor() {

        this.messages = Array();

        this.interval = null;

        this.runwaies = {};

        this.runwaies[1] = new Runway(1, Runway.TYPE.IN_BOUND);
        this.runwaies[2] = new Runway(2, Runway.TYPE.IN_BOUND);
        this.runwaies[3] = new Runway(3, Runway.TYPE.IN_BOUND);
        this.runwaies[4] = new Runway(4, Runway.TYPE.RUNWAY);
        this.runwaies[5] = new Runway(5, Runway.TYPE.POST_LANDING);
        this.runwaies[6] = new Runway(6, Runway.TYPE.TERMINAL_ENTRANCE);
        this.runwaies[7] = new Runway(7, Runway.TYPE.TERMINAL_ENTRANCE);
        this.runwaies[8] = new Runway(8, Runway.TYPE.PRE_TAKEOFF);

        //we create a connect graph 
        this.runwaies[1].conectedTo.push(this.runwaies[2]);
        this.runwaies[2].conectedTo.push(this.runwaies[3]);
        this.runwaies[3].conectedTo.push(this.runwaies[4]);
        this.runwaies[4].conectedTo.push(this.runwaies[5]);
        this.runwaies[5].conectedTo.push(this.runwaies[6], this.runwaies[7]);
        this.runwaies[6].conectedTo.push(this.runwaies[8]);
        this.runwaies[7].conectedTo.push(this.runwaies[8]);
        this.runwaies[8].conectedTo.push(this.runwaies[4]);




        this.terminal = new Array;

        this._onInit();
    }

    _onInit() {

        this.start();

    }

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

                    }

                }

                this.messages = new Array;


                //trminal logic (chack planes that need to tack of)
                for (let i in this.terminal) {

                }


                //run way logic
                for (let ID in this.runwaies) {
                    let fromRunway = this.runwaies[ID];

                    if (fromRunway.plane) {

                        if (fromRunway.type == Runway.TYPE.TERMINAL_ENTRANCE && fromRunway.plane.prosses == Plane.PROSSES_TYPE.LANDING) {
                            this.messages.push(new Message(Message.TYPE.MOVE_TO_TERMINAL, fromRunway));
                        }
                        else if (fromRunway.type == Runway.TYPE.RUNWAY && fromRunway.plane.prosses == Plane.PROSSES_TYPE.TAKEOFF) {
                            this.messages.push(new Message(Message.TYPE.TAKE_OFF, fromRunway));
                        } else {

                            for (let i in fromRunway.conectedTo) {
                                let toRunway = fromRunway.conectedTo[i];
                                if (!toRunway.plane) {

                                    this.messages.push(new Message(Message.TYPE.MOVE, {
                                        from: fromRunway,
                                        to: toRunway
                                    }));

                                }
                                break;
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


    _takeOffAction(message){
        let runway = message.data;
        console.log('plane ' + runway.plane.ID + ' took off from ' + runway.ID);
        runway.plane = null;
    }

    _moveToTerminalAction(message) {
        let runway = message.data;
        runway.plane.prosses = Plane.PROSSES_TYPE.IN_TERMINAL;
        runway.plane.prossesStartTime = new Date();
        console.log('plane ' + runway.plane.ID + ' moved from ' + runway.ID + ' to terminal')
        
        this.terminal.push({
            plane: runway.plane,
            delay: Math.floor((Math.random() * 10) + 10000)
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

        let runway = this.runwaies[1];

        if (runway.plane) {
            message.onError(new Error('unable to exption'));
        }
        else {
            runway.plane = message.data;
            console.log('added plane ' + runway.plane.ID + ' to runway 1');
        }
    }

    //makes a request andd adds the request to our array called messages
    addPlane(cb) {
        this.messages.push(new Message(Message.TYPE.ADD_PLANE, new Plane(Plane.PROSSES_TYPE.LANDING)))
    }

    careateDesaster(type, ranwayNum) {

    }

}

module.exports = Airport;