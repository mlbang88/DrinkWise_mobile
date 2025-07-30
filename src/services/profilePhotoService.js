// src/services/profilePhotoService.js
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';
import { storage } from '../firebase';

export const profilePhotoService = {
    /**
     * Upload d'une photo de profil
     */
    async uploadProfilePhoto(file, userId, appId) {
        try {
            console.log('📸 Upload photo de profil pour:', userId);
            
            // Validation du fichier
            if (!file) {
                throw new Error('Aucun fichier sélectionné');
            }

            // Vérifier la taille du fichier (max 5MB)
            const maxSize = 5 * 1024 * 1024; // 5MB
            if (file.size > maxSize) {
                throw new Error('La photo doit faire moins de 5MB');
            }

            // Vérifier le type de fichier
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
            if (!allowedTypes.includes(file.type)) {
                throw new Error('Format non supporté. Utilisez JPG, PNG ou WebP');
            }

            // Créer la référence de stockage
            const filename = `profile_photos/${appId}/${userId}_${Date.now()}.${file.name.split('.').pop()}`;
            const storageRef = ref(storage, filename);

            // Upload du fichier
            console.log('⬆️ Upload en cours...');
            const snapshot = await uploadBytes(storageRef, file);
            
            // Obtenir l'URL de téléchargement
            const downloadURL = await getDownloadURL(snapshot.ref);
            console.log('✅ Photo uploadée:', downloadURL);

            return {
                url: downloadURL,
                path: filename,
                filename: file.name,
                size: file.size,
                type: file.type
            };
        } catch (error) {
            console.error('❌ Erreur upload photo:', error);
            throw error;
        }
    },

    /**
     * Mettre à jour la photo de profil dans le profil utilisateur
     */
    async updateUserProfilePhoto(db, appId, userId, photoData) {
        try {
            const userProfileRef = doc(db, `artifacts/${appId}/users/${userId}/profile`, 'data');
            await updateDoc(userProfileRef, {
                profilePhoto: photoData,
                updatedAt: new Date()
            });

            // Mettre à jour aussi les stats publiques pour affichage dans les listes
            const publicStatsRef = doc(db, `artifacts/${appId}/public_user_stats`, userId);
            await updateDoc(publicStatsRef, {
                profilePhoto: photoData,
                updatedAt: new Date()
            });

            console.log('✅ Photo de profil mise à jour');
        } catch (error) {
            console.error('❌ Erreur mise à jour profil:', error);
            throw error;
        }
    },

    /**
     * Supprimer une ancienne photo de profil
     */
    async deleteProfilePhoto(photoPath) {
        try {
            if (!photoPath) return;
            
            const photoRef = ref(storage, photoPath);
            await deleteObject(photoRef);
            console.log('✅ Ancienne photo supprimée');
        } catch (error) {
            // Ne pas faire échouer si la photo n'existe pas
            console.warn('⚠️ Impossible de supprimer l\'ancienne photo:', error);
        }
    },

    /**
     * Processus complet de changement de photo de profil
     */
    async changeProfilePhoto(db, appId, userId, file, oldPhotoPath = null) {
        try {
            // Supprimer l'ancienne photo si elle existe
            if (oldPhotoPath) {
                await this.deleteProfilePhoto(oldPhotoPath);
            }

            // Upload de la nouvelle photo
            const photoData = await this.uploadProfilePhoto(file, userId, appId);

            // Mettre à jour le profil
            await this.updateUserProfilePhoto(db, appId, userId, photoData);

            return photoData;
        } catch (error) {
            console.error('❌ Erreur changement photo profil:', error);
            throw error;
        }
    },

    /**
     * Supprimer complètement la photo de profil
     */
    async removeProfilePhoto(db, appId, userId, photoPath) {
        try {
            // Supprimer du storage
            if (photoPath) {
                await this.deleteProfilePhoto(photoPath);
            }

            // Supprimer du profil
            const userProfileRef = doc(db, `artifacts/${appId}/users/${userId}/profile`, 'data');
            await updateDoc(userProfileRef, {
                profilePhoto: null,
                updatedAt: new Date()
            });

            // Supprimer des stats publiques
            const publicStatsRef = doc(db, `artifacts/${appId}/public_user_stats`, userId);
            await updateDoc(publicStatsRef, {
                profilePhoto: null,
                updatedAt: new Date()
            });

            console.log('✅ Photo de profil supprimée');
        } catch (error) {
            console.error('❌ Erreur suppression photo:', error);
            throw error;
        }
    },

    /**
     * Obtenir l'URL de l'avatar par défaut
     */
    getDefaultAvatar(username) {
        // Utiliser un service d'avatar basé sur les initiales
        const initials = username ? username.substring(0, 2).toUpperCase() : 'DW';
        const colors = [
            '4f46e5', '7c3aed', 'db2777', 'dc2626', 'ea580c',
            '059669', '0891b2', '2563eb', '7c2d12', '9333ea'
        ];
        const colorIndex = username ? username.charCodeAt(0) % colors.length : 0;
        const bgColor = colors[colorIndex];
        
        return `https://ui-avatars.com/api/?name=${initials}&background=${bgColor}&color=fff&size=200&font-size=0.6&bold=true`;
    }
};
