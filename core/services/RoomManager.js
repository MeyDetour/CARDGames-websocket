import Identificator from "./helper/Identificator.js";
import { Logger, LoggerClass } from "../logger/logger.js";
import { errorStack } from "../error/ErrorStack.js";
import PlayerManager from "./PlayerManager.js";
import AppError from "../error/AppError.js";
import { MessagerieManager } from "./MessagerieManager.js";
import { io } from "../../server.js";
const roomLogger = Logger("RoomManager");

class RoomManager {
  constructor() {
    this.rooms = new Map();
  }

  isExistingId(id) {
    console.log(this.rooms.keys());
    return this.rooms.has(id);
  }

  #generateRoomId() {
    let roomID = Identificator.generateId();
    while (this.isExistingId(roomID)) {
      roomID = Identificator.generateId();
    }
    return roomID;
  }

  getRoom(id) {
    return this.rooms.get(id) || null;
  }

  removeRoom(id) {
    this.rooms.delete(id);
  }

  createRoom(gameInDB, pseudo, socket) {
    roomLogger.info(pseudo + "Création d'une room");

    if (!gameInDB) {
      const msg = "No game provided to RoomManager.createRoom";
      roomLogger.error(msg);
      LoggerClass.logFileLocalisation();
      try {
        errorStack.addError(msg, LoggerClass.getFileLocalisation());
      } catch (e) {}
      return;
    }
    if (!pseudo) {
      const msg = "No pseudo provided to RoomManager.createRoom";
      roomLogger.error(msg);
      LoggerClass.logFileLocalisation();
      try {
        errorStack.addError(msg, LoggerClass.getFileLocalisation());
      } catch (e) {}
      return;
    }

    if (!socket) {
      const msg = "No socket provided to RoomManager.createRoom";
      roomLogger.error(msg);
      LoggerClass.logFileLocalisation();
      try {
        errorStack.addError(msg, LoggerClass.getFileLocalisation());
      } catch (e) {}
      return;
    }

    roomLogger.info("Creation d'une room");
    const player = PlayerManager.createPlayerOBject(
      {
        position: 1,
        pseudo: pseudo,
        socketID: socket.id,
        id: Identificator.generateId(), // id concerne la room, aucun joueur n'a le meme id dans cette room pusiqu'elle vient d'etre crée
      },
      gameInDB["playerGlobalValue"],

      gameInDB["assets"]["gains"]
    );

    // generate room Id
    let roomID = this.#generateRoomId();
    roomID = roomID.toUpperCase();

    //TODO : REMOVE its for test

    let gameData = {
      roomInDb: gameInDB,
      roomId: roomID,
      data: {
        players: [player],
        messages: [],
        logs: [],
        currentPlayerPosition: { value: 1 },
        tour: 0,
        manche: 0,
        ...gameInDB["globalValue"],
        gain: {
          type: "gainObject",
          value: {
            1: 0,
          },
        },
        ...gameInDB["assets"],
      },
      admin: player,
    };
    socket.join(roomID);
    socket.data.roomId = roomID;
    socket.data.pseudo = pseudo;
    socket.data.playerId = player.id;

    this.rooms.set(roomID, gameData);
    MessagerieManager.addMessage(gameData, socket, {
      content: pseudo + " a crée la partie",
    });

    socket.emit("roomCreated", { gameData, player });
    socket.to(roomID).emit("playerHasJoinedRoom", gameData);
  }

  sendGameChangeSignal(roomID) {
    let gameData = this.getRoom(roomID);
    if (gameData) {
      for (let currentPlayer of gameData.data.players) {
        io.to(currentPlayer.socketID).emit("gameChanges", {
          gameData,
          currentPlayer,
        });
      }
    }
  }

  joinRoom(roomID, pseudo, socket) {
    roomLogger.info(pseudo + "A rejoin la room");
    if (!roomID) {
      const msg =
        "No room id provided to RoomManager.joinRoom, cannot join room";
      roomLogger.error(msg);
      LoggerClass.logFileLocalisation();
      try {
        errorStack.addError(msg, LoggerClass.getFileLocalisation());
      } catch (e) {}
      return;
    }
    if (!pseudo) {
      const msg =
        "No pseudo provided to RoomManager.joinRoom, cannot join room";
      roomLogger.error(msg);
      LoggerClass.logFileLocalisation();
      try {
        errorStack.addError(msg, LoggerClass.getFileLocalisation());
      } catch (e) {}
      return;
    }
    if (!socket) {
      const msg =
        "No socket provided to RoomManager.joinRoom, cannot join room";
      roomLogger.error(msg);
      LoggerClass.logFileLocalisation();
      try {
        errorStack.addError(msg, LoggerClass.getFileLocalisation());
      } catch (e) {}
      return;
    }

    let gameData = this.getRoom(roomID);
    if (gameData) {
      socket.join(roomID);
      socket.data.roomId = roomID;
      socket.data.pseudo = pseudo;
      let player = PlayerManager.createPlayerOBject(
        {
          position: gameData.data.players.length + 1,
          pseudo: pseudo,
          socketID: socket.id,
          id: Identificator.generateId(), // id concerne la room, aucun joueur n'a le meme id dans cette room pusiqu'elle vient d'etre crée
        },
        gameData.roomInDb["playerGlobalValue"],
        gameData.roomInDb.assets.gains,
      );
      let playerId = player.id;

      socket.data.playerId = playerId;
      gameData.data.players.push(player);
      MessagerieManager.addMessage(gameData, socket, {
        content: pseudo + " a rejoint la partie",
      });

      PlayerManager.reORderPlayerPosition(gameData);
      socket.emit("roomJoined", { gameData, player });
      socket.to(roomID).emit("playerHasJoinedRoom", gameData);
    } else {
      const msg = "Join room failed: Id incorrect -> " + roomID;
      roomLogger.error(msg);
      LoggerClass.logFileLocalisation();
      try {
        errorStack.addError(msg, LoggerClass.getFileLocalisation());
      } catch (e) {}
      new AppError(socket, "Id incorrect");
    }
  }

  disconnectPlayer(socket) {
    const roomId = socket.data.roomId;
    const pseudo = socket.data.pseudo;
    const playerId = socket.data.playerId;

    if (!roomId) return;

    const gameData = this.getRoom(roomId);
    if (gameData) {
      //remove player
      gameData.data.players = gameData.data.players.filter(
        (p) => p.id !== playerId,
      );
      roomLogger.info(
        `${pseudo} a quitté la room ${roomId}. Joueurs restants : ${gameData.data.players.length}`,
      );

      // delete player if he's the last
      if (gameData.data.players.length === 0) {
        this.removeRoom(roomId);
        roomLogger.info(`Room ${roomId} supprimée car elle est vide.`);
        return;
      }
      // alert room
      MessagerieManager.addMessage(gameData, socket, {
        content: `${pseudo} a quiité la partie`,
      });

      // if player is admin , change admin
      if (gameData.admin && gameData.admin.id == playerId) {
        gameData.admin = gameData.data.players[0];
      }

      PlayerManager.reORderPlayerPosition(gameData);

      socket.to(roomId).emit("playerHasLeftRoom", gameData);
      this.sendGameChangeSignal(roomId);
    }
  }
}

// Singleton naturel
export const roomManager = new RoomManager();
