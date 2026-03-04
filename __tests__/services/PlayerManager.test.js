import PlayerManager from '../../core/services/PlayerManager.js';

describe('PlayerManager', () => {
    // Mock des données de jeu pour les tests
    let mockGameData;

    beforeEach(() => {
        mockGameData = {
            data: {
                currentPlayerPosition: { value: 1 },
                players: [
                    { id: "p1", position: 1, name: "Alice" },
                    { id: "p2", position: 2, name: "Bob" },
                    { id: "p3", position: 3, name: "Charlie" }
                ]
            }
        };
    });

    describe('getPlayer', () => {
        it('doit retourner le bon joueur selon la position (base 1)', () => {
            const player = PlayerManager.getPlayer(mockGameData, 2);
            expect(player.id).toEqual("p2");
        });

        it('doit gérer le modulo si la position dépasse le nombre de joueurs', () => {
            // Position 4 sur 3 joueurs -> doit revenir au joueur 1
            const player = PlayerManager.getPlayer(mockGameData, 4);
            expect(player.id).toEqual("p1");
        });
    });

    describe('getNextPlayer', () => {
        it('doit retourner le joueur suivant dans la liste', () => {
            const next = PlayerManager.getNextPlayer(mockGameData, 1);
            expect(next.id).toEqual("p2");
        });

        it('doit boucler au premier joueur si le joueur actuel est le dernier', () => {
            const next = PlayerManager.getNextPlayer(mockGameData, 3);
            expect(next.id).toEqual("p1");
        });
    });

    describe('isLastUser', () => {
        it('doit retourner true si le joueur est le dernier de la liste', () => {
            expect(PlayerManager.isLastUser(mockGameData, 3)).toEqual(true);
        });

        it('doit retourner false si le joueur n est pas le dernier', () => {
            expect(PlayerManager.isLastUser(mockGameData, 1)).toEqual(false);
        });
    });
 
});