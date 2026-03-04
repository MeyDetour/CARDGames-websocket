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

.PHONY: all run clean

all: run

# Cible : run
# Lance le serveur après avoir nettoyé la console
run: clean
	@echo "--- Lancement du serveur Node.js ---"
	@$(CLEAR_CMD)
	@node $(SERVER_FILE)
	test


	
# Cible : test
# Lance les tests après avoir nettoyé la console
test: clean
	@echo "--- Lancement des tests ---"
	@npm test


# Cible : clean
# Nettoie uniquement la console (sans lancer le serveur)
clean:
	@echo "--- Nettoyage de la console ---"
	@$(CLEAR_CMD)

# Cible : help (optionnel)
# Affiche les commandes disponibles
help:
	@echo "Commandes Make disponibles :"
	@echo "  make run  : Nettoie la console et lance $(SERVER_FILE) avec Node."
	@echo "  make clean: Nettoie uniquement la console."
git-reset:
	sudo rm -R .git
	git init
	git remote add origin https://github.com/MeyDetour/CARDGames-websocket.git
	git add .
	git commit -m "fix git object error"
	git push -uf --set-upstream origin master	

