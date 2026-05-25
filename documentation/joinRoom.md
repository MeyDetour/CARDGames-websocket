```
graph TD
    A([Entrée dans la partie]) --> B{La partie est-elle pleine ?}

    B -->|s13| C{La partie a-t-elle commencé ?}
    
    C -->|s14| D{Spectateurs autorisés ?}
    D -->|s15| E([Devenir Spectateur])
    D -->|s16| F([Message d'erreur])
    
    C -->|s17| G{Toutes les places sont prises ?} 
    G -->|s18| H([Devenir Joueur])
    
    B -->|s20| I{Spectateurs autorisés ?}
    I -->|s21| J([Devenir Spectateur])
    I -->|s22| K([Message d'erreur])

    %% Styles pour rendre le schéma plus lisible
    style A fill:#f9f,stroke:#333,stroke-width:2px
    style E fill:#9cf,stroke:#333,stroke-width:2px
    style H fill:#8f8,stroke:#333,stroke-width:2px
    style J fill:#9cf,stroke:#333,stroke-width:2px
    style F fill:#f99,stroke:#333,stroke-width:2px
    style K fill:#f99,stroke:#333,stroke-width:2px
```


 
### 1. La partie est pleine

* **Spectateurs autorisés :** 👁️ Spectateur
* **Spectateurs interdits :** ❌ Message d'erreur

### 2. La partie n'est pas pleine

* **Si elle a commencé :**
* Spectateurs autorisés ➡️ 👁️ Spectateur
* Spectateurs interdits ➡️ ❌ Message d'erreur


* **Si elle n'a pas commencé :**
* Il reste de la place joueur ➡️ 🎮 Joueur
* Plus de place joueur (Spectateurs autorisés) ➡️ 👁️ Spectateur
* Plus de place joueur (Spectateurs interdits) ➡️ ❌ Message d'erreur