import { Logger, LoggerClass } from "../logger/logger.js";
import { TypeManager } from "./helper/TypeManager.js";
import { errorStack } from "../error/ErrorStack.js";
import Parser from "../../parser/parser.js";
import  VariableType  from "../../parser/VariableType.js";
const playerManagerLogger = Logger("PlayerManager");
export default class PlayerManager {
  //playerPosition 1 - x
  // player position must no be index
  static getPlayer(gameData, playerPosition) {
    if (!gameData) {
      const msg = `Game Data is undefined in PlayerManager.getPlayer(playerPosition=${playerPosition})`;
      playerManagerLogger.error(msg);
      LoggerClass.logFileLocalisation();
      errorStack.addError(
        msg,
        LoggerClass.pretty(LoggerClass.getCallerLocation().reverse()),
      );
    }
    if (playerPosition > gameData.data.players.length) {
      playerPosition = (playerPosition % gameData.data.players.length) - 1;
    } else {
      playerPosition--;
    }
    return gameData.data.players[playerPosition];
  }
  static getNextPlayer(gameData, currentPlayerPosition) {
    if (!gameData) {
      const msg = `Game Data is undefined in PlayerManager.getNextPlayer(currentPlayerPosition=${currentPlayerPosition})`;
      playerManagerLogger.error(msg);

      LoggerClass.logFileLocalisation();
      errorStack.addError(
        msg,
        LoggerClass.pretty(LoggerClass.getCallerLocation().reverse()),
      );
      return null;
    }
    let playerIsPrevious = false;
    for (let i=0; i < gameData.data.players.length; i++) {
      let p = gameData.data.players[i];
      if (p.position === currentPlayerPosition) {
        playerIsPrevious = true;
        continue;
      }
      // permet de récupérer le joueur suivant
      // car on est sur d'avoir croiser le joueur actuel
      // on utilise pas la position car elle peut être désordonné
      // et ne pas refléter l'ordre de jeu
      if (playerIsPrevious) {
        if (i === 0) {
          return gameData.data.players[gameData.data.players.length - 1];
        }
        if (i === gameData.data.players.length - 1) {
          return gameData.data.players[0];
        }
        return p;
      }
    }
    // Valeur par défaut a retourner si on ne trouve pas de joueur statisfaisant
    return gameData.data.players[0];
  }
  static getPreviousPlayer(gameData, currentPlayerPosition) {
    if (!gameData) {
      const msg = `Game Data is undefined in PlayerManager.getPreviousPlayer(currentPlayerPosition=${currentPlayerPosition})`;
      playerManagerLogger.error(msg);

      LoggerClass.logFileLocalisation();
      errorStack.addError(
        msg,
        LoggerClass.pretty(LoggerClass.getCallerLocation().reverse()),
      );
      return null;
    }
    let playerIsCurrent = false;
    // on parcours à l'envers la liste
    for (let i = gameData.data.players.length - 1; i >= 0; i--) {
      let p = gameData.data.players[i];
      if (p.position === currentPlayerPosition) {
        playerIsCurrent = true;
        continue;
      }
      // permet de récupérer le joueur précédent
      // car on est sur d'avoir croiser le joueur actuel
      // on utilise pas la position car elle peut être désordonné
      // et ne pas refléter l'ordre de jeu
      if (playerIsCurrent) {
        if (i == 0){
          return gameData.data.players[gameData.data.players.length - 1];
        }
        return gameData.data.players[i - 1];
      }
    }
    // Valeur par défaut a retourner si on ne trouve pas de joueur statisfaisant
    return gameData.data.players[0];
  }
  // DONT SET NEXT PLAYHER TO A SPECTATOR

