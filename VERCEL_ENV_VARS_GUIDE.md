# 🔐 Guide : Ajouter les Variables d'Environnement sur Vercel

## 📋 LES VARIABLES À AJOUTER

Voici EXACTEMENT ce que vous devez copier-coller sur Vercel :

---

### ✅ ÉTAPE 1 : Aller sur Vercel

1. Ouvrez votre navigateur
2. Allez sur : **https://vercel.com/dashboard**
3. Connectez-vous si nécessaire

---

### ✅ ÉTAPE 2 : Sélectionner votre projet

1. Dans la liste des projets, cliquez sur **"drink-wise-mobile"**
2. En haut, cliquez sur l'onglet **"Settings"**
3. Dans le menu de gauche, cliquez sur **"Environment Variables"**

---

### ✅ ÉTAPE 3 : Ajouter les variables UNE PAR UNE

Pour CHAQUE variable ci-dessous :
1. Cliquez sur **"Add New"** ou **"Add Variable"**
2. Copiez le **NOM** dans le champ "Key" ou "Name"
3. Copiez la **VALEUR** dans le champ "Value"
4. Sélectionnez **"Production", "Preview", et "Development"** (toutes les 3)
5. Cliquez sur **"Save"**

---

## 📝 VARIABLES À COPIER-COLLER

### Variable 1 : Google Maps API Key
```
NOM (Key):
VITE_GOOGLE_MAPS_API_KEY

VALEUR (Value):
AIzaSyBft5cAtkne-0dbY8m20bFeYGIKUBHRf_Y
```
✅ Environnements : Production, Preview, Development

---

### Variable 2 : Gemini API Key
```
NOM (Key):
VITE_GEMINI_API_KEY

VALEUR (Value):
your_actual_api_key_here
```
⚠️ **ATTENTION** : Cette valeur est "your_actual_api_key_here" - c'est une clé placeholder.
Si vous voulez que Gemini AI fonctionne, vous devrez obtenir une vraie clé sur :
https://makersuite.google.com/app/apikey

Pour l'instant, vous pouvez la laisser comme ça, l'app fonctionnera quand même.

✅ Environnements : Production, Preview, Development

---

### Variable 3 : Firebase API Key
```
NOM (Key):
VITE_FIREBASE_API_KEY

VALEUR (Value):
AIzaSyD_Gi_m1IRhl8SfgfIU6x0erT5pxeaUM5o
```
✅ Environnements : Production, Preview, Development

---

### Variable 4 : Firebase Auth Domain
```
NOM (Key):
VITE_FIREBASE_AUTH_DOMAIN

VALEUR (Value):
drinkwise-31d3a.firebaseapp.com
```
✅ Environnements : Production, Preview, Development

---

### Variable 5 : Firebase Project ID
```
NOM (Key):
VITE_FIREBASE_PROJECT_ID

VALEUR (Value):
drinkwise-31d3a
```
✅ Environnements : Production, Preview, Development

---

### Variable 6 : Firebase Storage Bucket
```
NOM (Key):
VITE_FIREBASE_STORAGE_BUCKET

VALEUR (Value):
drinkwise-31d3a.firebasestorage.app
```
✅ Environnements : Production, Preview, Development

---

### Variable 7 : Firebase Messaging Sender ID
```
NOM (Key):
VITE_FIREBASE_MESSAGING_SENDER_ID

VALEUR (Value):
210028837880
```
✅ Environnements : Production, Preview, Development

---

### Variable 8 : Firebase App ID
```
NOM (Key):
VITE_FIREBASE_APP_ID

VALEUR (Value):
AIzaSyD_Gi_m1IRhl8SfgfIU6x0erT5pxeaUM5o
```
✅ Environnements : Production, Preview, Development

---

### Variable 9 : Firebase Measurement ID
```
NOM (Key):
VITE_FIREBASE_MEASUREMENT_ID

VALEUR (Value):
G-RHZNKFRZVF
```
✅ Environnements : Production, Preview, Development

---

## ✅ ÉTAPE 4 : Redéployer

Après avoir ajouté TOUTES les variables :

