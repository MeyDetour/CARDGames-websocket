import  ValueType  from '../../parser/ValueType';
describe('ValueType', () => {
  it('should handle values', () => {
    // Ajoutez vos assertions ici
    expect(ValueType.removeTag('<<value>>')).toEqual("value");
    expect(ValueType.removeTag('<<>>')).toEqual("");
  });
});