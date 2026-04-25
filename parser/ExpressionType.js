import TypeInterface from "./TypeInterface.js";
import Parser from "./parser.js";

export default class ExpressionType extends TypeInterface {
  static removeTag(exp) {
      if (!exp || typeof exp !== "string") {
        return "";
      }
    return exp.substring(4, exp.length - 1);
  }

  /**
   * Execute logical separation for Expressions
   * @param  {String} str The full expression
   * return : [leftSide,["&&" | "||"], rightSide]
   * @param {Object} gameData detail of all game
   * @param params
   */
  static splitLogical(str, gameData, params) {
    str = ExpressionType.removeTag(str);

    let depth = 0;
    let parts = [];
    let current = "";

    for (let i = 0; i < str.length; i++) {
      const c = str[i];
      const next = str[i + 1];

      if (c === "(") depth++;
      if (c === ")") depth--;

      // On ne split que si profondeur 0 → opérateurs logiques externes
      if (
        depth === 0 &&
        ((c === "|" && next === "|") || (c === "&" && next === "&"))
      ) {
        // left expression
        if(params.fileLogger){
          params.fileLogger.log( Parser.getDepthIndentation(params.depth) + "Get first part "+current.trim() + " and analyse...")
        }
        parts.push(
          Parser.translateInnerExpression(current.trim(), gameData, {...params, depth : params.depth+10})
        );
        parts.push(c + c);
        current = "";
        i++; // skip the second |
        continue;
      }

      current += c;
    }

    // right side of
    if (current) {
       if(params.fileLogger){
          params.fileLogger.log(Parser.getDepthIndentation(params.depth) +  "Get seconde part "+current.trim() + " and analyse...")
        }
      parts.push(
        Parser.translateInnerExpression(current.trim(), gameData, {...params, depth : params.depth+10})
      );
    }
    if (parts.length === 1) return parts[0];
    if (params.fileLogger) {
      params.fileLogger.log(Parser.getDepthIndentation(params.depth) + 
        `ExpressionType.splitLogical called with expression: ${str}`
      );
      params.fileLogger.log(Parser.getDepthIndentation(params.depth) + `Split into parts: ${parts}`);
    }
    let result = ExpressionType.resolveLogical(parts);
    if (params.fileLogger) {
      params.fileLogger.log(Parser.getDepthIndentation(params.depth) + `ExpressionType result: ${result}`);
    }
    return result; 
  }
  
  /**
   *  Resolve  expression like a || b
   * @param  {List} list list of expression like ["false","&&","false"]
   * return : bool
   */
  static resolveLogical(list) {
    let comparateur = list[1];
    let a = list[0];
    let b = list[2];
    if (typeof a == "boolean" && typeof b == "boolean") {
      if (comparateur === "&&") return a && b;
      if (comparateur === "||") return a || b;
    } else {
      console.warn(a + " et " + b + " ne sont pas des booleans");
    }
  }
}
