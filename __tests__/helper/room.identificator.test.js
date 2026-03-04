import  RoomIdentificator from '../../core/services/helper/room.identificator'
describe('roomIdentificator', () => {
  it('should identify room', () => {
    // Ajoutez vos assertions ici
    expect(RoomIdentificator.generateId()).toBeDefined();
    expect(RoomIdentificator.isExistingId()).toBeDefined();
    expect(RoomIdentificator.generateRoomId()).toBeDefined();
    expect(RoomIdentificator.setId()).toBeDefined();
    expect(RoomIdentificator.get()).toBeDefined();
  });
});