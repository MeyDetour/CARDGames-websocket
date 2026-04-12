import { Logger, LoggerClass } from "../logger/logger.js";
import AppError from "../error/AppError.js";
import Parser from "../../parser/parser.js";
import VariableType from "../../parser/VariableType.js";
import PlayerManager from "../services/PlayerManager.js";
import { ArrayManager } from "../services/helper/ArrayManager.js";
import CardManager from "../services/CardManager.js";
import { TypeManager } from "../services/helper/TypeManager.js";
import Action from "./Action.js";
import { errorStack } from "../error/ErrorStack.js";
import GameManager from "../services/GameManager.js";
import EventFileLogger from "../logger/EventFileLogger.js"; 
import {ObjectManager} from "../services/helper/ObjectManager.js";


const eventLogger = Logger("Event");

/**
 * Gestionnaire des événements définis dans les définitions de partie.
 * Fournit des méthodes statiques pour rechercher, exécuter et gérer
 * les différents types d'événements (boucles, withValue, actions, etc.).
 */
export default class Event {
  /**
   * Cherche un event par son id et l'exécute.
   * @param {number|string} id - Identifiant de l'événement
   * @param {Socket} socket - Socket de l'appelant
   * @param {Object} gameData - Données de la partie
   * @return {null|void} retourne null en cas d'erreur
   */
  static applyEventId(id, socket, gameData, params = {}) {
    if (!params) {
      params = {};
    }
    eventLogger.info("Search Event ID: " + id);
    if (!gameData.roomInDb.events["events"]) {
      new AppError(socket, "Demon folder does not exist!");
      return null;
    }
    let event = gameData.roomInDb.events["events"].filter(
      (event) => event.id === id,
    )[0];

    if (!event) {
      new AppError(socket, "Event not found! ID=" + id);
      eventLogger.warn("Event not found! ID=" + id);
      return null;
    }

    Event.ExecuteEvent(event, socket, gameData, params);
  }

