import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

// Check if Haptics is available (mobile only)
const isHapticsAvailable = async () => {
  try {
    // Try to vibrate to check if available
    await Haptics.impact({ style: ImpactStyle.Light });
    return true;
  } catch (error) {
    return false;
  }
};

export const hapticFeedback = {
  // Light impact - for subtle interactions (button press, tab switch)
  light: async () => {
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch (error) {
      // Silently fail on web/desktop
    }
  },

  // Medium impact - for standard interactions (like, selection)
  medium: async () => {
    try {
      await Haptics.impact({ style: ImpactStyle.Medium });
    } catch (error) {
      // Silently fail on web/desktop
    }
  },

  // Heavy impact - for significant actions (delete, submit)
  heavy: async () => {
    try {
      await Haptics.impact({ style: ImpactStyle.Heavy });
    } catch (error) {
      // Silently fail on web/desktop
    }
  },

  // Success notification - for completed actions
  success: async () => {
    try {
      await Haptics.notification({ type: NotificationType.Success });
    } catch (error) {
      // Silently fail on web/desktop
    }
  },

  // Warning notification - for warnings
  warning: async () => {
    try {
      await Haptics.notification({ type: NotificationType.Warning });
    } catch (error) {
      // Silently fail on web/desktop
    }
  },

  // Error notification - for errors
  error: async () => {
    try {
      await Haptics.notification({ type: NotificationType.Error });
    } catch (error) {
      // Silently fail on web/desktop
    }
  },

  // Selection changed - for picker/selector changes
  selection: async () => {
    try {
      await Haptics.selectionChanged();
    } catch (error) {
      // Silently fail on web/desktop
    }
  },

  // Check if haptics is available
  isAvailable: isHapticsAvailable,
};

export default hapticFeedback;
