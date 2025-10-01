import React from 'react';

const LoadingIcon = () => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
            width: '20px',
            height: '20px',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            borderTop: '2px solid white',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            boxShadow: '0 2px 8px rgba(255, 255, 255, 0.2)'
        }} />
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

export default LoadingIcon;