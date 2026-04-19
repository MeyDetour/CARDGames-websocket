import AppError from "../error/AppError.js";
import { errorStack } from "../error/ErrorStack.js";
import Parser from "../../parser/parser.js";
import Event from "./Event.js";
import { Logger, LoggerClass } from "../logger/logger.js";
import PlayerManager from "../services/PlayerManager.js";
import { TypeManager } from "../services/helper/TypeManager.js";
import FileLogger from "../logger/FileLogger.js";
import { roomManager } from "../services/RoomManager.js";
import { io } from "../../server.js";

let evaluatorLogger = Logger("evaluator");

/**
 * Utilitaires pour charger et vérifier les conditions/démons définis dans
 * les événements de la room. Permet d'exécuter automatiquement les
 * événements associés lorsque les conditions sont satisfaites.
 */
export default class Evaluator {
  // start of tour are emit Event
  // end of tour is a caclated envent based on condition

  /**
   * Execute logical separation for access variable  ex currentPlayer#gain#1
   * @param {Socket} socket the data of client connection
   * @param {Object} gameData detail of all game
   * @param {Object}  {
   *                 originEvent:str,  -> manually declenche event like onChangeTour
   *                 removeAfterUse:bool,  -> like "onStartGame" we want to delete demon
   * return : value
   */
  /**
   * Parcourt les démons (rules) et exécute les events associés si la
   * condition du démon est vraie.
   * @param {Object} gameData - données complètes de la partie
   * @param {Socket} socket - socket de l'appelant (pour émettre des erreurs)
   * @param {Object} [params] - params: { originEvent, removeAfterUse }
   * @returns {null|void}
   */
  static loadDemon(gameData, socket, params) {
    let fileLogger = null;
    if (process.env.ENGINE_FILE_LOG !== "false") {
      fileLogger = FileLogger.create([
        "LOAD DEMON",
        "=====================",
      ]);
      evaluatorLogger.info(this.evaluatorLogTitle("loadDemon"));
      if (fileLogger) {
        evaluatorLogger.info(
          `[fileLogger] Log file created: ${fileLogger.filepath}`,
        );
      }
    }
    if (!gameData.roomInDb.events["demons"]) {
      new AppError(socket, "Demon folder does not exist!");
      if (fileLogger) {
        fileLogger.error(
          new Error("Demon folder does not exist!"),
          "Evaluator.js  -->  loadDemon()",
        );
      }
      return null;
    }
    params.currentPlayer = PlayerManager.getPlayerWhoHasToPlay(gameData).id;
    if (!params.currentPlayer) {
      evaluatorLogger.warn("There is no current player");
      if (fileLogger) fileLogger.warn("There is no current player");
    }
    let c = 0;
    for (let demon of gameData.roomInDb.events["demons"]) {
      if (fileLogger) {
        fileLogger.log(
          `Check demon: ${demon.name || "unnamed"} | condition: ${demon.condition}`,
        );
        fileLogger.log(LoggerClass.pretty(demon));
      }
      if (!demon.name || !demon.condition) {
        if (fileLogger) {
          fileLogger.warn(
            `Demon missing name or condition: ${JSON.stringify(demon)}`,
          );
        }
        continue;
      }
      // evaluatorLogger.debug("====DEMON [" + demon.id + "]: " + demon.name);
      let result = null;
      if (demon.boucle) {
        if (fileLogger) fileLogger.log(`Demon boucle: ${demon.boucle}`);
        let elts = Parser.translateInnerExpression(
          demon.boucle,
          gameData,
          params,
        );

        if (!Array.isArray(elts)) {
          new AppError(
            socket,
            "Cannot obtain array with value " + demon.boucle,
          );
          evaluatorLogger.error(
            "Cannot obtain array with value " + demon.boucle,
          );
          fileLogger.error(
            new Error("Cannot obtain array with value " + demon.boucle),
            "Evaluator.js  -->  loadDemon()",
          );
          return null;
        }

        for (let i = 0; i < elts.length; i++) {
          if (demon.condition.includes("playerBoucle")) {
            if (result === false) {
              continue;
            }

            if (
              params.originEvent &&
              !demon.condition.includes(params.originEvent)
            ) {
              result = false;
              continue;
            }
            params = {
              ...params,
              playerBoucle: PlayerManager.getPlayer(gameData, i + 1),
            };
            result = Parser.translateInnerExpression(
              demon.condition,
              gameData,
              params,
            );
            if (fileLogger) fileLogger.log(
              `Boucle result for playerBoucle: ${JSON.stringify(result)}`,
            );
          }
        }
      } else {
        result = Parser.translateInnerExpression(demon.condition, gameData, {
          ...params,
          eventEmited: params?.originEvent,
        });
        if (fileLogger) fileLogger.log(`Result for demon condition: ${JSON.stringify(result)}`);
        // un demon appelé par un originEvent (ChangerManche,changertour etc)
        // declenche des evenements et demons, eviter de repeter deux fois le
        //  meme demon alors qu'il n'a pas fini d'executer ses evenements
        // eviter de repeter deux fois l'evenement si on
        if (
          params.originEvent &&
          !demon.condition.includes(params.originEvent)
        ) {
          result = false;
        }
      }

      if (typeof result !== "boolean") {
        const msg =
          "Erreur sur la condition : " +
          demon.condition +
          " le résultat n'est pas un boolean mais : " +
          JSON.stringify(result);
        evaluatorLogger.error(msg);
        if (fileLogger) fileLogger.error(new Error(msg), "Evaluator.js  -->  loadDemon()");
        LoggerClass.logFileLocalisation();
        errorStack.addError(
          msg,
          LoggerClass.pretty(LoggerClass.getCallerLocation().reverse()),
        );
      }

      if (result) {
        evaluatorLogger.info("le démon est réalisable : " + demon.condition);
        if (fileLogger) fileLogger.log(`Demon réalisable: ${demon.condition}`);
        gameData.data.testLogs.push({
          testType: "demon",
          ...demon,
          executionDate: new Date(),
          id: "o45455efer",
        });
        LoggerClass.objectToString(demon);

        for (let id of demon.events) {
          if (fileLogger) fileLogger.log(`Apply event id: ${id}`);
          Event.applyEventId(id, socket, gameData, {
            ...params,
            originEvent: "loadDemon",
          });
        }
        if (demon.removeAfterUse) {
          evaluatorLogger.info("remove demon");
          if (fileLogger) fileLogger.log("remove demon");
          gameData.roomInDb.events["demons"].splice(c, 1);
        }
      }
      c++;
    }
  }

