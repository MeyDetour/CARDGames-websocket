export default class AppError  {
    constructor(socket, message, { code = "UNKNOWN", details = null } = {}) {
        if (!socket) {
            console.error("AppError: socket is required to emit the error!");
            return;
        }

        this.socket = socket;
        this.message = message;
        this.code = code;
        this.details = details;

        // On envoie directement l'emit
        this.send();
    }

    send() {
        this.socket.emit("error",  {message: this.message, code : this.code , detail :  this.details})

    }
}
