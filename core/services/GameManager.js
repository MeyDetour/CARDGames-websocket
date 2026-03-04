import Conditions from "../engine/Conditions.js";
import { Logger, LoggerClass } from "../logger/logger.js";
import { Socket } from "socket.io";
import { roomManager } from "./RoomManager.js";
import PlayerManager from "./PlayerManager.js";
import ActionManager from "./ActionManager.js";

const gameLogger = Logger("Game");
gameLogger.info("Logger démarrée");
export default class GameManager {
  constructor() {}

  static startGame(gameData, socket) {

    engineLogger.info("Do Engine Action : startGame")
    gameData.data.logs.push("La partie commence");
    gameData.data.state.value = "inProgress";
    gameLogger.info("EVENTS : Check onGameStart Events");
    Conditions.loadDemon(gameData, socket, {
      originEvent: "startOfGame",
    });
    // implication
    return { event: "startOfManche" };
  }

  static startOfManche(gameData, socket) {

    engineLogger.info("Do Engine Action : startOFManche")
    gameData.data.logs.push("Début de la manche"); 
    gameLogger.info("EVENTS : Check eachStartOfManche Events");
    Conditions.loadDemon(gameData, socket, {
      originEvent: "eachStartOfManche",
    });
    // implication
    return { event: "startOfTour" };
  }

  static endOfManche(gameData, socket) {

    engineLogger.info("Do Engine Action : endOfManche")
    gameData.data.logs.push("fin de la manche"); 
    gameLogger.info("EVENTS : Check eachEndOfManche Events");

    Conditions.loadDemon(gameData, socket, {
      originEvent: "eachEndOfManche",
    });
    // implication
    return { event: "onChangeManche" };
  }

  static changeTour(gameData, socket) {

    engineLogger.info("Do Engine Action : changeTour")
    gameData.data.logs.push("Changement d'un tour");
    if (gameData.roomInDb.params.tours.sens === "incrementation") {
      gameData.data.tour += 1;
    } else {
      gameData.data.tour -= 1;
    }

    gameData.data.currentPlayerPosition.value = 1;
    Conditions.loadDemon(gameData, socket, {
      originEvent: "onChangeTour",
    });
    return {};
  } 
  static onChangeManche(gameData, socket) {

    engineLogger.info("Do Engine Action : onChangeManche")

    gameData.data.logs.push("Changement d'une manche");
      
      gameData.data.manche += 1;
      gameData.data.tour = 0
    
    gameData.data.currentPlayerPosition.value = 1;
    Conditions.loadDemon(gameData, socket, {
      originEvent: "startOfManche",
    });
    return {event:"startOfManche"};
  }
  static changeCurrentPlayer(gameData, socket) {
    engineLogger.info("Do Engine Action : changeCurrentPlayer")
    let nextP = null;
    do {
      nextP = PlayerManager.getNextPlayer(
        gameData,
        gameData.data.currentPlayerPosition.value
      );

      gameData.data.currentPlayerPosition.value = nextP.position;
    } while (nextP.attachedEventForTour.value.includes("skipPlayerTour"));
    return {};
  }

  static engine(gameData, socket, params = {}) {
    console.log(LoggerClass.pretty(LoggerClass.getCallerLocation().reverse()));
    if (!params) {
      params = {};
    }
    engineLogger.info(
      "GameManager engine called with params :>>  " + JSON.stringify(params)
    );
    if (params.event && params.event === "startGame") {
      params = this.startGame(gameData, socket);
    }
   if (params.event && params.event === "endOfManche") {
      params = this.endOfManche(gameData, socket);
    }
    if (params.event && params.event === "onChangeTour") {
      params = this.changeTour(gameData, socket);
    }  if (params.event && params.event === "onChangeManche") {
      params = this.onChangeManche(gameData, socket);
    }  if (params.event && params.event === "startOfManche") {
      params = this.startOfManche(gameData, socket);
    }
    if (params.event && params.event === "changeCurrentPlayer") {
      params = this.changeCurrentPlayer(gameData, socket);
    }
    if (params.event && params.event === "doAction") {
      if (params.action) {
        //apply action
        //verify player
        if (
          PlayerManager.verifyIsPlayerCanDoAction(
            params.playerId,
            gameData,
            params.action
          )
        ) {
          Conditions.loadCurrentPlayerAction(
            gameData,
            socket,
            ActionManager.getActionFromName(gameData, params.action),
            params.playerId
          );
          if (params.actionType ? params.actionType != "askPlayer" : true) {
            params = this.changeCurrentPlayer(gameData, socket);
          }
        } else {
          new AppError(socket, "Player can't do this action", {
            code: "INVALID",
            details: {},
          });
          return;
        }
      } else {
        new AppError(socket, "You need to associate action", {
          code: "INVALID PARAMS",
          details: {},
        });
        return;
      }
    }

    //check actions for player

    // load globals demons
    Conditions.loadDemon(gameData, socket, params);
    Conditions.loadRoles(gameData, socket, params);
    Conditions.changeLoadActionsForPlayers(gameData, socket);
    // condition de fin de manche
    // condition de début de manche

    roomManager.sendGameChangeSignal(gameData.roomId);

    // gestion des manches
    // gestion des events à la fin d'une manchge
    // incrementation d'une manche
    // incrementation d'un tour
  }
}

const engineLogger = Logger("Engine");