  /**
   * Recharge les actions disponibles pour chaque joueur en fonction
   * des règles de tours présentes dans `gameData.roomInDb.params.tours.actions`.
   * @param {Object} gameData
   * @param {Socket} socket
   */
  static loadActionsForPlayers(gameData, socket) {
    let fileLogger = null;
    if (process.env.ENGINE_FILE_LOG !== "false") {
      fileLogger = FileLogger.create([
        "LOAD ACTIONS FOR PLAYERS",
        "=====================",
      ]);
      evaluatorLogger.info(this.evaluatorLogTitle("loadActionsForPlayers"));
      if (fileLogger) {
        evaluatorLogger.info(
          `[fileLogger] Log file created: ${fileLogger.filepath}`,
        );
      }
    }
    let actions = gameData.roomInDb.params.tours.actions;
    let currentPlayerId = PlayerManager.getPlayerWhoHasToPlay(gameData).id;
    for (let p of gameData.data.players) {
      evaluatorLogger.info("search actions for player ID=" + p.id);

      if (p.isSpectator.value) {
        evaluatorLogger.info("Player is spectator" + p.id);
        continue;
      }

      if (fileLogger) fileLogger.log(`search actions for player ID=${p.id}`);
      let player = structuredClone(p);
      player.actions.value = [];

      for (let a of actions) {
        let resultOFCondition = null;
        if (a.condition) {
          resultOFCondition = Parser.translateInnerExpression(
            a.condition,
            gameData,
            {
              currentPlayer: currentPlayerId,
            },
          );
          if (fileLogger) fileLogger.log(
            `Action condition for ${a.name || "unnamed"}: ${JSON.stringify(resultOFCondition)}`,
          );
        }

        if (
          (a.appearAtPlayerTurn ? p.id == currentPlayerId : true) &&
          (TypeManager.isDefined(resultOFCondition) ? resultOFCondition : true)
        ) {
          player.actions.value.push(a);
          if (fileLogger) fileLogger.log(`Action added: ${a.name || "unnamed"}`);
        }
      }
      PlayerManager.updatePlayerObject(player, gameData);
    }
  }

