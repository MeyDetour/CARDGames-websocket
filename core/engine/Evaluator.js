import AppError from "../error/AppError.js";
import { errorStack } from "../error/ErrorStack.js";
import Parser from "../../parser/parser.js";
import Event from "./Event.js";
import { Logger, LoggerClass } from "../logger/logger.js";
import PlayerManager from "../services/PlayerManager.js";
import { TypeManager } from "../services/helper/TypeManager.js";
import  FileLogger  from "../logger/FileLogger.js";
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
    const fileLogger = FileLogger.create([
      "LOAD DEMON",
      "====================="
    ]);
    evaluatorLogger.info(`[fileLogger] Log file created: ${fileLogger.filepath}`);
    if (!gameData.roomInDb.events["demons"]) {
      new AppError(socket, "Demon folder does not exist!");
      fileLogger.error(new Error("Demon folder does not exist!"), "Evaluator.js  -->  loadDemon()");
      return null;
    }
    params.currentPlayer = PlayerManager.getPlayerWhoHasToPlay(gameData).id;
    if (!params.currentPlayer) {
      evaluatorLogger.warn("There is no current player");
      fileLogger.warn("There is no current player");
    }

    evaluatorLogger.info("Load Demons...");
    fileLogger.log("Load Demons...");
    let c = 0;
    for (let demon of gameData.roomInDb.events["demons"]) {
      fileLogger.log(`Check demon: ${demon.name || 'unnamed'} | condition: ${demon.condition}`);
      if (!demon.name || !demon.condition) {
        fileLogger.warn(`Demon missing name or condition: ${JSON.stringify(demon)}`);
        continue;
      }
      // evaluatorLogger.debug("====DEMON [" + demon.id + "]: " + demon.name);
      let result = null;
      if (demon.boucle) {
        fileLogger.log(`Demon boucle: ${demon.boucle}`);
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
          fileLogger.error(new Error("Cannot obtain array with value " + demon.boucle), "Evaluator.js  -->  loadDemon()");
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
            fileLogger.log(`Boucle result for playerBoucle: ${JSON.stringify(result)}`);
          }
        }
      } else {
        result = Parser.translateInnerExpression(demon.condition, gameData, {
          ...params,
          eventEmited: params?.originEvent,
        });
        fileLogger.log(`Result for demon condition: ${JSON.stringify(result)}`);
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
        const msg = "Erreur sur la condition : " + demon.condition;
        evaluatorLogger.error(msg);
        fileLogger.error(new Error(msg), "Evaluator.js  -->  loadDemon()");
        LoggerClass.logFileLocalisation();
        errorStack.addError(msg, LoggerClass.getFileLocalisation());
      }

      if (result) {
        evaluatorLogger.info("le démon est réalisable : " + demon.condition);
        fileLogger.log(`Demon réalisable: ${demon.condition}`);
        LoggerClass.objectToString(demon);

        for (let id of demon.events) {
          fileLogger.log(`Apply event id: ${id}`);
          Event.applyEventId(id, socket, gameData, {
            ...params,
            originEvent: "loadDemon",
          });
        }
        if (demon.removeAfterUse) {
          evaluatorLogger.info("remove demon");
          fileLogger.log("remove demon");
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
  static changeLoadActionsForPlayers(gameData, socket) {
    const fileLogger = FileLogger.create([
      "LOAD ACTIONS FOR PLAYERS",
      "====================="
    ]);
    evaluatorLogger.info(`[fileLogger] Log file created: ${fileLogger.filepath}`);
    let actions = gameData.roomInDb.params.tours.actions;
    let currentPlayerId = PlayerManager.getPlayerWhoHasToPlay(gameData).id;
    for (let p of gameData.data.players) {
      evaluatorLogger.info("search actions for player ID=" + p.id);
      fileLogger.log(`search actions for player ID=${p.id}`);
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
          fileLogger.log(`Action condition for ${a.name || 'unnamed'}: ${JSON.stringify(resultOFCondition)}`);
        }

        if (
          (a.appearAtPlayerTurn ? p.id == currentPlayerId : true) &&
          (TypeManager.isDefined(resultOFCondition) ? resultOFCondition : true)
        ) {
          player.actions.value.push(a);
          fileLogger.log(`Action added: ${a.name || 'unnamed'}`);
        }
      }
      PlayerManager.updatePlayerObject(player, gameData);
    }
  }
  /**
   * Charge et exécute les events liés à une action spécifique pour le joueur courant.
   * @param {Object} gameData
   * @param {Socket} socket
   * @param {Object} action - définition d'action (peut contenir withValue)
   * @param {number} playerId - id du joueur cible
   */
  static loadCurrentPlayerAction(gameData, socket, action, playerId) {
    const fileLogger = FileLogger.create([
      "LOAD CURRENT PLAYER ACTION",
      "====================="
    ]);
    evaluatorLogger.info(`[fileLogger] Log file created: ${fileLogger.filepath}`);
    evaluatorLogger.info("Load Current Player Action ...");
    fileLogger.log("Load Current Player Action ...");
    LoggerClass.objectToString(action);
    let currentPlayer = PlayerManager.getPlayerWithId(gameData, playerId);
    const params = {
      currentPlayer: playerId,
    };
    let canDoAction = action.condition
      ? Parser.translateInnerExpression(action.condition, gameData, {
          ...params,
          log: false,
        })
      : true;
    fileLogger.log(`Can do action: ${canDoAction}`);
    if (canDoAction && playerId) {
      evaluatorLogger.debug("Load current player action ");
      fileLogger.log("Load current player action");
      for (let event of action.withValue) {
        fileLogger.log(`Apply with value event: ${JSON.stringify(event)}`);
        Event.applyWithValueEvent(event, socket, gameData, params);
      }
    } else {
      evaluatorLogger.error("Cannot do action for current player ");
      fileLogger.error(new Error("Cannot do action for current player"), "Evaluator.js  -->  loadCurrentPlayerAction()");
      console.log("candDoAction :>> ", canDoAction);
      console.log("currentPlayer :>> ", typeof currentPlayer);
    }
  }

  /**
   * Charge les variable globale static
   * @param {Object} gameData
   * @param {Socket} socket
   */
  static loadGlobalValueStatic(gameData, socket) {
    const fileLogger = FileLogger.create([
      "LOAD GLOBAL VALUE STATIC",
      "====================="
    ]);
    evaluatorLogger.info(`[fileLogger] Log file created: ${fileLogger.filepath}`);
    evaluatorLogger.info("Load Global Value Static ...");
    fileLogger.log("Load Global Value Static ...");
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
        fileLogger.log(`Load global static value ${s} with value : ${value}`);
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
    const fileLogger = FileLogger.create([
      "LOAD ROLES",
      "====================="
    ]);
    evaluatorLogger.info(`[fileLogger] Log file created: ${fileLogger.filepath}`);
    evaluatorLogger.info("Load Roles...");
    fileLogger.log("Load Roles...");
    let roles = gameData.data.roles;

    for (let r of roles) {
      let player = structuredClone(
        Parser.translateInnerExpression(r.attribution, gameData),
      );
      if (PlayerManager.isPlayerType(player, gameData)) {
        if (player.roles.value.filter((pr) => pr.nom == r.nom).length === 0) {
          player.roles.value.push(r);
          PlayerManager.updatePlayerObject(player, gameData);
          fileLogger.log(`Role ${r.nom} assigned to player ${player.id}`);
        }
      } else {
        evaluatorLogger.error(
          "Il n'y pas de player trouvé pour " + r.attribution,
        );
        fileLogger.error(new Error("No player found for " + r.attribution), "Evaluator.js  -->  loadRoles()");
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
 
    const fileLogger = FileLogger.create([
      "LOAD WIN",
      "=====================",
    ]);
    evaluatorLogger.info(`LOAD WIN`);
    evaluatorLogger.info(`[fileLogger] Log file created: ${fileLogger.filepath}`);
    fileLogger.log("Début de loadWin");
    let winParams = gameData.roomInDb.events.win;
    if (!winParams) {
      const msg = "Erreur cannot find win parameters";
      evaluatorLogger.warn(msg);
      fileLogger.log("[loadWin] Paramètres de victoire non trouvés");
      fileLogger.error(new Error(msg), "Evaluator.js  -->  loadWin()");
      return;
    }
    if (!winParams.condition) {
      const msg = "There is win parameters but no condition parameters";
      evaluatorLogger.warn(msg);
      fileLogger.log("[loadWin] Paramètre 'condition' manquant dans winParams");
      fileLogger.error(new Error(msg), "Evaluator.js  -->  loadWin()");
      return;
    }

    fileLogger.log("[loadWin] Paramètres de victoire :");
    fileLogger.log(LoggerClass.objectToString(winParams));

    let allPlayerRespectCondition = true;
    let victory = false;
    let winners = [];

    fileLogger.log("[loadWin] Analyse de la boucle : " + winParams.boucle);
    if (winParams.boucle) {
      fileLogger.log("[loadWin] Exécution de la boucle");
      let elts = Parser.translateInnerExpression(winParams.boucle, gameData);
      fileLogger.log("[loadWin] Résultat de la boucle : " );
      fileLogger.log(LoggerClass.objectToString(elts));
      if (!Array.isArray(elts)) {
        new AppError(
          socket,
          "Cannot obtain array with value " + winParams.boucle,
        );
        evaluatorLogger.error(
          "Cannot obtain array with value " + winParams.boucle,
        );
        fileLogger.error(new Error("Cannot obtain array with value " + winParams.boucle), "Evaluator.js  -->  loadWin()");
        fileLogger.log(LoggerClass.getFileLocalisation());
        LoggerClass.logFileLocalisation();
        return null;
      }

      for (let i = 0; i < elts.length; i++) {
        if (winParams.condition.includes("playerBoucle")) {
          let player = PlayerManager.getPlayer(gameData, i + 1);
          let result = Parser.translateInnerExpression(
            winParams.condition,
            gameData,
            {
              playerBoucle: player,
            },
          );
          fileLogger.log(`[loadWin] Résultat condition pour playerBoucle ${player.id}: ${result}`);
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
            fileLogger.log(`[loadWin] Joueur ajouté aux gagnants: ${player.id}`);
          }
        }
      }
      // si il y a vainqueur alors victoire
      if (winners.length > 0) {
        victory = true;
        fileLogger.log(`[loadWin] Il y a des gagnants: ${winners.map(w=>w.id).join(',')}`);
      }
      // mais si on voulait tous vainqueur alors pas victoire
      if (
        winParams.allElementOfBoucleMustSatisyCondition &&
        winners.length != elts.length
      ) {
        victory = false;
        fileLogger.log(`[loadWin] Tous les éléments doivent satisfaire la condition mais ce n'est pas le cas.`);
      }
      if (winParams.applyOnAllPlayers && victory) {
        fileLogger.log(`[loadWin] Victoire collective, fin de partie.`);
        gameData.data.state.value = "endOfGame";
        gameData.data.winners = winners;
        for (let p of gameData.data.players) {
          p.haswin.value = winners.map((w) => w.id).includes(p.id);
          PlayerManager.updatePlayerObject(p, gameData);
        }
        socket.to(gameData.roomId).emit("gameEnd", { gameData });
      }
      if (!winParams.applyOnAllPlayers && victory) {
        fileLogger.log(`[loadWin] Victoire individuelle, gagnants: ${winners.map(w=>w.id).join(',')}`);
        gameData.data.winners = gameData.data.winners || [];
        gameData.data.winners = [...gameData.data.winners, ...winners];
        for (let p of winners) {
          p.haswin.value = true;
          PlayerManager.updatePlayerObject(p, gameData);
          socket.to(p.socketID).emit("playerWin", { winner: p });
        }
      }
    } else {
      fileLogger.log("[loadWin] Pas de boucle, évaluation directe de la condition");
      let result = Parser.translateInnerExpression(
        winParams.condition,
        gameData,
      );
      fileLogger.log(`[loadWin] Résultat de la condition: ${result}`);
      if (result) {
        fileLogger.log(`[loadWin] Condition de victoire remplie, fin de partie.`);
        gameData.data.state.value = "endOfGame";
        for (let p of gameData.data.players) {
          p.haswin.value = true;
          gameData.data.winners = gameData.data.winners || [];
          gameData.data.winners.push(p);
          PlayerManager.updatePlayerObject(p, gameData);
        }
        socket.to(gameData.roomId).emit("gameEnd", { gameData });
      }
    }
  }
}
