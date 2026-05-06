// Utility: Handles all incoming requests (listening) and data outputs (emissions) for players.
// NOTE: You must add the module call in 'sockets/index.js' as follows:
// PlayerSocket.listen(io, socket);

import GameDataError from "../core/error/GameDataError.js";
import { roomManager } from "../core/services/RoomManager.js";
import PlayerManager from "../core/services/PlayerManager.js";
export default class PlayerSocket {
  static listen(io, socket) {
    socket.on("changeSpectatorToPlayer", () => {
      let id = socket.data.playerId;
      let roomId = socket.data.roomId;
      let gameData = roomManager.getRoom(roomId);
      if (!gameData) {
        GameDataError.notFound(socket, roomId);
        return;
      }
     let newPlayer= PlayerManager.setSpectatorAsPlayer(id, gameData);
      roomManager.sendGameChangeSignal(gameData);
      socket.emit("changeSpectatorToPlayerValidation",{gameData,newPlayer});

    });
  }
}
