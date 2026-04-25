import  FunctionType  from '../../parser/FunctionType';
describe('FunctionType', () => {
  it('should execute functions', () => {
    // Ajoutez vos assertions ici
    expect(FunctionType.removeTag('getPlayer(123)')).toEqual("123");
    expect(FunctionType.removeTag('')).toEqual("");
    expect(FunctionType.removeTag(null)).toEqual("");
    expect(FunctionType.removeTag(42545)).toEqual("");
    expect(FunctionType.removeTag( [])).toEqual("");
    expect(FunctionType.removeTag( {})).toEqual("");
    expect(FunctionType.removeTag('getPlaer(123)')).toEqual('getPlaer(123)');
    expect(FunctionType.removeTag('len(123)')).toEqual('123');
    expect(FunctionType.removeTag('len(++++++125416546efervre3)')).toEqual('++++++125416546efervre3');
  });
});