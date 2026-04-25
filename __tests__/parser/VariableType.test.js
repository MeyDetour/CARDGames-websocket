import  VariableType  from '../../parser/VariableType';
describe('VariableType', () => {
   beforeEach(() => {
    mockGameData = {
      data: {
        roomId: 10,
        currentPlayerPosition: { value: 1 },
        players: [
          { id: "p1", position: 1, pseudo: "Alice" , hasPlayed : {value : true},hasloose: {value : false},haswin: {value : false},isSpectator: {value : false}},
          { id: "p2", position: 2, pseudo: "Bob" , hasPlayed : {value : true},hasloose: {value : false},haswin: {value : false},isSpectator: {value : false}},
          { id: "p3", position: 3, pseudo: "Charlie" , hasPlayed : {value : true},hasloose: {value : false},haswin: {value : false},isSpectator: {value : false}},
        ],
        pot:{
          value:"bb",
          truc:"aa"
        },
        pot2:{ 
          truc:"aa"
        }
        ,pot3:{ 
          value:{
            truc:"aa"
          }
        }
      },
    }; 
  });
  it('should remove tag', () => { 
    expect(VariableType.removeTag('{a}')).toEqual("a"); 
    
        expect(VariableType.removeTag('')).toEqual("");
        expect(VariableType.removeTag(null)).toEqual("");
        expect(VariableType.removeTag(42545)).toEqual("");
        expect(VariableType.removeTag( [])).toEqual("");
        expect(VariableType.removeTag( {})).toEqual("");
  });
    it('should get variable', () => { 
    expect(VariableType.splitLogicalList('aaaa')).toEqual(null); 
    expect(VariableType.splitLogicalList([])).toEqual(null); 
    expect(VariableType.splitLogicalList(["startPlayer"],mockGameData)).toEqual(mockGameData.data.players[0]);  
    expect(VariableType.splitLogicalList(["allPlayersInGame"],mockGameData)).toEqual(mockGameData.data.players);   
    expect(VariableType.splitLogicalList(["currentPlayer"],mockGameData)).toEqual(null);  
    expect(VariableType.splitLogicalList(["currentPlayer"],mockGameData,{currentPlayer:"p3"})).toEqual(mockGameData.data.players[2]);  
    expect(VariableType.splitLogicalList(["player"],mockGameData,{player:"p3"})).toEqual(mockGameData.data.players[2]);  
    expect(VariableType.splitLogicalList(["insertedValue"],mockGameData,{insertedValue:10})).toEqual(10);  
    expect(VariableType.splitLogicalList(["currentCard"],mockGameData,{currentCard:10})).toEqual(10);  
    expect(VariableType.splitLogicalList(["roomId"],mockGameData)).toEqual(10);  
    expect(VariableType.splitLogicalList(["pot"],mockGameData)).toEqual("bb");  
    expect(VariableType.splitLogicalList(["truc"],mockGameData)).toEqual(null);  
    expect(VariableType.splitLogicalList(["pot","truc"],mockGameData)).toEqual(null);  
    expect(VariableType.splitLogicalList(["pot2","truc"],mockGameData)).toEqual("aa");  
    expect(VariableType.splitLogicalList(["pot3","truc"],mockGameData)).toEqual("aa");  
  });
});