 
import {Logger, LoggerClass} from "../logger/logger.js"; 
import FileLogger from "../logger/FileLogger.js";
import {errorStack} from "../error/ErrorStack.js";
import Event from "../engine/Event.js";
import Parser from "../../parser/parser.js";
import PlayerManager from "./PlayerManager.js";
import AppError from "../error/AppError.js";
import { TypeManager } from "./helper/TypeManager.js";

const actionManagerLogger = Logger("CardManager")
export default class ActionManager {
    static getActionFromId(gameData, actionId) {
        for (let action of gameData.roomInDb.params.tours.actions) {
            if (action.id === actionId) {
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
      static applyCurrentPlayerAction(gameData, socket, action, playerId,params) {
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
        const paramsComplete = {
          currentPlayer: playerId,
          ...params
        };
        if (!action){
           actionManagerLogger.error("Action not found for current player");
          fileLogger.error(
            new Error("Action not found for current player"),
            "ActionManager.js  -->  applyCurrentPlayerAction()",
          ); new AppError(
                      socket,
                      "Action not found for current player",
                    );
          return;
        }
        let canDoAction = action.condition
          ? Parser.translateInnerExpression(action.condition, gameData, {
              ...paramsComplete,
              log: false,
              location : fileLogger
            })
          : true;

        if (PlayerManager.isPlayerActifInGame(currentPlayer)) {
          canDoAction = false;
          console.error("player is not actif in game : cant do action");
        }
        fileLogger.log(`Can do action: ${canDoAction}`);
        if (canDoAction && TypeManager.isDefined(playerId)) {
          actionManagerLogger.debug("Load current player action ");
          fileLogger.log("Load current player action");
          for (let event of action.withValue) {
            fileLogger.log(`Apply with value event: ${JSON.stringify(event)}`);
            Event.applyWithValueEvent(event, socket, gameData, paramsComplete,"eventFromAction");
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


