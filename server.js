// server.js
// this file will create express server and websocket server

import express from "express"
import fs from "fs"
import path from "path"
import cors from "cors"
import http from "http"
import { Server } from "socket.io";
import registerSocket from "./sockets/index.js";
import dotenv from "dotenv/config";    

//  ======================== LOGGER FOLDEr ================================

 
const LOG_DIR = "./logs";

fs.rmSync(LOG_DIR, { recursive: true, force: true });
fs.mkdirSync(LOG_DIR, { recursive: true });
fs.mkdirSync(LOG_DIR+"/functions", { recursive: true });
fs.mkdirSync(LOG_DIR+"/events", { recursive: true });



//  ======================== SERVER EXPRESSJS ================================

const app = express();
const PORT = 3000;

app.use(express.static('public'));

app.use(cors({
    origin: '*' // ou '*' pour tout le monde
}));

app.listen(PORT, () => {
    console.log(`Serveur démarré sur http://localhost:${PORT}`);
});



//  ======================== SERVER WEBSOCKET ================================


// Création du serveur HTTP de base
const server = http.createServer((req, res) => {
    res.writeHead(200, {'Content-Type': 'text/plain'});
});

// Initialisation de Socket.io
export const io = new Server(server, {
    transports: ['websocket', 'polling'],
    cors: { origin: "*",  methods: ["GET", "POST"],  }
});

registerSocket(io)



// Lancement du serveur
server.listen(process.env.PORT, () => {
    console.log(`Serveur WebSocket en écoute sur le port ${process.env.PORT}`);
});

