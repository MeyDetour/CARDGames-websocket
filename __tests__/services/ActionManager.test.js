import ActionManager from '../../core/services/ActionManager';
describe('ActionManager', () => {
  it('should manage actions', () => {
    // Ajoutez vos assertions ici
    expect(ActionManager.getActionFromName({roomInDb: {
    params: {tours: {
    actions: [
        {name: "action1", description: "Action 1"},
        {name: "action2", description: "Action 2"}
    ]
    }}}}, "action1")).toEqual( {name: "action1", description: "Action 1"});
  });
});