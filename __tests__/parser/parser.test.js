import Parser  from '../../parser/parser.js';
describe('parser', () => {
  
    it('should parse and evaluate complex expressions', () => {
    // Test d'intégration sur une expression complexe
   
    expect(Parser.getType('{a}')).toEqual("variable");
    expect(Parser.getType('getPlayer("afe")')).toEqual('function');
    // Ajoutez d'autres assertions selon le comportement attendu
  });
  it("should validate variables with correct # placement", () => {
    expect(Parser.verifyExpressionSyntax("{player#gain#1}")).toEqual(true);
    expect(Parser.verifyExpressionSyntax("{currentPlayer#currentBet}")).toEqual(true);
  });

  it("should validate if variable has no #", () => { 
    expect(Parser.verifyExpressionSyntax("{currentPlayer}")).toEqual(true);
  });

  it("should fail if variable starts or ends with #", () => {
    expect(Parser.verifyExpressionSyntax("{#player#gain}")).toEqual(false);
    expect(Parser.verifyExpressionSyntax("{#player}")).toEqual(false);
    expect(Parser.verifyExpressionSyntax("{player#gain#}")).toEqual(false);
  });
  it("should fail if variable has duplicated #", () => { 
    expect(Parser.verifyExpressionSyntax("{player##gain}")).toEqual(false);
  });

  it("should validate complex nested variables", () => {
    // Ici on a une fonction dans une variable, le # est bien à la fin du bloc interne
    const complex = "{getPlayer(calc({p#pos}+1))#currentBet}";
    expect(Parser.verifyExpressionSyntax(complex)).toEqual(true);
  });
  it("should fail if expression has invalid () or {}", () => { 
    expect(Parser.verifyExpressionSyntax("{getPlayer(calc({p#pos}+1)#currentBet}")).toEqual(false);
    expect(Parser.verifyExpressionSyntax("{getPlayer(calc({p#pos}+1)#currentBet)}")).toEqual(true);
  });
}); 