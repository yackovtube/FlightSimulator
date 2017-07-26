class Simulator {

    start(callback) {

        callback({ type: Simulator.EVENT.ADD_PLANE });
        setInterval(() => {
            callback({ type: Simulator.EVENT.ADD_PLANE });
        }, 5000);
    }

}

Simulator.EVENT = {
    ADD_PLANE: 0
}

module.exports = Simulator;