import ExpressionType from "./ExpressionType.js";
import ComparaisonType from "./ComparaisonType.js";
import FunctionType from "./FunctionType.js";
import VariableType from "./VariableType.js";
import CalculType from "./CalculType.js";
import { Logger, LoggerClass } from "../core/logger/logger.js";
import { errorStack } from "../core/error/ErrorStack.js";

import { TypeManager } from "../core/services/helper/TypeManager.js";
import ValueType from "./ValueType.js";
import FunctionFileLogger from "../core/logger/FunctionFileLogger.js";

export default class Parser {
  static getType(exp) {
    const specialEvents = ["onChangeTour", "startOfGame", "eachStartOfManche"];
    if (TypeManager.isBool(exp)) {
      return "bool";
    }
    if (TypeManager.getType(exp) === "number" && parseInt(exp)) {
      return "int";
    }
    if (typeof exp !== "string") {
      return exp;
    }
    if (exp.startsWith("exp(")) {
      return "expression";
    } else if (exp.startsWith("calc(")) {
      return "calcul";
    } else if (exp.startsWith("comp(")) {
      return "comparaison";
    } else if (exp.startsWith("{")) {
      return "variable";
    } else if (exp.startsWith("getPlayer(")) {
      return "function";
    } else if (exp.startsWith("<<")) {
      return "value";
    } else if (
      specialEvents.includes(exp) ||
      exp == "allPlayersHasPlayed/endOfTour"
    ) {
      return "calculatedValue";
    } else {
      return "str";
    }
  }

