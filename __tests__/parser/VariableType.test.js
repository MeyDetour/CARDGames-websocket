import { VariableType } from '../../parser/VariableType';
describe('VariableType', () => {
  it('should handle variables', () => {
    // Ajoutez vos assertions ici
    expect(VariableType.removeTag('{a}')).toEqual("a");
  });
});