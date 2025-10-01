// AnimatedInput.jsx - Input avec animations et micro-interactions
import React, { useState, useRef } from 'react';

const AnimatedInput = ({ 
    label,
    type = 'text',
    value,
    onChange,
    placeholder = '',
    required = false,
    disabled = false,
    error = '',
    style = {},
    className = '',
    ...props 
}) => {
    const [isFocused, setIsFocused] = useState(false);
    const [hasValue, setHasValue] = useState(Boolean(value));
    const inputRef = useRef(null);

    const handleFocus = (e) => {
        setIsFocused(true);
        if (props.onFocus) props.onFocus(e);
    };

    const handleBlur = (e) => {
        setIsFocused(false);
        setHasValue(Boolean(e.target.value));
        if (props.onBlur) props.onBlur(e);
    };

    const handleChange = (e) => {
        setHasValue(Boolean(e.target.value));
        if (onChange) onChange(e);
    };

    const containerStyle = {
        position: 'relative',
        marginBottom: '20px',
        ...style
    };

    const labelStyle = {
        position: 'absolute',
        left: '20px',
        top: isFocused || hasValue ? '-6px' : '50%',
        transform: isFocused || hasValue ? 'translateY(0)' : 'translateY(-50%)',
        fontSize: isFocused || hasValue ? '12px' : '15px',
        fontWeight: '600',
        backgroundImage: isFocused || hasValue 
            ? 'linear-gradient(135deg, #8b5cf6, #c084fc)' 
            : 'linear-gradient(135deg, #e2e8f0, #cbd5e1)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        transition: 'all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)',
        pointerEvents: 'none',
        zIndex: 1,
        paddingLeft: isFocused || hasValue ? '8px' : '0',
        paddingRight: isFocused || hasValue ? '8px' : '0',
        backgroundColor: isFocused || hasValue ? 'rgba(30, 30, 60, 0.9)' : 'transparent',
        borderRadius: isFocused || hasValue ? '6px' : '0',
        letterSpacing: '-0.01em'
    };

    const inputStyle = {
        width: '100%',
        padding: '16px 20px',
        background: isFocused 
            ? 'rgba(255, 255, 255, 0.12)' 
            : 'rgba(255, 255, 255, 0.08)',
        backdropFilter: 'blur(10px)',
        border: `1px solid ${isFocused 
            ? 'rgba(139, 92, 246, 0.6)' 
            : error 
                ? 'rgba(239, 68, 68, 0.5)'
                : 'rgba(255, 255, 255, 0.2)'}`,
        borderRadius: '16px',
        color: 'white',
        fontSize: '15px',
        outline: 'none',
        transition: 'all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)',
        boxShadow: isFocused 
            ? '0 8px 20px rgba(139, 92, 246, 0.2)' 
            : '0 4px 12px rgba(0, 0, 0, 0.1)',
        transform: isFocused ? 'translateY(-1px)' : 'translateY(0)',
        opacity: disabled ? 0.6 : 1,
        cursor: disabled ? 'not-allowed' : 'text'
    };

    const errorStyle = {
        position: 'absolute',
        bottom: '-18px',
        left: '20px',
        fontSize: '12px',
        color: '#ef4444',
        fontWeight: '500',
        opacity: error ? 1 : 0,
        transform: error ? 'translateY(0)' : 'translateY(-5px)',
        transition: 'all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)'
    };

    // Animation pour l'indicateur de focus
    const focusIndicatorStyle = {
        position: 'absolute',
        bottom: '0',
        left: '50%',
        transform: 'translateX(-50%)',
        width: isFocused ? '60%' : '0%',
        height: '2px',
        background: 'linear-gradient(135deg, #8b5cf6, #c084fc)',
        borderRadius: '2px',
        transition: 'width 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)',
    };

    return (
        <div style={containerStyle}>
            {label && (
                <label style={labelStyle}>
                    {label}
                    {required && <span style={{ color: '#ef4444' }}>*</span>}
                </label>
            )}
            
            <div style={{ position: 'relative' }}>
                <input
                    {...props}
                    ref={inputRef}
                    type={type}
                    value={value}
                    onChange={handleChange}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    placeholder={placeholder}
                    required={required}
                    disabled={disabled}
                    style={inputStyle}
                    className={className}
                />
                
                <div style={focusIndicatorStyle} />
            </div>
            
            {error && (
                <div style={errorStyle}>
                    {error}
                </div>
            )}
        </div>
    );
};

export default AnimatedInput;