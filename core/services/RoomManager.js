import Identificator from "./helper/Identificator.js";
import { Logger, LoggerClass } from "../logger/logger.js";
import { errorStack } from "../error/ErrorStack.js";
import PlayerManager from "./PlayerManager.js";
import AppError from "../error/AppError.js";
import { MessagerieManager } from "./MessagerieManager.js";
import { io } from "../../server.js";
import { TypeManager } from "./helper/TypeManager.js";
import GameManager from "./GameManager.js";

const roomLogger = Logger("RoomManager");

class RoomManager {
  constructor() {
    this.rooms = new Map();
  }

  isExistingId(id) {
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

  createRoom(gameInDB, pseudo, skin, isTest, socket) {
    roomLogger.info(pseudo + "Création d'une room");

    if (!gameInDB) {
      const msg = "No game provided to RoomManager.createRoom";
      roomLogger.error(msg);
      LoggerClass.logFileLocalisation();
      try {
        errorStack.addError(
          msg,
          LoggerClass.pretty(LoggerClass.getCallerLocation().reverse()),
        );
      } catch (e) {}
      return;
    }
    if (!pseudo) {
      const msg = "No pseudo provided to RoomManager.createRoom";
      roomLogger.error(msg);
      LoggerClass.logFileLocalisation();
      try {
        errorStack.addError(
          msg,
          LoggerClass.pretty(LoggerClass.getCallerLocation().reverse()),
        );
      } catch (e) {}
      return;
    }

    if (!socket) {
      const msg = "No socket provided to RoomManager.createRoom";
      roomLogger.error(msg);
      LoggerClass.logFileLocalisation();
      try {
        errorStack.addError(
          msg,
          LoggerClass.pretty(LoggerClass.getCallerLocation().reverse()),
        );
      } catch (e) {}
      return;
    }

    roomLogger.info("Creation d'une room");
    const player = PlayerManager.createPlayerOBject(
      {
        position: 1,
        pseudo: pseudo,
        skin: skin,
        socketID: socket.id,
        id: Identificator.generateId(), // id concerne la room, aucun joueur n'a le meme id dans cette room pusiqu'elle vient d'etre crée
      },
      gameInDB["playerGlobalValue"],

      gameInDB["assets"]["gains"],
    );

    // generate room Id
    let roomID = this.#generateRoomId();
    roomID = roomID.toUpperCase();

    // construit l'object global value
    // ex :
    // groupPot : {
    //   display : false,
    //   type : gainObject,
    //   value :  0
    //   }
    // }
    let globalValues = {};
    for (let key of Object.keys(gameInDB["globalValue"])) {
      let type = gameInDB["globalValue"][key].type;
      globalValues[key] = {
        ...gameInDB["globalValue"][key],
        value: gameInDB["globalValue"][key].defaultValue
          ? gameInDB["globalValue"][key].defaultValue
          : TypeManager.getDefaultValueOfType(type),
      };
    }
    let gainObject = {};
    for (let gain of gameInDB["assets"]["gains"]) {
      gainObject[`{gain#${gain.id}}`] = { value: 0 };
    }

    let gameData = {
      roomInDb: gameInDB,
      roomId: roomID,

      data: {
        players: [player],
        spectators: [],
        isTest: isTest,
        messages: [],
        logs: [],
        testLogs: [],
        state: { type: "string", value: "waitingPlayers" },
        boardCard: {
          type: "cardList",
          value: [],
        },
        allPlayersHasPlayed: {
          type: "boolean",
          value: false,
        },
        winners: {
          type: "playerList",
          value: [],
        },
        losers: {
          type: "playerList",
          value: [],
        },
        globalValueStatic: gameInDB.globalValueStatic || {},
        currentPlayerPosition: { value: 1 },
        tour: 0,
        manche: 0,
        ...gameInDB["globalValue"],

        deck: {
          type: "cardList",
          value: Object.keys(gameInDB.assets.cards).map((key) => parseInt(key)),
        },
        discardDeck: {
          type: "cardList",
          value: [],
        },
        //  liste des gains possibles dans le jeu avec leur valeur actuelle pour cette partie (qui peut évoluer pendant la partie) , ex : gainObject = { gainId1 : {value: 2} , gainId2 : {value: 0} }
        gain: {
          type: "gainObject",
          value: {
            ...gainObject,
          },
        },
        // Pot commun de gain
        groupPot: {
          type: "gainObject",
          value: {
            ...gainObject,
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

  joinRoom(roomID, pseudo, skin, socket) {
    roomLogger.info(pseudo + "A rejoin la room");
    if (!roomID) {
      const msg =
        "No room id provided to RoomManager.joinRoom, cannot join room";
      roomLogger.error(msg);
      LoggerClass.logFileLocalisation();
      try {
        errorStack.addError(
          msg,
          LoggerClass.pretty(LoggerClass.getCallerLocation().reverse()),
        );
      } catch (e) {}
      return;
    }
    if (!pseudo) {
      const msg =
        "No pseudo provided to RoomManager.joinRoom, cannot join room";
      roomLogger.error(msg);
      LoggerClass.logFileLocalisation();
      try {
        errorStack.addError(
          msg,
          LoggerClass.pretty(LoggerClass.getCallerLocation().reverse()),
        );
      } catch (e) {}
      return;
    }
    if (!socket) {
      const msg =
        "No socket provided to RoomManager.joinRoom, cannot join room";
      roomLogger.error(msg);
      LoggerClass.logFileLocalisation();
      try {
        errorStack.addError(
          msg,
          LoggerClass.pretty(LoggerClass.getCallerLocation().reverse()),
        );
      } catch (e) {}
      return;
    }

    let gameData = this.getRoom(roomID);
    let isSpectator =
      gameData.roomInDb.params.globalGame.autoriseSpectator &&
      gameData.data.state.value !== "waitingPlayers";

    if (gameData) {
      socket.join(roomID);
      socket.data.roomId = roomID;
      socket.data.pseudo = pseudo;
      let player = PlayerManager.createPlayerOBject(
        {
          position: gameData.data.players.length + 1,
          pseudo: pseudo,
          skin: skin,
          socketID: socket.id,
          id: Identificator.generateId(), // id concerne la room, aucun joueur n'a le meme id dans cette room pusiqu'elle vient d'etre crée
        },
        gameData.roomInDb["playerGlobalValue"],
        gameData.roomInDb.assets.gains,
      );
      let playerId = player.id;
      // JOIN AS SPECTATOR IF GAME IS ALREADY STARTED AND SPECTATOR ARE ALLOWED
      if (isSpectator) {
        player.isSpectator.value = true;
      }
      socket.data.playerId = playerId;
      if (isSpectator) {

        gameData.data.spectators.push(player);
        MessagerieManager.addMessage(gameData, socket, {
          content: pseudo + " observe la partie",
        });
        socket.emit("roomJoinedAsSpectator", { gameData, player });
        socket.to(roomID).emit("playerHasJoinedRoomAsSpectator", gameData);
      } else {
        gameData.data.players.push(player);
        MessagerieManager.addMessage(gameData, socket, {
          content: pseudo + " a rejoint la partie",
        });
        PlayerManager.reORderPlayerPosition(gameData);

        socket.emit("roomJoined", { gameData, player });
        socket.to(roomID).emit("playerHasJoinedRoom", gameData);
      }
    } else {
      const msg = "Join room failed: Id incorrect -> " + roomID;
      roomLogger.error(msg);
      LoggerClass.logFileLocalisation();
      try {
        errorStack.addError(
          msg,
          LoggerClass.pretty(LoggerClass.getCallerLocation().reverse()),
        );
      } catch (e) {}
      new AppError(socket, "Id incorrect");
    }
  }
  replayGame(gameData, socket) {
    //reset players
    PlayerManager.restartPlayers(gameData);

    // reset global values
    for (let key of Object.keys(gameData.roomInDb.globalValue)) {
      gameData.data[key].value = gameData.roomInDb.globalValue[key].defaultValue
        ? gameData.roomInDb.globalValue[key].defaultValue
        : TypeManager.getDefaultValueOfType(
            gameData.roomInDb.globalValue[key].type,
          );
    }

    // reset gain and cards
    for (let key of Object.keys(gameData.data.gain.value)) {
      gameData.data.gain.value[key].value = 0;
    }

    gameData.data.messages = [];
    gameData.data.logs = [];
    gameData.data.state.value = "inProgress";

    gameData.data.boardCard.value = [];
    gameData.data.allPlayersHasPlayed.value = false;
    gameData.data.winners.value = [];

    // dont reset globalValueStatic because they are auto reload at start of game
    gameData.data.currentPlayerPosition.value = 1;
    gameData.data.tour = 0;
    gameData.data.manche = 0;
    ((gameData.data.deck.value = Object.keys(
      gameData.roomInDb.assets.cards,
    ).map((key) => parseInt(key))),
      (gameData.data.discardDeck.value = []));

    if (gameData.data.isTest) {
      GameManager.engine(gameData, socket, { event: "startGame" });
    } else {
      this.sendGameChangeSignal(gameData.roomId);
    }
  }

  sendGameChangeSignal(roomID) {
    roomLogger.info("SEND GAME CHANGE SINGAL");
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

  disconnectPlayer(socket) {
    console.log("TRY TO DISCONNECT PLAYER");
    const roomId = socket.data.roomId;
    const pseudo = socket.data.pseudo;
    const playerId = socket.data.playerId;
    console.log(roomId, pseudo, playerId);

    if (!roomId) {
      roomLogger.error("Cannot disconnect player, no roomId found on socket");
      return;
    }
    if (!pseudo) {
      roomLogger.error("Cannot disconnect player, no pseudo found on socket");
      return;
    }
    if (!playerId) {
      roomLogger.error("Cannot disconnect player, no playerId found on socket");
      return;
    }
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
        content: `${pseudo} a quitté la partie`,
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
