import Evaluator from "../../core/engine/Evaluator";
describe("Evaluator", () => {
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
    }; mockGameData2 = {
      data: {
        currentPlayerPosition: { value: 1 },
        players: [
          { id: "p1", position: 1, name: "Alice" , hasPlayed : {value : true}},
          { id: "p2", position: 2, name: "Bob" , hasPlayed : {value : true}},
          { id: "p3", position: 3, name: "Charlie" , hasPlayed : {value : false}},
        ],
      },
    };
  });
  it("should verify if all player has played", () => {
    // Ajoutez vos assertions ici
    expect(Evaluator.verifyIsAllPlayerHasPlayed(mockGameData)).toEqual(true);
    expect(Evaluator.verifyIsAllPlayerHasPlayed(mockGameData2)).toEqual(false);
  });
});
