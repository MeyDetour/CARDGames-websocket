import ExpressionType from "../../parser/ExpressionType";
describe("ExpressionType", () => {
  describe("ExpressionType - Full Integration", () => {
    it("should resolve boolean logic from arrays", () => {
      // Test de base : OR
      expect(ExpressionType.resolveLogical([true, "||", false])).toEqual(true);

      // Test de base : AND
      expect(ExpressionType.resolveLogical([true, "&&", true])).toEqual(true);

      // Test de base : Mixte
      expect(ExpressionType.resolveLogical([false, "&&", false])).toEqual(false);
    });
  });
  it("should respect operator precedence (AND before OR)", () => {
    /** * true || (false && false) => true || false => true
     * Si resolveLogical traite le && en priorité, le résultat doit être true.
     */
    expect(
      ExpressionType.resolveLogical([true, "||", false, "&&", false]),
    ).toEqual(true);

    // (false && true) || true => false || true => true
    expect(ExpressionType.resolveLogical([false, "&&", true, "||", true])).toEqual(
      true,
    );
  });
  
});
