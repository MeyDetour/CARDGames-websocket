import PlayerManager from "../services/PlayerManager.js";
import { LoggerClass, Logger } from "../logger/logger.js";
import { errorStack } from "../error/ErrorStack.js";
import Parser from "../../parser/parser.js";
import CardManager from "../services/CardManager.js";
import { TypeManager } from "../services/helper/TypeManager.js";
import { ArrayManager } from "../services/helper/ArrayManager.js";
import VariableType from "../../parser/VariableType.js";
import { ObjectManager } from "../services/helper/ObjectManager.js"; 
export default class Action {
  /**
   * Execute logical separation for access variable  ex currentPlayer#gain#1
   * @param  {Object} event   The event object
   * @param  {string} boucle  The name of the loop if the action is in a loop
   * @param  {Object} sender  The player or card stack wich give element
   * @param  {Object} senderListObject The list of player or card stack wich give element
   * @param  {Object} destinataire The player or card stack
   * @param  {Array} giveElements Object of elements to give
   * @param socket
   * @param {Object} gameData detail of all game
   * @param {Object} logs params
   * return : value
   * @param index
   */
  constructor(
    fileLogger,
    event = null,
    boucle = null,
    sender = null,
    senderListObject = null,
    destinataire = null,
    destinataireListObject = null,
    giveElements = null,
    value = null,
    socket = null,
    gameData = null,
    logs = {},
    params = {},
    testType = "event",
    conditionDetailsForTest = null,
    index = null,
  ) {
    this.fileLogger = fileLogger;
    this.event = event;
    this.boucle = boucle
      ? Parser.translateInnerExpression(boucle, gameData, { ...params })
      : null;
    this.sender = sender;
    this.senderListObject = senderListObject;
    this.destinataire = destinataire;
    this.destinataireListObject = destinataireListObject;
    this.giveElementsData = giveElements;
    this.value = value;
    this.socket = socket;
    this.gameData = gameData;
    this.logs = logs;
    this.boucleDataArray = null;
    this.params = params;
    this.index = index;

    // Object used to save action log for test
    this.actionEventForTest = {
      testType: testType,
      diffs: [],
      conditionDetailsForTest: conditionDetailsForTest,
      executionDate: new Date(),
      ...event,
    };

    const actionLogger = Logger("Action Event ID=" + this.event?.id);
    this.actionLogger = actionLogger;

    if (!TypeManager.isDefined(this.fileLogger)) {
      const msg = "fileLogger is null in Action constructor";
      console.error(msg);
      /*  LoggerClass.logFileLocalisation();
      try {
        errorStack.addError(
          msg,
          LoggerClass.pretty(LoggerClass.getCallerLocation().reverse()),
        );
      } catch (e) {}
       */
    }
  }

  /**
   * Définit le destinataire de l'action
   * @param {Object} destinataire
   */

  setDestinataire(destinataire) {
    this.destinataire = destinataire;
  }
  /**
   * Définit la liste d'objets destinataires (utilisé pour 'for' loops)
   * @param {Array} destinataireListObject
   */
  setDestinataireListObject(destinataireListObject) {
    this.destinataireListObject = destinataireListObject;
  }
  /**
   * Définit l'élément envoyeur de l'action
   * @param {Object} sender
   */
  setSender(sender) {
    this.sender = sender;
  }
  /**
   * Définit la liste d'objets envoyeurs (utilisé pour 'for' loops)
   * @param {Array} SenderListObject
   */
  setSenderListObject(SenderListObject) {
    this.senderListObject = SenderListObject;
  }
  /**
   * Définit la liste d'objets envoyeurs (utilisé pour 'for' loops)
   * @param {Array} boucleDataArray
   */
  setBoucleDataArray(boucleDataArray) {
    this.boucleDataArray = boucleDataArray;
  }
  /**
   * Définit l'index courant d'itération (si dans une boucle)
   * @param {number} index
   */
  setIndex(index) {
    this.index = index;
  }

  setBoucleCondition(boucleCondition) {
    this.boucleCondition = boucleCondition;
  }
  getThisObject() {
    return {
      event: this.event,
      sender: this.sender,
      senderListObject: this.senderListObject ? "object" : null,
      destinataire: this.destinataire ? "object" : null,
      destinataireListObject: this.destinataireListObject ? "object" : null,
      giveElements: this.giveElementsData,
      value: this.value,
      params: this.params ? LoggerClass.getKeyOfObject(this.params) : null,
      index: this.index,
    };
  }
  getActionEventForTest() {
    return this.actionEventForTest;
  }

