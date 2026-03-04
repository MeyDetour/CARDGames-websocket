import CardManager from '../../core/services/CardManager';
describe('CardManager', () => {
  it('should manage cards', () => {
    // Ajoutez vos assertions ici
    expect(CardManager.getCard).toBeDefined(); 
    expect(CardManager.dropCard).toBeDefined(); 
  });
});