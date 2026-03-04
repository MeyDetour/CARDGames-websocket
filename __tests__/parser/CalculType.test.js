import CalculType from '../../parser/CalculType';
describe('CalculType', () => {
describe("CalculType - resolveLogical", () => {
    it("should resolve basic arithmetic from arrays", () => {
      // Équivalent de calc(5*3)
      expect(CalculType.resolveLogical([5, "*", 3])).toEqual(15);

      // Équivalent de calc(5-3)
      expect(CalculType.resolveLogical([5, "-", 3])).toEqual(2);

      // Équivalent de calc(5+3)
      expect(CalculType.resolveLogical([5, "+", 3])).toEqual(8);
    });

    it("should handle string numbers using parseInt internally", () => {
      // Ta méthode utilise parseInt, donc ces tests doivent passer
      expect(CalculType.resolveLogical(["10", "+", "5"])).toEqual(15);
      expect(CalculType.resolveLogical(["20", "*", "2"])).toEqual(40);
    });
  });

  describe("CalculType - Complex chains (if implemented)", () => {
    it("should respect standard math results for simple triplets", () => {
      expect(CalculType.resolveLogical([100, "-", 50])).toEqual(50);
      expect(CalculType.resolveLogical([10, "*", 10])).toEqual(100);
    });
  });
});