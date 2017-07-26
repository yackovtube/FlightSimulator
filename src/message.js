class Message {
    constructor(type, data) {
        this.type = type;
        this.data = data;
        this.onError = (err) => {

        }
    }

}

Message.TYPE = {
    ADD_PLANE: 0,
    MOVE: 1,
    MOVE_TO_TERMINAL: 2,
    EXIT_TERMINAL: 3,
    TAKE_OFF: 4
};

module.exports = Message;