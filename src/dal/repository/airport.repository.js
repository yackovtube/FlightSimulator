const _ = require('lodash');

const Airport = require('./../models/airport.model');
const Plane = require('./../models/plane.model');
const Runway = require('./../models/runway.model');

const RunwayRepository = require('./runway.repository');

class AirportRepository {
    findAll() {
        return new Promise((resolve, reject) => {

            Airport.find({})
                .populate({ path: 'runways', populate: { path: 'runways' } })
                .populate({ path: 'planes', populate: { path: 'planes' } })
                .populate({ path: 'inBoundPlanes', populate: { path: 'inBoundPlanes' } })
                .exec((err, docs) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve(docs);
                    }
                })
        })
    }

    //create the airport using promise
    create() {
        //step 1: create runways
        return Promise
            .all([
                RunwayRepository.create(1, Runway.TYPE.IN_BOUND, Runway.STATUS_TYPE.OPEN),
                RunwayRepository.create(2, Runway.TYPE.IN_BOUND, Runway.STATUS_TYPE.OPEN),
                RunwayRepository.create(3, Runway.TYPE.IN_BOUND, Runway.STATUS_TYPE.OPEN),
                RunwayRepository.create(4, Runway.TYPE.RUNWAY, Runway.STATUS_TYPE.OPEN),
                RunwayRepository.create(5, Runway.TYPE.POST_LANDING, Runway.STATUS_TYPE.OPEN),
                RunwayRepository.create(6, Runway.TYPE.TERMINAL_ENTRANCE, Runway.STATUS_TYPE.OPEN),
                RunwayRepository.create(7, Runway.TYPE.TERMINAL_ENTRANCE, Runway.STATUS_TYPE.OPEN),
                RunwayRepository.create(8, Runway.TYPE.PRE_TAKEOFF, Runway.STATUS_TYPE.OPEN),
            ])
            .then((docs) => {
                //step 2: link the runways and wait untill they are all updated (promise)
                return Promise.all([
                    RunwayRepository.update(docs[0]._id, { conectedTo: [docs[1]._id] }),
                    RunwayRepository.update(docs[1]._id, { conectedTo: [docs[2]._id] }),
                    RunwayRepository.update(docs[2]._id, { conectedTo: [docs[3]._id] }),
                    RunwayRepository.update(docs[3]._id, { conectedTo: [docs[4]._id] }),
                    RunwayRepository.update(docs[4]._id, { conectedTo: [docs[5]._id, docs[6]._id] }),
                    RunwayRepository.update(docs[5]._id, { conectedTo: [docs[7]._id] }),
                    RunwayRepository.update(docs[6]._id, { conectedTo: [docs[7]._id] }),
                    RunwayRepository.update(docs[7]._id, { conectedTo: [docs[3]._id] })
                ]);

            })
            .then((docs) => {
                //step 3: create the airport in the db
                return new Promise((resolve, reject) => {
                    let airport = new Airport({
                        runways: docs.map(d => d._id),
                        terminal: [],
                        exitTerminalRunways: [docs[5]._id, docs[6]._id],
                        speed: Airport.SPEED.FAST,
                        inBoundPlanes: []
                    });
                    airport.save((err, doc) => {
                        if (err) {
                            reject(err);
                        }
                        else {
                            resolve(doc)
                        }
                    })
                });

            })
            .catch((err) => {
                console.log(err);
            })

    }

    //Add plane to the airport database
    addPlane(id, plane) {
        return new Promise((resolve, reject) => {

            Airport.update(
                { _id: id },//where
                { $push: { planes: plane } },
                (err, airport) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve();
                    }

                }
            );
        })
    }

    addPlaneToTerminal(id, plane, delay) {
        return new Promise((resolve, reject) => {

            Airport.update(
                { _id: id },//where
                { $push: { terminal: { plane: plane, delay: delay } } },
                (err, airport) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve();
                    }

                }
            );
        })
    }

    addPlaneToInBoundPlanes(id, plane){

        return new Promise((resolve, reject) => {

            Airport.update(
                { _id: id },//where
                { $push: { inBoundPlanes: plane } },
                (err, airport) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve();
                    }

                }
            );
        })
    }

    removePlaneFromInBoundPlanes(id, plane){
         return new Promise((resolve, reject) => {

            Airport.update(
                { _id: id },//where
                { $pull: { inBoundPlanes: plane } },
                (err, airport) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve();
                    }

                }
            );
        })
    }

    removePlaneFromTerminal(id, plane) {

        return new Promise((resolve, reject) => {

            Airport.update(
                { _id: id },//where
                { $pull: { terminal: { plane: plane } } },
                (err, airport) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve();
                    }

                }
            );
        })
    }

    updateSpeed(id, speed){
        return new Promise((resolve,reject)=>{
            Airport.update(
                { _id: id },//where
                { speed : speed },
                (err, airport) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve();
                    }

                }
            );
        })
    }

    removePlane(id, plane) {
        return new Promise((resolve, reject) => {

            Airport.update(
                { _id: id },//where
                { $pull: { planes: plane } },
                (err, airport) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve();
                    }

                }
            );
        })
    }

};

module.exports = new AirportRepository();  //singelton