import Identificator from "./Identificator.js";

class RoomIdentificator  extends  Identificator{
    constructor() {
        super();
    }

    #generateId() {
        return Math.random().toString(36).substring(2, 8); // ex: "a9f3x1"
    }
    #isExistingId(id) {
        return this.rooms.has(id)
    }

    #generateRoomId() {
        let roomID = this.#generateId()
        while (this.#isExistingId(roomID)) {
            roomID = this.#generateId()
        }
        return roomID
    }

     setId(room) {
        let id = this.#generateRoomId()
        this.ids.set(id,room);
        return id
    }
     get(id) {
        return this.ids.get(id)
    }


}
export  const  roomIdentificator = new RoomIdentificator();