  /**
   * Mélange la collection du destinataire.
   * Si le destinataire est invalide ou n'a pas une valeur tableau, logue et enregistre l'erreur.
   */
  shuffle() {
    // error is not exist
    if (!TypeManager.isDefined(this.destinataire)) {
      const msg =
        "Cannot shuffle without destinataire in event : " +
        this.event["name"] +
        " with ID=" +
        this.event["id"];
      this.actionLogger.error(msg);
      LoggerClass.logFileLocalisation();
      if (this.fileLogger) {
        this.fileLogger.error(new Error(msg), "actions.js → shuffle()");
      }
      errorStack.addError(
        msg,
        LoggerClass.pretty(LoggerClass.getCallerLocation().reverse()),
      );
    }

    // error is its not array
    if (!Array.isArray(this.destinataire.value)) {
      const msg =
        "Cannot shuffle because 'for' resolved to a non-array: " +
        String(this.destinataire) +
        " for event ID=" +
        this.event["id"];
      this.actionLogger.error(msg);
      LoggerClass.logFileLocalisation();
      if (this.fileLogger) {
        this.fileLogger.error(new Error(msg), "actions.js → shuffle()");
      }
      errorStack.addError(
        msg,
        LoggerClass.pretty(LoggerClass.getCallerLocation().reverse()),
      );
      return;
    }

    // Effectue le mélange
    if (this.fileLogger) {
      this.fileLogger.log(
        `🔀 Mélange de la collection du destinataire dans l'événement ID=${this.event["id"]}`,
      );
    }

    let before = structuredClone(this.destinataire);
    ArrayManager.shuffle(this.destinataire.value);
    if (this.fileLogger) {
      LoggerClass.logGridOldNew(before, this.destinataire, this.fileLogger);
      this.fileLogger.log("✅ Mélange effectué.");
    }
    this.actionLogger.info("Effectué");
    if (this.gameData.data.isTest) {
      this.actionEventForTest.diffs.push({
        id: "jzbfebdxk54165zf",
        key: this.event.event.for,
        diff: ObjectManager.getObjectDiff(before, this.destinataire),
        type: before.type,
        before: before.value,
        after: this.destinataire.value,
      });
    }
    return;
  }
  reverseGameDirection() {
    if (!TypeManager.isDefined(this.value)) {
      const msg =
        "Cannot apply event <<reverseGameDirection>> without value to indicate sens of changement of player  in event : " +
        this.event["name"] +
        "with ID=" +
        this.event["id"];
      this.actionLogger.error(msg);
      LoggerClass.logFileLocalisation();
      if (this.fileLogger) {
        this.fileLogger.error(
          new Error(msg),
          "actions.js → reverseGameDirection()",
        );
      }
      errorStack.addError(
        msg,
        LoggerClass.pretty(LoggerClass.getCallerLocation().reverse()),
      );
    }
    let oldSens = this.gameData.data.playerSens.value;
    this.gameData.data.playerSens.value =
      this.gameData.data.playerSens.value === "incrementation"
        ? "decrementation"
        : "incrementation";
    if (this.fileLogger) {
      this.fileLogger.log(`🔄 Changement du sens des joueurs`);
    }
    if (this.gameData.data.isTest) {
      this.actionEventForTest.diffs.push({
        id: "564e65rggrrrrrrlko555",
        key: "Change Player Direction",
        type: "player",
        before: oldSens,
        after: this.gameData.data.playerSens.value,
      });
    }
    return;
  }
  changeStartingPlayer() {
    // ERROR IF NO VALUE PROVIDED
    if (!TypeManager.isDefined(this.value)) {
      const msg =
        "Cannot apply event <<changeStartingPlayer>> without value to indicate sens of changement of player  in event : " +
        this.event["name"] +
        "with ID=" +
        this.event["id"];
      this.actionLogger.error(msg);
      LoggerClass.logFileLocalisation();
      if (this.fileLogger) {
        this.fileLogger.error(
          new Error(msg),
          "actions.js → changeStartingPlayer()",
        );
      }
      errorStack.addError(
        msg,
        LoggerClass.pretty(LoggerClass.getCallerLocation().reverse()),
      );
    }
    if (this.fileLogger) {
      this.fileLogger.log(
        `🔄 Changement du joueur de départ dans l'événement ID=${this.event["id"]}`,
      );
    }
    let before = this.gameData.data.players[0];
    let beforePPlayers = structuredClone(this.gameData.data.players);
    PlayerManager.changePlayerOrder(this.value, this.gameData);
    if (this.fileLogger) {
      this.fileLogger.log(
        `✅ Le joueur de départ a été changé de ${before.name} à ${this.gameData.data.players[0].name}.`,
      );
      LoggerClass.logGridOldNew(
        before,
        this.gameData.data.players[0],
        this.fileLogger,
      );
      this.fileLogger.log("Players :");
      LoggerClass.logGridOldNew(
        beforePPlayers,
        this.gameData.data.players,
        this.fileLogger,
      );
    }
    // SAVE ACTION LOG FOR TEST
    if (this.gameData.data.isTest) {
      this.actionEventForTest.diffs.push({
        id: "jzbbbu5454165zf",
        key: "Starting Player",
        type: "player",
        before: before.pseudo,
        after: structuredClone(this.gameData.data.players[0].pseudo),
      });
      this.actionEventForTest.diffs.push({
        id: "hzefuf548fzefez",
        key: "Player order",
        type: "array",
        before: beforePPlayers.map((p) => p.pseudo),
        after: structuredClone(this.gameData.data.players.map((p) => p.pseudo)),
      });
    }
    this.actionLogger.info("Effectué");
    if (this.fileLogger) {
      this.fileLogger.log("✅ Changement de joueur effectué.");
    }
  }
  skipPlayerTour() {
    if (!TypeManager.isDefined(this.destinataire)) {
      const msg =
        "Cannot apply event <<skipPlayerTour>> without destinataire in event : " +
        this.event["name"] +
        "with ID=" +
        this.event["id"];
      this.actionLogger.error(msg);
      LoggerClass.logFileLocalisation();
      if (this.fileLogger) {
        this.fileLogger.error(new Error(msg), "actions.js → skipPlayerTour()");
      }
      errorStack.addError(
        msg,
        LoggerClass.pretty(LoggerClass.getCallerLocation().reverse()),
      );
    }
    if (
      !TypeManager.isDefined(this.value) ||
      this.value === 0 ||
      TypeManager.getType(this.value) !== "number"
    ) {
      const msg =
        "Cannot apply event <<skipPlayerTour>> without value for action : " +
        this.event["name"] +
        "with ID=" +
        this.event["id"];
      this.actionLogger.error(msg);
      LoggerClass.logFileLocalisation();
      if (this.fileLogger) {
        this.fileLogger.error(new Error(msg), "actions.js → skipPlayerTour()");
      }
      errorStack.addError(
        msg,
        LoggerClass.pretty(LoggerClass.getCallerLocation().reverse()),
      );
    }
    let actualPosition = this.gameData.data.currentPlayerPosition.value;
    if (this.fileLogger) {
      this.fileLogger.log(`Position actuelle du joueur : ${actualPosition}`);
      this.fileLogger.log(`Valeur à ajouter : ${this.value}`);
    }
    // Value est le nombre de joueur à sauter,
    // a la fin de la boucle actualPosition est un joueur à sauter aussi
    // mais il est remplacer à la fin de la boucle par le joueur suivant
    //  pour éviter de sauter un joueur en plus
    for (let i = 0; i < this.value; i++) {
      let p = getNextPlayer(this.gameData, actualPosition);
      actualPosition = p.position;
    }
    if (this.fileLogger) {
      this.fileLogger.log(
        `Nouvelle position du joueur après ajout : ${actualPosition}`,
      );
    }
    this.gameData.data.currentPlayerPosition.value = actualPosition;

    if (this.fileLogger) {
      this.fileLogger.log("✅ Saut du tour effectué.");
    }
    this.actionLogger.info("Effectué");
  }

