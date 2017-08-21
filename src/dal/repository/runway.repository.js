const Runway = require('./../models/runway.model');


class RunwayRepository {


    create(tag, type, status) {

        return new Promise((resovle, reject) => {

            let runway = new Runway({ tag: tag, conectedTo: [], type: type, status : status });
            runway.save((err, doc) => {
                if (err) {
                    reject(err);
                }
                else {
                    resovle(doc);
                }
            });

        });

    }

    //whit callback
    // createCB(tag, type, cb) {
    //     let runway = new Runway({ tag: tag, conectedTo: [], type: type });
    //     runway.save((err, doc) => {
    //         //translate error

    //         cb(err, doc);
    //     });
    // }


    //{new true} = return updated document
    update(id, updateData) {
        return new Promise((resolve, reject) => {
            Runway.findByIdAndUpdate(id, { $set: updateData }, { new: true }, (err, doc) => {
                if(err){
                    reject(err);
                }
                else{
                    resolve(doc);
                }
            })
        });
    }

};

module.exports = new RunwayRepository(); // singleton