  /**
   * Exécute un event complet en évaluant sender, destinataires, actions et giveElements.
   * Cette fonction orchestre la création d'un objet Action et itère éventuellement
   * sur une boucle définie dans l'event.
   * @param {Object} event - Objet event chargé depuis la room
   * @param {Socket} socket - Socket du demandeur
   * @param {Object} gameData - Données complètes de la partie
   * @param {Object} [params={}] - Paramètres additionnels passés aux expressions
   * @returns {null|void} retourne null si une erreur empêche l'exécution
   */
  static ExecuteEvent(event, socket, gameData, params = {}) {
    if (!gameData) {
      eventLogger.error("Game Data is undefined");
      LoggerClass.logFileLocalisation();
      errorStack.addError(
        "Game Data is undefined in Event.ExecuteEvent",
           LoggerClass.pretty(LoggerClass.getCallerLocation().reverse()),
      );

      return null;
    }
    if (!event) {
      eventLogger.error("Event is undefined");
      LoggerClass.logFileLocalisation();
      errorStack.addError(
        "Event is undefined in Event.ExecuteEvent",
           LoggerClass.pretty(LoggerClass.getCallerLocation().reverse()),
      );

      return null;
    }
    if (!params) {
      params = {};
      eventLogger.debug("No params provided, initializing empty params object");
    }
    let conditionOfEvent = Parser.translateInnerExpression(
      event.condition,
      gameData,
      { ...params },
    );

    if (conditionOfEvent === false) {
      const msg = `Event ${event.id} condition is false, skipping execution. Condition: ${event.condition}`;
      eventLogger.warn(msg);
      return;
    }

    const globalEventLog = true;
    const globalEventDetailLog = true;

    const boucleLog = true;
    const boucleRemoveAttachedEventLog = false;
    const boucleUpdateValueLog = false;

    const notBoucleLog = false;
    const shuffleEventLog = false;
    const changeStartingPlayerLog = false;

    const giveElementsLog = false;
    const skipEventLog = false;
    const resultOfEventsLog = true;

    const fileLogger = EventFileLogger.create(event,gameData.roomId);
    const gameDataCopy = structuredClone(gameData.data);
    eventLogger.info(
      `🟢 Event exécuté (${fileLogger.order}) : ${event.name} → ${fileLogger.filepath}`,
    );
    fileLogger.log(LoggerClass.pretty(event));
    params.location = fileLogger;
    LoggerClass.objectToString(event); 
    let action = this.getAction(event, gameData);
    let value = this.getValue(event); 
    let giveElements = this.getGiveElements(event, gameData);

    const actionObject = new Action(
      fileLogger,
      event,
      null,
      null,
      null,
      null,
      giveElements,
      value,
      socket,
      gameData,
      {
        giveElementsLog: giveElementsLog,
        globalEventLog: globalEventLog,
        resultOfEventsLog: resultOfEventsLog,
        boucleRemoveAttachedEventLog: boucleRemoveAttachedEventLog,
        boucleUpdateValueLog: boucleUpdateValueLog,
        shuffleEventLog: shuffleEventLog,
        changeStartingPlayerLog: changeStartingPlayerLog,
        skipEventLog: skipEventLog,
      },
      params,
      null
    );
    if (event["boucle"]) {
      let elts = Parser.translateInnerExpression(event["boucle"], gameData, {
        params,
        location: fileLogger,
      });
      //   eventLogger.debug("Liste des elements a parcourir")
      if (globalEventDetailLog)
        fileLogger.section(" Il y a  " + elts.length + " elements");
      if (Array.isArray(elts)) {
        for (let i = 0; i < elts.length; i++) {
          fileLogger.log("I In boucle :>> ", i);

          let destinataireListObject, destinataire;
          let senderListObject, sender;
          [destinataireListObject, destinataire] = this.getDestinataireElement(
            event,
            gameData,
            i,
            params,
          );
          let conditionOfEvent = Parser.translateInnerExpression(
            event.condition,
            gameData,
            { ...params },
          );
          if (
            TypeManager.isDefined(conditionOfEvent) &&
            conditionOfEvent === false
          ) {
            eventLogger.warn(
              "player doest not satisfied condition " +
                event.event.condition +
                " ",
            );
            continue;
          }
          if (PlayerManager.isPlayerType(destinataire, gameData)) {
            destinataire = structuredClone(destinataire);
          }
          [senderListObject, sender] = this.getSenderElement(
            event,
            gameData,
            i,
            params,
          );

          if (PlayerManager.isPlayerType(sender, gameData)) {
            sender = structuredClone(sender);
          }
          actionObject.setDestinataireListObject(destinataireListObject);
          actionObject.setDestinataire(destinataire);
          actionObject.setSenderListObject(senderListObject);
          actionObject.setSender(sender);
          actionObject.setIndex(i);
          const conidtion = this.getboucleCondition(event, gameData, params);

          if (!conidtion) {
            fileLogger.log("Condition false for player : ");
            fileLogger.log(LoggerClass.pretty(destinataire));
            eventLogger.debug("condition :>> ", event.event.condition);

            continue;
          }

          if (boucleLog) {
            LoggerClass.logGridFromObject(
              {
                Sender: sender,
                "Sender List": senderListObject,
                Destinataire: destinataire,
                "Destinataire List": destinataireListObject,
                Action: action,
                GiveElements: giveElements,
              },
              `STUDY ELEMENT ${i}`,
              this.fileLogger,
            );
          }

          //  ACTION
          if (action && destinataire != null) {
            if (action === "removeAllAtachedEventsForTour") {
              actionObject.removeAllAtachedEventsForTour();
            }
            if (action === "updateGlobalValue") {
              actionObject.updateGlobalValue();
              
            }
          }

          //  ELEMENT TO GIVE
          if (giveElements !== null && destinataire != null) {
            actionObject.giveElementsTo();
          }
        }
      } else {
        new AppError(
          socket,
          "Cannot obtain array with value " +
            event["boucle"] +
            "with event ID=" +
            event["id"],
        );
        eventLogger.warn(
          "Cannot obtain array with value " +
            event["boucle"] +
            "with event ID=" +
            event["id"],
        );
        return null;
      }
    }
    if (!event["boucle"]) {
      let destinataireListObject, destinataire;
      let senderListObject, sender;

      [destinataireListObject, destinataire] = this.getDestinataireElement(
        event,
        gameData,
        null,
        params,
      );
      [senderListObject, sender] = this.getSenderElement(
        event,
        gameData,
        null,
        params,
      );
      actionObject.setDestinataireListObject(destinataireListObject);
      actionObject.setDestinataire(destinataire);
      actionObject.setSenderListObject(senderListObject);
      actionObject.setSender(sender);

      LoggerClass.logGridFromObject(
        {
          Sender: sender,
          "Sender List": senderListObject,
          Destinataire: destinataire,
          "Destinataire List": destinataireListObject,
          Action: action,
          GiveElements: giveElements,
        },
        `STUDY ELEMENT NOT IN BOUCLE`,
        this.fileLogger,
      );

      if (giveElements && destinataire) {
        actionObject.giveElementsTo(
          sender,
          destinataire,
          destinataireListObject,
          giveElements,
          socket,
          gameData,
          {
            giveElementsLog: giveElementsLog,
            globalEventLog: globalEventLog,
            resultOfEventsLog: resultOfEventsLog,
          },
          params,
          null,
        );
      }
      if (action) {
        if (action === "shuffle") {
          actionObject.shuffle();
        }
        if (action === "endOfTour") {
          let before = gameData.data.tour;

          // change tour before end of tour because it's infinite boucle
          if (
            TypeManager.isDefined(
              gameData.roomInDb.params.tours.maxTour
                ? gameData.roomInDb.params.tours.maxTour > gameData.data.tour
                : true,
            )
          ) {
            GameManager.engine(gameData, socket, {
              ...params,
              event: "onChangeTour",
            });
          }

          LoggerClass.logGridOldNew(before, gameData.data.tour, fileLogger);
        }
        if (action === "changeManche") {
          let before = gameData.data.manche;

          // change tour before end of tour because it's infinite boucle
          if (
            TypeManager.isDefined(
              gameData.roomInDb.params.manches.max
                ? gameData.roomInDb.params.manches.max > gameData.data.manche
                : true,
            )
          ) {
            GameManager.engine(gameData, socket, {
              ...params,
              event: "endOfManche",
            });
          }

          LoggerClass.logGridOldNew(before, gameData.data.manche, fileLogger);
        }

        if (action === "changeStartingPlayer") {
          actionObject.changeStartingPlayer();
        }
        if (action === "skipPlayerTour") {
          actionObject.skipPlayerTour();
        }
        if (action === "askPlayer") {
          socket.emit("askPlayer", { event, params, roomId: gameData.roomId });
          eventLogger.debug(
            "Ask player action executed, waiting for response...",
          );
        }
        if (action === "updateGlobalValue") {
          actionObject.updateGlobalValue();
        }
      }
    }
    if (
      params.originEvent !== "loadDemon" &&
      (action ? action !== "askPlayer" : true)
    ) {
      eventLogger.info(
        "Trigger afterEvent in GameManager.engine From Event ID=" + event.id,
      );
      GameManager.engine(gameData, socket, { event: "afterEvent" });
    }

 
    // to execute if event doesnot wait answer from player
    if (event.event.withValue && action !== "askPlayer") {
      for (let eventInWVE of event.event.withValue) {
        Event.applyWithValueEvent(eventInWVE, socket, gameData, params);

        eventLogger.info(
          "Trigger afterEvent in GameManager.engine after withValue Event id" +
            eventInWVE.id +
            " of Event ID=" +
            event.id,
        );
        GameManager.engine(gameData, socket, {
          event: "afterEvent",
          ...params,
        });
      }
    }

    if (gameData.data.isTest){
      gameData.data.testLogs.push(actionObject.getActionEventForTest());
    }
    if (event.loadMessage){ gameData.data.logs.push(event.loadMessage); socket.to(gameData.roomId).emit("updateGameDataLogs", event.loadMessage);}
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
            errorStack.addError(msg,    LoggerClass.pretty(LoggerClass.getCallerLocation().reverse()));
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
            errorStack.addError(msg,    LoggerClass.pretty(LoggerClass.getCallerLocation().reverse()));
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
  /**
   * Récupère la valeur associée à l'event (champ `value`) après traduction.
   * @param {Object} event
   * @param {Object} gameData
   * @returns {*|undefined}
   */
  static getEventActionValue(event, gameData, params) {
    if (event["event"]["value"]) {
      return Parser.translateInnerExpression(
        event["event"]["value"],
        gameData,
        params,
      );
    }
  }
  /**
   * Évalue la condition d'itération d'une boucle (`event.event.condition`).
   * Retourne true si pas de condition définie.
   * @param {Object} event
   * @param {Object} gameData
   * @param {Object} [params]
   * @returns {boolean}
   */
  static getboucleCondition(event, gameData, params) {
    if (event["event"]["condition"]) {
      return Parser.translateInnerExpression(
        event["event"]["condition"],
        gameData,
        { ...params, log: true },
      );
    } else return true;
  }

  /**
   * Retourne le nom de l'action définie dans l'event (champ `action`).
   * @param {Object} event
   * @param {Object} gameData
   * @returns {string|undefined}
   */
  static getAction(event, gameData) {
    if (event["event"]["action"]) {
      return event["event"]["action"];
    }
  }

  /**
   * Retourne l'objet `give` de l'event ou null si aucun élément à donner.
   * @param {Object} event
   * @param {Object} gameData
   * @returns {Object|null}
   */
  static getGiveElements(event, gameData) {
    if (event && event.event && event.event.give) {
      const giveObject = event.event.give;
      if (Object.keys(giveObject).length === 0) {
        return null;
      }
      for (let key of Object.keys(giveObject)) {
        if (!TypeManager.isDefined(giveObject[key]) || giveObject[key] == 0) {
          return null;
        }
      }
      return giveObject;
    }
    return null;
  }

  /**
   * Retourne la propriété `value` de l'event si présente.
   * @param {Object} eventObj - L'objet complet contenant la clé 'event'
   * @returns {*|undefined}
   */
  static getValue(eventObj) {
    // On vérifie si eventObj existe, puis si la clé event existe, puis si value existe
    return eventObj?.event?.value;
  }

  /**
   * Applique un event de type `withValue` en résolvant les paramètres courts
   * puis en recherchant l'event complet correspondant et en l'exécutant.
   * @param {Object} shortWithValueEvent - forme courte contenant `id` et clés de params
   * @param {Socket} socket
   * @param {Object} gameData
   * @param {Object} params
   * @returns {null|void}
   */
  static applyWithValueEvent(shortWithValueEvent, socket, gameData, params) {
    if (!shortWithValueEvent) {
      new AppError(socket, "shortWithValueEvent must be provided");
      eventLogger.warn("shortWithValueEvent must be provided");
      return null;
    }
    eventLogger.info("Apply WithValue Event ID: " + shortWithValueEvent.id);
    LoggerClass.objectToString(shortWithValueEvent);

    // Example of shortWithValueEvent{
    //  id: 2,
    //  inputNumber: "calc({currentPlayer#currentBet}+{insertedValue})",
    //},

    for (let key of Object.keys(shortWithValueEvent)) {
      if (key != "id" && key !="componentId") {
        let newParam = Parser.translateInnerExpression(
          shortWithValueEvent[key],
          gameData,
          { ...params },
        );
        if (!TypeManager.isDefined(newParam)) {
          new AppError(
            socket,
            "Cannot get value for key " +
              key +
              " with " +
              shortWithValueEvent[key],
          );
          LoggerClass.logFileLocalisation();
          eventLogger.warn(
            "Cannot get value for key " +
              key +
              " with " +
              shortWithValueEvent[key],
          );
          return null;
        }
        if (PlayerManager.isPlayerType(newParam, gameData)) {
          newParam = newParam.id;
        }
        params[key] = newParam;
      }
    }
    console.log("withValueEvent params :>> ", params);

    eventLogger.info("Search WithValue Event  ID: " + shortWithValueEvent.id);
    if (!gameData.roomInDb.events["withValueEvent"]) {
      const msg =
        "you data object must have with value array " + withValueEvent.id;
      eventLogger.error(msg);
      LoggerClass.logFileLocalisation();
      errorStack.addError(msg,    LoggerClass.pretty(LoggerClass.getCallerLocation().reverse()));

      return null;
    }

    let event = gameData.roomInDb.events["withValueEvent"].filter(
      (event) => event.id == shortWithValueEvent.id,
    )[0];
    if (!event) {
      const msg = "Event not found! ID=" + withValueEvent.id;
      actionLogger.error(msg);
      LoggerClass.logFileLocalisation();
      errorStack.addError(msg,    LoggerClass.pretty(LoggerClass.getCallerLocation().reverse()));
      return null;
    }

    console.log("params :>> ", params);

    Event.ExecuteEvent(event, socket, gameData, { ...params });
  }
}