  /**
   * Charge les variable globale static
   * @param {Object} gameData
   * @param {Socket} socket
   */
  static loadGlobalValueStatic(gameData, socket) {
    let fileLogger = null;
    if (process.env.ENGINE_FILE_LOG !== "false") {
      fileLogger = FileLogger.create([
        "LOAD GLOBAL VALUE STATIC",
        "========================="
      ]);
      evaluatorLogger.info(this.evaluatorLogTitle("loadGlobalValueStatic"));
      if (fileLogger) {
        evaluatorLogger.info(
          `[fileLogger] Log file created: ${fileLogger.filepath}`,
        );
        evaluatorLogger.info("Load Global Value Static ...");
        fileLogger.log("Load Global Value Static ...");
      }
    }
    let globalValueStatic = gameData.roomInDb.globalValueStatic;
    if (globalValueStatic) {
      for (let s of Object.keys(globalValueStatic)) {
        let value = Parser.translateInnerExpression(
          globalValueStatic[s].value,
          gameData,
        );
        gameData.data.globalValueStatic[s] = {
          value: value,
          display: globalValueStatic[s].display,
        };
        evaluatorLogger.info(
          `Load global static value ${s} with value : ${value}`,
        );
        if (fileLogger) fileLogger.log(`Load global static value ${s} with value : ${value}`);
      }
    }
  }

  /**
   * Attribue les rôles définis dans `gameData.data.roles` aux joueurs
   * correspondants en mettant à jour l'objet player.
   * @param {Object} gameData
   * @param {Socket} socket
   */
  static loadRoles(gameData, socket) {
    let fileLogger = null;
    if (process.env.ENGINE_FILE_LOG !== "false") {
      fileLogger = FileLogger.create([
        "LOAD ROLES",
        "=====================",
      ]);
      evaluatorLogger.info(this.evaluatorLogTitle("loadRoles"));
      if (fileLogger) {
        evaluatorLogger.info(
          `[fileLogger] Log file created: ${fileLogger.filepath}`,
        );
      }
    }
    let roles = gameData.data.roles;

    for (let r of roles) {
      let player = structuredClone(
        Parser.translateInnerExpression(r.attribution, gameData),
      );
      if (PlayerManager.isPlayerType(player, gameData)) {
        if (player.isSpectator.value) {
          continue;
        }

        if (player.roles.value.filter((pr) => pr.name == r.name).length === 0) {
          player.roles.value.push(r);
          PlayerManager.updatePlayerObject(player, gameData);
          if (fileLogger) fileLogger.log(`Role ${r.name} assigned to player ${player.id}`);
        }
      } else {
        evaluatorLogger.error(
          "Il n'y pas de player trouvé pour " + r.attribution,
        );
        if (fileLogger) fileLogger.error(
          new Error("No player found for " + r.attribution),
          "Evaluator.js  -->  loadRoles()",
        );
      }
    }
  }
  /**
   * Vérifie si tous les joueurs ont joué lors du tour courant.
   * @param {Object} gameData
   * @returns {boolean}
   */
  static verifyIsAllPlayerHasPlayed(gameData) {
    if (gameData.roomInDb.params.tours.endOfTour)
      for (let player of gameData.data.players) {
        if (!player.hasPlayed.value) {
          return false;
        }
      }
    return true;
  }

