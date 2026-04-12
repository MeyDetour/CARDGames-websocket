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
    sender = null,
    senderListObject = null,
    destinataire,
    destinataireListObject,
    giveElements,
    value,
    socket,
    gameData,
    logs = {},
    params = {},
    index = null,
  ) {
    this.fileLogger = fileLogger;
    this.event = event;
    this.sender = sender;
    this.senderListObject = senderListObject;
    this.destinataire = destinataire;
    this.destinataireListObject = destinataireListObject;
    this.giveElements = giveElements;
    this.value = value;
    this.socket = socket;
    this.gameData = gameData;
    this.logs = logs;
    this.params = params;
    this.index = index;
    this.actionEventForTest = {
      testType: "event",
      diffs: [],
      executionDate: new Date(),
      ...event,
    };
    const actionLogger = Logger("Action Event ID=" + this.event?.id);
    this.actionLogger = actionLogger;

    if (!TypeManager.isDefined(this.fileLogger)) {
      const msg = "fileLogger is null in Action constructor";
      console.error(msg);
      LoggerClass.logFileLocalisation();
      try {
        errorStack.addError(
          msg,
          LoggerClass.pretty(LoggerClass.getCallerLocation().reverse()),
        );
      } catch (e) {}
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
    this.SenderListObject = SenderListObject;
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
      giveElements: this.giveElements,
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
        "Cannot apply event <<skipPlayerTour>> without destinataire in event : " +
        this.event["name"] +
        " with ID=" +
        this.event["id"];
      this.actionLogger.error(msg);
      LoggerClass.logFileLocalisation();
      this.fileLogger.error(new Error(msg), "actions.js → shuffle()");
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
      this.fileLogger.error(new Error(msg), "actions.js → shuffle()");
      errorStack.addError(
        msg,
        LoggerClass.pretty(LoggerClass.getCallerLocation().reverse()),
      );
      return;
    }

    // Effectue le mélange
    this.fileLogger.log(
      `🔀 Mélange de la collection du destinataire dans l'événement ID=${this.event["id"]}`,
    );
    let before = structuredClone(this.destinataire);
    ArrayManager.shuffle(this.destinataire.value);
    LoggerClass.logGridOldNew(before, this.destinataire, this.fileLogger);
    this.actionLogger.info("Effectué");
    this.fileLogger.log("✅ Mélange effectué.");
    if (this.gameData.data.isTest) {
      this.actionEventForTest.diffs.push({
        id:"jzbfebdxk54165zf",
        key: this.event.event.for,
        diff: ObjectManager.getObjectDiff(before, this.destinataire),
        type: before.type,
        before: before.value,
        after: this.destinataire.value,
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
      this.fileLogger.error(
        new Error(msg),
        "actions.js → changeStartingPlayer()",
      );
      errorStack.addError(
        msg,
        LoggerClass.pretty(LoggerClass.getCallerLocation().reverse()),
      );
    }
    this.fileLogger.log(
      `🔄 Changement du joueur de départ dans l'événement ID=${this.event["id"]}`,
    );
    let before = this.gameData.data.players[0];
    let beforePPlayers = structuredClone(this.gameData.data.players);
    PlayerManager.changePlayerOrder(this.value, this.gameData);

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
    // SAVE ACTION LOG FOR TEST
    if (this.gameData.data.isTest) {
      this.actionEventForTest.diffs.push({
         id:"jzbbbu5454165zf",
        key: "Starting Player",
        type: "player",
        before: before.pseudo,
        after: structuredClone(this.gameData.data.players[0].pseudo),
      });
      this.actionEventForTest.diffs.push({
         id:"hzefuf548fzefez",
        key: "Player order",
        type: "array",
        before: beforePPlayers.map((p) => p.pseudo),
        after: structuredClone(this.gameData.data.players.map((p) => p.pseudo)),
      });
    }
    this.actionLogger.info("Effectué");
    this.fileLogger.log("✅ Changement de joueur effectué.");
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
      this.fileLogger.error(new Error(msg), "actions.js → skipPlayerTour()");

      errorStack.addError(
        msg,
        LoggerClass.pretty(LoggerClass.getCallerLocation().reverse()),
      );
    }
    this.fileLogger.log(
      `⏭️ Saut du tour du joueur dans l'événement ID=${this.event["id"]}`,
    );
    let before = structuredClone(this.destinataire);
    this.destinataire["attachedEventForTour"]["value"].push("skipPlayerTour");
    PlayerManager.updatePlayerObject(this.destinataire, this.gameData);
    LoggerClass.logGridOldNew(before, this.destinataire, this.fileLogger);

    this.actioplayerListnLogger.info("Effectué");
    this.fileLogger.log("✅ Saut du tour effectué.");
  }

  updateGlobalValue() {
    this.fileLogger.log("Action element :");
    this.fileLogger.log(LoggerClass.pretty(this.getThisObject()));

    // Error if value undefined
    if (!TypeManager.isDefined(this.value)) {
      const msg =
        "cannot update gloabal value without value. Event id=" + this.event.id;
      this.actionLogger.error(msg);
      LoggerClass.logFileLocalisation();
      this.fileLogger.error(new Error(msg), "actions.js → updateGlobalValue()");

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
      this.fileLogger.error(new Error(msg), "actions.js → updateGlobalValue()");
      errorStack.addError(msg, LoggerClass.logFileLocalisation());
      return;
    }

    this.fileLogger.log(
      `🔄 Mise à jour de la valeur globale dans l'événement ID=${this.event["id"]}`,
    );
    this.fileLogger.log("Get Value to replace -> " + this.value);
    this.fileLogger.log("Destinataire avant modification-> ");
    this.fileLogger.log(LoggerClass.pretty(this.destinataire));
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
        id:"vnjbu45561zef",
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

    LoggerClass.logGridOldNew(before, this.gameData.data, this.fileLogger);
    if (this.logs.globalEventLog) this.actionLogger.info("Effectué");
    this.fileLogger.log("✅ changement de valeur effectué.");
  }

  removeAllAtachedEventsForTour() {
    this.fileLogger.log(
      `🗑️ Suppression de tous les événements attachés pour le tour du joueur dans l'événement ID=${this.event["id"]}`,
    );
    let before = structuredClone(this.destinataire);
    if (
      this.destinataire["attachedEventForTour"] &&
      this.destinataire["attachedEventForTour"]["value"]
    ) {
      this.destinataire["attachedEventForTour"]["value"] = [];
      PlayerManager.updatePlayerObject(this.destinataire, this.gameData);

      this.fileLogger.log(
        `✅ Tous les événements attachés pour le tour ont été supprimés du joueur dans l'événement ID=${this.event["id"]}.`,
      );
      LoggerClass.logGridOldNew(before, this.destinataire, this.fileLogger);

      this.fileLogger.log("Effectué");
      // SAVE ACTION LOG FOR TEST
      if (this.gameData.data.isTest) {
        this.actionEventForTest.diffs.push({
          key: this.destinataire.pseudo,
          id:"efhufe4564efz",
          type: "array",
          before: structuredClone(before.attachedEventForTour.value),
          after: structuredClone(this.destinataire.attachedEventForTour.value),
        });
      }
    }
  }

  giveElementsTo() {
    LoggerClass.logGridFromObject(
      {
        Sender: typeof this.sender,
        "Sender List Object": typeof this.senderListObject,
        Destinataire: typeof this.destinataire,
        "Destinataire List Object": typeof this.destinataireListObject,
        "Give Elements": typeof this.giveElements,
        Socket: typeof this.socket,
        "Game Data": typeof this.gameData,
        Params: typeof this.params,
        Logs: typeof this.logs,
        Index: typeof this.index,
      },
      "🔄 GiveElementTo PARAMS",
      this.fileLogger,
    );

    let beforeGameData = structuredClone(this.gameData.data);

    LoggerClass.logGridFromObject(
      {
        Destinataire: this.destinataire,
        Sender: this.sender,
      },
      "AVANT GiveElementTo ",
      this.fileLogger,
    );

    // PARCOURIR TOUS LES ELEMENTS A DONNER
    for (let key of Object.keys(this.giveElements)) {
      //transform element to give like {gain#1} to array like ["gain","1"]
      // get array like ["gain","1"]
      let keyToTransform = VariableType.getListSplited(
        key,
        this.gameData,
        null,
      ); //  {gain#1} -> ['gain','1']
      this.fileLogger.log("keyToTransform :");
      this.fileLogger.log(LoggerClass.pretty(keyToTransform));

      //  INITIALIZED SENDER =======================
      let senderObject = null;
      if (TypeManager.isDefined(this.sender)) {
        senderObject = VariableType.splitLogicalList(
          [this.sender, ...keyToTransform],
          this.gameData,
          { returnType: "ref" },
        );

        if (!TypeManager.isDefined(senderObject)) {
          senderObject = this.sender;
        }
      }
      const senderObjectSave = structuredClone(senderObject);

      // INITIALIZE DESTINATAIRE =================================
      let destinataireObject = null;
      if (TypeManager.isDefined(this.destinataire)) {
        destinataireObject = VariableType.splitLogicalList(
          [this.destinataire, ...keyToTransform],
          this.gameData,
          { returnType: "ref", log: false },
        );

        if (!TypeManager.isDefined(destinataireObject)) {
          destinataireObject = this.destinataire;
        }
      }
      const destinataireObjectSave = structuredClone(destinataireObject);

      // LOG ====================================
      LoggerClass.logGridFromObject(
        {
          "Destinataire object": destinataireObject,
          "Sender Object": senderObject,
        },
        "APPLICATION DES CLES ",
        this.fileLogger,
      );

      // START MANIP ==========================================

      //  GET QUANTITY TO GIVE
      let sum = Parser.translateInnerExpression(
        this.giveElements[key],
        this.gameData,
        {
          ...this.params,
          location: this.fileLogger,
        },
      );
      this.fileLogger.log("sum");
      this.fileLogger.log(LoggerClass.pretty(sum));

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
            this.fileLogger.error(
              new Error(msg),
              "actions.js → giveElementsTo()",
            );

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
            this.fileLogger.log(LoggerClass.pretty(senderObject));
            this.actionLogger.error(msg);
            LoggerClass.logFileLocalisation();
            this.fileLogger.error(
              new Error(msg),
              "actions.js → giveElementsTo()",
            );

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
            LoggerClass.logGridFromObject(
              {
                "New Sender Object Value before": newSenderObjectValue,
                "senderObject value ": senderObject.value,
              },
              "COPY ALL CARDS - BEFORE LOOP",
              this.fileLogger,
            );
            // GIVE ALL CARD
            for (let elt of senderObject.value) {
              if (senderObject.value.length === 0) {
                this.fileLogger.log("Sender value empty  ");
                continue;
              }
              // Verify That card exist in gameData
              if (CardManager.getCard(this.gameData, elt)) {
                this.fileLogger.log(
                  "Give card id  " + elt + " to destinataire",
                );
                destinataireObject.value.push(elt);
                const index = newSenderObjectValue.indexOf(elt);
                if (index !== -1) {
                  newSenderObjectValue.splice(index, 1);
                } else {
                  this.fileLogger.log(
                    "Card id " + elt + " not found in newSenderObjectValue ",
                  );
                }
              } else {
                if (this.logs.giveElementsLog) {
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
                key: PlayerManager.isPlayerType(this.destinataire, this.gameData)
                  ? this.destinataire.pseudo
                  : this.event.event.for,
                id:"ezfu54528585",
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
            if (this.logs.giveElementsLog) {
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
                id:"eflokort5123",
                type: "number",
                before: structuredClone(senderObject.value),
                after: 0,
              });
            }
          }
        }
      }

      // IF WE WANT TO GIVE A SPECIFIC QUANTITY
      if (!exceptions.includes(sum)) {
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
          this.fileLogger.error(
            new Error(msg),
            "actions.js → giveElementsTo()",
          );

          errorStack.addError(
            msg,
            LoggerClass.pretty(LoggerClass.getCallerLocation().reverse()),
          );

          return;
        }
        this.fileLogger.log("Sum : " + sum);
        if (senderObject) {
          this.fileLogger.log(
            "type of senderobject value " +
              TypeManager.getType(senderObject.value) +
              " reel type " +
              typeof senderObject.value,
          );
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
          LoggerClass.logGridFromObject(
            {
              "New Sender Object Value before": newSenderObjectValue,
              "senderObject value ": senderObject.value,
            },
            "COPY ALL CARDS - BEFORE LOOP",
            this.fileLogger,
          );
          for (let n = 0; n < sum; n++) {
            // Sender donne des cartes une par une à Destinataire
            if (!senderObject) {
              this.fileLogger.log("No sender,   ");
              continue;
            }
            if (senderObject.value.length === 0) {
              this.fileLogger.log("Sender value empty  ");
              continue;
            }

            if (senderObject.value[n]) {
              this.fileLogger.log(
                "Give card id  " + senderObject.value[n] + " to destinataire",
              );

              destinataireObject.value.push(senderObject.value[n]);
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
              message:"Give " + sum + " cards to destinataire",
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
              type: destinataireObject.type,
              message:"Receive " + sum + " cards from sender",
              id: "435545grerg",
              before: structuredClone(destinataireObjectSave.value),
              after: structuredClone(destinataireObject.value),
            });
          }
        } else {
          destinataireObject.value += sum;
          if (this.gameData.data.isTest) {
            this.actionEventForTest.diffs.push({
              key: PlayerManager.isPlayerType(this.destinataire, this.gameData)
                ? this.destinataire.pseudo
                : this.event.event.for,
              type: "number",
              id:"e5443655155",
              before: structuredClone(destinataireObjectSave.value),
              after: structuredClone(destinataireObject.value),
            });
          }
        }
      }

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
    }
  }
}
