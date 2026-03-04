import { ArrayManager } from '../../core/services/helper/ArrayManager.js';
describe('ArrayManager', () => {
  it('should manage arrays', () => {
    // Ajoutez vos assertions ici
    expect(ArrayManager.shuffle(["a", "b", "c"])).toEqual(expect.arrayContaining(["a","b","c"]));
  });
});