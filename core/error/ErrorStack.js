import { Logger } from "../logger/logger.js";

const errorLogger = Logger("ErrorStack");
class ErrorStack{
    constructor() {
        this.errors = []
    }
    addError(message,loc) {
     
        this.errors.push({message: message, loc :loc});
        errorLogger.error(`Error ${this.errors.length}: ${message}`);
    }
    show() {
        if (this.errors.length === 0) {
            errorLogger.info("No errors recorded.");
            return;
        }
        errorLogger.info("Recorded Errors:");
        this.errors.forEach((err, index) => {
            errorLogger.info(`${index + 1}: ${err.message} ${err.loc}`);
        });
    }       
}
export  const errorStack = new ErrorStack();