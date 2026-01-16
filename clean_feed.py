# Script pour nettoyer FeedPage.jsx
import codecs

# Chemin du fichier
file_path = r"c:\Users\Maxime Labonde\Documents\Mes projets react\DrinkWise_mobile\src\pages\FeedPage.jsx"

# Lire les 948 premières lignes
with codecs.open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()[:948]

# Réécrire le fichier avec seulement ces lignes
with codecs.open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(lines)

print(f"Fichier nettoyé! {len(lines)} lignes conservées.")
