// Utility: Handles all incoming requests (listening) and data outputs (emissions) for games.
// NOTE: You must add the module call in 'sockets/index.js' as follows:
// GameSocket.listen(io, socket);

import GameManager from "../core/services/GameManager.js";
import { roomManager } from "../core/services/RoomManager.js";
import AppError from "../core/error/AppError.js";
import { Logger, LoggerClass } from "../core/logger/logger.js";
import Event from "../core/engine/Event.js"; 
const gameSocket = Logger("GameSocket");
export default class GameSocket {
  static listen(io, socket) {
    socket.on("startGame", ({ roomId }) => {
      let gameData = roomManager.getRoom(roomId);

      if (!gameData) {
        new AppError(socket, "La room n'existe pas", {
          code: "ROOM_NOT_FOUND",
          details: { roomId },
        });
        return;
      }

      if (gameData.data.state === "inProgress") {
        new AppError(socket, "La partie à dejà commencé", {
          code: "ALREADY_IN_PROGRESS",
          details: { roomId },
        });
        return;
      }
      if (
        gameData.roomInDb.params.globalGame.minPlayer >
        gameData.data.players.length
      ) {
        new AppError(socket, "There is not enought player", {
          code: "NOT_ENOUGHT_PLAYER",
          details: { roomId },
        });
        return;
      }
      // LoggerClass.objectToString(gameData.data);
      GameManager.engine(gameData, socket, { event: "startGame" });
    });

    socket.on("doAction", ({ playerId, roomId, action, actionType }) => {
      gameSocket.info("========ACTION FROM PLAYER");
      let gameData = roomManager.getRoom(roomId);
      if (!gameData) {
        new AppError(socket, "La room n'existe pas", {
          code: "ROOM_NOT_FOUND",
          details: { roomId },
        });
        return;
      }
      GameManager.engine(gameData, socket, {
        event: "doAction",
        action: action,
        actionType: actionType,
        playerId: playerId,
      });
    });

    socket.on("playerInsertedValue", ({ roomId, event, obj, params }) => {
      gameSocket.debug("roomid received " + roomId);

      gameSocket.debug("Get value from frontend ");
      LoggerClass.objectToString(event);
      LoggerClass.objectToString(obj);
      if (!obj.insertedValue) {
        new AppError(socket, "Inserted value is missing", {
              code: "VALUE_MISSING",
              details: { roomId },
            });
            return;
      }

      if (event.event.requiresInput.type == "number") {
        params.insertedValue = parseInt(obj.insertedValue);
      }

      if (event.event.withValue) {
        for (let eventInWVE of event.event.withValue) {
          // call here to get last update of gameData
          let gameData = roomManager.getRoom(roomId);

          if (!gameData) {
            new AppError(socket, "La room n'existe pas", {
              code: "ROOM_NOT_FOUND",
              details: { roomId },
            });
            return;
          }
          Event.applyWithValueEvent(eventInWVE, socket, gameData, params);
          roomManager.sendGameChangeSignal(roomId);
          GameManager.engine(gameData, socket, {
            event: "changeCurrentPlayer",
          });
        }
      }
    });
  
  }
}
