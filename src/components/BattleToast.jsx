import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Flame, Crown, AlertCircle } from 'lucide-react';

/**
 * BattleToast - Notifications visuelles pour les événements de bataille
 */
const BattleToast = ({ message, type = 'info', duration = 3000, onClose }) => {
    useEffect(() => {
        if (duration > 0) {
            const timer = setTimeout(() => {
                onClose();
            }, duration);

            return () => clearTimeout(timer);
        }
    }, [duration, onClose]);

    const configs = {
        victory: {
            icon: Trophy,
            gradient: 'from-yellow-500 to-orange-500',
            borderColor: 'border-yellow-500/50'
        },
        defeat: {
            icon: AlertCircle,
            gradient: 'from-gray-600 to-gray-700',
            borderColor: 'border-gray-500/50'
        },
        leader: {
            icon: Crown,
            gradient: 'from-purple-600 to-pink-600',
            borderColor: 'border-purple-500/50'
        },
        combo: {
            icon: Flame,
            gradient: 'from-orange-500 to-red-600',
            borderColor: 'border-orange-500/50'
        },
        info: {
            icon: AlertCircle,
            gradient: 'from-blue-600 to-blue-700',
            borderColor: 'border-blue-500/50'
        }
    };

    const config = configs[type] || configs.info;
    const Icon = config.icon;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: -50, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -50, scale: 0.9 }}
                transition={{ type: 'spring', bounce: 0.4 }}
                className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-[100] max-w-md w-full mx-4`}
            >
                <div className={`bg-gradient-to-r ${config.gradient} rounded-2xl shadow-2xl border-2 ${config.borderColor} p-4`}>
                    <div className="flex items-center gap-3">
                        <div className="flex-shrink-0">
                            <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                                <Icon className="text-white" size={20} />
                            </div>
                        </div>
                        <div className="flex-1">
                            <p className="text-white font-medium text-sm leading-tight">
                                {message}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="flex-shrink-0 text-white/60 hover:text-white transition-colors"
                        >
                            ✕
                        </button>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default BattleToast;
