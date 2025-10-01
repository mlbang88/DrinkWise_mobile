import React from 'react';

const LoadingSpinner = ({ text = "Chargement..." }) => (
    <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, rgba(15, 15, 35, 0.95), rgba(25, 25, 45, 0.9))',
        backdropFilter: 'blur(20px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white'
    }}>
        <div style={{
            width: '48px',
            height: '48px',
            border: '3px solid rgba(255, 255, 255, 0.2)',
            borderTop: '3px solid #8b5cf6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            marginBottom: '16px',
            boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)'
        }} />
        <p style={{
            backgroundImage: 'linear-gradient(135deg, #ffffff, #e2e8f0)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            fontSize: '18px',
            fontWeight: '600',
            letterSpacing: '-0.01em'
        }}>{text}</p>
        <style>
            {`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}
        </style>
    </div>
);

export default LoadingSpinner;