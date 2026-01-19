import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Trophy, Users, MapPin, TrendingUp, 
    Gift, Zap, Heart, Sparkles,
    ChevronRight, Check, X
} from 'lucide-react';
import { enhancedNotifications } from '../../utils/enhancedNotifications';

const ONBOARDING_STEPS = [
    {
        id: 'welcome',
        title: 'Bienvenue sur DrinkWise !',
        description: 'L\'app sociale qui transforme vos soirées en aventures épiques',
        icon: Sparkles,
        color: '#00f0ff'
    },
    {
        id: 'track',
        title: 'Suivez vos soirées',
        description: 'Enregistrez chaque sortie, suivez vos boissons et créez votre historique',
        icon: TrendingUp,
        color: '#ff00ff'
    },
    {
        id: 'badges',
        title: 'Débloquez des badges',
        description: '35+ badges à collectionner selon vos exploits et votre style de fête',
        icon: Trophy,
        color: '#ffd700'
    },
    {
        id: 'friends',
        title: 'Connectez-vous',
        description: 'Ajoutez vos amis, créez des groupes et comparez vos stats',
        icon: Users,
        color: '#00ff88'
    },
    {
        id: 'territory',
        title: 'Conquérez des territoires',
        description: 'Devenez le roi/la reine de vos bars préférés en y passant du temps',
        icon: MapPin,
        color: '#ff6b35'
    },
    {
        id: 'rewards',
        title: 'Gagnez des récompenses',
        description: 'Montez de niveau, complétez des défis et obtenez des avantages exclusifs',
        icon: Gift,
        color: '#a855f7'
    }
];

export default function OnboardingFlow({ onComplete, onSkip }) {
    const [currentStep, setCurrentStep] = useState(0);
    const [direction, setDirection] = useState(1);

    useEffect(() => {
        // Mark that user has seen onboarding
        return () => {
            try {
                localStorage.setItem('onboarding_completed', 'true');
                localStorage.setItem('onboarding_date', new Date().toISOString());
            } catch (error) {
                console.error('Failed to save onboarding status', error);
            }
        };
    }, []);

    const handleNext = () => {
        if (currentStep < ONBOARDING_STEPS.length - 1) {
            setDirection(1);
            setCurrentStep(prev => prev + 1);
        } else {
            handleComplete();
        }
    };

    const handlePrev = () => {
        if (currentStep > 0) {
            setDirection(-1);
            setCurrentStep(prev => prev - 1);
        }
    };

    const handleComplete = () => {
        enhancedNotifications.showSuccess(
            'Prêt à commencer !',
            'Créez votre première soirée pour débuter l\'aventure 🎉'
        );
        onComplete?.();
    };

    const handleSkipAll = () => {
        if (window.confirm('Êtes-vous sûr de vouloir passer l\'introduction ?')) {
            onSkip?.();
        }
    };

    const step = ONBOARDING_STEPS[currentStep];
    const Icon = step.icon;
    const progress = ((currentStep + 1) / ONBOARDING_STEPS.length) * 100;

    const slideVariants = {
        enter: (direction) => ({
            x: direction > 0 ? 1000 : -1000,
            opacity: 0
        }),
        center: {
            zIndex: 1,
            x: 0,
            opacity: 1
        },
        exit: (direction) => ({
            zIndex: 0,
            x: direction < 0 ? 1000 : -1000,
            opacity: 0
        })
    };

    return (
        <div className="fixed inset-0 z-50 bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900">
            {/* Skip button */}
            <button
                onClick={handleSkipAll}
                className="absolute top-4 right-4 z-10 flex items-center gap-2 px-4 py-2 
                         bg-slate-800/60 backdrop-blur-sm rounded-lg border border-slate-700
                         text-slate-300 hover:text-white hover:bg-slate-700/80 
                         transition-all duration-200 font-semibold"
            >
                <span>Passer</span>
                <X size={20} />
            </button>

            {/* Progress bar */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-slate-800">
                <motion.div
                    className="h-full bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                />
            </div>

            {/* Content */}
            <div className="flex flex-col items-center justify-center min-h-screen px-6 py-20">
                <AnimatePresence initial={false} custom={direction} mode="wait">
                    <motion.div
                        key={step.id}
                        custom={direction}
                        variants={slideVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{
                            x: { type: "spring", stiffness: 300, damping: 30 },
                            opacity: { duration: 0.2 }
                        }}
                        className="flex flex-col items-center text-center max-w-md"
                    >
                        {/* Icon */}
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ 
                                type: "spring", 
                                stiffness: 260, 
                                damping: 20,
                                delay: 0.1 
                            }}
                            className="relative mb-8"
                        >
                            <div 
                                className="absolute inset-0 blur-3xl opacity-60 rounded-full"
                                style={{ backgroundColor: step.color }}
                            />
                            <div 
                                className="relative p-8 rounded-full border-2"
                                style={{ 
                                    borderColor: step.color,
                                    backgroundColor: 'rgba(0,0,0,0.3)'
                                }}
                            >
                                <Icon size={64} style={{ color: step.color }} strokeWidth={1.5} />
                            </div>
                        </motion.div>

                        {/* Title */}
                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-3xl font-black mb-4 text-white"
                        >
                            {step.title}
                        </motion.h2>

                        {/* Description */}
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="text-lg text-slate-300 leading-relaxed mb-8"
                        >
                            {step.description}
                        </motion.p>

                        {/* Step indicators */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className="flex gap-2 mb-12"
                        >
                            {ONBOARDING_STEPS.map((s, index) => (
                                <div
                                    key={s.id}
                                    className={`h-2 rounded-full transition-all duration-300 ${
                                        index === currentStep 
                                            ? 'w-8 bg-gradient-to-r from-cyan-500 to-purple-500' 
                                            : index < currentStep
                                            ? 'w-2 bg-green-500'
                                            : 'w-2 bg-slate-700'
                                    }`}
                                />
                            ))}
                        </motion.div>
                    </motion.div>
                </AnimatePresence>

                {/* Navigation */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="flex gap-4 w-full max-w-md"
                >
                    {/* Previous button */}
                    {currentStep > 0 && (
                        <button
                            onClick={handlePrev}
                            className="flex-1 py-4 px-6 rounded-xl border-2 border-slate-600 
                                     bg-slate-800/80 text-white hover:border-slate-500 hover:bg-slate-700/80
                                     backdrop-blur-sm shadow-lg
                                     transition-all duration-200 font-bold"
                        >
                            Précédent
                        </button>
                    )}

                    {/* Next/Complete button */}
                    <button
                        onClick={handleNext}
                        className={`flex-1 py-4 px-6 rounded-xl font-bold text-white
                                   bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500
                                   hover:from-cyan-400 hover:via-purple-400 hover:to-pink-400
                                   shadow-[0_0_30px_rgba(168,85,247,0.4)]
                                   hover:shadow-[0_0_40px_rgba(168,85,247,0.6)]
                                   transform hover:scale-105 active:scale-95
                                   transition-all duration-200
                                   flex items-center justify-center gap-2
                                   ${currentStep === 0 ? 'flex-1' : ''}`}
                    >
                        {currentStep === ONBOARDING_STEPS.length - 1 ? (
                            <>
                                <Check size={20} />
                                <span>Commencer</span>
                            </>
                        ) : (
                            <>
                                <span>Suivant</span>
                                <ChevronRight size={20} />
                            </>
                        )}
                    </button>
                </motion.div>
            </div>

            {/* Background decorations */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-pink-500/5 rounded-full blur-3xl" />
            </div>
        </div>
    );
}
