import  ValueType  from '../../parser/ValueType';
describe('ValueType', () => {
  it('should handle values', () => {
    // Ajoutez vos assertions ici
    expect(ValueType.removeTag('<<value>>')).toEqual("value");
    expect(ValueType.removeTag('<<>>')).toEqual("");
    expect(ValueType.removeTag('<value>')).toEqual("alu");
    expect(ValueType.splitLogical('<value>',{},{})).toEqual("alu");
    expect(ValueType.splitLogical('<<value>>',{},{})).toEqual("value");
  });
});