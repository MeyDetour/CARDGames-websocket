// Utility: Handles all incoming requests (listening) and data outputs (emissions) for rooms.
// NOTE: You must add the module call in 'sockets/index.js' as follows:
// RoomSocket.listen(io, socket);
import {MessagerieManager} from "../core/services/MessagerieManager.js"
import { roomManager } from "../core/services/RoomManager.js";

export default class RoomSocket {
  static listen(io, socket) {
    socket.on("createRoom", ({ gameInDB, pseudo }) => {
      roomManager.createRoom(gameInDB, pseudo, socket);
    });

    socket.on("joinRoom", ({ roomId, pseudo }) => {
      roomManager.joinRoom(roomId, pseudo, socket);
    });
    socket.on("isExistingRoom", ({ roomId , pathOnEchec}) => {

     let   roomIDUppercase = roomId.toUpperCase();

        console.log("Verify if "+roomId+ " exist ");
        console.log(roomManager.isExistingId(roomIDUppercase)); 
        let room = roomManager.getRoom(roomIDUppercase)
        let result = !!room
        let gameId = room ? room.roomInDb.id : null
      socket.emit("isExistingRoomResult",{roomId : roomIDUppercase, result , gameId ,pathOnEchec } );
    });
    
    socket.on("newMessageOnmessagerie", (message) => {
      console.log("new message " + message);
     MessagerieManager.sendMessage(socket, message); 
    });
  }
}

// socket.emit("gameEnd") // suppression
//
// socket.on('joinRoom', ({roomId, pseudo, game}) => {
//
//     //verifier pseudo
//     if (!rooms[roomId]) {
//         socket.emit("error", "La room n'existe pas");
//         return;
//     }
//
//     socket.join(roomId);
//     socket.data.roomId = roomId;
//     socket.data.game = game;
//     socket.data.pseudo = pseudo;
//
//
//     rooms[roomId].players.push({pseudo: pseudo, id: socket.id});
//
//     socket.emit('joinRoomValidation', rooms[roomId]);
//     io.to(roomId).emit('message', rooms[roomId].messages);
//     io.to(roomId).emit('playerJoinRoom', rooms[roomId].players);
//
// });
//
// quitter une room
//
// socket.on('adminConnected', () => {
//     console.log(`[ADMIN CONNECTÉ] `);
//     admins.add(socket)
// });
//
//
// // Envoi d’un message de bienvenue
// socket.emit('connectionValidation', 'Welcome!');
//
//
// // === Quand un joueur quitte ===
// socket.on('disconnect', () => {
//     const {roomId, pseudo} = socket.data;
//
//     if (roomId && rooms[roomId]) {
//         rooms[roomId].players = rooms[roomId].players.filter(p => p.id !== socket.id);
//
//         // S’il n’y a plus personne, on peut supprimer la roomId
//         if (rooms[roomId].players.length === 0) {
//             delete rooms[roomId];
//         } else {
//             if (rooms[roomId].creator === socket.id) {
//                 rooms[roomId].creator = rooms[roomId].players[0].id
//             }
//             rooms[roomId].messages.push(`${pseudo} a quitté la partie`);
//             io.to(roomId).emit('message', rooms[roomId].messages);
//             io.to(roomId).emit('playerLeftRoom', rooms[roomId].players);
//         }
//     }
//
//     // todo : delete room if last user left
//     // tODO : si l'admin de la game part le premier joueur apres lui est admin
// });
//
//
// socket.on("getRoomData", ({roomId}) => {
//     const roomData = rooms[roomId];
//     socket.emit("roomDataResponse", roomData);
// });
//
// socket.on("changeTour", () => {
//     const {roomId} = socket.data;
//     if (!roomId || !rooms[roomId]) return;
//
//     const detail = rooms[roomId].gameDetails;
//     detail.tour = (detail.tour || 0) + 1;
//     rooms[roomId].gameDetails = detail;
//     io.to(roomId).emit("tourChanged", rooms[roomId]);
// })
//
// socket.on("changeGameDetails", (gameDetails) => {
//     const {roomId} = socket.data;
//     if (!roomId || !rooms[roomId]) return;
//
//     rooms[roomId].gameDetails = gameDetails;
//     console.log(rooms[roomId])
//     io.to(roomId).emit("gameDetailsChanged", rooms[roomId]);
// })

//});
