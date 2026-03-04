import  Parser  from '../../parser/parser';
describe('parser functional', () => {
  it('should parse and evaluate complex expressions', () => {
    // Test d'intégration sur une expression complexe
   
    expect(Parser.getType('{a}')).toEqual("variable");
    expect(Parser.getType('getPlayer("afe")')).toEqual('function');
    // Ajoutez d'autres assertions selon le comportement attendu
  });
});