// Gestion centralisée des erreurs liées aux Events
import AppError from "../core/error/AppError.js";

export default class EventError {
  static notFoundInsertedValue(socket, roomId) {
    new AppError(socket, "Aucune valeur insérée", {
      code: "VALUE_NOT_FOUND",
      details: { roomId },
    });
  } 
 }