  static isLastUser(gameData, playerPosition) {
    if (!gameData) {
      const msg = `Game Data is undefined in PlayerManager.isLastUser(playerPosition=${playerPosition})`;
      playerManagerLogger.error(msg);
      LoggerClass.logFileLocalisation();
      errorStack.addError(
        msg,
        LoggerClass.pretty(LoggerClass.getCallerLocation().reverse()),
      );
      return null;
    }
    if (
      gameData.data.players[gameData.data.players.length - 1].position ===
      playerPosition
    ) {
      return true;
    }
    return false;
  }
  static getPlayerWithId(gameData, playerId) {
    if (!gameData) {
      const msg = `Game Data is undefined in PlayerManager.getPlayerWithId(playerId=${playerId})`;
      playerManagerLogger.error(msg);
      LoggerClass.logFileLocalisation();
      try {
        errorStack.addError(
          msg,
          LoggerClass.pretty(LoggerClass.getCallerLocation().reverse()),
        );
      } catch (e) {}
      return null;
    }
    for (let p of gameData.data.players) {
      if (p.id === playerId) {
        return p;
      }
    }
    return null;
  }
  static allPlayerHasFinished(gameData) {
    let result = true;
    for (let p of gameData.data.players) {
      if (!p.haswin.value && !p.hasloose.value) {
        result = false;
        break;
      }
    }
    return result;
  }
  static getStartPlayer(gameData) {
    if (!gameData) {
      const msg = `Game Data is undefined in PlayerManager.getStartPlayer()`;
      playerManagerLogger.error(msg);
      LoggerClass.logFileLocalisation();
      try {
        errorStack.addError(
          msg,
          LoggerClass.pretty(LoggerClass.getCallerLocation().reverse()),
        );
      } catch (e) {}
      return null;
    }
    let nextP = PlayerManager.getPlayerWithPosition(gameData, 1);
    while (PlayerManager.isPlayerActifInGame(nextP)) {
      nextP = PlayerManager.getNextPlayer(gameData, 1);

      gameData.data.currentPlayerPosition.value = nextP.position;
    }
    return nextP;
  }
  static getPlayerWithPosition(gameData, playerPosition) {
    if (!gameData) {
      const msg = `Game Data is undefined in PlayerManager.getPlayerWithPosition(playerPosition=${playerPosition})`;
      playerManagerLogger.error(msg);
      LoggerClass.logFileLocalisation();
      try {
        errorStack.addError(
          msg,
          LoggerClass.pretty(LoggerClass.getCallerLocation().reverse()),
        );
      } catch (e) {}
      return null;
    }
    for (let p of gameData.data.players) {
      if (p.position === playerPosition) {
        return p;
      }
    }
    return null;
  }

  static createPlayerOBject(baseObecjt, globalValueOFPlayer, gainList) {
    let gainObject = {};
    for (let gain of gainList) {
      gainObject[gain.id] = { value: 0 };
    }

    let globalValueOfPlayer = structuredClone(globalValueOFPlayer);
    for (let key of Object.keys(globalValueOfPlayer)) {
      globalValueOfPlayer[key].value = globalValueOfPlayer[key].defaultValue
        ? globalValueOfPlayer[key].defaultValue
        : TypeManager.getDefaultValueOfType(globalValueOfPlayer[key].type);
    }
    return {
      // order in list is the order of turn
      ...baseObecjt,
      ...globalValueOfPlayer,
      gain: { type: "object", value: gainObject },
      handDeck: { type: "cardList", value: [] }, //card id
      personalHandDeck: { type: "cardList", value: [] }, //card id
      personalHandDiscard: { type: "cardList", value: [] }, // card id
      hasPlayed: { type: "boolean", value: false },
      haswin: { type: "boolean", value: null },
      hasloose: { type: "boolean", value: false },
      actions: { type: "array", value: [] },
      roles: { type: "array", value: [] },
      isSpectator: { type: "boolean", value: false },
      attachedEventForTour: {
        type: "array",
        value: [],
      },
    };
  }
  static #save(playerObject, gameData) {
    const log = false;
    const hardlog = false;
    let playerIndex = null;
    let player = null;

    if (log) playerManagerLogger.debug("verify if playerobject exit");
    for (let index = 0; index < gameData.data.players.length; index++) {
      if (hardlog) {
        playerManagerLogger.debug("player study : ");
        LoggerClass.objectToString(gameData.data.players[index]);
        playerManagerLogger.debug(
          "player study id=" + gameData.data.players[index]["id"],
        );
        playerManagerLogger.debug("search id=" + playerObject.id);
        playerManagerLogger.debug(
          "is equal ?  " + gameData.data.players[index]["id"] ===
            playerObject.id,
        );
      }
      if (gameData.data.players[index]["id"] === playerObject.id) {
        playerIndex = index;
        player = gameData.data.players[index];
      }
    }

    if (log) playerManagerLogger.debug("==========UPDATE PLAYER============");
    if (hardlog) LoggerClass.objectToString(gameData.data.players);
    if (log) LoggerClass.logConsoleGridOldNew(player, playerObject);