  static loadWin(gameData, socket) {
    evaluatorLogger.info(this.evaluatorLogTitle("loadWin"));
    let fileLogger = null;
    if (process.env.ENGINE_FILE_LOG !== "false") {
      fileLogger = FileLogger.create(["LOAD WIN", "====================="]);
      if (fileLogger) {
        evaluatorLogger.info(
          `[fileLogger] Log file created: ${fileLogger.filepath}`,
        );
        fileLogger.log("Début de loadWin");
      }
    }

    let winParams = gameData.roomInDb.events.win;
    if (!winParams) {
      const msg = "Erreur cannot find win parameters";
      evaluatorLogger.warn(msg);
      if (fileLogger) {
        fileLogger.log(" Paramètres de victoire non trouvés");
        fileLogger.error(new Error(msg), "Evaluator.js  -->  loadWin()");
      }
      return;
    }
    if (!winParams.condition) {
      const msg = "There is win parameters but no condition parameters";
      evaluatorLogger.warn(msg);
      if (fileLogger) {
        fileLogger.log(" Paramètre 'condition' manquant dans winParams");
        fileLogger.error(new Error(msg), "Evaluator.js  -->  loadWin()");
      }
      return;
    }

    if (fileLogger) {
      fileLogger.log(" Paramètres de victoire :");
      fileLogger.log(LoggerClass.pretty(winParams));
    }

    let allPlayerRespectCondition = true;
    let victory = false;
    let winners = [];

    if (fileLogger) fileLogger.log(" Analyse de la boucle : " + winParams.boucle);
    if (winParams.boucle) {
      let elts = Parser.translateInnerExpression(winParams.boucle, gameData, {
        precedentFileLogger: fileLogger,
      });

      if (fileLogger) {
        fileLogger.log(" Elements de la boucle");
        fileLogger.log(LoggerClass.pretty(elts));
      }
      if (!Array.isArray(elts)) {
        new AppError(
          socket,
          "Cannot obtain array with value " + winParams.boucle,
        );
        evaluatorLogger.error(
          "Cannot obtain array with value " + winParams.boucle,
        );
        if (fileLogger) {
          fileLogger.error(
            new Error("Cannot obtain array with value " + winParams.boucle),
            "Evaluator.js  -->  loadWin()",
          );
          fileLogger.log(
            LoggerClass.pretty(LoggerClass.getCallerLocation().reverse()),
          );
        }
        LoggerClass.logFileLocalisation();
        return null;
      }

      if (fileLogger) fileLogger.log(" Exécution de la boucle");
      for (let i = 0; i < elts.length; i++) {
        if (winParams.condition.includes("playerBoucle")) {
          let player = PlayerManager.getPlayer(gameData, i + 1);
          let result = Parser.translateInnerExpression(
            winParams.condition,
            gameData,
            {
              playerBoucle: player,
              precedentFileLogger: fileLogger,
            },
          );
          if (fileLogger) {
            fileLogger.log(
              ` Condition evaluated for playerBoucle ${player.id} - haswin=${player.haswin.value}: IsWinner ? ${result}`,
            );
            fileLogger.log(
              ` Résultat condition pour playerBoucle ${player.id}: ${result}`,
            );

            fileLogger.log(" Vainqueurs potentiels :");
            fileLogger.log(LoggerClass.pretty(winners.map((w) => w.id)));
          }
          // si tous les joueurs doivent respecter la condition pour gagner
          if (!result) {
            allPlayerRespectCondition = false;
          }
          if (
            result &&
            !winners.map((w) => w.id).includes(player.id) &&
            !player.haswin.value
          ) {
            winners.push(player);
            if (fileLogger) fileLogger.log(` Joueur ajouté aux gagnants: ${player.id}`);
          }
        }
      }
      if (fileLogger) {
        fileLogger.log(" Vainqueurs potentiels :");
        fileLogger.log(LoggerClass.pretty(winners.map((w) => w.id)));
      }
      // si il y a vainqueur alors victoire
      if (winners.length > 0) {
        victory = true;
        if (fileLogger) fileLogger.log(
          ` Il y a des gagnants: ${winners.map((w) => w.id).join(",")}`,
        );
      }
      // mais si on voulait tous vainqueur alors pas victoire
      if (
        winParams.allElementOfBoucleMustSatisyCondition &&
        winners.length != elts.length
      ) {
        victory = false;
        if (fileLogger) fileLogger.log(
          ` Tous les éléments doivent satisfaire la condition mais ce n'est pas le cas.`,
        );
      }
      if (winParams.applyOnAllPlayers && victory) {
        if (fileLogger) fileLogger.log(` Victoire collective, fin de partie.`);
        gameData.data.state.value = "endOfGame";
        gameData.data.winners.value = winners;
        for (let p of gameData.data.players) {
          p.haswin.value = winners.map((w) => w.id).includes(p.id);
          p.hasloose.value = !winners.map((w) => w.id).includes(p.id);
          PlayerManager.updatePlayerObject(p, gameData);
        }
        if (fileLogger) fileLogger.log(
          `Mise à jour des joueurs et envoie d'un signal de fin de partie.`,
        );
        gameData.data.logs.push("Victoire collective des joueurs !");

        socket.to(gameData.roomId).emit("gameEnd", { gameData });
      }
      if (!winParams.applyOnAllPlayers && victory) {
        if (fileLogger) fileLogger.log(
          ` Victoire individuelle, gagnants: ${winners.map((w) => w.id).join(",")}`,
        );
        if (!Array.isArray(gameData.data.winners.value)) {
          gameData.data.winners.value = [];
        }
        gameData.data.winners.value = [
          ...gameData.data.winners.value,
          ...winners,
        ];
        for (let p of winners) {
          p.haswin.value = true;

          if (fileLogger) fileLogger.log(
            ` Joueur ${p.id} a gagné, mise à jour de son objet joueur. et envoie d'un signal`,
          );

          PlayerManager.updatePlayerObject(p, gameData);
          let newGameData = roomManager.getRoom(gameData.roomId);
          newGameData.data.logs.push(`Joueur ${p.pseudo} a gagné.`);
          socket
            .to(p.socketID)
            .emit("playerWin", { gameData: newGameData, player: p });
        }
      }
      if (PlayerManager.allPlayerHasFinished(gameData)) {
        if (fileLogger) fileLogger.log(" Tous les joueurs ont terminé, fin de partie.");
        gameData.data.state.value = "endOfGame";
        for (let p of gameData.data.players) {
          if (!p.haswin.value) {
            p.hasloose.value = true;
          }
          PlayerManager.updatePlayerObject(p, gameData);
        }
        gameData.data.logs.push("Tous les joueurs ont terminé, fin de partie.");
        socket.to(gameData.roomId).emit("gameEnd", { gameData });
      }
    } else {
      if (fileLogger) fileLogger.log(" Pas de boucle, évaluation directe de la condition");
      let result = Parser.translateInnerExpression(
        winParams.condition,
        gameData,
        {
          precedentFileLogger: fileLogger,
        },
      );
      if (fileLogger) fileLogger.log(` Résultat de la condition: ${result}`);
      if (result) {
        if (fileLogger) fileLogger.log(` Condition de victoire remplie, fin de partie.`);
        gameData.data.state.value = "endOfGame";
        for (let p of gameData.data.players) {
          p.haswin.value = true;
          gameData.data.winners.value = gameData.data.winners.value || [];
          gameData.data.winners.value.push(p);
          PlayerManager.updatePlayerObject(p, gameData);
        }
        gameData.data.logs.push("Victoire globale des joueurs !");
        socket.to(gameData.roomId).emit("gameEnd", { gameData });
      }
    }

    console.log(gameData.data.state);
  }
  static evaluatorLogTitle(type) {
    if (type === "loadDemon")
      return "LOAD DEMON============================================================================================";
    if (type === "loadRoles")
      return "=============LOAD ROLES==============================================================================";
    if (type === "loadActionsForPlayers")
      return "=========================LOAD ACTIONS FOR PLAYERS====================================================";
    if (type === "loadGlobalValueStatic")
      return "====================================================LOAD GLOBAL VALUE STATIC=========================";
    if (type === "loadWin")
      return "===============================================================================LOAD WIN==============";
    return "";
  }
}
