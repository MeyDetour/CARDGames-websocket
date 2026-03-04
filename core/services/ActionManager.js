 
import {Logger, LoggerClass} from "../logger/logger.js"; 

const actionManagerLogger = Logger("CardManager")
export default class ActionManager {
    static getActionFromName(gameData, actionName) {
        for (let action of gameData.roomInDb.params.tours.actions) {
            if (action.name === actionName) {
                return action;
            }
        }
        return null;
    }
}


