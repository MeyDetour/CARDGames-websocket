import AppError from "../error/AppError.js";
import { roomManager } from "./RoomManager.js";
export class MessagerieManager {
  static sendMessage(socket, message) {
    let roomId = socket.data.roomId;
    if (!roomId) {
      new AppError(socket, "Le joueur n'est dans aucune partie", {
        code: "ROOM_NOT_FOUND",
      });
      retturn;
    }
    let gameData = roomManager.getRoom(roomId);
    if (!gameData) {
      new AppError(socket, "Partie non trouvée", {
        code: "ROOM_NOT_FOUND",
      });
      retturn;
    }
    let players = gameData.data.players.filter(
      (p) => p.id === message.playerId,
    );
    if (players.length == 0) {
      new AppError(socket, "Le joueur n'est pas dans la partie", {
        code: "ROOM_NOT_FOUND",
      });
      retturn;
    }
   
    this.addMessage(gameData, socket, message);
 
    let messages =gameData.data.messages
    socket.emit("messageAddedInMessagerie",{messages, message});
  }
  static addMessage(gameData, socket, message) {
    
      gameData.data.messages.push(message);
  
    let messages =gameData.data.messages
    socket.to(gameData.roomId).emit("newMessageReceived",{messages, message});
  }
}
