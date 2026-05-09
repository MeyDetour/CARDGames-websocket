// Utility: Handles all incoming requests (listening) and data outputs (emissions) for players.
// NOTE: You must add the module call in 'sockets/index.js' as follows:
// PlayerSocket.listen(io, socket);

import GameDataError from "../core/error/GameDataError.js";
import { roomManager } from "../core/services/RoomManager.js";
import PlayerManager from "../core/services/PlayerManager.js";
export default class PlayerSocket {
  static listen(io, socket) {
    socket.on("changeSpectatorToPlayer", () => {
      console.log("SPECTATOR WANT TO BECOME PLAYER");
      let id = socket.data.playerId;
      let roomId = socket.data.roomId;
      let gameData = roomManager.getRoom(roomId);
      if (!gameData) {
        GameDataError.notFound(socket, roomId);
        return;
      }
      let newPlayer = PlayerManager.setSpectatorAsPlayer(id, gameData);
      console.log("new player : ");
      console.log(newPlayer);
      console.log(gameData.data.players);
      roomManager.sendGameChangeSignal(gameData.roomId);
      socket.emit("changeSpectatorToPlayerValidation", { gameData, newPlayer });
    });
  }
}
