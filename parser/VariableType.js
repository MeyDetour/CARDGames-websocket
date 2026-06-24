import { Logger, LoggerClass } from "../core/logger/logger.js";
import { errorStack } from "../core/error/ErrorStack.js";
import PlayerManager from "../core/services/PlayerManager.js";
import { TypeManager } from "../core/services/helper/TypeManager.js";
import TypeInterface from "./TypeInterface.js";
import Parser from "./parser.js";
const variableLogger = Logger("variableType");
export default class VariableType extends TypeInterface {
  static removeTag(exp) {
    if (!exp || typeof exp !== "string") {
      return "";
    }
    return exp.substring(1, exp.length - 1);
  }

  /**
   * Execute logical separation for access variable  ex currentPlayer#gain#1
   * @param  {String} str The full expression variable
   * @param {Object} gameData detail of all game
   * return : value
   * @param params
   */
  static splitLogical(str, gameData, params) {
    if (!params) {
      params = {};
    }
    // stop propagation because with call parsing and we dont want to have
    // just topDiscardCard form str "{topDiscardCard#color}" but we want
    // to have all the string to be able to parse it in the right order
    // if we dont reset, params.conditionDetailsForTest will be transfered
    // into other parsings
    // we copy local params because if we remove directly params.conditionDetailsForTest
    // this will be applied for splitLogical
    const localParams = { ...params };
    localParams.conditionDetailsForTest = null;
    if (params && params.fileLogger) {
      params.fileLogger.log(
        Parser.getDepthIndentation(params.depth) +
          `VariableType.splitLogical called with expression: ${str}`,
      );
    }
    let result = this.splitLogicalList(
      this.getListSplited(str, gameData, localParams),
      gameData,
      localParams,
    );
    if (params.conditionDetailsForTest) {
      params.conditionDetailsForTest.result = result;
    }
    return result;
  }
  static getListSplited(str, gameData, params) {
    if (!params) {
      params = {};
    }

    if (!TypeManager.isDefined(str)) {
      variableLogger.error(
        "VariableType.getListSplited called with undefined str",
      );
      return [];
    }
    // If an array of expressions is passed (e.g. from: ["{playerBoucle#currentBet}"])
    // use the first element. Guard against non-string values to avoid calling
    // string methods on arrays/objects.
    if (Array.isArray(str)) {
      if (str.length === 0) return [];
      str = str[0];
    }
    // If str is not a string at this point, coerce to string to avoid
    // substring/type errors later and allow downstream parsing to report
    // more meaningful errors.
    if (typeof str !== "string") {
      try {
        str = String(str);
      } catch (e) {
        variableLogger.error(
          "VariableType.getListSplited received non-string value",
        );
        return [];
      }
    }

    str = VariableType.removeTag(str);
    let depth = 0;
    let list = [];
    let current = "";
    // for {card#comp({currentCard#type};isEqualString;french_standard)}
    let currentCardForParams = null;

    for (let i = 0; i < str.length; i++) {
      const c = str[i];

      if (c === "{") depth++;
      if (c === "}") depth--;

      // On ne split que si profondeur 0 → opérateurs logiques externes
      if (depth === 0 && c === "#") {
        // left expression
        if (current === "currentCard") {
          let currentCard = Parser.translateInnerExpression(
            current.trim(),
            gameData,
            { ...params, depth: params.depth + 10 },
          );
          list.push(currentCard);
          currentCardForParams = currentCard;
        }
        if (current !== "currentCard" && currentCardForParams === null) {
          list.push(
            Parser.translateInnerExpression(current.trim(), gameData, {
              ...params,
              depth: params.depth + 10,
            }),
          );
        }
        if (current !== "currentCard" && currentCardForParams != null) {
          list.push(
            Parser.translateInnerExpression(current.trim(), gameData, {
              ...params,
              currentCard: currentCardForParams,
              depth: params.depth + 10,
            }),
          );
        }
        current = "";
        continue;
      }

      current += c;
    }
    // right side of
    if (current) {
      list.push(current);
    }
    return list;
  }

