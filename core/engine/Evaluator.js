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
 * Utilitaires pour charger et vérifier les conditions/déclencheurs définis dans
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
   *                 removeAfterUse:bool,  -> like "onStartGame" we want to delete trigger
   * return : value
   */
  /**
   * Parcourt les déclencheurs (rules) et exécute les events associés si la
   * condition du déclencheur est vraie.
   * @param {Object} gameData - données complètes de la partie
   * @param {Socket} socket - socket de l'appelant (pour émettre des erreurs)
   * @param {Object} [params] - params: { originEvent, removeAfterUse }
   * @returns {null|void}
   */
  static loadDeclencheur(gameData, socket, params) {
    let fileLogger = null;
Event._eventCallCounts = {}
    // CREATE DECLENCHEUR FILE LOG
    if (process.env.ENGINE_FILE_LOG !== "false") {
      fileLogger = FileLogger.create(["LOAD DECLENCHEUR", "====================="]);
      evaluatorLogger.info(this.evaluatorLogTitle("loadDeclencheur"));
      evaluatorLogger.info(
        "Load Declencheur with params : " + JSON.stringify(params),
      );
      params.location = fileLogger;
      if (fileLogger) {
        evaluatorLogger.info(
          `[fileLogger] Log file created: ${fileLogger.filepath}`,
        );
      }
    }

    // No triggers
    if (!gameData.roomInDb.events["triggers"]) {
      new AppError(socket, "triggers key does not exist!");
      if (fileLogger) {
        fileLogger.error(
          new Error("triggers key does not exist!"),
          "Evaluator.js  -->  loadDeclencheur()",
        );
      }
      return null;
    }

    // GET CURRENT PLAYER
    params.currentPlayer = PlayerManager.getPlayerWhoHasToPlay(gameData).id;
    if (!params.currentPlayer) {
      evaluatorLogger.warn("There is no current player");
      if (fileLogger) fileLogger.warn("There is no current player");
    }

    // VERIFY ALL DECLENCHEURS
    let c = 0;
    for (let trigger of gameData.roomInDb.events["triggers"]) {
      // LOG START DECLENCHEUR CHECK
      if (fileLogger) {
        fileLogger.log(
          `Check trigger: ${trigger.name || "unnamed"} | condition: ${trigger.condition}`,
        );
        fileLogger.log(LoggerClass.pretty(trigger));
      }
      // IF THERE NO CONDITION OR NAME
      if (!trigger.name || !trigger.condition) {
        if (fileLogger) {
          console.log(fileLogger);
          fileLogger.warn(
            `Declencheur missing name or condition: ${JSON.stringify(trigger)}`,
          );
        }
        continue;
      }
      // evaluatorLogger.debug("====DECLENCHEUR [" + trigger.id + "]: " + trigger.name);
      let result = null;

      // IF DECLENCHEUR MUST ITERATE ON ELEMENT TO CHECK CONDITION
      if (trigger.boucle) {
        if (fileLogger) fileLogger.log(`Declencheur boucle: ${trigger.boucle}`);
        let elts = Parser.translateInnerExpression(
          trigger.boucle,
          gameData,
          params,
        );

        if (!Array.isArray(elts)) {
          new AppError(
            socket,
            "Cannot obtain array with value " + trigger.boucle,
          );
          evaluatorLogger.error(
            "Cannot obtain array with value " + trigger.boucle,
          );
          fileLogger.error(
            new Error("Cannot obtain array with value " + trigger.boucle),
            "Evaluator.js  -->  loadDeclencheur()",
          );
          return null;
        }

        for (let i = 0; i < elts.length; i++) {
          if (trigger.condition.includes("playerBoucle")) {
            if (result === false) {
              continue;
            }

            if (
              params.originEvent &&
              !trigger.condition.includes(params.originEvent)
            ) {
              result = false;
              continue;
            }
            params = {
              ...params,
              playerBoucle: PlayerManager.getPlayer(gameData, i + 1),
            };
            result = Parser.translateInnerExpression(
              trigger.condition,
              gameData,
              params,
            );
            if (fileLogger)
              fileLogger.log(
                `Boucle result for playerBoucle: ${JSON.stringify(result)}`,
              );
          }
        }
      } else {
        // IF ITS SIMPLE CONDITION
        result = Parser.translateInnerExpression(trigger.condition, gameData, {
          ...params,
          eventEmited: params?.originEvent,
        });
        if (fileLogger)
          fileLogger.log(
            `Result for trigger condition: ${JSON.stringify(result)}`,
          );
        // un trigger appelé par un originEvent (ChangerManche,changertour etc)
        // declenche des evenements et triggers, eviter de repeter deux fois le
        //  meme trigger alors qu'il n'a pas fini d'executer ses evenements
        // eviter de repeter deux fois l'evenement si on
        if (
          params.originEvent &&
          !trigger.condition.includes(params.originEvent)
        ) {
          result = false;
        }
      }

      if (typeof result !== "boolean") {
        const msg =
          "Erreur sur la condition : " +
          trigger.condition +
          " le résultat n'est pas un boolean mais : " +
          JSON.stringify(result);
        evaluatorLogger.error(msg);
        if (fileLogger)
          fileLogger.error(new Error(msg), "Evaluator.js  -->  loadDeclencheur()");
        LoggerClass.logFileLocalisation();
        errorStack.addError(
          msg,
          LoggerClass.pretty(LoggerClass.getCallerLocation().reverse()),
        );
      }

      if (result) {
        evaluatorLogger.info("le déclencheur est réalisable : " + trigger.condition);
        if (fileLogger) fileLogger.log(`Declencheur réalisable: ${trigger.condition}`);
        gameData.data.testLogs.push({
          testType: "trigger",
          ...trigger,
          executionDate: new Date(),
          id: "o45455efer",
        });
        LoggerClass.objectToString(trigger);

        for (let id of trigger.events) {
          if (fileLogger) fileLogger.log(`Apply event id: ${id}`);
          Event.applyEventId(id, socket, gameData, {
            ...params,
            originEvent: "loadDeclencheur",
          });
        }
        if (trigger.removeAfterUse) {
          evaluatorLogger.info("remove trigger");
          if (fileLogger) fileLogger.log("remove trigger");
          gameData.roomInDb.events["triggers"].splice(c, 1);
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
    if (fileLogger) {
      fileLogger.log("--- CONTEXTE DES ACTIONS ---");
      fileLogger.log(LoggerClass.pretty(actions));
      fileLogger.log("Deck : ");
      fileLogger.log(LoggerClass.pretty(gameData.data.deck));
      fileLogger.log("Discard Deck : ");
      fileLogger.log(LoggerClass.pretty(gameData.data.discardDeck));
    }
    let currentPlayerId = PlayerManager.getPlayerWhoHasToPlay(gameData).id;
    for (let pIndex = 0; pIndex < gameData.data.players.length; pIndex++) {
      let p = gameData.data.players[pIndex];
      if (fileLogger) {
        fileLogger.log(
          `\n[BOUCLE JOUEUR] Etude du joueur #${pIndex + 1} (ID=${p.id}, pseudo=${p.pseudo})`,
        );
        fileLogger.log(LoggerClass.pretty(p));
      }
      let player = structuredClone(p);
      player.actions.value = [];

      for (let aIndex = 0; aIndex < actions.length; aIndex++) {
        let a = actions[aIndex];
        if (fileLogger) {
          fileLogger.log(
            `\n  [ACTION] Etude de l'action #${aIndex + 1} : ${a.name || "unnamed"}`,
          );
          fileLogger.log(`Paramètres de l'action : ${LoggerClass.pretty(a)}`);
        }
        let resultOFCondition = null;
        if (a.condition) {
          if (fileLogger) {
            fileLogger.log(`[CONDITION] Condition à évaluer : ${a.condition}`);
            fileLogger.log(
              `Paramètres utilisés : currentPlayer=${currentPlayerId}`,
            );
          }
          resultOFCondition = Parser.translateInnerExpression(
            a.condition,
            gameData,
            {
              currentPlayer: currentPlayerId,
              location: fileLogger,
            },
          );
          if (fileLogger)
            fileLogger.log(
              `[RESULTAT CONDITION] Résultat de la condition pour ${a.name || "unnamed"} : ${JSON.stringify(resultOFCondition)}`,
            );
        } else {
          if (fileLogger)
            fileLogger.log(
              "    [CONDITION] Pas de condition, action toujours possible.",
            );
        }

        // return truc if  resultOFCondition is not defined because
        // some actions dont have any condition
        if (
          (a.appearAtPlayerTurn ? p.id == currentPlayerId : true) &&
          (TypeManager.isDefined(resultOFCondition) ? resultOFCondition : true)
        ) {
          player.actions.value.push(a);
          if (fileLogger)
            fileLogger.log(
              `[ACTION AJOUTEE] Action ajoutée à la liste du joueur : ${a.name || "unnamed"}`,
            );

          // Gestion des actions sur la main
          if (a.actionOnHand && a.conditionOfCardSelection) {
            if (fileLogger)
              fileLogger.log(
                `[ACTION SUR MAIN] Vérification des cartes de la main pour l'action : ${a.name || "unnamed"}`,
              );
            fileLogger.log(
              `  [CONDITION CARTE] Condition à évaluer : ${a.conditionOfCardSelection} ============================================`,
            );
            for (
              let cardIndex = 0;
              cardIndex < player.handDeck.value.length;
              cardIndex++
            ) {
              let cardId = player.handDeck.value[cardIndex];
              let card = gameData.data.cards[cardId];
              if (card) {
           
                let result = Parser.translateInnerExpression(
                  a.conditionOfCardSelection,
                  gameData,
                  {
                    currentPlayer: currentPlayerId,
                    playerCard: card.addedAttributs,
                    location: fileLogger,
                  },
                );
                if (fileLogger) 
                  fileLogger.log(
                    `  [${result}] Etude de la carte #${cardIndex + 1} (ID=${cardId}) : ${LoggerClass.pretty(card)}`,
                  );
                
                if (!player.cardsSelectableForActionOnHand) {
                  player.cardsSelectableForActionOnHand = { value: [] };
                }
                if (result) {
                  player.cardsSelectableForActionOnHand.value.push(cardId);
                }
              } else {
                if (fileLogger)
                  fileLogger.log(
                    `  [CARTE] Carte non trouvée pour l'ID : ${cardId}`,
                  );
              }
            }
            if (fileLogger)
              fileLogger.log(
                `[RESULTAT ACTION SUR MAIN] Cartes sélectionnables pour l'action sur main : ${JSON.stringify(player.cardsSelectableForActionOnHand)}`,
              );
              fileLogger.log(
              `  [FIN CONDITION CARTE] ${a.conditionOfCardSelection} ============================================`,
            );
          }
          // Gestion des actions sur le deck (exemple, à adapter si besoin)
          if (a.actionOnDeck && a.conditionOfDeckSelection) {
            if (fileLogger)
              fileLogger.log(
                `[ACTION SUR DECK] Vérification des cartes du deck pour l'action : ${a.name || "unnamed"}`,
              );
            for (
              let cardIndex = 0;
              cardIndex < player.deck.value.length;
              cardIndex++
            ) {
              let cardId = player.deck.value[cardIndex];
              let card = gameData.data.cards[cardId];
              if (card) {
                if (fileLogger) {
                  fileLogger.log(
                    `  [CARTE DECK] Etude de la carte #${cardIndex + 1} (ID=${cardId}) : ${LoggerClass.pretty(card)}`,
                  );
                  fileLogger.log(
                    `  [CONDITION DECK] Condition à évaluer : ${a.conditionOfDeckSelection}`,
                  );
                }
                let result = Parser.translateInnerExpression(
                  a.conditionOfDeckSelection,
                  gameData,
                  {
                    currentPlayer: currentPlayerId,
                    playerCard: card,
                    location: fileLogger,
                  },
                );
                if (fileLogger)
                  fileLogger.log(
                    `  [RESULTAT CONDITION DECK] Résultat : ${JSON.stringify(result)}`,
                  );
                if (!player.cardsSelectableForActionOnDeck) {
                  player.cardsSelectableForActionOnDeck = { value: [] };
                }
                player.cardsSelectableForActionOnDeck.value.push(cardId);
                if (fileLogger)
                  fileLogger.log(
                    `  [ACTION SUR DECK] Carte ajoutée comme sélectionnable pour l'action : ${cardId}`,
                  );
              } else {
                if (fileLogger)
                  fileLogger.log(
                    `  [CARTE DECK] Carte non trouvée pour l'ID : ${cardId}`,
                  );
              }
            }
            if (fileLogger)
              fileLogger.log(
                `[RESULTAT ACTION SUR DECK] Cartes sélectionnables pour l'action sur deck : ${JSON.stringify(player.cardsSelectableForActionOnDeck)}`,
              );
          }
        } else {
          if (fileLogger)
            fileLogger.log(
              `[ACTION NON AJOUTEE] Condition non remplie ou ce n'est pas le tour du joueur.`,
            );
        }
      }
      if (fileLogger)
        fileLogger.log(
          `[FIN JOUEUR] Actions finales pour le joueur ${player.id} : ${LoggerClass.pretty(player.actions.value)}`,
        );
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
        "=========================",
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
        if (fileLogger)
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
    let fileLogger = null;
    if (process.env.ENGINE_FILE_LOG !== "false") {
      fileLogger = FileLogger.create(["LOAD ROLES", "====================="]);
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
          if (fileLogger)
            fileLogger.log(`Role ${r.name} assigned to player ${player.id}`);
        }
      } else {
        evaluatorLogger.error(
          "Il n'y pas de player trouvé pour " + r.attribution,
        );
        if (fileLogger)
          fileLogger.error(
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

    if (fileLogger)
      fileLogger.log(" Analyse de la boucle : " + winParams.boucle);
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
            if (fileLogger)
              fileLogger.log(` Joueur ajouté aux gagnants: ${player.id}`);
          }
        }
      }
      if (fileLogger) {
        fileLogger.log(" Vainqueurs potentiels :");
        fileLogger.log(LoggerClass.pretty(winners.map((w) => w.id)));
      }
      // si il y a vainqueur alors victoire
      // si il y a vainqueur alors victoire
      if (winners.length > 0) {
        victory = true;
        if (fileLogger)
          fileLogger.log(
            ` Il y a des gagnants: ${winners.map((w) => w.id).join(",")}`,
          );
      }
      // mais si on voulait tous vainqueur alors pas victoire
      if (
        winParams.allElementOfBoucleMustSatisyCondition &&
        winners.length != elts.length
      ) {
        victory = false;
        if (fileLogger)
          fileLogger.log(
            ` Tous les éléments doivent satisfaire la condition mais ce n'est pas le cas.`,
          );
      }
      if (!gameData.data.losers) gameData.data.losers = { type: "array", value: [] };
      if (!Array.isArray(gameData.data.losers.value)) gameData.data.losers.value = [];
      // --- CAS 1 : VICTOIRE COLLECTIVE (Fin de la partie pour tout le monde) ---
      if (winParams.applyOnAllPlayers && victory) {
        if (fileLogger) fileLogger.log(` Victoire collective, fin de partie.`);
        gameData.data.state.value = "endOfGame";
        gameData.data.winners.value = winners;
        let losers = [];
        const winnerIds = winners.map((w) => w.id);

        for (let p of gameData.data.players) {
          p.haswin.value = winnerIds.includes(p.id);
          p.hasloose.value = !winnerIds.includes(p.id);
          PlayerManager.updatePlayerObject(p, gameData);

          if (p.haswin.value) {
            socket.to(p.socketID).emit("playerWin", { gameData, player: p });
          } else {
            losers.push(p);
            socket.to(p.socketID).emit("playerLoose", { gameData, player: p });
          }
        }
        gameData.data.losers.value = losers;
        gameData.data.logs.push("Victoire collective des joueurs !");
        
        // On envoie le signal de fin globale à TOUTE la room (sans exclure personne)
        socket.emit("gameEnd", { gameData });
        socket.to(gameData.roomId).emit("gameEnd", { gameData });
      }

      // --- CAS 2 : VICTOIRE INDIVIDUELLE (La partie continue ou s'arrête par joueur) ---
      if (!winParams.applyOnAllPlayers && victory) {
        if (fileLogger)
          fileLogger.log(
            ` Victoire individuelle, gagnants: ${winners.map((w) => w.id).join(",")}`,
          );
        if (!Array.isArray(gameData.data.winners.value)) {
          gameData.data.winners.value = [];
        }
        gameData.data.winners.value = [
          ...gameData.data.winners.value,
          ...winners
        ];
        
        for (let p of winners) {
          p.haswin.value = true;
          PlayerManager.updatePlayerObject(p, gameData);
          
          let newGameData = roomManager.getRoom(gameData.roomId);
          newGameData.data.logs.push(`Joueur ${p.pseudo} a gagné.`);
          
          // Notification individuelle du gagnant
          socket.to(p.socketID).emit("playerWin", { gameData: newGameData, player: p });
        }
        gameData.data.losers.value = gameData.data.players.filter(p => !p.haswin.value);
      }

      // --- CAS 3 : TOUS LES JOUEURS ONT TERMINÉ (Sécurité de fin de jeu) ---
      // On ajoute un "&& !victory" pour éviter d'émettre deux fois si le Cas 1 a déjà tout clôturé
      if (!victory && PlayerManager.allPlayerHasFinished(gameData)) {
        if (fileLogger)
          fileLogger.log(" Tous les joueurs ont terminé, fin de partie.");
        gameData.data.state.value = "endOfGame";
        let losers = [];
        for (let p of gameData.data.players) {
          if (!p.haswin.value) {
            p.hasloose.value = true;
            losers.push(p);
          }
          PlayerManager.updatePlayerObject(p, gameData);
          socket.to(p.socketID).emit("playerLoose", { gameData, player: p });
        }
        gameData.data.losers.value = losers;
        gameData.data.logs.push("Tous les joueurs ont terminé, fin de partie.");
        
        socket.emit("gameEnd", { gameData });
        socket.to(gameData.roomId).emit("gameEnd", { gameData });
      }
    } else {
      if (fileLogger)
        fileLogger.log(" Pas de boucle, évaluation directe de la condition");
      let result = Parser.translateInnerExpression(
        winParams.condition,
        gameData,
        {
          precedentFileLogger: fileLogger,
        },
      );
      if (fileLogger) fileLogger.log(` Résultat de la condition: ${result}`);
      if (result) {
        if (fileLogger)
          fileLogger.log(` Condition de victoire remplie, fin de partie.`);
        gameData.data.state.value = "endOfGame";
        if (!gameData.data.losers) gameData.data.losers = { type: "array", value: [] };
        for (let p of gameData.data.players) {
          p.haswin.value = true;
          
          gameData.data.winners.value = gameData.data.winners.value || [];
          gameData.data.winners.value.push(p);
          PlayerManager.updatePlayerObject(p, gameData);
        }
        gameData.data.losers.value = [];
        gameData.data.logs.push("Victoire globale des joueurs !");
        socket.to(gameData.roomId).emit("gameEnd", { gameData });
      }
    }

    console.log(gameData.data.state);
  }
  static evaluatorLogTitle(type) {
    if (type === "loadDeclencheur")
      return "LOAD DECLENCHEUR============================================================================================";
    if (type === "loadRoles")
      return "=============LOAD ROLES==============================================================================";
    if (type === "loadActionsForPlayers")
      return "=========================LOAD ACTIONS FOR PLAYERS====================================================";
    if (type === "loadGlobalValueStatic")
      return "====================================================LOAD GLOBAL VALUE STATIC=========================";
    if (type === "loadWin")
      return "===============================================================================LOAD WIN==============";
    if (type === "loadLoose")
      return "===============================================================================LOAD LOOSE==============";
    return "";
  }
  static loadLoose(gameData, socket) {
    evaluatorLogger.info(this.evaluatorLogTitle("loadLoose"));
    let fileLogger = null;
    if (process.env.ENGINE_FILE_LOG !== "false") {
      fileLogger = FileLogger.create(["LOAD LOOSE", "====================="]);
      if (fileLogger) {
        evaluatorLogger.info(
          `[fileLogger] Log file created: ${fileLogger.filepath}`,
        );
        fileLogger.log("Début de loadLoose");
      }
    }

    let looseParams = gameData.roomInDb.events.loose;
    if (!looseParams) {
      const msg = "Erreur cannot find loose parameters";
      evaluatorLogger.warn(msg);
      if (fileLogger) {
        fileLogger.log(" Paramètres de défaite non trouvés");
        fileLogger.error(new Error(msg), "Evaluator.js  -->  loadLoose()");
      }
      return;
    }
    if (!looseParams.condition) {
      const msg = "There is loose parameters but no condition parameters";
      evaluatorLogger.warn(msg);
      if (fileLogger) {
        fileLogger.log(" Paramètre 'condition' manquant dans looseParams");
        fileLogger.error(new Error(msg), "Evaluator.js  -->  loadLoose()");
      }
      return;
    }

    if (fileLogger) {
      fileLogger.log(" Paramètres de défaite :");
      fileLogger.log(LoggerClass.pretty(looseParams));
    }

    let allPlayerRespectCondition = true;
    let defeat = false;
    let losers = [];

    if (fileLogger)
      fileLogger.log(" Analyse de la boucle : " + looseParams.boucle);
    if (looseParams.boucle) {
      let elts = Parser.translateInnerExpression(looseParams.boucle, gameData, {
        precedentFileLogger: fileLogger,
      });

      if (fileLogger) {
        fileLogger.log(" Elements de la boucle");
        fileLogger.log(LoggerClass.pretty(elts));
      }
      if (!Array.isArray(elts)) {
        new AppError(
          socket,
          "Cannot obtain array with value " + looseParams.boucle,
        );
        evaluatorLogger.error(
          "Cannot obtain array with value " + looseParams.boucle,
        );
        if (fileLogger) {
          fileLogger.error(
            new Error("Cannot obtain array with value " + looseParams.boucle),
            "Evaluator.js  -->  loadLoose()",
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
        if (looseParams.condition.includes("playerBoucle")) {
          let player = PlayerManager.getPlayer(gameData, i + 1);
          let result = Parser.translateInnerExpression(
            looseParams.condition,
            gameData,
            {
              playerBoucle: player,
              precedentFileLogger: fileLogger,
            },
          );
          if (fileLogger) {
            fileLogger.log(
              ` Condition evaluated for playerBoucle ${player.id} - hasloose=${player.hasloose.value}: IsLoser ? ${result}`,
            );
            fileLogger.log(
              ` Résultat condition pour playerBoucle ${player.id}: ${result}`,
            );

            fileLogger.log(" Perdants potentiels :");
            fileLogger.log(LoggerClass.pretty(losers.map((l) => l.id)));
          }
          if (!result) {
            allPlayerRespectCondition = false;
          }
          if (
            result &&
            !losers.map((l) => l.id).includes(player.id) &&
            !player.hasloose.value
          ) {
            losers.push(player);
            if (fileLogger)
              fileLogger.log(` Joueur ajouté aux perdants: ${player.id}`);
          }
        }
      }
      if (fileLogger) {
        fileLogger.log(" Perdants potentiels finaux :");
        fileLogger.log(LoggerClass.pretty(losers.map((l) => l.id)));
      }

      // Si au moins un joueur remplit la condition de défaite
      if (losers.length > 0) {
        defeat = true;
        if (fileLogger)
          fileLogger.log(
            ` Il y a des perdants: ${losers.map((l) => l.id).join(",")}`,
          );
      }
      // Si tous les éléments devaient satisfaire la condition
      if (
        looseParams.allElementOfBoucleMustSatisyCondition &&
        losers.length != elts.length
      ) {
        defeat = false;
        if (fileLogger)
          fileLogger.log(
            ` Tous les éléments doivent satisfaire la condition de défaite mais ce n'est pas le cas.`,
          );
      }

      // Initialisations sécurisées des tableaux
      if (!gameData.data.losers) gameData.data.losers = { type: "array", value: [] };
      if (!Array.isArray(gameData.data.losers.value)) gameData.data.losers.value = [];
      if (!gameData.data.winners) gameData.data.winners = { type: "array", value: [] };
      if (!Array.isArray(gameData.data.winners.value)) gameData.data.winners.value = [];

      // --- CAS 1 : DÉFAITE COLLECTIVE (Fin de la partie suite à une défaite globale) ---
      if (looseParams.applyOnAllPlayers && defeat) {
        if (fileLogger) fileLogger.log(` Défaite collective, fin de partie.`);
        gameData.data.state.value = "endOfGame";
        gameData.data.losers.value = losers;
        
        let winners = [];
        const loserIds = losers.map((l) => l.id);

        for (let p of gameData.data.players) {
          p.hasloose.value = loserIds.includes(p.id); 
          PlayerManager.updatePlayerObject(p, gameData);

          if (p.hasloose.value) {
            socket.to(p.socketID).emit("playerLoose", { gameData, player: p });
          } else {
            winners.push(p);
            socket.to(p.socketID).emit("playerWin", { gameData, player: p });
          }
        }
        gameData.data.winners.value = winners;
        gameData.data.logs.push("Défaite collective des joueurs !");
        
        socket.emit("gameEnd", { gameData });
        socket.to(gameData.roomId).emit("gameEnd", { gameData });
      }

      // --- CAS 2 : DÉFAITE INDIVIDUELLE (Un ou plusieurs joueurs perdent, les autres continuent) ---
      if (!looseParams.applyOnAllPlayers && defeat) {
        if (fileLogger)
          fileLogger.log(
            ` Défaite individuelle, perdants: ${losers.map((l) => l.id).join(",")}`,
          );
        
        gameData.data.losers.value = [
          ...gameData.data.losers.value,
          ...losers
        ];
        
        for (let p of losers) {
          p.hasloose.value = true; 
          PlayerManager.updatePlayerObject(p, gameData);
           
          gameData.data.logs.push(`Joueur ${p.pseudo} a perdu.`);
          
          // Notification individuelle du perdant
          socket.to(p.socketID).emit("playerLoose", { gameData, player: p });
        }   
         for (let p of gameData.data.players) {
          if (!p.hasloose.value) {
            p.haswin.value = true;
            gameData.data.winners.value.push(p);
            socket.to(p.socketID).emit("playerWin", { gameData, player: p });
          } 
        }
      }

      // --- CAS 3 : SÉCURITÉ SI TOUS LES JOUEURS ONT TERMINÉ ---
      if (!defeat && PlayerManager.allPlayerHasFinished(gameData)) {
        if (fileLogger)
          fileLogger.log(" Tous les joueurs ont terminé, fin de partie.");
        gameData.data.state.value = "endOfGame";
        let endLosers = [];
        for (let p of gameData.data.players) {
          if (!p.haswin.value) {
            p.hasloose.value = true; 
            endLosers.push(p);
          }
          PlayerManager.updatePlayerObject(p, gameData);
          socket.to(p.socketID).emit("playerLoose", { gameData, player: p });
        }
        gameData.data.losers.value = endLosers;
        gameData.data.logs.push("Tous les joueurs ont terminé, fin de partie.");
        
        socket.emit("gameEnd", { gameData });
        socket.to(gameData.roomId).emit("gameEnd", { gameData });
      }
    } else {
      // Évaluation directe sans boucle
      if (fileLogger)
        fileLogger.log(" Pas de boucle, évaluation directe de la condition");
      let result = Parser.translateInnerExpression(
        looseParams.condition,
        gameData,
        {
          precedentFileLogger: fileLogger,
        },
      );
      if (fileLogger) fileLogger.log(` Résultat de la condition: ${result}`);
      if (result) {
        if (fileLogger)
          fileLogger.log(` Condition de défaite remplie, fin de partie.`);
        gameData.data.state.value = "endOfGame";
        
        if (!gameData.data.winners) gameData.data.winners = { type: "array", value: [] };
        gameData.data.losers.value = gameData.data.losers.value || [];
        
        for (let p of gameData.data.players) {
          p.hasloose.value = true; 
          gameData.data.losers.value.push(p);
          PlayerManager.updatePlayerObject(p, gameData);
        }
        gameData.data.winners.value = [];
        gameData.data.logs.push("Défaite globale des joueurs !");
        socket.to(gameData.roomId).emit("gameEnd", { gameData });
      }
    }

    console.log(gameData.data.state);
  }
}
