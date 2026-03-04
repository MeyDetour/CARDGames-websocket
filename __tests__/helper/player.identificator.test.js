import PlayerIdentificator  from '../../core/services/helper/player.identificator';
describe('playerIdentificator', () => {
  it('should identify player', () => {
    // Ajoutez vos assertions ici
    expect(PlayerIdentificator.generateId()).toBeDefined();
  });
});