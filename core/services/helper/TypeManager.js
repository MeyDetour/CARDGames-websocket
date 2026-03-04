import { Logger, LoggerClass } from "../../logger/logger.js"; 
import { errorStack } from "../../error/ErrorStack.js";

export class TypeManager {
  static isBool(str) {
    if (typeof str === "boolean") return true;
    if( str === "true" || str === "false")  return true;
    return false;
  }
  static strToBool(str) {
    if (typeof str == "boolean") return str;
    if (str === "true") return true;

    return false;
  }

  static isSameType(type1, type2) {
    return type1 == type2;
  }

  static isDefined(elt) {return elt !== null && elt !== undefined && !Number.isNaN(elt);  }
  static getType(elt) {

    if (Array.isArray(elt)) return "array";
    if (elt === 1 || elt === 0) return "number";
    if (parseInt(elt)) return "number";
    if (this.isBool(elt)) return "boolean";
    if (typeof elt === "object") return "object";
    if (typeof elt === "string") return "string";
    const msg = "Cannot get type of " + elt;
    typeManager.error(msg);
    LoggerClass.logFileLocalisation();
    try { errorStack.addError(msg, LoggerClass.getFileLocalisation()); } catch(e) {}
    return null;
  }
  static getFormatedType(elt) {
    switch (this.getType(elt)) {
      case "number":
        return parseInt(elt);
      case "boolean":
        return this.strToBool(elt);
      default:
        return elt;
    }
  }
}

const typeManager = Logger("TypeManager");
