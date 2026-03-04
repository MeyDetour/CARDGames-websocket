import Parser  from '../../parser/parser.js';
describe('parser', () => {
  
  
  it("should validate variables with correct # placement", () => {
    expect(Parser.verifyExpressionSyntax("{player#gain#1}")).toEqual(true);
    expect(Parser.verifyExpressionSyntax("{currentPlayer#currentBet}")).toEqual(true);
  });

  it("should fail if variable has no #", () => {
    // Selon ta règle : doit avoir un ou plusieurs #
    expect(Parser.verifyExpressionSyntax("{currentPlayer}")).toEqual(false);
  });

  it("should fail if variable starts or ends with #", () => {
    expect(Parser.verifyExpressionSyntax("{#player#gain}")).toEqual(false);
    expect(Parser.verifyExpressionSyntax("{player#gain#}")).toEqual(false);
  });

  it("should validate complex nested variables", () => {
    // Ici on a une fonction dans une variable, le # est bien à la fin du bloc interne
    const complex = "{getPlayer(calc({p#pos}+1))#currentBet}";
    expect(Parser.verifyExpressionSyntax(complex)).toEqual(true);
  });
}); 