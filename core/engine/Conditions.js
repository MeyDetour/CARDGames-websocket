import AppError from "../error/AppError.js";
import { errorStack } from "../error/ErrorStack.js";
import Parser from "../../parser/parser.js";
import Event from "./Event.js";
import { Logger, LoggerClass } from "../logger/logger.js";
import PlayerManager from "../services/PlayerManager.js";
import { TypeManager } from "../services/helper/TypeManager.js";

let conditionLogger = Logger("condition");

/**
 * Utilitaires pour charger et vérifier les conditions/démons définis dans
 * les événements de la room. Permet d'exécuter automatiquement les
 * événements associés lorsque les conditions sont satisfaites.
 */
export default class Conditions {
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
    if (!gameData.roomInDb.events["demons"]) {
      new AppError(socket, "Demon folder does not exist!");
      return null;
    }
    params.currentPlayer = PlayerManager.getPlayerWhoHasToPlay(gameData).id;
    if (!params.currentPlayer) {
      conditionLogger.warn("There is no current player");
    }

    conditionLogger.info("Load Demons...");
    let c = 0;
    for (let demon of gameData.roomInDb.events["demons"]) {
      if (!demon.name || !demon.condition){
          continue;
      }
      conditionLogger.debug("====DEMON [" + demon.id + "]: " + demon.name);
      let result = null;
      if (demon.boucle) {
        let elts = Parser.translateInnerExpression(
          demon.boucle,
          gameData,
          params
        );

        if (!Array.isArray(elts)) {
          new AppError(
            socket,
            "Cannot obtain array with value " + demon.boucle
          );
          conditionLogger.error(
            "Cannot obtain array with value " + demon.boucle
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
              result = false
              continue;
            }
            params = {
              ...params,
              playerBoucle: PlayerManager.getPlayer(gameData, i + 1),
            };
            result = Parser.translateInnerExpression(
              demon.condition,
              gameData,
              params
            );
          }
        }
      } else {
        result = Parser.translateInnerExpression(demon.condition, gameData, {
          ...params,
          eventEmited: params?.originEvent,
        });
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
        conditionLogger.error(msg);
        LoggerClass.logFileLocalisation();
        errorStack.addError(msg, LoggerClass.getFileLocalisation());
      }

      if (result) {
        conditionLogger.info("le démon est réalisable : " + demon.condition);
        LoggerClass.objectToString(demon)

        for (let id of demon.events) {
          Event.applyEventId(id, socket, gameData, {
            ...params,
            originEvent: "loadDemon",
          });
        }
        if (demon.removeAfterUse) {
          conditionLogger.info("remove demon");
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
    let actions = gameData.roomInDb.params.tours.actions;
    let currentPlayerId = PlayerManager.getPlayerWhoHasToPlay(gameData).id;
    for (let p of gameData.data.players) {
      conditionLogger.info("search actions for player ID=" + p.id);
      let player = structuredClone(p);
      player.actions.value = [];

      for (let a of actions) {
        conditionLogger.debug("condition for event " + a.name);
        let resultOFCondition = Parser.translateInnerExpression(
          a.condition,
          gameData,
          {
            currentPlayer: currentPlayerId,
          }
        );
        if (
          (a.appearAtPlayerTurn ? p.id == currentPlayerId : true) &&
          (TypeManager.isDefined(resultOFCondition) ? resultOFCondition : true)
        ) {
          player.actions.value.push(a);
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
    conditionLogger.info("Load Current Player Action ...");
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
    if (canDoAction && playerId) {
      conditionLogger.debug("Load current player action ");
      for (let event of action.withValue) {
        Event.applyWithValueEvent(event, socket, gameData, params);
      }
    } else {
      conditionLogger.error("Cannot do action for current player ");
      console.log("candDoAction :>> ", canDoAction);
      console.log("currentPlayer :>> ", typeof currentPlayer);
    }
  }
  /**
   * Attribue les rôles définis dans `gameData.data.roles` aux joueurs
   * correspondants en mettant à jour l'objet player.
   * @param {Object} gameData
   * @param {Socket} socket
   */
  static loadRoles(gameData, socket) {
    conditionLogger.info("Load Roles...");
    let roles = gameData.data.roles;

    for (let r of roles) {
      let player = structuredClone(
        Parser.translateInnerExpression(r.attribution, gameData)
      );
      if (PlayerManager.isPlayerType(player, gameData)) {
        if (player.roles.value.filter((pr) => pr.nom == r.nom).length === 0) {
          player.roles.value.push(r);
          PlayerManager.updatePlayerObject(player, gameData);
        }
      } else {
        conditionLogger.error(
          "Il n'y pas de player trouvé pour " + r.attribution
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
}
