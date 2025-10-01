import React, { useState, useContext, useEffect } from 'react';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { FirebaseContext } from '../contexts/FirebaseContext.jsx';
import { drinkOptions, partyCategories } from '../utils/data';
import LoadingSpinner from './LoadingSpinner';
import { Save, Trash2, X, PlusCircle } from 'lucide-react';
import { logger } from '../utils/logger.js';

const EditPartyModal = ({ partyData, onClose, onPartyUpdated, onPartyDeleted }) => {
    const { db, user, appId, setMessageBox } = useContext(FirebaseContext);
    
    // États pour les données du formulaire
    const [date, setDate] = useState('');
    const [drinks, setDrinks] = useState([]);
    const [stats, setStats] = useState({
        fights: 0,
        recal: 0,
        vomi: 0,
        elleVeutElleVeut: 0
    });
    const [location, setLocation] = useState('');
    const [category, setCategory] = useState('');
    const [loading, setLoading] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // Initialiser les données du formulaire avec les données de la soirée
    useEffect(() => {
        if (partyData) {
            // Convertir la date Firestore en format HTML date input
            const partyDate = partyData.timestamp?.toDate() || new Date();
            setDate(partyDate.toISOString().split('T')[0]);
            
            setDrinks(partyData.drinks || [{ type: 'Bière', brand: '', quantity: 1 }]);
            setStats({
                fights: partyData.fights || 0,
                recal: partyData.recal || 0,
                vomi: partyData.vomi || 0,
                elleVeutElleVeut: partyData.elleVeutElleVeut || 0
            });
            setLocation(partyData.location || '');
            setCategory(partyData.category || partyCategories[0]);
        }
    }, [partyData]);

    // Gestion des modifications de boissons
    const handleDrinkChange = (index, field, value) => {
        const newDrinks = [...drinks];
        newDrinks[index][field] = field === 'quantity' ? parseInt(value, 10) || 0 : value;
        if (field === 'type') newDrinks[index].brand = '';
        setDrinks(newDrinks);
    };

    const addDrink = () => {
        setDrinks([...drinks, { type: 'Bière', brand: '', quantity: 1 }]);
    };

    const removeDrink = (index) => {
        if (drinks.length > 1) {
            setDrinks(drinks.filter((_, i) => i !== index));
        }
    };

    // Gestion des statistiques
    const handleStatChange = (field, value) => {
        setStats(prev => ({ ...prev, [field]: Math.max(0, Number(value)) }));
    };

    // Sauvegarder les modifications
    const handleUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const updatedData = {
                date,
                drinks,
                ...stats,
                location,
                category,
                updatedAt: new Date()
            };

            const partyRef = doc(db, `artifacts/${appId}/users/${user.uid}/parties`, partyData.id);
            await updateDoc(partyRef, updatedData);

            logger.info('Soirée mise à jour', { partyId: partyData.id });
            setMessageBox({ message: "Soirée mise à jour avec succès !", type: "success" });
            
            if (onPartyUpdated) {
                onPartyUpdated({ ...partyData, ...updatedData });
            }
            
            onClose();
        } catch (error) {
            logger.error('Erreur mise à jour soirée', { error: error.message, partyId: partyData.id });
            setMessageBox({ message: "Erreur lors de la mise à jour.", type: "error" });
        } finally {
            setLoading(false);
        }
    };

    // Supprimer la soirée
    const handleDelete = async () => {
        setLoading(true);

        try {
            const partyRef = doc(db, `artifacts/${appId}/users/${user.uid}/parties`, partyData.id);
            await deleteDoc(partyRef);

            logger.info('Soirée supprimée', { partyId: partyData.id });
            setMessageBox({ message: "Soirée supprimée avec succès.", type: "success" });
            
            if (onPartyDeleted) {
                onPartyDeleted(partyData.id);
            }
            
            onClose();
        } catch (error) {
            logger.error('Erreur suppression soirée', { error: error.message, partyId: partyData.id });
            setMessageBox({ message: "Erreur lors de la suppression.", type: "error" });
        } finally {
            setLoading(false);
        }
    };

    if (!partyData) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px'
        }}>
            <div style={{
                backgroundColor: '#1a1a1a',
                borderRadius: '24px',
                padding: '24px',
                width: '100%',
                maxWidth: '500px',
                maxHeight: '98vh',
                overflow: 'auto',
                position: 'relative',
                border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
                {/* En-tête */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '24px',
                    position: 'relative'
                }}>
                    <h2 style={{
                        color: 'white',
                        fontSize: '20px',
                        fontWeight: '600',
                        margin: 0,
                        textAlign: 'center'
                    }}>
                        ✏️ Modifier la Soirée
                    </h2>
                    
                    <button 
                        onClick={onClose}
                        style={{
                            position: 'absolute',
                            top: '-8px',
                            right: '0',
                            backgroundColor: 'transparent',
                            border: 'none',
                            color: '#9ca3af',
                            cursor: 'pointer',
                            padding: '8px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <X size={24} />
                    </button>
                </div>

                {loading && <LoadingSpinner />}

                <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* Date */}
                    <div>
                        <label style={{
                            display: 'block',
                            color: '#9ca3af',
                            fontSize: '16px',
                            fontWeight: '500',
                            marginBottom: '8px'
                        }}>
                            Date:
                        </label>
                        <input 
                            type="date" 
                            value={date} 
                            onChange={(e) => setDate(e.target.value)} 
                            required
                            style={{
                                width: '100%',
                                padding: '16px 20px',
                                backgroundColor: '#2d3748',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '12px',
                                color: 'white',
                                fontSize: '16px',
                                outline: 'none'
                            }}
                        />
                    </div>

                    {/* Boissons */}
                    <div>
                        <label style={{
                            display: 'block',
                            color: '#9ca3af',
                            fontSize: '16px',
                            fontWeight: '500',
                            marginBottom: '12px'
                        }}>
                            Boissons consommées:
                        </label>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {drinks.map((drink, index) => (
                                <div key={index} style={{
                                    display: 'flex',
                                    gap: '8px',
                                    alignItems: 'center',
                                    backgroundColor: '#2d3748',
                                    padding: '12px',
                                    borderRadius: '12px'
                                }}>
                                    <select 
                                        value={drink.type} 
                                        onChange={(e) => handleDrinkChange(index, 'type', e.target.value)}
                                        style={{
                                            flex: 1,
                                            padding: '10px 12px',
                                            backgroundColor: '#374151',
                                            border: '1px solid rgba(255, 255, 255, 0.1)',
                                            borderRadius: '8px',
                                            color: 'white',
                                            fontSize: '14px',
                                            outline: 'none'
                                        }}
                                    >
                                        {drinkOptions.map(option => (
                                            <option key={option.type} value={option.type} style={{ backgroundColor: '#374151', color: 'white' }}>
                                                {option.type}
                                            </option>
                                        ))}
                                    </select>
                                    
                                    {drinkOptions.find(opt => opt.type === drink.type)?.brands.length > 0 && (
                                        <select 
                                            value={drink.brand} 
                                            onChange={(e) => handleDrinkChange(index, 'brand', e.target.value)}
                                            style={{
                                                flex: 1,
                                                padding: '10px 12px',
                                                backgroundColor: '#374151',
                                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                                borderRadius: '8px',
                                                color: 'white',
                                                fontSize: '14px',
                                                outline: 'none'
                                            }}
                                        >
                                            <option value="" style={{ backgroundColor: '#374151', color: 'white' }}>Marque</option>
                                            {drinkOptions.find(opt => opt.type === drink.type)?.brands.map(brand => (
                                                <option key={brand} value={brand} style={{ backgroundColor: '#374151', color: 'white' }}>
                                                    {brand}
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                    
                                    <input 
                                        type="number" 
                                        value={drink.quantity} 
                                        onChange={(e) => handleDrinkChange(index, 'quantity', e.target.value)} 
                                        min="1"
                                        style={{
                                            width: '50px',
                                            padding: '10px 8px',
                                            backgroundColor: '#374151',
                                            border: '1px solid rgba(255, 255, 255, 0.1)',
                                            borderRadius: '8px',
                                            color: 'white',
                                            fontSize: '14px',
                                            outline: 'none',
                                            textAlign: 'center'
                                        }}
                                    />
                                    
                                    {drinks.length > 1 && (
                                        <button 
                                            type="button" 
                                            onClick={() => removeDrink(index)}
                                            style={{
                                                width: '40px',
                                                height: '40px',
                                                backgroundColor: '#dc2626',
                                                border: 'none',
                                                borderRadius: '8px',
                                                color: 'white',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                        
                        <button 
                            type="button" 
                            onClick={addDrink}
                            style={{
                                width: '100%',
                                padding: '12px',
                                marginTop: '12px',
                                backgroundColor: '#8b45ff',
                                border: 'none',
                                borderRadius: '12px',
                                color: 'white',
                                fontSize: '14px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px'
                            }}
                        >
                            <PlusCircle size={18} />
                            Ajouter une boisson
                        </button>
                    </div>

                    {/* Statistiques */}
                    <div>
                        <label style={{
                            display: 'block',
                            color: '#9ca3af',
                            fontSize: '16px',
                            fontWeight: '500',
                            marginBottom: '12px'
                        }}>
                            Statistiques de la soirée:
                        </label>
                        
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: '16px'
                        }}>

                            
                            <div>
                                <label style={{ display: 'block', color: '#9ca3af', fontSize: '14px', marginBottom: '4px' }}>
                                    Bagarres:
                                </label>
                                <input 
                                    type="number" 
                                    value={stats.fights} 
                                    onChange={(e) => handleStatChange('fights', e.target.value)} 
                                    min="0"
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        backgroundColor: '#2d3748',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        borderRadius: '8px',
                                        color: 'white',
                                        fontSize: '14px',
                                        outline: 'none',
                                        textAlign: 'center'
                                    }}
                                />
                            </div>
                            
                            <div>
                                <label style={{ display: 'block', color: '#9ca3af', fontSize: '14px', marginBottom: '4px' }}>
                                    Récal:
                                </label>
                                <input 
                                    type="number" 
                                    value={stats.recal} 
                                    onChange={(e) => handleStatChange('recal', e.target.value)} 
                                    min="0"
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        backgroundColor: '#2d3748',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        borderRadius: '8px',
                                        color: 'white',
                                        fontSize: '14px',
                                        outline: 'none',
                                        textAlign: 'center'
                                    }}
                                />
                            </div>
                            
                            <div>
                                <label style={{ display: 'block', color: '#9ca3af', fontSize: '14px', marginBottom: '4px' }}>
                                    Vomis:
                                </label>
                                <input 
                                    type="number" 
                                    value={stats.vomi} 
                                    onChange={(e) => handleStatChange('vomi', e.target.value)} 
                                    min="0"
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        backgroundColor: '#2d3748',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        borderRadius: '8px',
                                        color: 'white',
                                        fontSize: '14px',
                                        outline: 'none',
                                        textAlign: 'center'
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Lieu */}
                    <div>
                        <label style={{
                            display: 'block',
                            color: '#9ca3af',
                            fontSize: '16px',
                            fontWeight: '500',
                            marginBottom: '8px'
                        }}>
                            Lieu:
                        </label>
                        <input 
                            type="text" 
                            value={location} 
                            onChange={(e) => setLocation(e.target.value)} 
                            placeholder="Où s'est déroulée la soirée ?"
                            style={{
                                width: '100%',
                                padding: '16px 20px',
                                backgroundColor: '#2d3748',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '12px',
                                color: 'white',
                                fontSize: '16px',
                                outline: 'none'
                            }}
                        />
                    </div>

                    {/* Catégorie */}
                    <div>
                        <label style={{
                            display: 'block',
                            color: '#9ca3af',
                            fontSize: '16px',
                            fontWeight: '500',
                            marginBottom: '8px'
                        }}>
                            Type de soirée:
                        </label>
                        <select 
                            value={category} 
                            onChange={(e) => setCategory(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '16px 20px',
                                backgroundColor: '#2d3748',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '12px',
                                color: 'white',
                                fontSize: '16px',
                                outline: 'none'
                            }}
                        >
                            {partyCategories.map(cat => (
                                <option key={cat} value={cat} style={{ backgroundColor: '#2d3748', color: 'white' }}>
                                    {cat}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Boutons d'action */}
                    <div style={{
                        display: 'flex',
                        gap: '12px',
                        marginTop: '24px'
                    }}>
                        <button 
                            type="submit"
                            disabled={loading}
                            style={{
                                flex: 1,
                                padding: '16px 24px',
                                backgroundColor: '#10b981',
                                border: 'none',
                                borderRadius: '12px',
                                color: 'white',
                                fontSize: '16px',
                                fontWeight: '600',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                opacity: loading ? 0.7 : 1
                            }}
                        >
                            <Save size={20} />
                            {loading ? 'Sauvegarde...' : 'Sauvegarder'}
                        </button>
                        
                        <button 
                            type="button"
                            onClick={() => setShowDeleteConfirm(true)}
                            disabled={loading}
                            style={{
                                padding: '16px 20px',
                                backgroundColor: '#dc2626',
                                border: 'none',
                                borderRadius: '12px',
                                color: 'white',
                                fontSize: '16px',
                                fontWeight: '600',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                opacity: loading ? 0.7 : 1
                            }}
                        >
                            <Trash2 size={20} />
                        </button>
                    </div>
                </form>

                {/* Modal de confirmation de suppression */}
                {showDeleteConfirm && (
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.9)',
                        borderRadius: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexDirection: 'column',
                        padding: '24px'
                    }}>
                        <h3 style={{
                            color: 'white',
                            fontSize: '18px',
                            fontWeight: '600',
                            marginBottom: '16px',
                            textAlign: 'center'
                        }}>
                            🗑️ Supprimer cette soirée ?
                        </h3>
                        
                        <p style={{
                            color: '#9ca3af',
                            fontSize: '14px',
                            textAlign: 'center',
                            marginBottom: '24px',
                            lineHeight: 1.5
                        }}>
                            Cette action est définitive et ne peut pas être annulée.
                        </p>
                        
                        <div style={{
                            display: 'flex',
                            gap: '12px',
                            width: '100%'
                        }}>
                            <button 
                                onClick={() => setShowDeleteConfirm(false)}
                                style={{
                                    flex: 1,
                                    padding: '12px 20px',
                                    backgroundColor: '#6b7280',
                                    border: 'none',
                                    borderRadius: '8px',
                                    color: 'white',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    cursor: 'pointer'
                                }}
                            >
                                Annuler
                            </button>
                            
                            <button 
                                onClick={handleDelete}
                                disabled={loading}
                                style={{
                                    flex: 1,
                                    padding: '12px 20px',
                                    backgroundColor: '#dc2626',
                                    border: 'none',
                                    borderRadius: '8px',
                                    color: 'white',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    cursor: loading ? 'not-allowed' : 'pointer',
                                    opacity: loading ? 0.7 : 1
                                }}
                            >
                                {loading ? 'Suppression...' : 'Supprimer'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EditPartyModal;