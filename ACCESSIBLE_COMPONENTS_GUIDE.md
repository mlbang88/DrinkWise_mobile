# Guide d'Utilisation des Nouveaux Composants Accessibles

## 🎯 Vue d'ensemble

Ce guide explique comment utiliser les nouveaux composants accessibles créés pour DrinkWise.

---

## 1️⃣ AccessibleModal - Modales Accessibles

### Import
```javascript
import AccessibleModal from '../components/AccessibleModal';
```

### Usage Basique
```jsx
const [isOpen, setIsOpen] = useState(false);

<AccessibleModal 
    isOpen={isOpen} 
    onClose={() => setIsOpen(false)}
    title="Titre de la modal"
>
    <p>Contenu de la modal</p>
    <button onClick={() => setIsOpen(false)}>
        Fermer
    </button>
</AccessibleModal>
```

### Props
| Prop | Type | Défaut | Description |
|------|------|--------|-------------|
| `isOpen` | boolean | required | État d'ouverture |
| `onClose` | function | required | Callback de fermeture |
| `title` | string | - | Titre affiché en haut |
| `children` | ReactNode | required | Contenu |
| `size` | 'sm'\|'md'\|'lg'\|'xl'\|'full' | 'md' | Taille |
| `showCloseButton` | boolean | true | Afficher bouton X |
| `ariaLabel` | string | title | Label pour lecteur d'écran |
| `className` | string | '' | Classes CSS additionnelles |

### Fonctionnalités
✅ **Focus automatique** sur premier élément focusable  
✅ **Navigation Tab** bouclée dans la modal  
✅ **Touche Escape** pour fermer  
✅ **Click backdrop** pour fermer  
✅ **Restauration focus** après fermeture  
✅ **ARIA complet** (role, aria-modal, aria-labelledby)

### Exemple Complet
```jsx
function MonComposant() {
    const [showConfirm, setShowConfirm] = useState(false);
    
    const handleDelete = () => {
        // Logic
        setShowConfirm(false);
    };
    
    return (
        <>
            <button onClick={() => setShowConfirm(true)}>
                Supprimer
            </button>
            
            <AccessibleModal
                isOpen={showConfirm}
                onClose={() => setShowConfirm(false)}
                title="Confirmer la suppression"
                size="sm"
            >
                <p className="text-gray-300 mb-4">
                    Êtes-vous sûr de vouloir supprimer cet élément ?
                </p>
                <div className="flex gap-3 justify-end">
                    <button 
                        onClick={() => setShowConfirm(false)}
                        className="px-4 py-2 bg-gray-700 rounded-lg"
                    >
                        Annuler
                    </button>
                    <button 
                        onClick={handleDelete}
                        className="px-4 py-2 bg-red-600 rounded-lg"
                    >
                        Supprimer
                    </button>
                </div>
            </AccessibleModal>
        </>
    );
}
```

---

## 2️⃣ FormField - Champs de Formulaire Accessibles

### Import
```javascript
import FormField from '../components/FormField';
```

### Usage Basique
```jsx
const [username, setUsername] = useState('');
const [error, setError] = useState('');

<FormField
    id="username"
    label="Nom d'utilisateur"
    type="text"
    value={username}
    onChange={(e) => setUsername(e.target.value)}
    error={error}
    hint="3-20 caractères alphanumériques"
    required
/>
```

### Props
| Prop | Type | Défaut | Description |
|------|------|--------|-------------|
| `id` | string | required | ID unique |
| `label` | string | required | Label du champ |
| `type` | string | 'text' | Type: text, number, email, password, tel, url, textarea, select |
| `value` | string\|number | required | Valeur |
| `onChange` | function | required | Callback de changement |
| `error` | string | - | Message d'erreur |
| `hint` | string | - | Texte d'aide |
| `required` | boolean | false | Champ obligatoire |
| `disabled` | boolean | false | Champ désactivé |
| `placeholder` | string | - | Placeholder |
| `options` | array | [] | Options pour select: [{value, label}] |
| `rows` | number | 4 | Lignes pour textarea |
| `className` | string | '' | Classes CSS additionnelles |

### Types Supportés

#### Input Text
```jsx
<FormField
    id="email"
    label="Email"
    type="email"
    value={email}
    onChange={(e) => setEmail(e.target.value)}
    placeholder="vous@example.com"
    required
/>
```

#### Textarea
```jsx
<FormField
    id="description"
    label="Description"
    type="textarea"
    value={description}
    onChange={(e) => setDescription(e.target.value)}
    rows={6}
    hint="Maximum 500 caractères"
/>
```

#### Select
```jsx
<FormField
    id="drinkType"
    label="Type de boisson"
    type="select"
    value={drinkType}
    onChange={(e) => setDrinkType(e.target.value)}
    options={[
        { value: 'beer', label: 'Bière' },
        { value: 'wine', label: 'Vin' },
        { value: 'cocktail', label: 'Cocktail' },
        { value: 'soft', label: 'Soft drink' }
    ]}
    required
/>
```

### Validation et Erreurs
```jsx
function FormWithValidation() {
    const [email, setEmail] = useState('');
    const [emailError, setEmailError] = useState('');
    
    const validateEmail = (value) => {
        if (!value) {
            setEmailError('Email requis');
        } else if (!/\S+@\S+\.\S+/.test(value)) {
            setEmailError('Email invalide');
        } else {
            setEmailError('');
        }
    };
    
    return (
        <FormField
            id="email"
            label="Email"
            type="email"
            value={email}
            onChange={(e) => {
                setEmail(e.target.value);
                validateEmail(e.target.value);
            }}
            error={emailError}
            required
        />
    );
}
```