  updateGlobalValue() {
    if (this.fileLogger) {
      this.fileLogger.log("Action element :");
      this.fileLogger.log(LoggerClass.pretty(this.getThisObject()));
    }

    // Error if value undefined
    if (!TypeManager.isDefined(this.value)) {
      const msg =
        "cannot update gloabal value without value. Event id=" + this.event.id;
      this.actionLogger.error(msg);
      LoggerClass.logFileLocalisation();
      if (this.fileLogger) {
        this.fileLogger.error(
          new Error(msg),
          "actions.js → updateGlobalValue()",
        );
      }
      errorStack.addError(msg, LoggerClass.logFileLocalisation());
      return;
    }
    // error if destinataire undefined
    if (!TypeManager.isDefined(this.destinataire.type)) {
      const msg =
        "cannot update gloabal value without type of destinataire. Event id=" +
        this.event.id;
      this.actionLogger.error(msg);
      LoggerClass.logFileLocalisation();
      if (this.fileLogger) {
        this.fileLogger.error(
          new Error(msg),
          "actions.js → updateGlobalValue()",
        );
      }
      errorStack.addError(msg, LoggerClass.logFileLocalisation());
      return;
    }
    if (this.fileLogger) {
      this.fileLogger.log(
        `🔄 Mise à jour de la valeur globale dans l'événement ID=${this.event["id"]}`,
      );
      this.fileLogger.log("Get Value to replace -> " + this.value);
      this.fileLogger.log("Destinataire avant modification-> ");
      this.fileLogger.log(LoggerClass.pretty(this.destinataire));
    }
    let before = structuredClone(this.gameData.data);
    let destinataireBefore = structuredClone(this.destinataire);
    let v = Parser.translateInnerExpression(this.value, this.gameData, {
      ...this.params,
      location: this.fileLogger,
    });

    if (
      TypeManager.isSameType(this.destinataire.type, TypeManager.getType(v))
    ) {
      this.destinataire.value = TypeManager.getFormatedType(v);
    }
    if (this.gameData.data.isTest) {
      this.actionEventForTest.diffs.push({
        id: "vnjbu45561zef",
        key: this.event.event.for,
        type: "number",
        before: structuredClone(destinataireBefore.value),
        after: structuredClone(this.destinataire.value),
      });
    }
    PlayerManager.updatePlayerObject(
      this.destinataire,
      this.gameData,
      this.destinataireListObject,
    );
    if (this.fileLogger) {
      LoggerClass.logGridOldNew(before, this.gameData.data, this.fileLogger);
      this.fileLogger.log("✅ changement de valeur effectué.");
    }
    if (this.logs.globalEventLog) this.actionLogger.info("Effectué");
  }

