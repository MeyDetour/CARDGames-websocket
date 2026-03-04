import  FunctionType  from '../../parser/FunctionType';
describe('FunctionType', () => {
  it('should execute functions', () => {
    // Ajoutez vos assertions ici
    expect(FunctionType.removeTag('getPlayer("123")')).toEqual("123");
  });
});