  /**
   * Execute logical separation for access variable  ex currentPlayer#gain#1
   * @param str
   * @param gameData
   * @param {Object} params detail of all game
   *              {
   *                  eventEmited : str -> evenement qui a été déclenché par le programm comme le début de tour etc,
   *                  returnType : str  ->  "ref" si besoin de la reference pour modification sinon il renvoie la valeur
   *                  currentPlayer : object -> player courant
   *                  insertedValue : int   -> value inserted by player for withValue event
   *                  key : value -> dynamic key value for withValue event
   *                 location : EventFileLogger -> logger for file location
   *                }
   * return : bool or elt
   */
  static translateInnerExpression(str, gameData, params = {}) {
    if (!gameData) {
      const msg = `missing gameData in translateInnerExpression for expression="${str}"`;
      parserLogger.error(msg);
      LoggerClass.logFileLocalisation();
      try {
        errorStack.addError(msg, LoggerClass.getFileLocalisation());
      } catch (e) {}
      return str;
    }
    if (!params) {
      params = {};
    }
    if (!TypeManager.isDefined(str)) {
      return null;
    }
    let type = Parser.getType(str, gameData);
    if (
      params.initialisation !== "true" &&
      process.env.PARSER_FILE_LOG === "true" &&
      type !== "str" &&
      type !== "int" &&
      type !== "bool"
    ) {
      const cFileLogger = FunctionFileLogger.create(str);
      if (!cFileLogger) {
        parserLogger.error(
          "FunctionFileLogger.create called with undefined condition :" + str,
        );
      }
      parserLogger.debug(
        `expression étudiée  ${str} :  ${cFileLogger.filepath}`,
      );

      cFileLogger.log("Parse call in :");
      cFileLogger.log(
        LoggerClass.pretty(LoggerClass.getCallerLocation().reverse()),
      );
      if (params.location && typeof params.location.log === "function") {
        params.location.log(
          `expression étudiée écuté in  ${cFileLogger.filepath}`,
        );
      }

      cFileLogger.log("gameData :>> " + typeof gameData);
      cFileLogger.log(
        "params :>> " +
          typeof params +
          " " +
          LoggerClass.getKeyOfObject(params),
      );
      params.initialisation = "true";
      params.fileLogger = cFileLogger;
      params.depth = 0;
    }

    if (!this.verifyExpressionSyntax(str)) {
      const msg = `Syntax error in expression: "${str}" — check braces/parentheses balance`;
      parserLogger.error(msg);
      LoggerClass.logFileLocalisation();
      try {
        errorStack.addError(msg, LoggerClass.getFileLocalisation());
      } catch (e) {}

      params.initialisation = "false";

      return null;
    }

    if (type === "expression") {
      if (params.fileLogger) {
        params.fileLogger.log(
          Parser.getDepthIndentation(params.depth) +
            "NEXT : Go to ExpressionType.splitLogical for " +
            str,
        );
      }

      let result = ExpressionType.splitLogical(str, gameData, params);
      if (params.depth === 0) {
        params.initialisation = "false";
      }
      return result;
    }
    if (type === "comparaison") {
      if (params.fileLogger) {
        params.fileLogger.log(
          Parser.getDepthIndentation(params.depth) +
            "NEXT : Go to ComparaisonType.splitLogical for " +
            str,
        );
      }

      let result = ComparaisonType.splitLogical(str, gameData, params);
      if (params.depth === 0) {
        params.initialisation = "false";
      }
      return result;
    }
    if (type === "calcul") {
      if (params.fileLogger) {
        params.fileLogger.log(
          Parser.getDepthIndentation(params.depth) +
            "NEXT : Go to CalculType.splitLogical for " +
            str,
        );
      }

      let result = CalculType.splitLogical(str, gameData, params);
      if (params.depth === 0) {
        params.initialisation = "false";
      }
      return result;
    }
    if (type === "function") {
      if (params.fileLogger) {
        params.fileLogger.log(
          Parser.getDepthIndentation(params.depth) +
            "NEXT : Go to FunctionType.splitLogical for " +
            str,
        );
      }

      let result = FunctionType.splitLogical(str, gameData, params);
      if (params.depth === 0) {
        params.initialisation = "false";
      }
      return result;
    }
    if (type === "variable") {
      if (params.fileLogger) {
        params.fileLogger.log(
          Parser.getDepthIndentation(params.depth) +
            "NEXT : Go to VariableType.splitLogical for " +
            str,
        );
      }
      let result = VariableType.splitLogical(str, gameData, params);
      if (params.depth === 0) {
        params.initialisation = "false";
      }
      return result;
    }
    if (type === "value") {
      if (params.fileLogger) {
        params.fileLogger.log(
          Parser.getDepthIndentation(params.depth) +
            "NEXT : Go to ValueType.splitLogical for " +
            str,
        );
      }
      let result = ValueType.splitLogical(str, gameData, params);
      if (params.depth === 0) {
        params.initialisation = "false";
      }
      return result;
    }
    if (type === "calculatedValue") {
      if (params.fileLogger) {
        params.fileLogger.log(
          Parser.getDepthIndentation(params.depth) +
            "NEXT : Go to FunctionType.splitLogical for " +
            str,
        );
      }
      let result = FunctionType.applyLogical(str, gameData, params);
      if (params.depth === 0) {
        params.initialisation = "false";
      }
      return result;
    }
    if (type === "int") {
      if (params.fileLogger) {
        params.fileLogger.log(
          Parser.getDepthIndentation(params.depth) +
            "NEXT : Do parseInt on " +
            str,
        );
      }
      if (params.depth === 0) {
        params.initialisation = "false";
      }

      return parseInt(str);
    }
    if (!TypeManager.isDefined(str)) {
      const msg = "str is undefined in parser ";
      eventLogger.error(msg);
      LoggerClass.logFileLocalisation();
      errorStack.addError(msg, LoggerClass.getFileLocalisation());

      return null;
    }

    return str;
  }

  static verifyExpressionSyntax(str) {
    let depth = 0;
    for (let i = 0; i < str.length; i++) {
      const c = str[i];

      if (c === "{") depth++;
      if (c === "(") depth++;
      if (c === "}") depth--;
      if (c === ")") depth--;
    }
    if (depth !== 0) {
      return false;
    }
    

    return true;
  }

  static getDepthIndentation(count) {
    return " ".repeat(count + 1);
  }
}

const parserLogger = Logger("parser");
