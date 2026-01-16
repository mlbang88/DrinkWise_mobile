// src/components/GroupGoals.jsx
import React, { useState, useContext } from 'react';
import { FirebaseContext } from '../contexts/FirebaseContext';
import { groupService } from '../services/groupService';
import LoadingIcon from './LoadingIcon';

export default function GroupGoals({ groupId, groupData, onGoalCreated }) {
    const { db, appId } = useContext(FirebaseContext);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newGoal, setNewGoal] = useState({
        name: '',
        description: '',
        type: 'totalDrinks',
        target: 100
    });
    const [creating, setCreating] = useState(false);

    const goalTypes = [
        { value: 'totalDrinks', label: 'Verres bus', unit: 'verres', icon: '🍺' },
        { value: 'totalParties', label: 'Soirées', unit: 'soirées', icon: '🎉' },
        { value: 'totalVolume', label: 'Volume', unit: 'cL', icon: '🥤' },
        { value: 'challengesCompleted', label: 'Défis complétés', unit: 'défis', icon: '⚡' },
        { value: 'totalBadges', label: 'Badges', unit: 'badges', icon: '🏅' }
    ];

    const handleCreateGoal = async () => {
        if (!newGoal.name.trim() || !newGoal.target) return;

        try {
            setCreating(true);
            await groupService.createGroupGoal(db, appId, groupId, newGoal);
            
            setNewGoal({
                name: '',
                description: '',
                type: 'totalDrinks',
                target: 100
            });
            setShowCreateForm(false);
            
            if (onGoalCreated) onGoalCreated();
        } catch (error) {
            console.error('❌ Erreur création objectif:', error?.message || String(error));
        } finally {
            setCreating(false);
        }
    };

    const calculateProgress = (goal) => {
        const currentValue = groupData.stats?.[goal.type] || 0;
        return Math.min((currentValue / goal.target) * 100, 100);
    };

    const getCurrentValue = (goal) => {
        return groupData.stats?.[goal.type] || 0;
    };

    const getGoalTypeInfo = (type) => {
        return goalTypes.find(gt => gt.value === type) || goalTypes[0];
    };

    const goals = groupData.goals || [];
    const completedGoals = goals.filter(g => g.isCompleted);
    const activeGoals = goals.filter(g => !g.isCompleted);

    return (
        <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '15px',
            padding: '20px',
            marginTop: '20px'
        }}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px'
            }}>
                <h3 style={{ color: '#ccc', margin: 0 }}>🎯 Objectifs de groupe</h3>
                <button
                    onClick={() => setShowCreateForm(true)}
                    style={{
                        backgroundColor: '#8b5cf6',
                        border: 'none',
                        borderRadius: '8px',
                        color: 'white',
                        padding: '8px 15px',
                        cursor: 'pointer',
                        fontSize: '14px'
                    }}
                >
                    + Nouvel objectif
                </button>
            </div>

            {/* Formulaire de création */}
            {showCreateForm && (
                <div style={{
                    backgroundColor: 'rgba(0, 0, 0, 0.3)',
                    borderRadius: '12px',
                    padding: '20px',
                    marginBottom: '20px'
                }}>
                    <h4 style={{ color: 'white', marginBottom: '15px' }}>Créer un nouvel objectif</h4>
                    
                    <input
                        type="text"
                        placeholder="Nom de l'objectif"
                        value={newGoal.name}
                        onChange={(e) => setNewGoal({ ...newGoal, name: e.target.value })}
                        style={{
                            width: '100%',
                            padding: '10px',
                            marginBottom: '10px',
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            borderRadius: '8px',
                            color: 'white',
                            fontSize: '14px'
                        }}
                    />
                    
                    <textarea
                        placeholder="Description (optionnel)"
                        value={newGoal.description}
                        onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
                        rows={2}
                        style={{
                            width: '100%',
                            padding: '10px',
                            marginBottom: '10px',
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            borderRadius: '8px',
                            color: 'white',
                            fontSize: '14px',
                            resize: 'vertical'
                        }}
                    />
                    
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '10px',
                        marginBottom: '15px'
                    }}>
                        <select
                            value={newGoal.type}
                            onChange={(e) => setNewGoal({ ...newGoal, type: e.target.value })}
                            style={{
                                padding: '10px',
                                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                borderRadius: '8px',
                                color: 'white',
                                fontSize: '14px'
                            }}
                        >
                            {goalTypes.map(type => (
                                <option key={type.value} value={type.value}>
                                    {type.icon} {type.label}
                                </option>
                            ))}
                        </select>
                        
                        <input
                            type="number"
                            placeholder="Objectif"
                            value={newGoal.target}
                            onChange={(e) => setNewGoal({ ...newGoal, target: parseInt(e.target.value) || 0 })}
                            style={{
                                padding: '10px',
                                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                borderRadius: '8px',
                                color: 'white',
                                fontSize: '14px'
                            }}
                        />
                    </div>
                    
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                            onClick={handleCreateGoal}
                            disabled={creating}
                            style={{
                                backgroundColor: '#10b981',
                                border: 'none',
                                borderRadius: '8px',
                                color: 'white',
                                padding: '10px 20px',
                                cursor: creating ? 'not-allowed' : 'pointer',
                                fontSize: '14px',
                                opacity: creating ? 0.7 : 1
                            }}
                        >
                            {creating ? <LoadingIcon /> : 'Créer'}
                        </button>
                        <button
                            onClick={() => setShowCreateForm(false)}
                            style={{
                                backgroundColor: '#6b7280',
                                border: 'none',
                                borderRadius: '8px',
                                color: 'white',
                                padding: '10px 20px',
                                cursor: 'pointer',
                                fontSize: '14px'
                            }}
                        >
                            Annuler
                        </button>
                    </div>
                </div>
            )}

            {/* Objectifs actifs */}
            {activeGoals.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                    <h4 style={{ color: '#ccc', marginBottom: '15px' }}>🎯 Objectifs en cours</h4>
                    <div style={{ display: 'grid', gap: '15px' }}>
                        {activeGoals.map(goal => {
                            const typeInfo = getGoalTypeInfo(goal.type);
                            const progress = calculateProgress(goal);
                            const currentValue = getCurrentValue(goal);
                            
                            return (
                                <div
                                    key={goal.id}
                                    style={{
                                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                        borderRadius: '12px',
                                        padding: '15px',
                                        border: '1px solid rgba(255, 255, 255, 0.1)'
                                    }}
                                >
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'flex-start',
                                        marginBottom: '10px'
                                    }}>
                                        <div>
                                            <h5 style={{ 
                                                color: 'white', 
                                                margin: 0, 
                                                marginBottom: '5px',
                                                fontSize: '16px' 
                                            }}>
                                                {typeInfo.icon} {goal.name}
                                            </h5>
                                            {goal.description && (
                                                <p style={{ 
                                                    color: '#9ca3af', 
                                                    fontSize: '12px', 
                                                    margin: 0 
                                                }}>
                                                    {goal.description}
                                                </p>
                                            )}
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ 
                                                color: progress >= 100 ? '#10b981' : '#fbbf24', 
                                                fontWeight: 'bold' 
                                            }}>
                                                {currentValue} / {goal.target}
                                            </div>
                                            <div style={{ 
                                                color: '#9ca3af', 
                                                fontSize: '12px' 
                                            }}>
                                                {typeInfo.unit}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div style={{
                                        width: '100%',
                                        height: '8px',
                                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                        borderRadius: '4px',
                                        overflow: 'hidden',
                                        marginBottom: '8px'
                                    }}>
                                        <div style={{
                                            width: `${progress}%`,
                                            height: '100%',
                                            backgroundColor: progress >= 100 ? '#10b981' : '#8b5cf6',
                                            borderRadius: '4px',
                                            transition: 'width 0.3s ease'
                                        }}></div>
                                    </div>
                                    
                                    <div style={{
                                        fontSize: '12px',
                                        color: progress >= 100 ? '#10b981' : '#9ca3af'
                                    }}>
                                        {progress >= 100 ? '🎉 Objectif atteint !' : `${Math.round(progress)}% complété`}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Objectifs complétés */}
            {completedGoals.length > 0 && (
                <div>
                    <h4 style={{ color: '#ccc', marginBottom: '15px' }}>✅ Objectifs complétés</h4>
                    <div style={{ display: 'grid', gap: '10px' }}>
                        {completedGoals.map(goal => {
                            const typeInfo = getGoalTypeInfo(goal.type);
                            
                            return (
                                <div
                                    key={goal.id}
                                    style={{
                                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                                        borderRadius: '12px',
                                        padding: '15px',
                                        border: '1px solid #10b981'
                                    }}
                                >
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}>
                                        <div>
                                            <h5 style={{ 
                                                color: '#10b981', 
                                                margin: 0, 
                                                fontSize: '16px' 
                                            }}>
                                                ✅ {typeInfo.icon} {goal.name}
                                            </h5>
                                            {goal.description && (
                                                <p style={{ 
                                                    color: '#9ca3af', 
                                                    fontSize: '12px', 
                                                    margin: '5px 0 0 0' 
                                                }}>
                                                    {goal.description}
                                                </p>
                                            )}
                                        </div>
                                        <div style={{ 
                                            color: '#10b981', 
                                            fontWeight: 'bold',
                                            textAlign: 'right'
                                        }}>
                                            {goal.target} {typeInfo.unit}
                                            <div style={{ 
                                                fontSize: '12px', 
                                                color: '#9ca3af',
                                                fontWeight: 'normal'
                                            }}>
                                                Complété
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {goals.length === 0 && (
                <div style={{
                    textAlign: 'center',
                    color: '#9ca3af',
                    padding: '40px',
                    fontSize: '14px'
                }}>
                    Aucun objectif créé. Créez votre premier défi de groupe !
                </div>
            )}
        </div>
    );
}