  static splitLogicalList(list, gameData, params) {
    if (params && params.fileLogger) {
      params.fileLogger.log(
        Parser.getDepthIndentation(params.depth) +
          "Split logical list for : " +
          JSON.stringify(list),
      );
    }
    if (!params) {
      params = {};
    }
    let value = null;
    if (!Array.isArray(list)) return null;
    if (!TypeManager.isDefined(list[0])) return null;
    for (let i = 0; i < list.length; i++) {
      let elt = list[i];

      if (params && params.fileLogger) {
        params.fileLogger.log(
          Parser.getDepthIndentation(params.depth) +
            `VariableType.splitLogicalList processing element: ${elt}`,
        );
        params.fileLogger.log(
          Parser.getDepthIndentation(params.depth) + `Current value: ${value}`,
        );
      }

      if (!TypeManager.isDefined(value)) {
        //if str = [{playerObject},gain,1]
        if (typeof elt === "object") {
          value = elt;
        } else if (elt === "startPlayer") {
          value = PlayerManager.getStartPlayer(gameData);
        } else if (elt === "previousPlayer") {

          let currentPlayer = PlayerManager.getPlayerWithId(gameData, params.currentPlayer);
          value = PlayerManager.getPreviousPlayer(gameData, currentPlayer.position);
        } else if (elt === "allPlayersInGame") {
          value = gameData.data.players;
        } else if (elt === "topDiscardCard") {
          if (
            !gameData.data.discardDeck ||
            gameData.data.discardDeck.value.length === 0
          ) {
            return null;
          }
          let cardId =
            gameData.data.discardDeck.value[
              gameData.data.discardDeck.value.length - 1
            ];
          let card = gameData.data.cards[cardId];
          // si cet element n'est pas le dernier de la liste
          // alors on va chercher les attributs de la carte (ex : {topDiscardCard#color})
          if (card) {
            value = card;
          }
          if (i == 0 && list.length > 1 && card) {
            value = card.addedAttributs ?? {};
          }
        } else if (elt === "currentPlayer") {
          if (params.currentPlayer == null) {
            const msg = `Missing params.currentPlayer for access to 'currentPlayer' in VariableType.splitLogicalList (element=${elt})`;
            variableLogger.error(msg);
            LoggerClass.logFileLocalisation();
            try {
              errorStack.addError(
                msg,
                LoggerClass.pretty(LoggerClass.getCallerLocation().reverse()),
              );
            } catch (e) {}
            return null;
          }
          value = PlayerManager.getPlayerWithId(gameData, params.currentPlayer);
        } else if (elt === "selectedPlayer") {
          if (params.selectedPlayer == null) {
            const msg = `Missing params.selectedPlayer for access to 'selectedPlayer' in VariableType.splitLogicalList (element=${elt})`;
            variableLogger.error(msg);
            LoggerClass.logFileLocalisation();
            try {
              errorStack.addError(
                msg,
                LoggerClass.pretty(LoggerClass.getCallerLocation().reverse()),
              );
            } catch (e) {}
            return null;
          }
          value = PlayerManager.getPlayerWithId(
            gameData,
            params.selectedPlayer,
          );
        } else if (elt === "player") {
          if (params.player == null) {
            const msg = `Missing params.player for access to 'player' in VariableType.splitLogicalList (element=${elt})`;
            variableLogger.error(msg);
            LoggerClass.logFileLocalisation();
            try {
              errorStack.addError(
                msg,
                LoggerClass.pretty(LoggerClass.getCallerLocation().reverse()),
              );
            } catch (e) {}
            return null;
          }
          value = PlayerManager.getPlayerWithId(gameData, params.player);
        } else if (elt === "insertedValue") {
          if (params.insertedValue == null) {
            const msg = `Missing params.insertedValue for access to 'insertedValue' in VariableType.splitLogicalList (element=${elt})`;
            variableLogger.error(msg);
            LoggerClass.logFileLocalisation();
            try {
              errorStack.addError(
                msg,
                LoggerClass.pretty(LoggerClass.getCallerLocation().reverse()),
              );
            } catch (e) {}
            return null;
          }
          value = params.insertedValue;
        } else if (elt === "currentCard") {
          if (params.currentCard !== null) {
            value = params.currentCard;
          }
          if (params.currentCard === null) {
            const msg = `Missing params.currentCard when accessing 'currentCard' in VariableType (element=${elt})`;
            variableLogger.error(msg);
            LoggerClass.logFileLocalisation();
            try {
              errorStack.addError(
                msg,
                LoggerClass.pretty(LoggerClass.getCallerLocation().reverse()),
              );
            } catch (e) {}
          }
        } else if (elt === "playerCard") {
          if (params.playerCard !== null) {
            value = params.playerCard;
          }
          if (params.playerCard === null) {
            const msg = `Missing params.playerCard when accessing 'playerCard' in VariableType (element=${elt})`;
            variableLogger.error(msg);
            LoggerClass.logFileLocalisation();
            try {
              errorStack.addError(
                msg,
                LoggerClass.pretty(LoggerClass.getCallerLocation().reverse()),
              );
            } catch (e) {}
          }
        } else {
          value = TypeManager.isDefined(gameData.data[elt])
            ? gameData.data[elt]
            : null;

          if (params && params.fileLogger) {
            params.fileLogger.log(
              Parser.getDepthIndentation(params.depth) +
                `Accessed gameData property '${elt}': ${JSON.stringify(value)}`,
            );
          }

          if (
            TypeManager.isDefined(value) &&
            value.value != null &&
            params?.returnType !== "ref"
          ) {
            value = value.value;
          }
          if (
            TypeManager.isDefined(value) &&
            typeof value.value == "object" &&
            !Array.isArray(value.value) &&
            params?.returnType === "ref"
          ) {
            value = value.value;
          }

          if (!TypeManager.isDefined(value)) {
            value = params[elt];

            if (params && params.fileLogger) {
              params.fileLogger.log(
                Parser.getDepthIndentation(params.depth) +
                  `Accessed params property '${elt}': ${JSON.stringify(value)}`,
              );
            }

            if (!TypeManager.isDefined(value)) {
              const msg = `${elt} property is null in params and data in VariableType.splitLogicalList`;

              if (params && params.fileLogger) {
                params.fileLogger.error(msg);
              }
              value = null;
              variableLogger.error(msg);
              JSON.stringify(gameData.data);
              JSON.stringify(params);
              LoggerClass.logFileLocalisation();
              try {
                errorStack.addError(
                  msg + ` (elt=${elt})`,
                  LoggerClass.pretty(LoggerClass.getCallerLocation().reverse()),
                );
              } catch (e) {}
              return null;
            }
          }
        }
      } else {
        // EXecution une fois qu'on a trouv" la base
        value = value[elt];

        // erreur si ca n'existe pas
        if (!TypeManager.isDefined(value) ) {
          console.warn(
            elt +
              " property is null search :" +
              JSON.stringify(list) +
              " in " +
              JSON.stringify(value),
          );
          console.log(" call in :");
          console.log(
            LoggerClass.pretty(LoggerClass.getCallerLocation().reverse()),
          );
          value = null;
        }
       
        // si on a un objet avec "value", 
        // on prend la valeur sauf si on veut le ref
        if (
          TypeManager.isDefined(value) &&
          value.value != null &&
          params?.returnType !== "ref"
        ) {
          value = value.value;
        }
        // si on a un objet avec "value" et qu'on veut le ref, 
        // on prend l'objet
        if (
          TypeManager.isDefined(value) &&
          typeof value.value == "object" &&
          !Array.isArray(value.value) &&
          params?.returnType === "ref"
        ) {
          value = value.value;
        }
      }
    }

    if (params && params.fileLogger) {
      params.fileLogger.log(
        Parser.getDepthIndentation(params.depth) +
          `VariableType.splitLogicalList final value: ${typeof value}`,
      );
      params.fileLogger.log(
        Parser.getDepthIndentation(params.depth) + JSON.stringify(value),
      );
    }
    if (params.conditionDetailsForTest) {
      params.conditionDetailsForTest.result = value;
    }
    return value;
  }
}
