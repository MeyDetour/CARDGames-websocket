import CalculType from "../../parser/CalculType";

describe("CalculType", () => {
  describe("CalculType - resolveLogical", () => {
    it("should resolve basic % from arrays", () => {
      expect(CalculType.resolveLogical([5, "%", 3])).toEqual(2);
      expect(CalculType.resolveLogical(["5", "%", "3"])).toEqual(2);
      expect(CalculType.resolveLogical(["5.8548", "%", "86,55"])).toEqual(5.85);
      expect(CalculType.resolveLogical(["5,8548", "%", "864.55"])).toEqual(
        5.85,
      );
      expect(CalculType.resolveLogical([5.8548, "%", "864.55"])).toEqual(5.85);
    });

    it("should resolve basic * from arrays", () => {
      expect(CalculType.resolveLogical([5, "*", 3])).toEqual(15);
      expect(CalculType.resolveLogical(["5", "*", "3"])).toEqual(15);
      expect(CalculType.resolveLogical(["5,854", "*", 3.54])).toEqual(20.72);
      expect(CalculType.resolveLogical(["5", "*", "100.589"])).toEqual(502.95);
    });

    it("should resolve basic - from arrays", () => {
      expect(CalculType.resolveLogical([5, "-", 3])).toEqual(2);
      expect(CalculType.resolveLogical(["5", "-", "3"])).toEqual(2);
      expect(CalculType.resolveLogical(["5,48", "-", "3.5994"])).toEqual(1.88);
      expect(CalculType.resolveLogical(["5.484", "-", 3.559])).toEqual(1.93);
    });

    it("should resolve basic + from arrays", () => {
      expect(CalculType.resolveLogical([5, "+", 3])).toEqual(8);
      expect(CalculType.resolveLogical(["5", "+", "3"])).toEqual(8);
      expect(CalculType.resolveLogical(["5,854", "+", 3.54])).toEqual(9.39);
      expect(CalculType.resolveLogical(["5", "+", "100.589"])).toEqual(105.59);
    });

    it("should resolve basic / from arrays", () => {
      expect(CalculType.resolveLogical([5, "/", 3])).toEqual(1.67);
      expect(CalculType.resolveLogical(["5", "/", "3"])).toEqual(1.67);
      expect(CalculType.resolveLogical(["5", "/", "8"])).toEqual(0.63);
      expect(CalculType.resolveLogical(["5,854", "/", 3.54])).toEqual(1.65);
      expect(CalculType.resolveLogical(["5", "/", "100.589"])).toEqual(0.05);
    });
    it("should remove tag ", () => {
      expect(CalculType.removeTag([5, "/", 3])).toEqual("");
      expect(CalculType.removeTag(null)).toEqual("");
      expect(CalculType.removeTag("calc(a)")).toEqual("a");
      expect(CalculType.removeTag("calc([a,b,c])")).toEqual("[a,b,c]");
      expect(CalculType.removeTag("comp([a,b,c])")).toEqual("[a,b,c]");
      expect(CalculType.removeTag("comparaison([a,b,c])")).toEqual(
        "raison([a,b,c]",
      );

      expect(CalculType.removeTag("")).toEqual("");
      expect(CalculType.removeTag(null)).toEqual("");
      expect(CalculType.removeTag(42545)).toEqual("");
      expect(CalculType.removeTag([])).toEqual("");
      expect(CalculType.removeTag({})).toEqual("");
    });
  });
});