1. Retournez à l'onglet **"Deployments"** (en haut)
2. Cliquez sur les **3 petits points** (...) du dernier déploiement
3. Cliquez sur **"Redeploy"**
4. Confirmez en cliquant **"Redeploy"** à nouveau

Attendez 1-2 minutes que le déploiement se termine.

---

## 🎯 VÉRIFICATION

Une fois le redéploiement terminé :

1. Ouvrez **https://drink-wise-mobile.vercel.app** sur votre téléphone
2. L'application devrait se charger normalement
3. Essayez de vous connecter
4. Si ça marche → **BRAVO ! C'est bon !** 🎉
5. Si erreur → Regardez les logs de build sur Vercel ou demandez-moi

---

## 📸 AIDE VISUELLE

Voici à quoi ça devrait ressembler dans Vercel :

### Interface d'ajout de variable :

```
┌─────────────────────────────────────────┐
│ Add Environment Variable                │
├─────────────────────────────────────────┤
│                                         │
│ Key (Name)                              │
│ ┌─────────────────────────────────────┐ │
│ │ VITE_GOOGLE_MAPS_API_KEY            │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Value                                   │
│ ┌─────────────────────────────────────┐ │
│ │ AIzaSyBft5cAtkne-0dbY8m20bFeYGI... │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Environments                            │
│ ☑ Production                            │
│ ☑ Preview                               │
│ ☑ Development                           │
│                                         │
│ [Cancel]              [Save]            │
└─────────────────────────────────────────┘
```

---

## ⏱️ TEMPS ESTIMÉ

- 5-10 minutes pour ajouter toutes les variables
- 1-2 minutes pour le redéploiement
- **Total : ~10 minutes** ⏰

---

## 🆘 PROBLÈMES COURANTS

### "Je ne trouve pas Environment Variables"
→ Assurez-vous d'être dans l'onglet **Settings** de votre projet
→ Cherchez dans le menu de gauche

### "Erreur après redéploiement"
→ Vérifiez que vous avez copié-collé EXACTEMENT les valeurs
→ Pas d'espaces avant/après les valeurs
→ Vérifiez qu'il n'y a pas de caractères bizarres

### "L'app ne charge pas"
→ Attendez 2-3 minutes (cache)
→ Videz le cache du navigateur mobile
→ Ouvrez en navigation privée
→ Si toujours erreur, regardez les logs de build sur Vercel

---

## 💡 ASTUCE

Vous pouvez ouvrir ce fichier sur votre téléphone aussi !
Comme ça vous pouvez copier-coller directement depuis votre téléphone vers Vercel.

**Lien du fichier sur GitHub :**
https://github.com/mlbang88/DrinkWise_mobile/blob/main/VERCEL_ENV_VARS_GUIDE.md

---

## ✅ CHECKLIST

- [ ] Connecté sur https://vercel.com/dashboard
- [ ] Projet "drink-wise-mobile" sélectionné
- [ ] Dans Settings → Environment Variables
- [ ] Variable 1 ajoutée (Google Maps)
- [ ] Variable 2 ajoutée (Gemini)
- [ ] Variable 3 ajoutée (Firebase API Key)
- [ ] Variable 4 ajoutée (Firebase Auth Domain)
- [ ] Variable 5 ajoutée (Firebase Project ID)
- [ ] Variable 6 ajoutée (Firebase Storage Bucket)
- [ ] Variable 7 ajoutée (Firebase Messaging Sender ID)
- [ ] Variable 8 ajoutée (Firebase App ID)
- [ ] Variable 9 ajoutée (Firebase Measurement ID)
- [ ] Redéploiement lancé
- [ ] Application testée sur téléphone

---

## 🎊 TERMINÉ !

Une fois toutes les variables ajoutées et l'app redéployée :

**Vous êtes 100% PRÊT pour demain !** 🚀

Demain, vous n'aurez qu'à :
1. Ouvrir Claude.ai sur votre téléphone
2. Me demander de modifier le code
3. Recharger l'URL Vercel
4. BOOM ! Les changements sont là ! 💥

---

**Besoin d'aide pendant le processus ?**
Envoyez-moi un message et je vous guide !