    if (playerIndex != null) {
      if (log)
        playerManagerLogger.debug(
          "========== index to replace : " + playerIndex,
        );

      gameData.data.players.splice(playerIndex, 1, playerObject);
      if (hardlog) {
        playerManagerLogger.debug("========== new list  :");
        LoggerClass.objectToString(gameData.data.players);
      }
      if (log)
        playerManagerLogger.debug("==========END OF UPDATE PLAYER============");
    } else {
      const msg = "no index so no save index=" + playerIndex;
      playerManagerLogger.error(msg);
      LoggerClass.logFileLocalisation();
      try {
        errorStack.addError(
          msg,
          LoggerClass.pretty(LoggerClass.getCallerLocation().reverse()),
        );
      } catch (e) {}
    }
  }

  // update player object in game data if exist in player list
  // playerObject can be full or partial object of player but must contain id
  // gameData is used to find player list and update the good player object
  // playerObjectList is used when we want to access {player#card} if we
  // have just the card list we cant access player, so we must store the path to access to the card list
  // in this case its [player,card] = playerObjectList
  // thanks this we will be able to search the player source object of this card list and update it
  static updatePlayerObject(playerObject, gameData, playerObjectList = null) {
    if (!playerObject && !playerObjectList) {
      return;
    }
    if (playerObject && this.isPlayerType(playerObject, gameData, null)) {
      this.#save(playerObject, gameData);
      return;
    }

    if (playerObjectList) {
      for (let elt of playerObjectList) {
        if (this.isPlayerType(elt, gameData)) {
          this.#save(elt, gameData);
          return;
        }
      }
    }
  }
  static isPlayerActifInGame(player) {
    // Un joueur est actif s'il n'a pas gagné, n'est pas spectateur, et n'a pas perdu
    // On considère null ou undefined comme "pas gagné" (donc actif)
    const hasWin = player.haswin && TypeManager.isTrue(player.haswin.value);
    const isSpectator =
      player.isSpectator && TypeManager.isTrue(player.isSpectator.value);
    const hasLoose =
      player.hasloose && TypeManager.isTrue(player.hasloose.value);
    return !hasWin && !isSpectator && !hasLoose;
  }

  static changePlayerOrder(order, gameData) {
    // list de base = 1 ,2 ,3, 4 ,5,
    // Imagine un rond
    if (order === "next") {
      // le deuxieme joueur commence : on met le premier joueur a la fin de la liste
      // new list = 2 ,3 ,4 ,5 , 1
      gameData.data.players.push(gameData.data.players.shift());
    }
    if (order === "previous") {
      // le dernier joueur commence : on met le dernier joueur a la fin de la liste
      // new list = 5, 1, 2 ,3 ,4
      gameData.data.players.unshift(gameData.data.players.pop());
    }

    //update position
    for (let p = 0; p < gameData.data.players.length; p++) {
      let newP = structuredClone(gameData.data.players[p]);
      newP["position"] = p + 1;
      PlayerManager.updatePlayerObject(newP, gameData);
    }
  }
  static reORderPlayerPosition(gameData) {
    gameData.data.players.forEach((player, index) => {
      player.position = index + 1;
    });
    if (
      gameData.data.currentPlayerPosition.value > gameData.data.players.length
    ) {
      gameData.data.currentPlayerPosition.value = 1;
    }
  }
  static getPlayerWhoHasToPlay(gameData) {
    for (let p of gameData.data.players) {
      if (p.position === gameData.data.currentPlayerPosition.value) {
        return p;
      }
    }
    return null;
  }

  static isPlayerType(element, gameData) {
    if (!element) {
      const msg = `Element is undefined in PlayerManager.isPlayerType(element=${element})`;
      playerManagerLogger.error(msg);
      LoggerClass.logFileLocalisation();
      return false;
    }
    if (!gameData) {
      const msg = `GameData is undefined in PlayerManager.isPlayerType(gameData=${gameData})`;
      playerManagerLogger.error(msg);
      LoggerClass.logFileLocalisation();
      return false;
    }

    if (element.id) {
      const player = gameData.data.players.filter(
        (v) => v.id === element.id,
      )[0];
      if (player) {
        return true;
      }
    }
    if (
      element.handDeck != null ||
      element.personalHandDeck != null ||
      element.personalHandDiscard != null ||
      element.hasPlayed != null ||
      element.haswin != null
    ) {
      return true;
    }

    return false;
  }

  static verifyIsPlayerCanDoAction(playerId, gameData, action) {
    if (playerId === this.getPlayerWhoHasToPlay(gameData).id) {
      return true;
    }
    if (!action.appearAtPlayerTurn) {
      return true;
    }
    return false;
  }
  static restartPlayers(gameData) {
    // on itere dans les joueurs
    // on utilise updatePlayerObject pour mettre à jour les joueurs
    // plutot que d'ecraser data.players afin d'eviter
    // les effets de bord et problemes de réferences
    let gainObject = {};
    for (let gain of gameData.roomInDb.assets.gains) {
      gainObject[gain.id] = { value: 0 };
    }
    let globalValueOfPlayer = { ...gameData.roomInDb.playerGlobalValue };
    for (let key of Object.keys(globalValueOfPlayer)) {
      globalValueOfPlayer[key].value = globalValueOfPlayer[key].defaultValue
        ? globalValueOfPlayer[key].defaultValue
        : TypeManager.getDefaultValueOfType(globalValueOfPlayer[key].type);
    }
    let newPlayers = [];
    [...gameData.data.players, ...gameData.data.spectators].forEach(
      (player) => {
        let newPlayer = PlayerManager.restartPlayer(
          player,
          gainObject,
          globalValueOfPlayer,
        );
        newPlayers.push(newPlayer);
      },
    );
    gameData.data.players = newPlayers;
    gameData.data.spectators = [];
  }
  static restartPlayer(player, gainObject, globalValueOfPlayer) {
    // on itere dans les joueurs
    // on utilise updatePlayerObject pour mettre à jour les joueurs
    // plutot que d'ecraser data.players afin d'eviter
    // les effets de bord et problemes de réferences

    let newPlayer = { ...player, ...globalValueOfPlayer };
    console.log(newPlayer);
    if (TypeManager.isDefined(newPlayer.hasPlayed)) {
      newPlayer.hasPlayed.value = false;
    } else {
      newPlayer.hasPlayed = { type: "boolean", value: false };
    }
    if (TypeManager.isDefined(newPlayer.hasloose)) {
      newPlayer.hasloose.value = false;
    } else {
      newPlayer.hasloose = { type: "boolean", value: false };
    }
    if (TypeManager.isDefined(newPlayer.haswin)) {
      newPlayer.haswin.value = false;
    } else {
      newPlayer.haswin = { type: "boolean", value: false };
    }
    if (TypeManager.isDefined(newPlayer.handDeck)) {
      newPlayer.handDeck.value = [];
    } else {
      newPlayer.handDeck = { type: "cardList", value: [] };
    }
    if (TypeManager.isDefined(newPlayer.personalHandDeck)) {
      newPlayer.personalHandDeck.value = [];
    } else {
      newPlayer.personalHandDeck = { type: "cardList", value: [] };
    }
    if (TypeManager.isDefined(newPlayer.personalHandDiscard)) {
      newPlayer.personalHandDiscard.value = [];
    } else {
      newPlayer.personalHandDiscard = { type: "cardList", value: [] };
    }
    if (TypeManager.isDefined(newPlayer.actions)) {
      newPlayer.actions.value = [];
    } else {
      newPlayer.actions = { type: "array", value: [] };
    }
    if (TypeManager.isDefined(newPlayer.roles)) {
      newPlayer.roles.value = [];
    } else {
      newPlayer.roles = { type: "array", value: [] };
    }
    if (TypeManager.isDefined(newPlayer.hasPlayed)) {
      newPlayer.hasPlayed.value = false;
    } else {
      newPlayer.hasPlayed = { type: "boolean", value: false };
    }
    if (TypeManager.isDefined(newPlayer.attachedEventForTour)) {
      newPlayer.attachedEventForTour.value = [];
    } else {
      newPlayer.attachedEventForTour = { type: "array", value: [] };
    }
    newPlayer.gain = { type: "object", value: { ...gainObject } };
    return newPlayer;
  }

  static setPlayerAsSpectator(playerId, gameData, socket) {
    for (let p of gameData.data.players) {
      if (p.id === playerId) {
        let player = gameData.data.players.find((s) => s.id === playerId);
        gameData.data.spectators.push(player);
        gameData.data.players = gameData.data.players.filter(
          (s) => s.id !== playerId,
        );
        PlayerManager.reORderPlayerPosition(gameData);
        socket.to(p.socketID).emit("youAreSpectator");
      }
    }
  }
  static setSpectatorAsPlayer(spectatorId, gameData) {
    // on itere dans les joueurs
    // on utilise updatePlayerObject pour mettre à jour les joueurs
    // plutot que d'ecraser data.players afin d'eviter
    // les effets de bord et problemes de réferences
    let gainObject = {};
    for (let gain of gameData.roomInDb.assets.gains) {
      gainObject[gain.id] = { value: 0 };
    }
    let globalValueOfPlayer = { ...gameData.roomInDb.playerGlobalValue };
    for (let key of Object.keys(globalValueOfPlayer)) {
      globalValueOfPlayer[key].value = globalValueOfPlayer[key].defaultValue
        ? globalValueOfPlayer[key].defaultValue
        : TypeManager.getDefaultValueOfType(globalValueOfPlayer[key].type);
    }

    let actualSpectator = gameData.data.spectators.find((s) => s.id === spectatorId);
 
    if(!actualSpectator){
      const msg = `Spectator with id ${spectatorId} not found in setSpectatorAsPlayer()`;
      playerManagerLogger.error(msg);
      LoggerClass.logFileLocalisation();
      try {
        errorStack.addError(
          msg,
          LoggerClass.pretty(LoggerClass.getCallerLocation().reverse()),
        );
      } catch (e) {}
      return null;
    }
    let newPlayer = PlayerManager.restartPlayer(
      actualSpectator,
      gainObject,
      globalValueOfPlayer,
    );

    gameData.data.players = [...gameData.data.players, newPlayer];
    gameData.data.spectators = gameData.data.spectators.filter(
      (s) => s.id !== spectatorId,
    );
    PlayerManager.reORderPlayerPosition(gameData);
    return newPlayer;
  }

    /**
     * Résout la cible (destinataire) d'un event en évaluant la clause `for`.
     * Supporte la valeur spéciale `playerBoucle` lorsqu'on est dans une boucle.
     * @param {Object} event
     * @param {Object} gameData
     * @param {number|null} indexInLoop - index de l'itération lorsqu'utilisé en boucle
     * @param {Object} [params={}] - paramètres passés aux expressions
     * @returns {[Array|null, Object|null]} retourne [list, destinataireRef]
     */
    static getDestinataireElement(event, gameData, indexInLoop, params = {}) {
      if (event["event"]["for"]) {
        if (event.event.for.includes("playerBoucle")) {
          let list = VariableType.getListSplited(
            event["event"]["for"],
            gameData,
            null,
          );
  
          // dans le cas d'une boucle
          let playerBoucleIndex = list.indexOf("playerBoucle");
          if (playerBoucleIndex > -1) {
            if (indexInLoop !== null) {
              let player = PlayerManager.getPlayer(gameData, indexInLoop + 1);
              params["playerBoucle"] = player;
              list.splice(playerBoucleIndex, 1, player);
            } else {
              const msg = `Event ${event.id} Want to check 'playerBoucle' but does not provide any index number in iteration`;
              eventLogger.error(msg);
              LoggerClass.logFileLocalisation();
              errorStack.addError(
                msg,
                LoggerClass.pretty(LoggerClass.getCallerLocation().reverse()),
              );
              return [null, null];
            }
          }
          return [
            list,
            VariableType.splitLogicalList(list, gameData, {
              returnType: "ref",
              ...params,
            }),
          ];
        }
        return [
          null,
          Parser.translateInnerExpression(event["event"]["for"], gameData, {
            returnType: "ref",
            ...params,
          }),
        ];
      }
      return [null, null];
    }
  
    /**
     * Résout l'élément sender (champ `from`) pour un event.
     * @param {Object} event
     * @param {Object} gameData
     * @param {Object} [params]
     * @returns {*} référence vers l'élément sender (ou undefined)
     */
  
    static getSenderElement(event, gameData, indexInLoop, params = {}) {
      if (params && params.log) {
        eventLogger.debug("event :>> " + typeof event);
        eventLogger.debug("gameData :>> " + typeof gameData);
        eventLogger.debug("indexInLoop :>> " + indexInLoop);
        eventLogger.debug("params :>> " + typeof params);
      }
      if (event["event"]["from"]) {
        if (event.event.from.includes("playerBoucle")) {
          console.log("playerBoucle :>> ");
          let list = VariableType.getListSplited(
            event["event"]["from"],
            gameData,
            params,
          );
  
          // dans le cas d'une boucle
          let playerBoucleIndex = list.indexOf("playerBoucle");
          if (playerBoucleIndex > -1) {
            if (indexInLoop !== null) {
              let player = PlayerManager.getPlayer(gameData, indexInLoop + 1);
              params["playerBoucle"] = player;
              list.splice(playerBoucleIndex, 1, player);
            } else {
              const msg = `Event ${event.id} Want to check 'playerBoucle' but does not provide any index number in iteration`;
              eventLogger.error(msg);
              LoggerClass.logFileLocalisation();
              errorStack.addError(
                msg,
                LoggerClass.pretty(LoggerClass.getCallerLocation().reverse()),
              );
              return [null, null]; // Retourne null si l'index n'est pas fourni
            }
          }
          return [
            list,
            VariableType.splitLogicalList(list, gameData, {
              returnType: "ref",
              ...params,
            }),
          ];
        }
        return [
          null,
          Parser.translateInnerExpression(event["event"]["from"], gameData, {
            returnType: "ref",
            ...params,
          }),
        ];
      }
      return [null, null];
    }
}
