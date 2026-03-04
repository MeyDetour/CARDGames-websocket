import ComparaisonType from "../../parser/ComparaisonType";

describe("ComparaisonType", () => {
  
 
describe("Array comparaison - Edge Cases", () => {
  it("should handle empty arrays", () => { 
    expect(ComparaisonType.resolveLogical([[], "contain", "A"])).toEqual(false);
    expect(ComparaisonType.resolveLogical([[], "notContain", "A"])).toEqual(true);
  });

  it("should be case sensitive (usually)", () => { 
    expect(ComparaisonType.resolveLogical([["A", "B"], "contain", "a"])).toEqual(false);
  });

  it("should handle partial matches", () => { 
    expect(ComparaisonType.resolveLogical([["Apple", "Banana"], "contain", "App"])).toEqual(false);
  });
});

  
});