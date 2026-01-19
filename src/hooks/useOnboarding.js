import { useState, useEffect } from 'react';

export function useOnboarding() {
    const [shouldShowOnboarding, setShouldShowOnboarding] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        checkOnboardingStatus();
    }, []);

    const checkOnboardingStatus = () => {
        try {
            const completed = localStorage.getItem('onboarding_completed');
            const hasAccount = localStorage.getItem('hasAccount'); // or check Firebase auth
            
            // Show onboarding if:
            // 1. Never completed before
            // 2. User is new (no account or first login)
            setShouldShowOnboarding(!completed);
        } catch (error) {
            console.error('Failed to check onboarding status', error);
            setShouldShowOnboarding(false);
        } finally {
            setIsLoading(false);
        }
    };

    const completeOnboarding = () => {
        try {
            localStorage.setItem('onboarding_completed', 'true');
            localStorage.setItem('onboarding_date', new Date().toISOString());
            setShouldShowOnboarding(false);
        } catch (error) {
            console.error('Failed to save onboarding completion', error);
        }
    };

    const skipOnboarding = () => {
        completeOnboarding();
    };

    const resetOnboarding = () => {
        try {
            localStorage.removeItem('onboarding_completed');
            localStorage.removeItem('onboarding_date');
            setShouldShowOnboarding(true);
        } catch (error) {
            console.error('Failed to reset onboarding', error);
        }
    };

    return {
        shouldShowOnboarding,
        isLoading,
        completeOnboarding,
        skipOnboarding,
        resetOnboarding
    };
}
