import TypeInterface from "./TypeInterface.js";
import Parser from "./parser.js";

export default class CalculType extends TypeInterface {
  static removeTag(exp) {
    return exp.substring(5, exp.length - 1);
  }

  /**
   * Execute logical separation for comparaison ex : a > b
   * @param  {String} str The full comparaison
   * return : [element to compare (a) ,text comparaison(>), comparaison value(b)]
   * @param {Object } gameData detail of all game
   */
  static splitLogical(str, gameData, params) {
    str = CalculType.removeTag(str);
    let comparators = ["+", "*", "-"];
    let string = "";
    let finalList = [];
    for (let i = 0; i < str.length; i++) {
      if (comparators.includes(str[i])) {
        finalList.push(string);
        finalList.push(str[i]);
        string = "";
        continue;
      }
      string += str[i];
    }
    if (string !== "") {
      finalList.push(string);
    }
    if (params.fileLogger) {
      params.fileLogger.log(Parser.getDepthIndentation(params.depth) + 
        `CalculType.splitLogical called with expression: ${str}`
      );
      params.fileLogger.log(Parser.getDepthIndentation(params.depth) + `Split into parts: ${finalList}`);
    }
    finalList[0] = Parser.translateInnerExpression(
      finalList[0],
      gameData,
      {...params, depth : params.depth+10}
    );

    finalList[2] = Parser.translateInnerExpression(
      finalList[2],
      gameData,
      {...params, depth : params.depth+10}
    );
    if (params.fileLogger) {
      params.fileLogger.log(Parser.getDepthIndentation(params.depth) + `After translation: ${finalList}`);
    }

    let result =  CalculType.resolveLogical(finalList);
    if (params.fileLogger) {
      params.fileLogger.log(Parser.getDepthIndentation(params.depth) + `CalculType result: ${result}`);
    }
    return result;
  }

  /**
   *  Resolve calcul like 1-1
   * @param  {List} list list of instructions like ["1","+","2"]
   * return : int
   */
  static resolveLogical(list) {
    let comparateur = list[1];
    let a = parseInt(list[0]);
    let b = parseInt(list[2]);
    if (comparateur === "-") return a - b;
    if (comparateur === "+") return a + b;
    if (comparateur === "*") return a * b;
  }
}
