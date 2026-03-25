// Utility: Handles all incoming requests (listening) and data outputs (emissions) for games.
// NOTE: You must add the module call in 'sockets/index.js' as follows:
// GameSocket.listen(io, socket);

import GameDataError from "../core/error/GameDataError.js";
import GameManager from "../core/services/GameManager.js";
import { roomManager } from "../core/services/RoomManager.js";
import AppError from "../core/error/AppError.js";
import { Logger, LoggerClass } from "../core/logger/logger.js";
import Event from "../core/engine/Event.js";
import GameDataError from "../core/error/GameDataError.js";
const gameSocket = Logger("GameSocket");
export default class GameSocket {
  static listen(io, socket) {
    socket.on("startGame", ({ roomId }) => {
      let gameData = roomManager.getRoom(roomId);

      if (!gameData) {
        GameDataError.notFound(socket, roomId);
        return;
      }

      if (gameData.data.state === "inProgress") {
        GameDataError.alreadyInProgress(socket, roomId);
        return;
      }
      if (
        gameData.roomInDb.params.globalGame.minPlayer >
        gameData.data.players.length
      ) {
        GameDataError.notEnoughPlayers(socket, roomId);
        return;
      }
      // LoggerClass.objectToString(gameData.data);
      GameManager.engine(gameData, socket, { event: "startGame" });
    });

    socket.on("doAction", ({ playerId, roomId, action, actionType }) => {
      let gameData = roomManager.getRoom(roomId);
      if (!gameData) {
        GameDataError.notFound(socket, roomId);
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
      gameSocket.debug("Get value from frontend ");
      if (!obj.insertedValue) {
        EventError.notFoundInsertedValue(socket, roomId);
        return;
      }

      if (event.event.requiresInput.type == "number") {
        params.insertedValue = parseInt(obj.insertedValue);
      }

      if (event.event.withValue) {
        for (let eventInWVE of event.event.withValue) {
          // call here in iteration to get last update of gameData
          // because maybe precedent event has changed data
          let gameData = roomManager.getRoom(roomId);
          if (!gameData) {
            GameDataError.notFound(socket, roomId);
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
    socket.on("replayGame", () => {
      let gameData = roomManager.getRoom(socket.data.roomId);
      if (!gameData) {
        GameDataError.notFound(socket, roomId);
        return;
      }
      roomManager.replayGame(gameData, socket);
    });
  }
}
