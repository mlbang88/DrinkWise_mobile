// Enhanced Notification Service with rich templates and smart delivery
import { toast } from 'sonner';
import { hapticFeedback } from './haptics';
import { logger } from './logger';

// Sound files mapping
const SOUNDS = {
    achievement: '/sounds/achievement.mp3',
    levelUp: '/sounds/level-up.mp3',
    badge: '/sounds/badge.mp3',
    friend: '/sounds/notification.mp3',
    message: '/sounds/message.mp3',
    success: '/sounds/success.mp3',
    error: '/sounds/error.mp3',
    warning: '/sounds/warning.mp3'
};

class EnhancedNotificationService {
    constructor() {
        this.soundEnabled = this.getSoundPreference();
        this.notificationPermission = null;
        this.audioContext = null;
        this.sounds = {};
    }

    // Initialize audio context and preload sounds
    async initialize() {
        try {
            // Check if AudioContext is supported
            if (typeof AudioContext !== 'undefined' || typeof webkitAudioContext !== 'undefined') {
                this.audioContext = new (AudioContext || webkitAudioContext)();
            }

            // Preload sounds
            await this.preloadSounds();

            // Check notification permission
            if ('Notification' in window) {
                this.notificationPermission = Notification.permission;
            }

            logger.info('Enhanced Notification Service initialized');
        } catch (error) {
            logger.error('Failed to initialize notification service', { error });
        }
    }

    // Preload audio files
    async preloadSounds() {
        const soundPromises = Object.entries(SOUNDS).map(async ([key, path]) => {
            try {
                const audio = new Audio(path);
                audio.preload = 'auto';
                this.sounds[key] = audio;
            } catch (error) {
                logger.warn(`Failed to preload sound: ${key}`, { error });
            }
        });

        await Promise.allSettled(soundPromises);
    }

    // Play sound with fallback
    playSound(soundType, volume = 0.5) {
        if (!this.soundEnabled) return;

        try {
            const sound = this.sounds[soundType];
            if (sound) {
                sound.volume = volume;
                sound.currentTime = 0;
                sound.play().catch(err => {
                    logger.warn(`Failed to play sound: ${soundType}`, { error: err });
                });
            }
        } catch (error) {
            logger.error(`Error playing sound: ${soundType}`, { error });
        }
    }

    // Get sound preference from localStorage
    getSoundPreference() {
        try {
            const pref = localStorage.getItem('soundEnabled');
            return pref === null ? true : pref === 'true';
        } catch {
            return true;
        }
    }

    // Toggle sound on/off
    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        try {
            localStorage.setItem('soundEnabled', String(this.soundEnabled));
        } catch (error) {
            logger.error('Failed to save sound preference', { error });
        }
        return this.soundEnabled;
    }

    // Request notification permission
    async requestPermission() {
        if (!('Notification' in window)) {
            logger.warn('Notifications not supported');
            return false;
        }

        if (this.notificationPermission === 'granted') {
            return true;
        }

        try {
            const permission = await Notification.requestPermission();
            this.notificationPermission = permission;
            return permission === 'granted';
        } catch (error) {
            logger.error('Failed to request notification permission', { error });
            return false;
        }
    }

    // Show achievement notification
    showAchievement(badge) {
        this.playSound('achievement');
        hapticFeedback.success();

        toast.success(`🏆 Badge débloqué !`, {
            description: `${badge.name} - ${badge.description}`,
            duration: 5000,
            action: {
                label: 'Voir',
                onClick: () => {
                    window.location.hash = '#badges';
                }
            }
        });

        // Native notification if permitted
        if (this.notificationPermission === 'granted') {
            new Notification('Badge débloqué !', {
                body: `${badge.name} - ${badge.description}`,
                icon: '/icon-192.png',
                badge: '/icon-badge.png',
                tag: `achievement-${badge.id}`,
                requireInteraction: false
            });
        }
    }

    // Show level up notification
    showLevelUp(newLevel, levelName) {
        this.playSound('levelUp');
        hapticFeedback.success();

        toast.success(`🎉 Niveau supérieur !`, {
            description: `Vous êtes maintenant ${levelName} (Niveau ${newLevel})`,
            duration: 5000
        });

        if (this.notificationPermission === 'granted') {
            new Notification('Niveau supérieur !', {
                body: `Vous êtes maintenant ${levelName} (Niveau ${newLevel})`,
                icon: '/icon-192.png',
                tag: 'level-up'
            });
        }
    }

    // Show friend request notification
    showFriendRequest(friendName) {
        this.playSound('friend');
        hapticFeedback.notification();

        toast.info(`👥 Nouvelle demande d'ami`, {
            description: `${friendName} veut être votre ami`,
            duration: 6000,
            action: {
                label: 'Voir',
                onClick: () => {
                    window.location.hash = '#friends';
                }
            }
        });
    }

    // Show new message notification
    showMessage(senderName, preview) {
        this.playSound('message');
        hapticFeedback.notification();

        toast.info(`💬 ${senderName}`, {
            description: preview,
            duration: 4000,
            action: {
                label: 'Répondre',
                onClick: () => {
                    // Navigate to chat
                }
            }
        });
    }

    // Show party saved notification
    showPartySaved(xpEarned, badgesUnlocked = []) {
        this.playSound('success');
        hapticFeedback.success();

        const description = badgesUnlocked.length > 0
            ? `+${xpEarned} XP et ${badgesUnlocked.length} badge(s) débloqué(s) !`
            : `+${xpEarned} XP gagné !`;

        toast.success('🎉 Soirée enregistrée !', {
            description,
            duration: 4000
        });
    }

    // Show battle victory notification
    showBattleVictory(opponentName, pointsEarned) {
        this.playSound('achievement');
        hapticFeedback.impact('medium');

        toast.success('⚔️ Victoire !', {
            description: `Vous avez battu ${opponentName} ! +${pointsEarned} pts`,
            duration: 5000
        });
    }

    // Show challenge completed notification
    showChallengeCompleted(challengeName, xpReward) {
        this.playSound('achievement');
        hapticFeedback.success();

        toast.success('✅ Défi complété !', {
            description: `${challengeName} - +${xpReward} XP`,
            duration: 4000
        });
    }

    // Show territory captured notification
    showTerritoryCaptured(venueName) {
        this.playSound('achievement');
        hapticFeedback.impact('medium');

        toast.success('🏴 Territoire conquis !', {
            description: `Vous contrôlez maintenant ${venueName}`,
            duration: 5000
        });
    }

    // Show generic success
    showSuccess(title, description) {
        this.playSound('success');
        hapticFeedback.success();

        toast.success(title, {
            description,
            duration: 3000
        });
    }

    // Show generic error
    showError(title, description) {
        this.playSound('error');
        hapticFeedback.error();

        toast.error(title, {
            description,
            duration: 4000
        });
    }

    // Show generic warning
    showWarning(title, description) {
        this.playSound('warning');
        hapticFeedback.warning();

        toast.warning(title, {
            description,
            duration: 4000
        });
    }

    // Show generic info
    showInfo(title, description, action) {
        toast.info(title, {
            description,
            duration: 4000,
            action
        });
    }

    // Show loading toast (returns dismiss function)
    showLoading(message) {
        return toast.loading(message);
    }

    // Dismiss toast
    dismiss(toastId) {
        if (toastId) {
            toast.dismiss(toastId);
        } else {
            toast.dismiss();
        }
    }
}

// Export singleton instance
export const enhancedNotifications = new EnhancedNotificationService();

// Initialize on load
if (typeof window !== 'undefined') {
    enhancedNotifications.initialize();
}

export default enhancedNotifications;
