const Plane = require('./../models/plane.model');

class PlaneRepository {

    create(data) {

        return new Promise((resolve, reject) => {
            let plane = new Plane({ mission: data.mission, missionStartTime: data.missionStartTime });
            plane.save((err, doc) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(doc);
                }
            });

        })
    }

    update(id, updateData) {
        return new Promise((resolve, reject) => {
            Plane.findByIdAndUpdate(id, { $set: updateData }, { new: true }, (err, doc) => {
                if(err){
                    reject(err);
                }
                else{
                    resolve(doc);
                }
            })
        });
    }

}
module.exports = new PlaneRepository(); // singleton