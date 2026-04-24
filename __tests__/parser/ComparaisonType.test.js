import ComparaisonType from "../../parser/ComparaisonType";

describe("ComparaisonType", () => {
  
 
describe("Array comparaison - Edge Cases", () => {
  it("should handle empty arrays", () => { 
    expect(ComparaisonType.resolveLogical([[], "contain", "A"])).toEqual(false);
    expect(ComparaisonType.resolveLogical([["A", "B"], "contain", "a"])).toEqual(false);
    expect(ComparaisonType.resolveLogical([["A", "B"], "contain", "A"])).toEqual(true);
    expect(ComparaisonType.resolveLogical([["Apple", "Banana"], "contain", "App"])).toEqual(false);
    expect(ComparaisonType.resolveLogical([["Apple", "Banana"], "contain", "Apple"])).toEqual(true);
  });

  it("should be verify if string comparaison in array", () => { 
    expect(ComparaisonType.resolveLogical(["aaAaaa", "contain", "A"])).toEqual(true);
    expect(ComparaisonType.resolveLogical(["aaaaaA", "contain", "A"])).toEqual(true);
    expect(ComparaisonType.resolveLogical(["tructruc", "contain", "truc"])).toEqual(true);
    expect(ComparaisonType.resolveLogical(["tructruc", "contain", "tructruc"])).toEqual(true);
    expect(ComparaisonType.resolveLogical(["tructruc", "contain", "main"])).toEqual(false);
    expect(ComparaisonType.resolveLogical(["tructruc", "notContain", "main"])).toEqual(true);
    expect(ComparaisonType.resolveLogical(["tructruc", "notContain", "tructruc"])).toEqual(false);
    expect(ComparaisonType.resolveLogical([["Fire"], "isEqualString", "Fire"])).toEqual(false); 
    expect(ComparaisonType.resolveLogical([" ", "isEqualString", ""])).toEqual(false);
    expect(ComparaisonType.resolveLogical(["", "isEqualString", ""])).toEqual(true);
  });

  it("should handle partial matches", () => { 

    expect(ComparaisonType.resolveLogical([[], "notContain", "A"])).toEqual(true);
    expect(ComparaisonType.resolveLogical([["A"], "notContain", "A"])).toEqual(false);
  });

  it("should verify uncoherent expression", () => {

    expect(ComparaisonType.resolveLogical([125, "isNotEqualNumber", "a"])).toEqual(false);
    expect(ComparaisonType.resolveLogical(["aa", "isInferiorOrEqual", "LL"])).toEqual(false);

  }) 
  it("should handle weird player comparisons", () => {
    // Comparer un ID de joueur avec un objet vide ou un type erroné

    expect(ComparaisonType.resolveLogical([{ name: "Pikachu" }, "isEqualString", "Pikachu"])).toEqual(false);
    expect(ComparaisonType.resolveLogical(["player123", "samePlayer", { id: "player123" }])).toEqual(false);
    expect(ComparaisonType.resolveLogical([null, "differentPlayer", "player456"])).toEqual(false);
    expect(ComparaisonType.resolveLogical([NaN, "isEqualNumber", NaN])).toEqual(false); // En JS, NaN !== NaN
    expect(ComparaisonType.resolveLogical([123, "samePlayer", "123"])).toEqual(false);
    expect(ComparaisonType.resolveLogical(["notAnArray", "contain", "item"])).toEqual(false);
    expect(ComparaisonType.resolveLogical([[1, 2, 3], "contain", { id: 1 }])).toEqual(false);
    expect(ComparaisonType.resolveLogical([null, "notContain", "any"])).toEqual(false);
    expect(ComparaisonType.resolveLogical([125, "isEqualNumber", "pokemon"])).toEqual(false);
    expect(ComparaisonType.resolveLogical(["ash", "isInferiorNumber", 10])).toEqual(false);
    expect(ComparaisonType.resolveLogical([null, "isSuperiorNumber", 5])).toEqual(false);
    expect(ComparaisonType.resolveLogical([undefined, "isNotEqualNumber", undefined])).toEqual(false);
    expect(ComparaisonType.resolveLogical([true, "isEqualNumber", 1])).toEqual(false);
    expect(ComparaisonType.resolveLogical([false, "isInferiorOrEqual", 0])).toEqual(false);
  });
  it("should return false for non-existent or misspelled comparators", () => {
    expect(ComparaisonType.resolveLogical([10, "isTheBestTrainer", 10])).toEqual(false);
    expect(ComparaisonType.resolveLogical(["A", "isEqualSring", "A"])).toEqual(false); // Typo intentionnelle
  });
});

  
});