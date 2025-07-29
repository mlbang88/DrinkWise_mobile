import React from 'react';
import { ArrowLeft, Trophy } from 'lucide-react';

const WrappedSummary = ({ summary, onBack }) => {
    const { stats, narrative, imageUrl, period, title } = summary;

    return (
        <div className="bg-yellow-400 text-black p-6 rounded-2xl shadow-2xl max-w-md mx-auto font-sans animate-scale-in relative">
            <button onClick={onBack} className="absolute top-2 left-2 p-2 rounded-full bg-black/20 hover:bg-black/30 text-white">
                <ArrowLeft size={20} />
            </button>
            <div className="text-center">
                <h2 className="text-3xl font-extrabold mb-4">{title || `Votre ${period}`}</h2>
                <div className="relative inline-block mb-4">
                    <img src={imageUrl || 'https://placehold.co/200x200/000000/FFFFFF?text=?'} alt={stats.mostConsumedDrink.brand || stats.mostConsumedDrink.type} className="w-48 h-48 object-cover rounded-lg shadow-lg mx-auto border-4 border-white" />
                    <div className="absolute -bottom-3 -right-3 bg-purple-600 text-white p-2 rounded-full">
                        <Trophy size={24} />
                    </div>
                </div>
                <h3 className="text-lg font-semibold">Votre Boisson N°1</h3>
                <h2 className="text-4xl font-extrabold my-1">{stats.mostConsumedDrink.brand || stats.mostConsumedDrink.type}</h2>
                <p className="font-bold text-xl">{stats.mostConsumedDrink.quantity} verres bus</p>

                <div className="grid grid-cols-2 gap-2 text-left my-6 bg-yellow-300/50 p-4 rounded-lg">
                    <p><strong>Soirées:</strong> {stats.totalParties}</p>
                    <p><strong>Lieux visités:</strong> {stats.uniqueLocations}</p>
                    <p><strong>Bagarres:</strong> {stats.totalFights}</p>
                    <p><strong>Vomis:</strong> {stats.totalVomi}</p>
                </div>

                <p className="text-lg italic text-gray-800">{narrative}</p>
            </div>
        </div>
    );
};

export default WrappedSummary;