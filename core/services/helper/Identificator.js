export default class Identificator {

    constructor() {
        this.ids = new Map()
    }

    static generateId() {
        return Math.random().toString(36).substring(2, 8); // ex: "a9f3x1"
    }

    static getId() {
        return Math.random().toString(36).substring(2, 8); // ex: "a9f3x1"
    }

    static setId() {
        return Math.random().toString(36).substring(2, 8); // ex: "a9f3x1"
    }

}
