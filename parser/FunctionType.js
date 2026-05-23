import TypeInterface from "./TypeInterface.js";
import Parser from "./parser.js";
import Conditions from "../core/engine/Evaluator.js";
import PlayerManager from "../core/services/PlayerManager.js";
import { LoggerClass } from "../core/logger/logger.js";
import { TypeManager } from "../core/services/helper/TypeManager.js";

export default class FunctionType extends TypeInterface {
  static removeTag(exp) {
    if (!exp || typeof exp !== "string") {
      return "";
    }
    if (exp.startsWith("getPlayer(")) {
      return exp.substring(10, exp.length - 1);
    }
    if (exp.startsWith("len(")) {
      return exp.substring(4, exp.length - 1);
    }
    if (exp.startsWith("not(")) {
      return exp.substring(4, exp.length - 1);
    }
    if (exp.startsWith("exist(")) {
      return exp.substring(6, exp.length - 1);
    }
    return exp;
  }

  static splitLogical(str, gameData, params) {
    let currentDetail = null;
    if (params.conditionDetailsForTest) {
      currentDetail = params.conditionDetailsForTest;
      currentDetail.operator = "";
      currentDetail.left = {};
    }
    if (params.fileLogger) {
      params.fileLogger.log(
        Parser.getDepthIndentation(params.depth) +
          `FunctionType.splitLogical called with expression: ${str}`,
      );
    }

    if (str.startsWith("getPlayer(")) {
      // enlever le tag apres avoir verifier dans quel if renvoyer l'expression, ne pas fusionner avec les autres
      str = FunctionType.removeTag(str);
      if (currentDetail) {
        currentDetail.operator = "getPlayer";
        currentDetail.left = {};
      }
      let value = Parser.translateInnerExpression(str, gameData, {
        conditionDetailsForTest: currentDetail ? currentDetail.left : null,
        ...params,
        depth: params.depth + 10,
      });
      // LOG DETAIL FOR TEST

      if (params.fileLogger) {
        params.fileLogger.log(
          Parser.getDepthIndentation(params.depth) +
            `Action is Get Player with value : ${value}   `,
        );
      }
      let player = PlayerManager.getPlayer(gameData, value);
      if (params.fileLogger) {
        params.fileLogger.log(
          Parser.getDepthIndentation(params.depth) +
            `FunctionType result: ${LoggerClass.pretty(player)}`,
        );
      }
      if (currentDetail) {
        currentDetail.result = player ? player.pseudo : null;
      }
      return player;
    }
    if (str.startsWith("len(")) {
      // enlever le tag apres avoir verifier dans quel if renvoyer l'expression, ne pas fusionner avec les autres
      str = FunctionType.removeTag(str);
      // LOG DETAIL FOR TEST
      if (currentDetail) {
        currentDetail.operator = "len";
        currentDetail.left = {};
      }
      let value = Parser.translateInnerExpression(str, gameData, {
        ...params,
        conditionDetailsForTest: currentDetail ? currentDetail.left : null,
        depth: params.depth + 10,
      });

      if (params.fileLogger) {
        params.fileLogger.log(
          Parser.getDepthIndentation(params.depth) +
            `Action is len() with value : ${value}   `,
        );
      }
      let result = 0;
      if (typeof value === "string" || Array.isArray(value)) {
        result = value.length;
      }
      if (params.conditionDetailsForTest) {
        params.conditionDetailsForTest.result = result;
      }
      if (params.fileLogger) {
        params.fileLogger.log(
          Parser.getDepthIndentation(params.depth) +
            `FunctionType result: ${result}`,
        );
      }
      return result;
    }
    if (str.startsWith("not(")) {
      // enlever le tag apres avoir verifier dans quel if renvoyer l'expression, ne pas fusionner avec les autres
      str = FunctionType.removeTag(str);
      // LOG DETAIL FOR TEST
      if (currentDetail) {
        currentDetail.operator = "not";
        currentDetail.left = {};
      }
      let value = Parser.translateInnerExpression(str, gameData, {
        ...params,
        conditionDetailsForTest: currentDetail ? currentDetail.left : null,
        depth: params.depth + 10,
      });

      if (params.fileLogger) {
        params.fileLogger.log(
          Parser.getDepthIndentation(params.depth) +
            `Action is not() with value : ${value}   `,
        );
      }
      let result = null;
      if (TypeManager.getType(value) === "boolean") {
        result = !value;
      }
      if (params.conditionDetailsForTest) {
        params.conditionDetailsForTest.result = result;
      }
      if (params.fileLogger) {
        params.fileLogger.log(
          Parser.getDepthIndentation(params.depth) +
            `FunctionType result: ${result}`,
        );
      }
      return result;
    }
    if (str.startsWith("exist(")) {
      // enlever le tag apres avoir verifier dans quel if renvoyer l'expression, ne pas fusionner avec les autres
      str = FunctionType.removeTag(str);
      // LOG DETAIL FOR TEST
      if (currentDetail) {
        currentDetail.operator = "exist";
        currentDetail.left = {};
      }
      let value = Parser.translateInnerExpression(str, gameData, {
        ...params,
        conditionDetailsForTest: currentDetail ? currentDetail.left : null,
        depth: params.depth + 10,
      });

      if (params.fileLogger) {
        params.fileLogger.log(
          Parser.getDepthIndentation(params.depth) +
            `Action is exist() with value : ${value}   `,
        );
      }
      let result = null;
      if (TypeManager.isDefined(value)) {
        result = true;
      } else {
        result = false;
      }
      // LOG DETAIL FOR TEST
   
      if (params.fileLogger) {
        params.fileLogger.log(
          Parser.getDepthIndentation(params.depth) +
            `FunctionType result: ${result}`,
        );
      }
      if (currentDetail) {
        currentDetail.result = result;
      }
      return result;
    }
    return null;
  }
  static applyLogical(str, gameData, params) {
    if (params.fileLogger) {
      params.fileLogger.log(
        Parser.getDepthIndentation(params.depth) +
          `FunctionType.applyLogical called with expression: ${str}`,
      );
    }
    if (str === "allPlayersHasPlayed/endOfTour") {
      let result = Conditions.verifyIsAllPlayerHasPlayed(gameData);
      if (params.fileLogger) {
        params.fileLogger.log(
          Parser.getDepthIndentation(params.depth) +
            `FunctionType result: ${result}`,
        );
      }
      return result;
    }
    const specialEvents = ["onChangeTour", "startOfGame", "eachStartOfManche"];
    if (specialEvents.includes(str)) {
      if (
        specialEvents.includes(params.eventEmited) &&
        params.eventEmited === str
      ) {
        if (params.fileLogger) {
          params.fileLogger.log(
            Parser.getDepthIndentation(params.depth) +
              `Action event matched emitted event: ${params.eventEmited}`,
          );
          params.fileLogger.log(
            Parser.getDepthIndentation(params.depth) +
              `FunctionType result: true`,
          );
        }
        return true;
      }

      // return false because this events are loaded by actions emit event
      return false;
    }
    return str;
  }
}
