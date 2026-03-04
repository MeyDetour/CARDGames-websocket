import {roomManager} from "./RoomManager.js";
import {Logger, LoggerClass} from "../logger/logger.js";
import CG from "console-grid";

const cardManagerLogger = Logger("CardManager")
export default class CardManager {


//cardPosition 1 - x
    static getCard(gameData, cardId) {
        console.log("search cardid "+cardId+ " in "+gameData.data["cards"]);
        return gameData.data["cards"][cardId.toString()];
    }
    static dropCard(gameData) { 
         if ( gameData.data["deck"].value.length > 0) {
            return gameData.data["deck"].value.pop()
        }
    }
  
}


