import React from 'react';

const LoadingSpinner = ({ text = "Chargement..." }) => (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        <p className="mt-4 text-lg">{text}</p>
    </div>
);

export default LoadingSpinner;