// src/services/groupMemoryService.js
import { doc, setDoc, collection, Timestamp } from 'firebase/firestore';

export const sharePartyToGroup = async (db, appId, userId, groupId, partyData) => {
    try {
        const memoryRef = doc(collection(db, `artifacts/${appId}/group_memories`));
        
        const groupMemory = {
            ...partyData,
            userId,
            groupId,
            sharedAt: Timestamp.now(),
            isPublic: true,
            type: 'party'
        };
        
        await setDoc(memoryRef, groupMemory);
        
        console.log('✅ Soirée partagée dans les souvenirs du groupe');
        return memoryRef.id;
    } catch (error) {
        console.error('❌ Erreur partage souvenir:', error);
        throw error;
    }
};

export const shareAchievementToGroup = async (db, appId, userId, groupId, achievementData) => {
    try {
        const memoryRef = doc(collection(db, `artifacts/${appId}/group_memories`));
        
        const groupMemory = {
            ...achievementData,
            userId,
            groupId,
            sharedAt: Timestamp.now(),
            isPublic: true,
            type: 'achievement'
        };
        
        await setDoc(memoryRef, groupMemory);
        
        console.log('✅ Achievement partagé dans les souvenirs du groupe');
        return memoryRef.id;
    } catch (error) {
        console.error('❌ Erreur partage achievement:', error);
        throw error;
    }
};