  removeAllAtachedEventsForTour() {
    if (this.fileLogger) {
      this.fileLogger.log(
        `🗑️ Suppression de tous les événements attachés pour le tour du joueur dans l'événement ID=${this.event["id"]}`,
      );
    }
    let before = structuredClone(this.destinataire);
    if (
      this.destinataire["attachedEventForTour"] &&
      this.destinataire["attachedEventForTour"]["value"]
    ) {
      this.destinataire["attachedEventForTour"]["value"] = [];
      PlayerManager.updatePlayerObject(this.destinataire, this.gameData);

      if (this.fileLogger) {
        this.fileLogger.log(
          `✅ Tous les événements attachés pour le tour ont été supprimés du joueur dans l'événement ID=${this.event["id"]}.`,
        );
        LoggerClass.logGridOldNew(before, this.destinataire, this.fileLogger);

        this.fileLogger.log("Effectué");
      }
      // SAVE ACTION LOG FOR TEST
      if (this.gameData.data.isTest) {
        this.actionEventForTest.diffs.push({
          key: this.destinataire.pseudo,
          id: "efhufe4564efz",
          type: "array",
          before: structuredClone(before.attachedEventForTour.value),
          after: structuredClone(this.destinataire.attachedEventForTour.value),
        });
      }
    }
  }
  giveElements() {
    // Si pas de boucle, déléguer à giveElementsTo classique
    if (
      !this.boucleDataArray ||
      !Array.isArray(this.boucleDataArray) ||
      this.boucleDataArray.length === 0
    ) {
      this.giveElementsTo();
      return;
    }

    const eligibleData = [];
    for (let i = 0; i < this.boucleDataArray.length; i++) {
      if (this.fileLogger) {
        this.fileLogger.log(
          `\n🔄 Évaluation de l'itération ${i} pour giveElements`,
        );
      }
      let [destinataireListObject, destinataire] = PlayerManager.getDestinataireElement(
        this.event,
        this.gameData,
        i,
        this.params,
      );
      let [senderListObject, sender] = PlayerManager.getSenderElement(
        this.event,
        this.gameData,
        i,
        this.params,
      );

      this.setDestinataireListObject(destinataireListObject);
      this.setDestinataire(destinataire);
      this.setSenderListObject(senderListObject);
      this.setSender(sender);
      this.setIndex(i);

      const condition = Parser.translateInnerExpression(
        this.boucleCondition,
        this.gameData,
        this.params,
      );

      if (condition == false && TypeManager.isDefined(this.boucleCondition)) {
        if (this.fileLogger) {
          this.fileLogger.log(`Condition false at index ${i}, skipping`);
          this.fileLogger.log(LoggerClass.pretty(destinataire));
        }
        continue;
      }
      if (this.fileLogger) {
        this.fileLogger.log(
          `Condition true at index ${i}, adding to eligibleData`,
        );
      }
      eligibleData.push({
        i,
        destinataireListObject,
        destinataire,
        senderListObject,
        sender,
      }); if (this.fileLogger) {
      this.fileLogger.log(
        `Condition true at index ${i}, adding to eligibleData`,
      );
    }

    }
   
    if (eligibleData.length === 0) {
      if (this.fileLogger)
        this.fileLogger.log("No eligible recipients after filtering");
      return;
    }

    // 2. PARCOURIR chaque clé à distribuer
    for (let key of Object.keys(this.giveElementsData)) {
      // Calculer la quantité à distribuer (sur le premier destinataire éligible pour l'évaluation)
      const first = eligibleData[0];
      this.setDestinataireListObject(first.destinataireListObject);
      this.setDestinataire(first.destinataire);
      this.setSenderListObject(first.senderListObject);
      this.setSender(first.sender);
      this.setIndex(first.i);

      let sum = Parser.translateInnerExpression(
        this.giveElementsData[key],
        this.gameData,
        { ...this.params, location: this.fileLogger },
      );

      if (this.fileLogger) {
        this.fileLogger.log("sum computed:");
        this.fileLogger.log(LoggerClass.pretty(sum));
      }

      const isGiveAll = sum === "*";
      const isArray = Array.isArray(sum);
      const isNumber = !isGiveAll && !isArray && !isNaN(parseInt(sum));
      const sumInt = isNumber ? parseInt(sum) : null;

      if (key === "{cards}") {
        // === DISTRIBUTION ROUND-ROBIN DE CARTES ===

        if (isGiveAll) {
          // "*" : distribuer TOUTES les cartes du sender en round-robin
          // On a besoin du sender global (deck), pas par joueur
          // Le sender est le même pour tous (ex: {deck}), on le récupère depuis le premier
          const [senderListObject, senderSource] = PlayerManager.getSenderElement(
            this.event,
            this.gameData,
            null,
            this.params,
          );
          let senderObject = VariableType.splitLogicalList(
            [senderSource],
            this.gameData,
            { returnType: "ref" },
          );

          if (!senderObject || !Array.isArray(senderObject.value)) {
            const msg =
              "giveElements: sender n'a pas de tableau de cartes pour '*'";
            this.actionLogger.error(msg);
            errorStack.addError(
              msg,
              LoggerClass.pretty(LoggerClass.getCallerLocation().reverse()),
            );
            return;
          }

          // Construire les objets destinataires pour chaque joueur éligible
          const destinataireObjects = eligibleData.map(({ destinataire }) => {
            let obj = VariableType.splitLogicalList(
              [destinataire],
              this.gameData,
              { returnType: "ref", log: false },
            );
            return obj;
          });

          // Round-robin : distribuer toutes les cartes une par une
          let cardIndex = 0;
          const totalCards = senderObject.value.length;
          const newSenderValue = structuredClone(senderObject.value);

          while (newSenderValue.length > 0) {
            const recipientIndex = cardIndex % eligibleData.length;
            const card = newSenderValue.shift(); // prendre la première carte

            if (!CardManager.getCard(this.gameData, card)) {
              if (this.fileLogger)
                this.fileLogger.log(`Card ${card} not found, skipping`);
              cardIndex++;
              continue;
            }

            destinataireObjects[recipientIndex]?.value?.push(card);

            if (this.fileLogger) {
              this.fileLogger.log(
                `Round-robin: carte ${card} → joueur index ${recipientIndex}`,
              );
            }
            cardIndex++;
          }

          // Vider le sender
          senderObject.value = [];

          // Sauvegarder les joueurs
          for (const { destinataire, destinataireListObject } of eligibleData) {
            PlayerManager.updatePlayerObject(
              null,
              this.gameData,
              destinataireListObject,
            );
            // (le sender global sera mis à jour après)
          }
          // Mettre à jour le sender (deck)
          PlayerManager.updatePlayerObject(
            senderSource,
            this.gameData,
            senderListObject,
          );
        } else if (isNumber) {
          // Nombre fixe de cartes : distribuer sumInt fois en round-robin
          // Même logique : le sender est global (le deck)
          const [senderListObject, senderSource] = Event.getSenderElement(
            this.event,
            this.gameData,
            null,
            this.params,
          );
          let senderObject = VariableType.splitLogicalList(
            [senderSource],
            this.gameData,
            { returnType: "ref" },
          );

          if (!senderObject || !Array.isArray(senderObject.value)) {
            const msg = "giveElements: sender n'a pas de tableau de cartes";
            this.actionLogger.error(msg);
            errorStack.addError(
              msg,
              LoggerClass.pretty(LoggerClass.getCallerLocation().reverse()),
            );
            return;
          }

          const destinataireObjects = eligibleData.map(({ destinataire }) =>
            VariableType.splitLogicalList([destinataire], this.gameData, {
              returnType: "ref",
              log: false,
            }),
          );

          // sumInt tours de distribution round-robin
          const totalToDistribute = sumInt * eligibleData.length;
          const newSenderValue = structuredClone(senderObject.value);

          for (let turn = 0; turn < sumInt; turn++) {
            for (let r = 0; r < eligibleData.length; r++) {
              if (newSenderValue.length === 0) {
                if (this.fileLogger)
                  this.fileLogger.log("Deck vide, arrêt de la distribution");
                break;
              }
              const card = newSenderValue.shift();
              if (!CardManager.getCard(this.gameData, card)) {
                if (this.fileLogger)
                  this.fileLogger.log(`Card ${card} not found, skipping`);
                r--; // réessayer avec la prochaine carte pour ce joueur
                continue;
              }
              destinataireObjects[r]?.value?.push(card);
              if (this.fileLogger) {
                this.fileLogger.log(
                  `Tour ${turn + 1}: carte ${card} → joueur index ${r}`,
                );
              }
            }
          }

          senderObject.value = newSenderValue;

          // Sauvegarder
          for (const { destinataireListObject } of eligibleData) {
            PlayerManager.updatePlayerObject(
              null,
              this.gameData,
              destinataireListObject,
            );
          }
          PlayerManager.updatePlayerObject(
            senderSource,
            this.gameData,
            senderListObject,
          );
        }
      } else {
        // === DISTRIBUTION D'UNE VALEUR NUMÉRIQUE (gain, ressource...) ===
        // Ici pas de round-robin, on applique à chaque joueur indépendamment
        for (const {
          i,
          destinataireListObject,
          destinataire,
          senderListObject,
          sender,
        } of eligibleData) {
          this.setDestinataireListObject(destinataireListObject);
          this.setDestinataire(destinataire);
          this.setSenderListObject(senderListObject);
          this.setSender(sender);
          this.setIndex(i);

          // Recalculer sum pour chaque joueur (au cas où l'expression dépend du joueur courant)
          let sumPerPlayer = Parser.translateInnerExpression(
            this.giveElementsData[key],
            this.gameData,
            { ...this.params, location: this.fileLogger },
          );

          this.giveElementsTo();
        }
      }
    }
  }
  giveElementsTo() {
    if (this.fileLogger) {
      this.fileLogger.log(
        "GiveElementTo , called with element :" +
          LoggerClass.getKeyOfObject(this.params),
      );
      LoggerClass.logGridFromObject(
        {
          Sender: typeof this.sender,
          "Sender List Object": typeof this.senderListObject,
          Destinataire: typeof this.destinataire,
          "Destinataire List Object": typeof this.destinataireListObject,
          "Give Elements": typeof this.giveElementsData,
          Socket: typeof this.socket,
          "Game Data": typeof this.gameData,
          Params: typeof this.params,
          Logs: typeof this.logs,
          Index: typeof this.index,
        },
        "🔄 GiveElementTo PARAMS",
        this.fileLogger,
      );

      LoggerClass.logGridFromObject(
        {
          Sender: this.sender,
          Destinataire: this.destinataire,
        },
        "AVANT GiveElementTo ",
        this.fileLogger,
      );
    }

    let beforeGameData = structuredClone(this.gameData.data);

    // PARCOURIR TOUS LES ELEMENTS A DONNER
    for (let key of Object.keys(this.giveElementsData)) {
      //transform element to give like {gain#1} to array like ["gain","1"]
      // get array like ["gain","1"]
      let keyToTransform = VariableType.getListSplited(
        key,
        this.gameData,
        null,
      );
      //  {gain#1} -> ['gain','1']
      //  {cards} -> ['cards']
      if (this.fileLogger) {
        this.fileLogger.log("keyToTransform :");
        this.fileLogger.log(LoggerClass.pretty(keyToTransform));
      }

      //  INITIALIZED SENDER =======================
      let senderObject = null;
      if (TypeManager.isDefined(this.sender)) {
        if (keyToTransform[0] != "cards") {
          senderObject = VariableType.splitLogicalList(
            [this.sender, ...keyToTransform],
            this.gameData,
            { returnType: "ref" },
          );
        } else {
          senderObject = VariableType.splitLogicalList(
            [this.sender],
            this.gameData,
            { returnType: "ref" },
          );
        }

        if (!TypeManager.isDefined(senderObject)) {
          senderObject = this.sender;
        }
      }
      const senderObjectSave = structuredClone(senderObject);

      // INITIALIZE DESTINATAIRE =================================
      let destinataireObject = null;
      if (TypeManager.isDefined(this.destinataire)) {
        if (keyToTransform[0] != "cards") {
          destinataireObject = VariableType.splitLogicalList(
            [this.destinataire, ...keyToTransform],
            this.gameData,
            { returnType: "ref", log: false },
          );
        } else {
          destinataireObject = VariableType.splitLogicalList(
            [this.destinataire],
            this.gameData,
            { returnType: "ref", log: false },
          );
        }

        if (!TypeManager.isDefined(destinataireObject)) {
          destinataireObject = this.destinataire;
        }
      }
      const destinataireObjectSave = structuredClone(destinataireObject);

      // LOG ====================================
      if (this.fileLogger) {
        LoggerClass.logGridFromObject(
          {
            "Destinataire object": destinataireObject,
            "Sender Object": senderObject,
          },
          "APPLICATION DES CLES ",
          this.fileLogger,
        );
      }

      // START MANIP ==========================================

      //  GET QUANTITY TO GIVE
      let sum = Parser.translateInnerExpression(
        this.giveElementsData[key],
        this.gameData,
        {
          ...this.params,
          location: this.fileLogger,
        },
      );
      if (this.fileLogger) {
        this.fileLogger.log("sum");
        this.fileLogger.log(LoggerClass.pretty(sum));
      }

      // IF WE WANT TO GIVE ALL
      const exceptions = ["*"];
      if (exceptions.includes(sum)) {
        if (Array.isArray(destinataireObject.value)) {
          // If no sender
          if (!senderObject) {
            const msg =
              "cannot update gloabal value without type of destinataire. Event id=" +
              this.event.id;
            this.actionLogger.error(msg);
            LoggerClass.logFileLocalisation();
            if (this.fileLogger) {
              this.fileLogger.error(
                new Error(msg),
                "actions.js → giveElementsTo()",
              );
            }

            errorStack.addError(
              msg,
              LoggerClass.pretty(LoggerClass.getCallerLocation().reverse()),
            );
            return;
          }

          // if senderObject not array
          if (!Array.isArray(senderObject.value)) {
            const msg =
              "Cannot give all " +
              key +
              " to " +
              this.destinataire +
              " because sender value is not array got :" +
              senderObject;
            if (this.fileLogger) {
              this.fileLogger.log(LoggerClass.pretty(senderObject));

              this.fileLogger.error(
                new Error(msg),
                "actions.js → giveElementsTo()",
              );
            }
            this.actionLogger.error(msg);
            LoggerClass.logFileLocalisation();
            errorStack.addError(
              msg,
              LoggerClass.pretty(LoggerClass.getCallerLocation().reverse()),
            );
            return;
          }

          // WHEN ALL CARDS ARE GIVEN
          if (key === "{cards}") {
            // COPY CARDS OF SENDER
            let newSenderObjectValue = structuredClone(senderObject.value);
            if (this.fileLogger) {
              LoggerClass.logGridFromObject(
                {
                  "New Sender Object Value before": newSenderObjectValue,
                  "senderObject value ": senderObject.value,
                },
                "COPY ALL CARDS - BEFORE LOOP",
                this.fileLogger,
              );
            }
            // GIVE ALL CARD
            for (let elt of senderObject.value) {
              if (senderObject.value.length === 0 && this.fileLogger) {
                this.fileLogger.log("Sender value empty  ");
                continue;
              }
              // Verify That card exist in gameData
              if (CardManager.getCard(this.gameData, elt)) {
                if (this.fileLogger) {
                  this.fileLogger.log(
                    "Give card id  " + elt + " to destinataire",
                  );
                }
                destinataireObject.value.push(elt);
                const index = newSenderObjectValue.indexOf(elt);
                if (index !== -1) {
                  newSenderObjectValue.splice(index, 1);
                } else {
                  if (this.fileLogger) {
                    this.fileLogger.log(
                      "Card id " + elt + " not found in newSenderObjectValue ",
                    );
                  }
                }
              } else {
                if (this.logs.giveElementsLog && this.fileLogger) {
                  this.fileLogger.error(
                    "l'element n'est pas une carte got : " + elt,
                  );
                }
              }
            }
            // SAVE ACTION LOG FOR TEST
            if (this.gameData.data.isTest) {
              this.actionEventForTest.diffs.push({
                key: PlayerManager.isPlayerType(this.sender, this.gameData)
                  ? this.sender.pseudo
                  : this.event.event.from,
                type: senderObject.type,
                id: "f456z854e846",
                before: structuredClone(senderObject.value),
                after: structuredClone(newSenderObjectValue),
              });
            }
            if (this.gameData.data.isTest) {
              this.actionEventForTest.diffs.push({
                key: PlayerManager.isPlayerType(
                  this.destinataire,
                  this.gameData,
                )
                  ? this.destinataire.pseudo
                  : this.event.event.for,
                id: "ezfu54528585",
                type: senderObject.type,
                before: structuredClone(destinataireObjectSave.value),
                after: structuredClone(destinataireObject.value),
              });
            }
            senderObject.value = newSenderObjectValue;
          }
        }

        // want to give all but it's value
        if (typeof destinataireObject.value == "number") {
          // if no sender
          if (!this.sender) {
            // get total available in global value
            let totalAvailable = VariableType.splitLogicalList(
              keyToTransform,
              this.gameData,
              null,
            );
            if (this.logs.giveElementsLog && this.fileLogger) {
              this.fileLogger.log("give to destinataire object all available ");
              this.fileLogger.log("totalAvailable: ", totalAvailable);
              this.fileLogger.log(
                "search ressource :" + keyToTransform.toString(),
              );
              this.fileLogger.log(this.destinataire);

              this.fileLogger.log(LoggerClass.pretty(destinataireObject));
            }
          }
          // if p1 want to give all his gain to p2
          if (senderObject && senderObject.value !== null) {
            sum = senderObject.value;

            // SAVE ACTION LOG FOR TEST
            if (this.gameData.data.isTest) {
              this.actionEventForTest.diffs.push({
                key: this.sender.pseudo,
                id: "eflokort5123",
                type: "number",
                before: structuredClone(senderObject.value),
                after: 0,
              });
            }
          }
        }
      }
      //IF WE WANT TO GIVE FIXE ELEMENT
      if (Array.isArray(sum)) {
        // Debut des logs de fin d'action
        if (this.fileLogger) {
          this.fileLogger.log("Sum : " + JSON.stringify(sum));
        }

        // if sender but sender value is not array
        if (
          TypeManager.isDefined(senderObject) &&
          TypeManager.getType(senderObject.value) !== "array"
        ) {
          const msg =
            "Try to give elements but senderObject value is not an array. Got type: " +
            typeof sum +
            " with value: " +
            JSON.stringify(sum) +
            "Error in key " +
            key;
          this.actionLogger.error(msg);
          LoggerClass.logFileLocalisation();
          if (this.fileLogger) {
            this.fileLogger.error(
              new Error(msg),
              "actions.js → giveElementsTo()",
            );
          }
          errorStack.addError(
            msg,
            LoggerClass.pretty(LoggerClass.getCallerLocation().reverse()),
          );
          return;
        } // if destinataire  but destinataire value is not array
        if (
          TypeManager.isDefined(destinataireObject) &&
          TypeManager.getType(destinataireObject.value) !== "array"
        ) {
          const msg =
            "Try to give elements but destinataireObject value is not an array. Got type: " +
            typeof sum +
            " with value: " +
            JSON.stringify(sum) +
            "Error in key " +
            key;
          this.actionLogger.error(msg);
          LoggerClass.logFileLocalisation();
          if (this.fileLogger) {
            this.fileLogger.error(
              new Error(msg),
              "actions.js → giveElementsTo()",
            );
          }
          errorStack.addError(
            msg,
            LoggerClass.pretty(LoggerClass.getCallerLocation().reverse()),
          );
          return;
        }

        // IF THERE IS SENDER, remove to sender
        if (
          TypeManager.isDefined(senderObject) &&
          TypeManager.getType(senderObject.value) === "array"
        ) {
          // throw away only element that sender have in his value
          senderObject.value = senderObject.value.filter(
            (elt) => !sum.includes(elt),
          );

          // SAVE ACTION LOG FOR TEST
          if (this.gameData.data.isTest) {
            this.actionEventForTest.diffs.push({
              key: PlayerManager.isPlayerType(this.sender, this.gameData)
                ? this.sender.pseudo
                : this.event.event.from,
              type: senderObjectSave.type,
              id: "givea6566rrayraayr5454",
              diff: ObjectManager.getObjectDiff(
                structuredClone(senderObjectSave.value),
                structuredClone(senderObject.value),
              ),
              before: structuredClone(senderObjectSave.value),
              after: structuredClone(senderObject.value),
            });
          }
        } // IF THERE IS SENDER, remove to sender
        if (
          TypeManager.isDefined(destinataireObject) &&
          TypeManager.getType(destinataireObject.value) === "array"
        ) {
          // throw away only element that sender have in his value
          destinataireObject.value = destinataireObject.value.concat(sum);

          // SAVE ACTION LOG FOR TEST
          if (this.gameData.data.isTest) {
            this.actionEventForTest.diffs.push({
              key: PlayerManager.isPlayerType(this.sender, this.gameData)
                ? this.sender.pseudo
                : this.event.event.from,
              type: "array",
              diff: ObjectManager.getObjectDiff(
                structuredClone(destinataireObjectSave.value),
                structuredClone(destinataireObject.value),
              ),
              id: "receivearr465ayraayr5454",
              before: structuredClone(destinataireObjectSave.value),
              after: structuredClone(destinataireObject.value),
            });
          }
        }
      }
      // IF WE WANT TO GIVE A SPECIFIC QUANTITY
      if (
        !exceptions.includes(sum) &&
        (TypeManager.getType(sum) === "string" ||
          TypeManager.getType(sum) === "number")
      ) {
        sum = parseInt(sum);

        // IF SUM IS NOT A NUMBER
        if (TypeManager.getType(sum) !== "number") {
          const msg =
            "Attemps to get int but got  " +
            typeof sum +
            " with " +
            sum +
            "Error in key " +
            key;
          this.actionLogger.error(msg);
          LoggerClass.logFileLocalisation();
          if (this.fileLogger) {
            this.fileLogger.error(
              new Error(msg),
              "actions.js → giveElementsTo()",
            );
          }
          errorStack.addError(
            msg,
            LoggerClass.pretty(LoggerClass.getCallerLocation().reverse()),
          );

          return;
        }

        // Debut des logs de fin d'action
        if (this.fileLogger) {
          this.fileLogger.log("Sum : " + sum);
          if (senderObject) {
            this.fileLogger.log(
              "type of senderobject value " +
                TypeManager.getType(senderObject.value) +
                " reel type " +
                typeof senderObject.value,
            );
          }
        }

        // IF THERE IS SENDER
        if (
          TypeManager.isDefined(senderObject) &&
          TypeManager.getType(senderObject.value) === "number"
        ) {
          // SUBSTRACT HIS SUM IF HE DONT HAVE ENOUG
          if (senderObject.value < sum) {
            if (
              senderObject.params &&
              senderObject.params["ifFromStackDoesNotHaveRessource"] &&
              senderObject.params["ifFromStackDoesNotHaveRessource"].value
            ) {
              if (
                senderObject.params["ifFromStackDoesNotHaveRessource"][
                  "giveAllRessourcePossible"
                ]
              ) {
                sum = senderObject.value;
                senderObject.value = 0;
              }
              if (
                senderObject.params["ifFromStackDoesNotHaveRessource"][
                  "doEvents"
                ]
              ) {
                for (const eventId of senderObject.params[
                  "ifFromStackDoesNotHaveRessource"
                ]["doEvents"]) {
                  Event.actions.jsId(eventId, socket, gameData);
                }
              }
            }
          } else {
            // SUBSTRACT REAL SUMIS HE HAS
            senderObject.value -= sum;
          }
          // SAVE ACTION LOG FOR TEST
          if (this.gameData.data.isTest) {
            this.actionEventForTest.diffs.push({
              key: PlayerManager.isPlayerType(this.sender, this.gameData)
                ? this.sender.pseudo
                : this.event.event.from,
              type: "number",
              id: "eflookpmmmort5123",
              before: structuredClone(senderObjectSave.value),
              after: structuredClone(senderObject.value),
            });
          }
        }
        // If WE GIVE FIXE NUMBER OF CARD
        if (key === "{cards}") {
          let newSenderObjectValue = structuredClone(senderObject.value);
          if (this.fileLogger) {
            LoggerClass.logGridFromObject(
              {
                "New Sender Object Value before": newSenderObjectValue,
                "senderObject value ": senderObject.value,
              },
              "COPY ALL CARDS - BEFORE LOOP",
              this.fileLogger,
            );
          }
          for (let n = 0; n < sum; n++) {
            // Sender donne des cartes une par une à Destinataire
            if (!senderObject) {
              if (this.fileLogger) {
                this.fileLogger.log("No sender,   ");
              }
              continue;
            }
            if (senderObject.value.length === 0) {
              if (this.fileLogger) {
                this.fileLogger.log("Sender value empty  ");
              }
              continue;
            }

            if (senderObject.value[n]) {
              if (this.fileLogger) {
                this.fileLogger.log(
                  "Give card id  " + senderObject.value[n] + " to destinataire",
                );
              }

              destinataireObject?.value?.push(senderObject.value[n]);
              newSenderObjectValue.splice(n, 1);
            }

            senderObject.value = newSenderObjectValue;
          }

          // SAVE ACTION LOG FOR TEST
          if (this.gameData.data.isTest && senderObject) {
            this.actionEventForTest.diffs.push({
              key: PlayerManager.isPlayerType(this.sender, this.gameData)
                ? this.sender.pseudo
                : this.event.event.from,
              type: senderObject.type,
              message: "Give " + sum + " cards to destinataire",
              id: "ppkzeort5123",
              before: structuredClone(senderObjectSave.value),
              after: structuredClone(newSenderObjectValue),
            });
          }
          if (this.gameData.data.isTest) {
            this.actionEventForTest.diffs.push({
              key: PlayerManager.isPlayerType(this.destinataire, this.gameData)
                ? this.destinataire.pseudo
                : this.event.event.for,
              type: destinataireObject?.type,
              message: "Receive " + sum + " cards from sender",
              id: "435545grerg",
              before: structuredClone(destinataireObjectSave.value),
              after: structuredClone(destinataireObject.value),
            });
          }
        }
        //END : If WE GIVE FIXE NUMBER OF CARD
        else {
          destinataireObject.value += sum;
          if (this.gameData.data.isTest) {
            this.actionEventForTest.diffs.push({
              key: PlayerManager.isPlayerType(this.destinataire, this.gameData)
                ? this.destinataire.pseudo
                : this.event.event.for,
              type: "number",
              id: "e5443655155",
              before: structuredClone(destinataireObjectSave.value),
              after: structuredClone(destinataireObject.value),
            });
          }
        }
      }
      // END OF  IF WE WANT TO GIVE A SPECIFIC QUANTITY

      // SAVER
      PlayerManager.updatePlayerObject(
        this.sender,
        this.gameData,
        this.SenderListObject,
      );
      PlayerManager.updatePlayerObject(
        this.destinataire,
        this.gameData,
        this.destinataireListObject,
      );

      // logs de resultats
      if (this.fileLogger) {
        LoggerClass.logGridFromObject(
          {
            "Destinataire Liste": this.destinataireListObject,
            "Destinataire Object": destinataireObject,
            Destinataire: this.destinataire,
          },
          "DESTINATAIRE AFTER GIVE ELEMENT",
          this.fileLogger,
        );

        LoggerClass.logGridFromObject(
          {
            "Sender Liste": this.SenderListObject,
            "Sender Object": senderObject,
            Sender: this.sender,
          },
          "SENDER AFTER GIVE ELEMENT",
          this.fileLogger,
        );

        this.fileLogger.log("Data ");
        this.fileLogger.log(LoggerClass.pretty(this.gameData.data.players));

        if (this.index) {
          this.fileLogger.log("Resultat des modifications ");
          for (let player of this.gameData.data.players) {
            this.fileLogger.log(LoggerClass.pretty(player));
            this.actionLogger.info("Effectué x" + this.index);
            this.fileLogger.log(
              "✅ GiveElementsTo effectué x" + this.index + ".",
            );
          }
        }

        LoggerClass.logGridOldNew(
          beforeGameData,
          this.gameData.data,
          this.fileLogger,
        );

        this.actionLogger.info("Effectué ");
        this.fileLogger.log("✅ GiveElementsTo effectué.");
      } // fin logs de resultats
    }
  }
}
