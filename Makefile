#
# Fichier: Makefile
#
# NOTE IMPORTANTE : Les commandes après la cible (dans 'run:')
# doivent IMPÉRATIVEMENT commencer par une tabulation (TAB) et non des espaces.
#

# Variable pour la commande de nettoyage de console.
# 'clear' fonctionne sur la plupart des systèmes Unix/Linux/macOS.
# Si vous êtes sur Windows, vous pourriez utiliser 'cls'.
CLEAR_CMD := clear

# Variable pour le fichier de démarrage du serveur
SERVER_FILE := server.js

# Variables pour les tests
NODE_OPTS := NODE_OPTIONS=--experimental-vm-modules
JEST := npx jest

.PHONY: all run clean

all: run
 
# --- SERVEUR ---
run: clean
	@echo "--- Lancement du serveur Node.js ---"
	@$(CLEAR_CMD)
	@node $(SERVER_FILE)
 

 

# --- UTILITAIRES ---

clean: 
	@$(CLEAR_CMD)

git-reset:
	@echo "--- Reset du dépôt Git ---"
	rm -rf .git
	git init
	git remote add origin https://github.com/MeyDetour/CARDGames-websocket.git
	git add .
	git commit -m "fix git object error"
	git push -uf --set-upstream origin master
 
 # --- TESTS ---

# Lance absolument tous les tests du projet
test-all: clean
	@echo "--- Lancement de TOUS les tests ---"
	$(NODE_OPTS) $(JEST) --runInBand

# Règle dynamique : ex: 'make test-Evaluator' cherchera Evaluator.test.js
test-%: clean
	@echo "--- Lancement du test spécifique : $* ---"
	$(NODE_OPTS) $(JEST) $*

# Raccourcis par dossiers
test-evaluator: clean
	@echo "--- Tests Evaluator ---"
	$(NODE_OPTS) $(JEST) evaluator/

test-parser: clean
	@echo "--- Tests Parser ---"
	$(NODE_OPTS) $(JEST) parser/

test-services: clean
	@echo "--- Tests Services ---"
	$(NODE_OPTS) $(JEST) services/