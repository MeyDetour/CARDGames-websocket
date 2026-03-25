// Gestion centralisée des erreurs liées à gameData
import AppError from "../core/error/AppError.js";

export default class GameDataError {
  static notFound(socket, roomId) {
    new AppError(socket, "La partie n'existe pas", {
      code: "ROOM_NOT_FOUND",
      details: { roomId },
    });
  }

  static notEnoughPlayers(socket, roomId) {
    new AppError(socket, "Il n'y a pas assez de joueurs", {
      code: "NOT_ENOUGHT_PLAYER",
      details: { roomId },
    });
  }

  static alreadyInProgress(socket, roomId) {
    new AppError(socket, "La partie à dejà commencé", {
      code: "ALREADY_IN_PROGRESS",
      details: { roomId },
    });
  } }
