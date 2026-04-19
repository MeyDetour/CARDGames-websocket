import Evaluator from "../engine/Evaluator.js";
import { Logger, LoggerClass } from "../logger/logger.js";
import { Socket } from "socket.io";
import { roomManager } from "./RoomManager.js";
import PlayerManager from "./PlayerManager.js";
import ActionManager from "./ActionManager.js";
import { io } from "../../server.js";

const gameLogger = Logger("Game");
gameLogger.info("Logger démarrée");
export default class GameManager {
  constructor() {}

  static startGame(gameData, socket) {
    engineLogger.info("Do Engine Action : startGame");
    console.trace("Qui m'appelle ?");
    gameData.data.logs.push("La partie commence");
    gameData.data.state.value = "inProgress";
    gameLogger.info("EVENTS : Check onGameStart Events");
    io.to(gameData.roomId).emit("gameStarted", { gameData });
    Evaluator.loadDemon(gameData, socket, {
      originEvent: "startOfGame",
    });
    // implication
    return { event: "startOfManche" };
  }

  static startOfManche(gameData, socket) {
    engineLogger.info("Do Engine Action : startOFManche");
    console.trace("Qui m'appelle ?");
    gameData.data.logs.push("Début de la manche");
    gameLogger.info("EVENTS : Check eachStartOfManche Events");
    Evaluator.loadDemon(gameData, socket, {
      originEvent: "eachStartOfManche",
    });
    // implication
    return { event: "startOfTour" };
  }

  static endOfManche(gameData, socket) {
    engineLogger.info("Do Engine Action : endOfManche");
    console.trace("Qui m'appelle ?");
    gameData.data.logs.push("fin de la manche");
    gameLogger.info("EVENTS : Check eachEndOfManche Events");

    Evaluator.loadDemon(gameData, socket, {
      originEvent: "eachEndOfManche",
    });
    // implication
    return { event: "onChangeManche" };
  }

  static changeTour(gameData, socket) {
    engineLogger.info("Do Engine Action : changeTour");
    console.trace("Qui m'appelle ?");
    gameData.data.logs.push("Changement d'un tour");
    if (gameData.roomInDb.params.tours.sens === "incrementation") {
      gameData.data.tour += 1;
    } else {
      gameData.data.tour -= 1;
    }
    let startPlayer = PlayerManager.getStartPlayer(gameData);

    gameData.data.currentPlayerPosition.value = startPlayer;

    Evaluator.loadDemon(gameData, socket, {
      originEvent: "onChangeTour",
    });
    return {};
  }
  static onChangeManche(gameData, socket) {
    engineLogger.info("Do Engine Action : onChangeManche");
    console.trace("Qui m'appelle ?");
    gameData.data.logs.push("Changement d'une manche");

    gameData.data.manche += 1;
    gameData.data.tour = 0;

    gameData.data.currentPlayerPosition.value = 1;
    Evaluator.loadDemon(gameData, socket, {
      originEvent: "startOfManche",
    });
    return { event: "startOfManche" };
  }
  static changeCurrentPlayer(gameData, socket) {
    engineLogger.info("Do Engine Action : changeCurrentPlayer");
    console.trace("Qui m'appelle ?");
    let nextP = null;
    do {
      nextP = PlayerManager.getNextPlayer(
        gameData,
        gameData.data.currentPlayerPosition.value,
      );

      gameData.data.currentPlayerPosition.value = nextP.position;
    } while (
      nextP.attachedEventForTour.value.includes("skipPlayerTour") ||
      PlayerManager.isPlayerActifInGame(nextP)
    );
    return {};
  }

  static engine(gameData, socket, params = {}) {
    //console.log(LoggerClass.pretty(LoggerClass.getCallerLocation().reverse()));
    if (!gameData) {
      GameDataError.notFound(socket, roomId);
      return;
    }

    if (!params) {
      params = {};
    }
    engineLogger.info(
      "GameManager engine called with params :>>  " + JSON.stringify(params),
    );
    if (gameData.data.state.value === "endOfGame") {
      return;
    }

    if (params.event && params.event === "startGame") {
      engineLogger.info(
        "GameManager engine called startGame with params :>>  " +
          JSON.stringify(params),
      );
      params = this.startGame(gameData, socket);
    }
    if (params.event && params.event === "endOfManche") {
      engineLogger.info(
        "GameManager engine called endOfManche with params :>>  " +
          JSON.stringify(params),
      );
      params = this.endOfManche(gameData, socket);
    }
    if (params.event && params.event === "onChangeTour") {
      engineLogger.info(
        "GameManager engine called onChangeTour with params :>>  " +
          JSON.stringify(params),
      );
      params = this.changeTour(gameData, socket);
    }
    if (params.event && params.event === "onChangeManche") {
      engineLogger.info(
        "GameManager engine called onChangeManche with params :>>  " +
          JSON.stringify(params),
      );

      params = this.onChangeManche(gameData, socket);
    }
    if (params.event && params.event === "startOfManche") {
      engineLogger.info(
        "GameManager engine called startOfManche with params :>>  " +
          JSON.stringify(params),
      );
      params = this.startOfManche(gameData, socket);
    }
    if (params.event && params.event === "changeCurrentPlayer") {
      engineLogger.info(
        "GameManager engine called changeCurrentPlayer with params :>>  " +
          JSON.stringify(params),
      );
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
            params.action,
          )
        ) {
          ActionManager.applyCurrentPlayerAction(
            gameData,
            socket,
            ActionManager.getActionFromName(gameData, params.action),
            params.playerId,
          );

          console.log(gameData.data.state.value);
          if (
       (     params.actionType
              ? params.actionType != "askPlayer"
              : true) && gameData.data.state.value !== "endOfGame"
          ) {
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

    Evaluator.loadDemon(gameData, socket, params);
    if (gameData.data.state.value !== "endOfGame") {
      Evaluator.loadWin(gameData, socket);
    }

    // on reverifie a chaque fois car chaque elt peut changer le status peut faire changer l'état du jeu
    if (gameData.data.state.value !== "endOfGame") {
      Evaluator.loadRoles(gameData, socket, params);
    }

    if (gameData.data.state.value !== "endOfGame") {
      Evaluator.loadActionsForPlayers(gameData, socket);
    }

    if (gameData.data.state.value !== "endOfGame") {
      // appel en dernier afin d'avoir les données les plus à jour possible
      Evaluator.loadGlobalValueStatic(gameData, socket);
    }
    roomManager.sendGameChangeSignal(gameData.roomId);
  }
}

const engineLogger = Logger("Engine");
