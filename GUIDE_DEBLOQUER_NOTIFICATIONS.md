# 🚫➡️✅ Guide pour Débloquer les Notifications

## 🎯 Problème : Permissions Bloquées

Quand vous voyez ce message :
```
Notifications permission has been blocked as the user has ignored the permission prompt several times.
```

Cela signifie que le navigateur a **définitivement bloqué** les notifications pour ce site.

## 🔧 Solutions par Navigateur

### 📌 **Chrome / Edge**
1. Cliquez sur l'icône **🔒** ou **🛡️** à gauche de l'URL
2. Trouvez "Notifications" dans la liste
3. Changez de "Bloquer" à **"Autoriser"**
4. **Rechargez la page** (F5)

### 📌 **Firefox**
1. Cliquez sur l'icône **🛡️** à gauche de l'URL
2. Cliquez sur la flèche **>** à côté de "Permissions"
3. Changez "Notifications" de "Bloquer" à **"Autoriser"**
4. **Rechargez la page** (F5)

### 📌 **Safari**
1. Menu Safari > Préférences
2. Onglet "Sites web"
3. Notifications dans la barre latérale
4. Trouvez votre site et changez en **"Autoriser"**
5. **Rechargez la page** (F5)

## 🧪 Alternative : Mode Incognito/Privé

Si vous voulez tester rapidement :
1. Ouvrez une **fenêtre privée/incognito**
2. Naviguez vers `http://localhost:5177/notification-tester`
3. Acceptez les permissions quand demandées
4. Testez les notifications

## ✅ Vérification

Après avoir suivi ces étapes :
1. Rechargez la page de test
2. Le statut devrait afficher **"granted"**
3. Un message vert devrait apparaître : "✅ Notifications autorisées"
4. Les notifications natives fonctionneront

## 📱 Notifications In-App

**Bonne nouvelle :** Même si les permissions natives sont bloquées, les **notifications in-app** fonctionnent toujours ! Elles apparaissent dans l'interface de l'application avec les mêmes animations et fonctionnalités.

## 🔄 Reset Complet (Si Problème Persist)

1. **Chrome :**
   - Paramètres > Confidentialité et sécurité > Paramètres du site
   - Notifications > Effacer les données du site

2. **Firefox :**
   - about:preferences#privacy
   - Gérer les données > Supprimer les données du site

---

## 📋 Checklist de Validation

- [ ] Icône de permissions cliqué (🔒/🛡️)
- [ ] Notifications changées en "Autoriser"  
- [ ] Page rechargée (F5)
- [ ] Statut affiché : "granted"
- [ ] Test des notifications natives réussi
- [ ] Notifications in-app fonctionnelles
