import  VariableType  from '../../parser/VariableType';
describe('VariableType', () => {
   beforeEach(() => {
    mockGameData = {
      data: {
        currentPlayerPosition: { value: 1 },
        players: [
          { id: "p1", position: 1, name: "Alice" , hasPlayed : {value : true}},
          { id: "p2", position: 2, name: "Bob" , hasPlayed : {value : true}},
          { id: "p3", position: 3, name: "Charlie" , hasPlayed : {value : true}},
        ],
      },
    }; 
  });
  it('should remove tag', () => { 
    expect(VariableType.removeTag('{a}')).toEqual("a"); 
  });
    it('should get variable', () => { 
    expect(VariableType.splitLogicalList('aaaa')).toEqual(null); 
  });
});