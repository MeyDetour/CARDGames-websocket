export class ConformiteManager {
  /**
   * Vérifie si les propriétés de premier niveau d'un objet correspondent aux types attendus.
   * @param {Object} roomData - L'objet JSON à vérifier (ton instance de jeu).
   * @returns {boolean} - true si conforme, lance une erreur sinon.
   */
  static verifyRoomData(roomData) {
    const schema = {
      id: "number",
      name: "string",
      isPublic: "boolean",
      description: "string|null",
      averageNotes: "number",
      notes: "object", // Array
      playerCount: "number",
      gameCount: "number",
      types: "string",
      editionHistory: [],
      globalValue: "object",
      playerGlobalValue: "object",
      params: "object",
      events: "object",
      assets: "object",
    };
    this.verifyPrensenceOfRequiredKeys(
      roomData,
      Object.keys(schema),
      "roomData",
    );
    this.compareObject(roomData, schema);
    this.verifyParams(roomData.params);
    this.verifyDemon(roomData.events.demons);
    this.verifyEvent(roomData.events.events);
    this.verifyEvent(roomData.events.withValueEvent);
    this.verifyEditionHistory(roomData.editionHistory);
    this.verifyGlobalValueOfPlayer(roomData.globalValueOfPlayer);
    this.verifyGlobalValue(roomData.globalValue);

    console.log("✅ Conformité du premier plan validée.");
    return true;
  }

  static verifyEditionHistory(editionHistory) {
    let schema = {
      id: "number",
      evenement: "string",
      action: "string",
      date_relative: "string",
    };
    for (let e of editionHistory) {
      this.compareObject(e, schema);
    }
  }
  static verifyGlobalValue(globalValue) {
    for (let key in Object.keys(globalValue)) {
      this.verifyPrensenceOfRequiredKeys(
        globalValue[key],
        ["value", "type"],
        "globalValue." + key,
      );
    }
  }
  static verifyGlobalValueOfPlayer(globalValueOfPlayer) {
    for (let key in Object.keys(globalValueOfPlayer)) {
      this.verifyPrensenceOfRequiredKeys(
        globalValueOfPlayer[key],
        ["value", "type"],
        "globalValueOfPlayer." + key,
      );
    }
  }
  static verifyParams(params) {
    this.verifyPrensenceOfRequiredKeys(
      params,
      ["globalGame", "rendering", "tours", "manches", "cards", "gain", "roles"],
      "params",
    );

    if (params.globalGame) {
      this.compareObject(params.globalGame, {
        jeuSolo: "boolean",
        playersCanJoin: "boolean",
        minPlayer: "number",
        maxPlayer: "number",
      });
    }
    if (params.rendering) {
      this.compareObject(params.rendering, {
        menu: "object",
        game: "object",
      });
      if (params.rendering.menu) {
        this.compareObject(params.rendering.menu, {
          template: "number",
          backgroundImage: "string|null",
        });
      }
      if (params.rendering.game) {
        this.compareObject(params.rendering.game, {
          template: "number",
          backgroundImage: "string|null",
          displayHandDeck: "boolean",
          displayCountAdversaryHandDeck: "boolean",
          displayStatistics: "boolean",
          displayHistory: "boolean",
          displayTimer: "boolean",
          displayChat: "boolean",
        });
      }
    }
    if (params.tours) {
      this.compareObject(params.tours, {
        activation: "boolean",
        sens: "string",
        startNumber: "number",
        timerActivation: "boolean",
        duration: "number",
        maxTour: "number",
        actionOnlyAtPlayerTour: "boolean",
        endOfTour: "object", // Array
        actions: "object", // Array
      });
      if (params.tours.actions) {
        this.compareObject(params.tours.actions, {
          id: "number",
          name: "string",
          condition: "object|null",
          appearAtPlayerTurn: "boolean",
          withValue: "object",
        });
      }
    }
    if (params.manches) {
      this.compareObject(params.manches, {
        max: "number|null",
        sens: "string",
        startNumber: "number",
      });
    }
    if (params.cards) {
      this.compareObject(params.cards, {
        activeHandDeck: "boolean",
        activPersonalHandDeck: "boolean",
        activPersonalHandDiscard: "boolean",
        activeDiscardDeck: "boolean",
        activeCardAsGain: "boolean",
        cardBoard: "object",
      });
    }
    if (params.gain) {
      this.compareObject(params.gain, {
        activation: "boolean",
        groupPot: "boolean",
      });
    }
    if (params.roles) {
      this.compareObject(params.roles, {
        activation: "boolean",
      });
    }
  }
  static verifyDemon(demons) {
    for (let e of demons) {
      this.compareObject(e, {
        id: "number",
        name: "string",
        condition: "string",
        events: "object", // Array
      });
    }
  }
  static verifyEvent(events) {
    for (let e of events) {
      this.compareObject(e, {
        id: "number",
        name: "string",
        condition: "string",
        boucle: "string",
        event: "object", // Array
      });
    }
  }

  static verifyPrensenceOfRequiredKeys(obj, requiredKeys, path = "") {
    for (let key of requiredKeys) {
      if (!(key in obj)) {
        console.warn(
          `Clé manquante : La clé "${key}" est requise mais absente. ${path ? "Chemin : " + path : ""}`,
        );
      }
    }
  }

  static compareElementType(key, value, expectedType) {
    const actualType = typeof value;
    const allowedTypes = expectedType.split("|");
    const isValid = allowedTypes.some((type) => {
      if (type === "null") return value === null;
      return actualType === type;
    });
    return isValid;
  }
  static compareObject(obj, expect, params = {}) {
    for (const [key, expectedType] of Object.entries(schema)) {
      if (!this.compareElementType(key, obj[key], expectedType)) {
        console.warn(
          `Erreur de conformité : La propriété "${key}" est de type "${typeof obj[key]}" (${obj[key]}), mais un type "${expectedType}" est attendu.`,
        );
      }
    }
  }
}

// Singleton naturel
export const conformiteManager = new ConformiteManager();
