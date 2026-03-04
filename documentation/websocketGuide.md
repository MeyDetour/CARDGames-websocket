

## server -> client du socket
socket.emit('welcome', 'Bienvenue dans la room !');

## SERVEUR → TOUS LES CLIENTS
io.emit('message', { author: 'Serveur', content: 'Une nouvelle partie commence !' });


## Serveur envoie à tous sauf à l'experiditeur
  socket.broadcast.emit('message', { author: socket.id, content: msg });
 

## Server -> Room
 io.to('room-123').emit('message', { content: 'Bienvenue dans la room 123 !' });

## Server -> client de la room sauf experidteur de playerMove
   socket.to(data.roomId).emit('playerMove', data);
 


## server to client
 io.to(targetSocketId).emit('privateMessage', "Salut, c'est un message privé !");
