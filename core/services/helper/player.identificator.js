import Identificator from "./Identificator.js";

export default class PlayerIdentificator  extends  Identificator{
    constructor() {
        super();
    }

    #generateId() {
        return Math.random().toString(36).substring(2, 8); // ex: "a9f3x1"
    }

    static getId() {
        return Math.random().toString(36).substring(2, 8); // ex: "a9f3x1"
    }

    static setId() {
        return Math.random().toString(36).substring(2, 8); // ex: "a9f3x1"
    }

}
