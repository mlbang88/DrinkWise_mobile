# 🎨 Guide d'Utilisation du Design System DrinkWise

## 📚 Table des Matières
1. [Introduction](#introduction)
2. [Installation](#installation)
3. [Couleurs](#couleurs)
4. [Composants UI](#composants-ui)
5. [Exemples d'Utilisation](#exemples-dutilisation)
6. [Migration](#migration)

---

## Introduction

Le Design System DrinkWise centralise tous les tokens de design (couleurs, espacements, typographie) et composants UI pour garantir une cohérence visuelle dans toute l'application.

---

## Installation

Les fichiers sont déjà créés dans votre projet :
- `src/styles/designSystem.js` - Tokens de design
- `src/components/ui/Button.jsx` - Composant Button
- `src/components/ui/Card.jsx` - Composant Card

---

## Couleurs

### Import
```javascript
import { COLORS, GRADIENTS } from '../styles/designSystem';
```

### Utilisation des Couleurs
```javascript
// Couleur primaire (violet)
background: COLORS.primary[500]  // Couleur principale
background: COLORS.primary[700]  // Plus foncé
background: COLORS.primary[300]  // Plus clair

// Couleurs sémantiques
background: COLORS.success[500]  // Vert
background: COLORS.warning[500]  // Jaune
background: COLORS.error[500]    // Rouge

// Neutrals (backgrounds)
background: COLORS.neutral[950]  // Background très sombre
background: COLORS.neutral[900]  // Cards
background: COLORS.neutral[800]  // Sections
```

### Utilisation des Gradients
```javascript
// Gradient principal
background: GRADIENTS.primary

// Glass effect
background: GRADIENTS.darkGlass,
backdropFilter: 'blur(20px)'

// Text gradient
background: GRADIENTS.textPrimary,
WebkitBackgroundClip: 'text',
WebkitTextFillColor: 'transparent'
```

---

## Composants UI

### Button

#### Import
```javascript
import Button from '../components/ui/Button';
```

#### Variantes
```javascript
// Primary (par défaut)
<Button variant="primary">
  Créer une soirée
</Button>

// Secondary
<Button variant="secondary">
  Annuler
</Button>

// Outline
<Button variant="outline">
  En savoir plus
</Button>

// Ghost (transparent)
<Button variant="ghost">
  Fermer
</Button>
```

#### Tailles
```javascript
<Button size="sm">Petit</Button>
<Button size="md">Moyen</Button>
<Button size="lg">Grand</Button>
```

#### États
```javascript
// Disabled
<Button disabled>Désactivé</Button>

// Loading
<Button loading>Chargement...</Button>

// Full width
<Button fullWidth>Pleine largeur</Button>
```

#### Avec Icon
```javascript
import { Plus, Check } from 'lucide-react';

<Button icon={<Plus size={20} />}>
  Ajouter
</Button>

<Button 
  icon={<Check size={20} />} 
  iconPosition="right"
>
  Valider
</Button>
```

---

### Card

#### Import
```javascript
import Card from '../components/ui/Card';
```

#### Variantes
```javascript
// Default
<Card variant="default">
  <p>Contenu de la carte</p>
</Card>

// Glass (effet verre)
<Card variant="glass">
  <p>Carte avec effet de verre</p>
</Card>

// Elevated (ombre forte)
<Card variant="elevated">
  <p>Carte élevée</p>
</Card>

// Gradient (avec gradient violet)
<Card variant="gradient">
  <p>Carte avec gradient</p>
</Card>
```

#### Padding
```javascript
<Card padding="none">Sans padding</Card>
<Card padding="sm">Petit padding</Card>
<Card padding="md">Padding moyen</Card>
<Card padding="lg">Grand padding</Card>
```

#### Hoverable / Clickable
```javascript
// Hover effect
<Card hoverable>
  <p>Passe la souris dessus</p>
</Card>

// Clickable
<Card onClick={() => console.log('Cliqué!')}>
  <p>Clique-moi</p>
</Card>
```

---

## Exemples d'Utilisation

### Exemple 1: Page Simple

**Avant (sans Design System):**
```javascript
const HomePage = () => {
  return (
    <div style={{
      background: '#0f0f0f',
      padding: '24px'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, rgba(26, 26, 26, 0.8), rgba(15, 15, 15, 0.6))',
        padding: '24px',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.08)'
      }}>
        <h2 style={{ color: 'white' }}>Bienvenue</h2>
        <button style={{
          background: 'linear-gradient(135deg, #667eea, #764ba2)',
          color: 'white',
          padding: '12px 24px',
          borderRadius: '12px',
          border: 'none',
          cursor: 'pointer'
        }}>
          Commencer
        </button>
      </div>
    </div>
  );
};
```

**Après (avec Design System):**
```javascript
import { COLORS, SPACING } from '../styles/designSystem';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

const HomePage = () => {
  return (
    <div style={{
      background: COLORS.neutral[950],
      padding: SPACING.lg
    }}>
      <Card variant="glass">
        <h2 style={{ color: COLORS.white }}>Bienvenue</h2>
        <Button variant="primary">
          Commencer
        </Button>
      </Card>
    </div>
  );
};
```

### Exemple 2: Modal

**Avant:**
```javascript
<div style={{
  position: 'fixed',
  inset: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.8)',
  backdropFilter: 'blur(8px)',
  zIndex: 50
}}>
  <div style={{
    background: '#0f0f0f',
    borderRadius: '20px',
    padding: '24px',
    maxWidth: '600px',
    margin: '50px auto'
  }}>
    <h3 style={{ color: 'white' }}>Titre</h3>
    <button style={{
      background: '#8b5cf6',
      color: 'white',
      padding: '12px 24px',
      borderRadius: '12px'
    }}>
      Confirmer
    </button>
  </div>
</div>
```

**Après:**
```javascript
import { COLORS, RADIUS, SPACING, Z_INDEX } from '../styles/designSystem';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

<div style={{
  position: 'fixed',
  inset: 0,
  backgroundColor: COLORS.black + '80', // 50% opacity
  backdropFilter: 'blur(8px)',
  zIndex: Z_INDEX.modal
}}>
  <Card 
    variant="elevated"
    style={{
      maxWidth: '600px',
      margin: '50px auto'
    }}
  >
    <h3 style={{ color: COLORS.white }}>Titre</h3>
    <Button variant="primary">
      Confirmer
    </Button>
  </Card>
</div>
```

---

## Migration

### Plan de Migration Progressive

#### Phase 1: Nouveaux Composants (1 semaine)
1. Utiliser Button et Card pour toutes nouvelles features
2. Importer COLORS au lieu de hard-code

#### Phase 2: Refactoring HomePage (2-3 jours)
1. Remplacer tous les boutons par <Button>
2. Remplacer toutes les cards par <Card>
3. Utiliser COLORS partout

#### Phase 3: Refactoring Autres Pages (2 semaines)
1. Une page par jour
2. Tests après chaque migration
3. Documenter les changements

### Checklist par Composant

**Avant de migrer un composant:**
- [ ] Identifier toutes les couleurs hard-codées
- [ ] Identifier tous les boutons custom
- [ ] Identifier toutes les cards custom
- [ ] Identifier tous les espacements custom

**Pendant la migration:**
- [ ] Remplacer couleurs par COLORS.*
- [ ] Remplacer boutons par <Button>
- [ ] Remplacer cards par <Card>
- [ ] Remplacer espacements par SPACING.*
- [ ] Remplacer border-radius par RADIUS.*

**Après la migration:**
- [ ] Tests visuels
- [ ] Tests responsive
- [ ] Vérifier hover states
- [ ] Vérifier accessibilité

---

## Bonnes Pratiques

### ✅ À FAIRE
```javascript
// Utiliser les tokens du Design System
import { COLORS, SPACING, RADIUS } from '../styles/designSystem';

background: COLORS.primary[500]
padding: SPACING.lg
borderRadius: RADIUS.md
```

### ❌ À ÉVITER
```javascript
// Hard-coder les valeurs
background: '#8b5cf6'
padding: '24px'
borderRadius: '16px'
```

### ✅ Composants Réutilisables
```javascript
// Utiliser les composants UI
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

<Card variant="glass">
  <Button variant="primary">Action</Button>
</Card>
```

### ❌ Code Dupliqué
```javascript
// Réinventer la roue
<button style={{
  background: 'linear-gradient(...)',
  padding: '12px 24px',
  // ... 15 lignes de style
}}>
  Action
</button>
```

---

## Support

Pour toute question sur le Design System :
1. Consulter ce README
2. Voir `designSystem.js` pour tous les tokens
3. Voir les composants dans `components/ui/`
4. Demander à l'équipe dev

---

**Dernière mise à jour:** 18 Janvier 2026  
**Version:** 1.0.0
