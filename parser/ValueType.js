import TypeInterface from "./TypeInterface.js";
 import Parser from "./parser.js";

export default class ValueType extends TypeInterface{

    static removeTag(exp){
        return exp.substring(2, exp.length - 2)
    }

    /**
     * Execute logical separation for Expressions
     * @param  {String} str The full expression
     * return : [leftSide,["&&" | "||"], rightSide]
     * @param {Object} gameData detail of all game
     * @param params
     */
    static splitLogical(str,gameData,params) {
        let result = this.removeTag(str);
        if (params.fileLogger) {
            params.fileLogger.log(Parser.getDepthIndentation(params.depth) +
                `ValueType.splitLogical called with expression: ${str}`
            );
            params.fileLogger.log(Parser.getDepthIndentation(params.depth) +`ValueType result: ${result}`);
        }
        return result
    }
        
  

}
