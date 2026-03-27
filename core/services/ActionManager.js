 
import {Logger, LoggerClass} from "../logger/logger.js"; 
import FileLogger from "../logger/FileLogger.js";
import {errorStack} from "../error/ErrorStack.js";
import Event from "../engine/Event.js";
import Parser from "../../parser/parser.js";
import PlayerManager from "./PlayerManager.js";

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
     /**
       * Charge et exécute les events liés à une action spécifique pour le joueur courant.
       * @param {Object} gameData
       * @param {Socket} socket
       * @param {Object} action - définition d'action (peut contenir withValue)
       * @param {number} playerId - id du joueur cible
       */
      static applyCurrentPlayerAction(gameData, socket, action, playerId) {
        const fileLogger = FileLogger.create([
          "LOAD CURRENT PLAYER ACTION",
          "=====================",
        ]); 
        
        actionManagerLogger.info(
          `[fileLogger] Log file created: ${fileLogger.filepath}`,
        );
        actionManagerLogger.info("Load Current Player Action ...");
        fileLogger.log("Load Current Player Action ...");
        LoggerClass.objectToString(action);
        let currentPlayer = PlayerManager.getPlayerWithId(gameData, playerId);
        const params = {
          currentPlayer: playerId,
        };
        let canDoAction = action.condition
          ? Parser.translateInnerExpression(action.condition, gameData, {
              ...params,
              log: false,
            })
          : true;

        if (PlayerManager.isPlayerActifInGame(currentPlayer)) {
          canDoAction = false;
          console.error("player is not actif in game : cant do action");
        }
        fileLogger.log(`Can do action: ${canDoAction}`);
        if (canDoAction && playerId) {
          actionManagerLogger.debug("Load current player action ");
          fileLogger.log("Load current player action");
          for (let event of action.withValue) {
            fileLogger.log(`Apply with value event: ${JSON.stringify(event)}`);
            Event.applyWithValueEvent(event, socket, gameData, params);
          }
        } else {
          actionManagerLogger.error("Cannot do action for current player ");
          fileLogger.error(
            new Error("Cannot do action for current player"),
            "Evaluator.js  -->  applyCurrentPlayerAction()",
          );
          console.log("candDoAction :>> ", canDoAction);
          console.log("currentPlayer :>> ", typeof currentPlayer);
        }
      }
    
}


