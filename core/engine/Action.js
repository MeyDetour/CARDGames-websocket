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
    if (
      !this.boucleDataArray ||
      !Array.isArray(this.boucleDataArray) ||
      this.boucleDataArray.length === 0
    ) {
      for (let key of Object.keys(this.giveElementsData)) {
        this.giveElementsTo(key,this.giveElementsData[key]);
      }
      return;
    }

    // 1. FILTRER les joueurs éligibles
    const eligibleData = [];
    for (let i = 0; i < this.boucleDataArray.length; i++) {
      let [destinataireListObject, destinataire] =
        PlayerManager.getDestinataireElement(
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

      const condition = Parser.translateInnerExpression(
        this.boucleCondition,
        this.gameData,
        this.params,
      );

      if (condition === false && TypeManager.isDefined(this.boucleCondition)) {
        if (this.fileLogger)
          this.fileLogger.log(`Condition false at index ${i}, skipping`);
        continue;
      }

      eligibleData.push({
        i,
        destinataireListObject,
        destinataire,
        senderListObject,
        sender,
      });
    }

    if (eligibleData.length === 0) {
      if (this.fileLogger)
        this.fileLogger.log("No eligible recipients after filtering");
      return;
    }

    // 2. Résoudre sum pour savoir le mode de distribution
    // On prend la première clé pour déterminer le type (nombre ou array ou *)

    for (let key of Object.keys(this.giveElementsData)) {
      // KEY ====================================================================
      //transform element to give like {gain#1} to array like ["gain","1"]
      // get array like ["gain","1"]
      let keyOfElementToGive = VariableType.getListSplited(
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
      //============================================================================

      const sum = Parser.translateInnerExpression(
        this.giveElementsData[key],
        this.gameData,
        { ...this.params, location: this.fileLogger },
      );

      if (this.fileLogger) {
        this.fileLogger.log("sum");
        this.fileLogger.log(LoggerClass.pretty(sum));
      }
      const isRoundRobin = !Array.isArray(sum) && sum != "*";

      if (isRoundRobin) {
        // ROUND-ROBIN : 1 unité par joueur à chaque tour
        // pour int

        let iterationCount = parseInt(sum);

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

        for (let turn = 0; turn < iterationCount; turn++) {
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
            // On override temporairement giveElementsData pour donner 1 à la fois
            const savedGiveElementsData = this.giveElementsData;
            this.giveElementsData = { [keyOfElementToGive]: 1 };
            this.giveElementsTo(keyOfElementToGive, 1);
            this.giveElementsData = savedGiveElementsData;
          }
        }
      } else if (sum === "*") {
        // Mode Épuisement de la source :
        // distribution à tous les joueurs jusqua la fin de la ressource
        this.giveEntireElement(keyOfElementToGive, sum, eligibleData);
      } else {
        // BATCH (array) : tout donner joueur par joueur
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
          this.giveElementsTo(keyOfElementToGive, sum);
        }
      }
    }
  }
  giveElementsTo(keyToTransform, sum) {
    if (this.fileLogger) {
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

    //  INITIALIZED SENDER =======================
    let senderObject = null;
    if (TypeManager.isDefined(this.sender)) {
      // si on ne donne pas de cartes
      // on veut acceder à la propriété du joueur
      // ex give {gain#1} to {playerBoucle}
      // alors on veut {playerBoucle#gain#1}
      if (keyToTransform[0] != "cards") {
        senderObject = VariableType.splitLogicalList(
          [this.sender, ...keyToTransform],
          this.gameData,
          { returnType: "ref" },
        );
      } else {
        // si on donne des cartes,
        // on ne veut pas accéder à la propriété cards du sender,
        // mais au sender lui-même
        senderObject = this.sender;
      }

      if (!TypeManager.isDefined(senderObject)) {
        senderObject = this.sender;
      }
    }
    const senderObjectSave = structuredClone(senderObject);

    // INITIALIZE DESTINATAIRE =================================
    let destinataireObject = null;
    if (TypeManager.isDefined(this.destinataire)) {
      // si on ne donne pas de cartes
      // on veut acceder à la propriété du joueur
      // ex give {gain#1} to {playerBoucle}
      // alors on veut {playerBoucle#gain#1}
      if (keyToTransform[0] != "cards") {
        destinataireObject = VariableType.splitLogicalList(
          [this.destinataire, ...keyToTransform],
          this.gameData,
          { returnType: "ref", log: false },
        );
      } else {
        // si on donne des cartes,
        // on ne veut pas accéder à la propriété cards du sender,
        // mais au sender lui-même
        destinataireObject = this.destinataire;
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

    // IF WE WANT TO GIVE A SPECIFIC QUANTITY

    sum = parseInt(sum);

    // IF SUM IS NOT A NUMBER

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
            senderObject.params["ifFromStackDoesNotHaveRessource"]["doEvents"]
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
    if (keyToTransform[0] === "cards") {
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
    //END : If WE GIVE FIXE NUMBER WITHOYUT SENDER
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
      // fin logs de resultats
    }
  }
  giveEntireElement(keyToTransform, sum, eligibleData = []) {
    const key = keyToTransform ? `{${keyToTransform[0]}}` : "";

    if (this.fileLogger) {
      LoggerClass.logGridFromObject(
        { Sender: this.sender, Destinataire: this.destinataire },
        "AVANT giveEntireElement (Distribution circulaire jusqu'à épuisement)",
        this.fileLogger,
      );
    }

    let beforeGameData = structuredClone(this.gameData.data);

    // Si aucun joueur éligible n'est passé (appel direct hors boucle), on crée un lot unique avec le destinataire actuel
    if (eligibleData.length === 0) {
      eligibleData = [
        {
          i: this.index,
          destinataireListObject: this.destinataireListObject,
          destinataire: this.destinataire,
          senderListObject: this.senderListObject,
          sender: this.sender,
        },
      ];
    }

    // 1. INITIALISATION ET SAUVEGARDE DU SENDER GLOBAL =======================
    let senderObject = null;
    if (TypeManager.isDefined(this.sender)) {
      if (keyToTransform[0] !== "cards") {
        senderObject = VariableType.splitLogicalList(
          [this.sender, ...keyToTransform],
          this.gameData,
          { returnType: "ref" },
        );
      } else {
        senderObject = this.sender;
      }
      if (!TypeManager.isDefined(senderObject)) {
        senderObject = this.sender;
      }
    }
    const senderObjectSave = structuredClone(senderObject);

    if (!senderObject || !TypeManager.isDefined(senderObject.value)) {
      const msg =
        "Cannot execute giveEntireElement: Sender object or its value is undefined.";
      this.actionLogger.error(msg);
      if (this.fileLogger) this.fileLogger.error(new Error(msg));
      return;
    }

    // 2. DISTRIBUTION EN BOUCLE TANT QUE LE SENDER A DU STOCK ===================

    // CAS A : LES CARTES (TABLEAUX)
    if (keyToTransform[0] === "cards" && Array.isArray(senderObject.value)) {
      let newSenderObjectValue = structuredClone(senderObject.value);
      let playerIndex = 0;

      // Tant qu'il reste des cartes dans le deck/la main du sender
      while (newSenderObjectValue.length > 0) {
        // Sélection du joueur courant de manière circulaire
        const currentRecipient =
          eligibleData[playerIndex % eligibleData.length];

        // Résolution dynamique du destinataire object pour ce joueur précis
        let destObj = null;
        if (TypeManager.isDefined(currentRecipient.destinataire)) {
          destObj = currentRecipient.destinataire; // C'est "cards", donc le destinataire lui-même
        }

        if (destObj && Array.isArray(destObj.value)) {
          const cardToGive = newSenderObjectValue[0]; // On prend la première carte disponible

          if (CardManager.getCard(this.gameData, cardToGive)) {
            if (this.fileLogger) {
              this.fileLogger.log(
                `Give card id ${cardToGive} to player index ${currentRecipient.i}`,
              );
            }

            // Sauvegarde pour les tests avant la première modification de ce destinataire
            if (this.gameData.data.isTest && !currentRecipient.savedDest) {
              currentRecipient.savedDest = structuredClone(destObj.value);
            }

            destObj.value.push(cardToGive);
            newSenderObjectValue.splice(0, 1); // On retire la carte distribuée
          } else {
            // Sécurité si l'élément n'est pas valide, on l'enlève pour éviter une boucle infinie
            newSenderObjectValue.splice(0, 1);
          }
        }

        playerIndex++;
      }

      // Application de la nouvelle valeur au sender
      senderObject.value = newSenderObjectValue;

      // LOGS DE TEST POUR LES CARTES
      if (this.gameData.data.isTest) {
        this.actionEventForTest.diffs.push({
          key: PlayerManager.isPlayerType(this.sender, this.gameData)
            ? this.sender.pseudo
            : this.event.event.from,
          type: senderObject.type,
          id: "f456z854e846_entire",
          before: structuredClone(senderObjectSave.value),
          after: structuredClone(senderObject.value),
        });

        // Diffs pour chaque joueur ayant reçu au moins une carte
        for (const target of eligibleData) {
          if (target.savedDest) {
            this.actionEventForTest.diffs.push({
              key: PlayerManager.isPlayerType(
                target.destinataire,
                this.gameData,
              )
                ? target.destinataire.pseudo
                : this.event.event.for,
              id: "ezfu54528585_entire_loop",
              type: senderObject.type,
              before: target.savedDest,
              after: structuredClone(target.destinataire.value),
            });
          }
        }
      }
    }

    // CAS B : LES RESSOURCES NUMÉRIQUES (NOMBRES)
    else if (typeof senderObject.value === "number") {
      let playerIndex = 0;
      let initialSenderValue = senderObject.value;

      // Tant que la ressource du sender est supérieure à 0
      while (senderObject.value > 0) {
        const currentRecipient =
          eligibleData[playerIndex % eligibleData.length];

        // Résolution de la propriété numérique chez le destinataire courant (ex: {player#gain#1})
        let destObj = VariableType.splitLogicalList(
          [currentRecipient.destinataire, ...keyToTransform],
          this.gameData,
          { returnType: "ref", log: false },
        );

        if (!TypeManager.isDefined(destObj)) {
          destObj = currentRecipient.destinataire;
        }

        if (destObj && typeof destObj.value === "number") {
          // Sauvegarde pour le test avant modification
          if (this.gameData.data.isTest && !currentRecipient.savedDest) {
            currentRecipient.savedDest = structuredClone(destObj.value);
          }

          destObj.value += 1;
          senderObject.value -= 1;
        } else {
          // Si le destinataire n'est pas valide, on coupe pour éviter une boucle infinie
          break;
        }

        playerIndex++;
      }

      // LOGS DE TEST POUR LES NOMBRES
      if (this.gameData.data.isTest) {
        this.actionEventForTest.diffs.push({
          key: PlayerManager.isPlayerType(this.sender, this.gameData)
            ? this.sender.pseudo
            : this.event.event.from,
          id: "eflokort5123_entire_num",
          type: "number",
          before: initialSenderValue,
          after: senderObject.value,
        });

        for (const target of eligibleData) {
          let destObj = VariableType.splitLogicalList(
            [target.destinataire, ...keyToTransform],
            this.gameData,
            { returnType: "ref", log: false },
          );
          if (!TypeManager.isDefined(destObj)) destObj = target.destinataire;

          if (target.savedDest !== undefined && destObj) {
            this.actionEventForTest.diffs.push({
              key: PlayerManager.isPlayerType(
                target.destinataire,
                this.gameData,
              )
                ? target.destinataire.pseudo
                : this.event.event.for,
              id: "e5443655155_entire_num_loop",
              type: "number",
              before: target.savedDest,
              after: destObj.value,
            });
          }
        }
      }
    }

    // 3. SAUVEGARDE ET COMMITS VIA PLAYERMANAGER ==============================
    PlayerManager.updatePlayerObject(
      this.sender,
      this.gameData,
      this.SenderListObject,
    );
    for (const target of eligibleData) {
      PlayerManager.updatePlayerObject(
        target.destinataire,
        this.gameData,
        target.destinataireListObject,
      );
    }

    // LOGS FINAUX =============================================================
    if (this.fileLogger) {
      LoggerClass.logGridFromObject(
        {
          "Sender Object Post-Distribution": senderObject,
          Sender: this.sender,
        },
        "SENDER AFTER GIVE ENTIRE ELEMENT ROUND ROBIN",
        this.fileLogger,
      );
      LoggerClass.logGridOldNew(
        beforeGameData,
        this.gameData.data,
        this.fileLogger,
      );
      this.actionLogger.info(
        "Effectué giveEntireElement en mode épuisement équitable",
      );
      this.fileLogger.log(
        "✅ giveEntireElement (épuisement de la source) effectué avec succès.",
      );
    }
  }
  giveAnArrayOfElements(keyToTransform, sum) {
    const key = keyToTransform ? `{${keyToTransform[0]}}` : "";

    if (this.fileLogger) {
      LoggerClass.logGridFromObject(
        { Sender: this.sender, Destinataire: this.destinataire },
        "AVANT giveAnArrayOfElements ",
        this.fileLogger,
      );
    }

    let beforeGameData = structuredClone(this.gameData.data);

    // INITIALIZATION SENDER =======================
    let senderObject = null;
    if (TypeManager.isDefined(this.sender)) {
      if (keyToTransform[0] !== "cards") {
        senderObject = VariableType.splitLogicalList(
          [this.sender, ...keyToTransform],
          this.gameData,
          { returnType: "ref" },
        );
      } else {
        senderObject = this.sender;
      }
      if (!TypeManager.isDefined(senderObject)) {
        senderObject = this.sender;
      }
    }
    const senderObjectSave = structuredClone(senderObject);

    // INITIALIZE DESTINATAIRE =================================
    let destinataireObject = null;
    if (TypeManager.isDefined(this.destinataire)) {
      if (keyToTransform[0] !== "cards") {
        destinataireObject = VariableType.splitLogicalList(
          [this.destinataire, ...keyToTransform],
          this.gameData,
          { returnType: "ref", log: false },
        );
      } else {
        destinataireObject = this.destinataire;
      }
      if (!TypeManager.isDefined(destinataireObject)) {
        destinataireObject = this.destinataire;
      }
    }
    const destinataireObjectSave = structuredClone(destinataireObject);

    // LOGS APRES APPLICATION DES CLES =========================
    if (this.fileLogger) {
      LoggerClass.logGridFromObject(
        {
          "Destinataire object": destinataireObject,
          "Sender Object": senderObject,
        },
        "APPLICATION DES CLES (giveAnArrayOfElements)",
        this.fileLogger,
      );
    }

    // MANIPULATION DES DONNEES ================================
    if (Array.isArray(sum)) {
      if (this.fileLogger) {
        this.fileLogger.log("Sum : " + JSON.stringify(sum));
      }

      // Type checks validations
      if (
        TypeManager.isDefined(senderObject) &&
        TypeManager.getType(senderObject.value) !== "array"
      ) {
        const msg =
          "Try to give elements but senderObject value is not an array. Got type: " +
          typeof sum +
          " with value: " +
          JSON.stringify(sum) +
          " Error in key " +
          key;
        this.actionLogger.error(msg);
        LoggerClass.logFileLocalisation();
        if (this.fileLogger) {
          this.fileLogger.error(
            new Error(msg),
            "actions.js → giveAnArrayOfElements()",
          );
        }
        errorStack.addError(
          msg,
          LoggerClass.pretty(LoggerClass.getCallerLocation().reverse()),
        );
        return;
      }

      if (
        TypeManager.isDefined(destinataireObject) &&
        TypeManager.getType(destinataireObject.value) !== "array"
      ) {
        const msg =
          "Try to give elements but destinataireObject value is not an array. Got type: " +
          typeof sum +
          " with value: " +
          JSON.stringify(sum) +
          " Error in key " +
          key;
        this.actionLogger.error(msg);
        LoggerClass.logFileLocalisation();
        if (this.fileLogger) {
          this.fileLogger.error(
            new Error(msg),
            "actions.js → giveAnArrayOfElements()",
          );
        }
        errorStack.addError(
          msg,
          LoggerClass.pretty(LoggerClass.getCallerLocation().reverse()),
        );
        return;
      }

      // IF THERE IS SENDER, remove elements from sender
      if (
        TypeManager.isDefined(senderObject) &&
        TypeManager.getType(senderObject.value) === "array"
      ) {
        senderObject.value = senderObject.value.filter(
          (elt) => !sum.includes(elt) || !sum.includes(String(elt)),
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
      }

      // ADD elements to destinataire
      if (
        TypeManager.isDefined(destinataireObject) &&
        TypeManager.getType(destinataireObject.value) === "array"
      ) {
        destinataireObject.value = destinataireObject.value.concat(sum);

        // SAVE ACTION LOG FOR TEST
        if (this.gameData.data.isTest) {
          this.actionEventForTest.diffs.push({
            key: PlayerManager.isPlayerType(this.destinataire, this.gameData)
              ? this.destinataire.pseudo
              : this.event.event.for,
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

    // SAVER & UPDATES =========================================
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

    // LOGS DE RESULTATS FINAUX ================================
    if (this.fileLogger) {
      LoggerClass.logGridFromObject(
        {
          "Destinataire Liste": this.destinataireListObject,
          "Destinataire Object": destinataireObject,
          Destinataire: this.destinataire,
        },
        "DESTINATAIRE AFTER GIVE ARRAY OF ELEMENTS",
        this.fileLogger,
      );
      LoggerClass.logGridFromObject(
        {
          "Sender Liste": this.SenderListObject,
          "Sender Object": senderObject,
          Sender: this.sender,
        },
        "SENDER AFTER GIVE ARRAY OF ELEMENTS",
        this.fileLogger,
      );
      LoggerClass.logGridOldNew(
        beforeGameData,
        this.gameData.data,
        this.fileLogger,
      );
      this.actionLogger.info("Effectué giveAnArrayOfElements");
      this.fileLogger.log("✅ giveAnArrayOfElements effectué.");
    }
  }
}
