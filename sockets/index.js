// Utility : Load all function wich contain "socket.on" and "socket.emit" to organize reception of request

import RoomSocket from "./room.socket.js";
import PlayerSocket from "./player.socket.js";
import GameSocket from "./game.socket.js";
import { errorStack } from "../core/error/ErrorStack.js";
import { roomManager } from "../core/services/RoomManager.js";
export default function registerSocket(io) {
  io.on("connection", (socket) => {
    console.log("socket connected");
    RoomSocket.listen(io, socket);
    PlayerSocket.listen(io, socket);
    GameSocket.listen(io, socket);
    errorStack.show();

    socket.on("disconnect", function () {
        console.log("disconnect");
        roomManager.disconnectPlayer(socket)
    });
  });
}
