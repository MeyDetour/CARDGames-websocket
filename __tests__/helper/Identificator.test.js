import {Identificator }from'../../core/services/helper/Identificator';
describe('Identificator', () => {
  it('should identify correctly', () => {
    // Ajoutez vos assertions ici
    expect(Identificator.generate()).toBeDefined();
  });
});