### Fonctionnalités ARIA
✅ **Label lié** avec `htmlFor`  
✅ **Required** avec astérisque visuel  
✅ **aria-invalid** quand erreur  
✅ **aria-describedby** pour hints et erreurs  
✅ **role="alert"** sur messages d'erreur  
✅ **Focus visible** avec ring violet

---

## 3️⃣ ErrorFallback - Gestion d'Erreurs UX

### Import
```javascript
import ErrorFallback, { EmptyState, LoadingFallback } from '../components/ErrorFallback';
```

### ErrorFallback - Affichage d'Erreur

```jsx
const [error, setError] = useState(null);
const [loading, setLoading] = useState(false);

const loadData = async () => {
    try {
        setLoading(true);
        setError(null);
        const data = await fetchData();
    } catch (err) {
        setError(err.message);
    } finally {
        setLoading(false);
    }
};

if (loading) return <LoadingFallback />;
if (error) return <ErrorFallback message={error} onRetry={loadData} />;
```

**Props ErrorFallback**:
- `message` (string) - Message d'erreur
- `onRetry` (function) - Callback pour réessayer

### EmptyState - État Vide

```jsx
if (items.length === 0) {
    return (
        <EmptyState
            title="Aucune soirée"
            message="Créez votre première soirée pour commencer"
            actionLabel="Créer une soirée"
            onAction={() => setShowCreateModal(true)}
        />
    );
}
```

**Props EmptyState**:
- `title` (string) - Titre principal
- `message` (string) - Message explicatif
- `actionLabel` (string) - Label du bouton CTA
- `onAction` (function) - Callback du bouton

### LoadingFallback - Chargement

```jsx
if (loading) {
    return <LoadingFallback message="Chargement des données..." />;
}
```

**Props LoadingFallback**:
- `message` (string, optional) - Message de chargement

---

## 4️⃣ useFocusTrap - Hook Focus Management

### Import
```javascript
import { useFocusTrap, useRestoreFocus } from '../hooks/useFocusTrap';
```

### Usage dans Modal Personnalisée

```jsx
function CustomModal({ isOpen, onClose, children }) {
    const modalRef = useFocusTrap(isOpen);
    useRestoreFocus(isOpen);
    
    if (!isOpen) return null;
    
    return (
        <div className="modal-backdrop">
            <div 
                ref={modalRef}
                role="dialog"
                aria-modal="true"
                className="modal-content"
            >
                {children}
                <button onClick={onClose}>Fermer</button>
            </div>
        </div>
    );
}
```

### Fonctionnement
1. **Focus automatique** sur premier élément focusable
2. **Navigation Tab** bouclée (dernier → premier)
3. **Shift+Tab** inverse (premier → dernier)
4. **Escape** déclenche événement `requestClose`
5. **Restauration focus** quand modal se ferme

### Éléments Focusables Détectés
- `button`
- `[href]` (liens)
- `input`
- `select`
- `textarea`
- `[tabindex]:not([tabindex="-1"])`

---

## 🎨 Standards de Design

### Couleurs Accessibilité
```css
/* index.css - déjà ajouté */
--accessible-text: #ffffff;
--accessible-text-secondary: #d1d5db;
--accessible-border: #4b5563;
--accessible-focus: #8b5cf6; /* violet */
```

### Focus Visible
```css
/* index.css - déjà ajouté */
*:focus-visible {
    outline: 3px solid var(--accessible-focus);
    outline-offset: 2px;
}
```

### Screen Reader Only
```jsx
<span className="sr-only">Texte pour lecteur d'écran uniquement</span>
```

---

## ✅ Checklist Accessibilité

### Pour chaque Modal
- [ ] Utilise AccessibleModal ou useFocusTrap
- [ ] A un `title` ou `aria-label`
- [ ] `role="dialog"` et `aria-modal="true"`
- [ ] Focus automatique sur premier élément
- [ ] Fermeture avec Escape
- [ ] Restauration focus après fermeture

### Pour chaque Formulaire
- [ ] Utilise FormField pour champs
- [ ] Tous les inputs ont un label visible
- [ ] Erreurs affichées avec `role="alert"`
- [ ] Required indiqué visuellement et dans ARIA
- [ ] Hints liés avec `aria-describedby`

### Pour chaque Page
- [ ] Gestion d'erreur avec ErrorFallback
- [ ] État vide avec EmptyState
- [ ] Chargement avec LoadingFallback
- [ ] Bouton retry fonctionnel

---

## 🚀 Exemples d'Intégration

### Remplacer Modal Existante

**Avant**:
```jsx
{showModal && (
    <div className="fixed inset-0 bg-black bg-opacity-50">
        <div className="bg-gray-900 p-6 rounded-lg">
            <h2>Mon titre</h2>
            {/* contenu */}
            <button onClick={() => setShowModal(false)}>X</button>
        </div>
    </div>
)}
```

**Après**:
```jsx
<AccessibleModal
    isOpen={showModal}
    onClose={() => setShowModal(false)}
    title="Mon titre"
>
    {/* contenu */}
</AccessibleModal>
```

### Remplacer Input Manuel

**Avant**:
```jsx
<div>
    <label>Username</label>
    <input 
        value={username} 
        onChange={(e) => setUsername(e.target.value)}
    />
    {error && <span>{error}</span>}
</div>
```

**Après**:
```jsx
<FormField
    id="username"
    label="Username"
    value={username}
    onChange={(e) => setUsername(e.target.value)}
    error={error}
    required
/>
```

---

## 📚 Ressources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM](https://webaim.org/)

---

*Guide généré pour DrinkWise - Version 1.0*
