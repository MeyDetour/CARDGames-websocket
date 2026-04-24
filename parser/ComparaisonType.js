import { Logger, LoggerClass } from "../core/logger/logger.js";
import { TypeManager } from "../core/services/helper/TypeManager.js";
import TypeInterface from "./TypeInterface.js";
import Parser from "./parser.js";
import { errorStack } from "../core/error/ErrorStack.js";
import PlayerManager from "../core/services/PlayerManager.js";

const comparatortypeLogger = Logger("comparaisonType");
export default class ComparaisonType extends TypeInterface {
  static removeTag(exp) {
    return exp.substring(5, exp.length - 1);
  }

  /**
   * Execute logical separation for comparaison ex : a > b
   * @param  {String} str The full comparaison
   * return : [element to compare (a) ,text comparaison(>), comparaison value(b)]
   * @param {Object}  gameData detail of all game
   * @param params
   */
  static splitLogical(str, gameData, params) {
    if (params.fileLogger) {
      params.fileLogger.log(
        Parser.getDepthIndentation(params.depth) +
          `ComparaisonType.splitLogical called with expression: ${str}`,
      );
    }
    str = ComparaisonType.removeTag(str);

    let depth = 0;
    let list = [];
    let current = "";

    for (let i = 0; i < str.length; i++) {
      const c = str[i];
      const next = str[i + 1];

      if (c === "(") depth++;
      if (c === ")") depth--;

      // On ne split que si profondeur 0 → opérateurs logiques externes
      if (depth === 0 && c === ";") {
        // left expression
        list.push(
          Parser.translateInnerExpression(current.trim(), gameData, {
            ...params,
            depth: params.depth + 10,
          }),
        );
        current = "";
        continue;
      }

      current += c;
    }

    // right side of
    if (current) {
      list.push(
        Parser.translateInnerExpression(current.trim(), gameData, {
          ...params,
          depth: params.depth + 10,
        }),
      );
    }
    if (params.fileLogger) {
      params.fileLogger.log(
        Parser.getDepthIndentation(params.depth) +
          `Split into parts: ${structuredClone(list)}`,
      );
    }

    list[0] = Parser.translateInnerExpression(list[0], gameData, {
      ...params,
      depth: params.depth + 10,
    });
    list[2] = Parser.translateInnerExpression(list[2], gameData, {
      ...params,
      depth: params.depth + 10,
    });

    if (params.fileLogger) {
      params.fileLogger.log(
        Parser.getDepthIndentation(params.depth) + `After translation: ${list}`,
      );
    }
    let result = ComparaisonType.resolveLogical(list);
    if (params.fileLogger) {
      params.fileLogger.log(
        Parser.getDepthIndentation(params.depth) +
          `ComparaisonType result: ${result}`,
      );
    }
    return result;
  }

  /**
   *  Resolve comparaison like a < b
   * @param  {List} list list of instructions like ["1","inferior","2"]
   * return : bool
   */
  static resolveLogical(list) {
    const stringComparators = ["isEqualString"];
    const numberComparators = [
      "isEqualNumber",
      "isNotEqualNumber",
      "isInferiorOrEqual",
      "isSuperiorNumber",
      "isInferiorNumber",
      "isSuperiorOrEqual",
    ];
    const arrayComparators = ["notContain", "contain"];
    const comparators = ["differentPlayer", "samePlayer"];
    let a = list[0];
    let b = list[2];
    if (!TypeManager.isDefined(a) || !TypeManager.isDefined(b)) {
      const msg = `A et B are not found in Comparaison Type got: a=${a} b=${b}`;
      comparatortypeLogger.error(msg);
      LoggerClass.logFileLocalisation();
      errorStack.addError(msg, LoggerClass.logFileLocalisation());
      return false;
    }

    let comparateur = list[1];
    if (stringComparators.includes(comparateur)) {
      if (comparateur === "isEqualString") return a === b;
    }
    if (numberComparators.includes(comparateur)) { 
      let a = parseInt(list[0]);
      let b = parseInt(list[2]);
      if (isNaN(a) || isNaN(b)) {
        return false;
      }
      if (comparateur === "isEqualNumber") return a === b;
      if (comparateur === "isNotEqualNumber") return a !== b;
      if (comparateur === "isInferiorOrEqual") return a <= b;
      if (comparateur === "isSuperiorOrEqual") return a >= b;
      if (comparateur === "isSuperiorNumber") return a > b;
      if (comparateur === "isInferiorNumber") return a < b;
    }

    if (arrayComparators.includes(comparateur)) {
      if (
        comparateur === "contain" &&
        (Array.isArray(a) || typeof a === "string")
      )
        return a.includes(b);
      if (
        comparateur === "notContain" &&
        (Array.isArray(a) || typeof a === "string")
      )
        return !a.includes(b);
    }
    if (comparators.includes(comparateur)) {
      let playerA = list[0];
      let playerB = list[2];
      if (
        comparateur === "differentPlayer" &&
        PlayerManager.isPlayerType(playerA) &&
        PlayerManager.isPlayerType(playerB)
      ) {
        return playerA.id !== playerB.id;
      }
      if (
        comparateur === "samePlayer" &&
        PlayerManager.isPlayerType(playerA) &&
        PlayerManager.isPlayerType(playerB)
      ) {
        return playerA.id === playerB.id;
      }
    }
    return false;
  }
}
