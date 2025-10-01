import React, { useState, useEffect, useRef } from 'react';

const AnimatedChart = ({ 
    data = [], 
    type = 'bar', // 'bar', 'line', 'progress', 'donut'
    className = '',
    maxValue = null,
    colors = ['#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#EF4444'],
    animationDuration = 1000,
    staggerDelay = 100,
    showValues = true,
    showLabels = true,
    height = 200
}) => {
    const [animatedValues, setAnimatedValues] = useState([]);
    const [isAnimating, setIsAnimating] = useState(false);
    const chartRef = useRef(null);

    const calculatedMaxValue = maxValue || Math.max(...data.map(item => item.value || item)) * 1.1;

    useEffect(() => {
        setIsAnimating(true);
        setAnimatedValues(new Array(data.length).fill(0));

        data.forEach((item, index) => {
            setTimeout(() => {
                setAnimatedValues(prev => {
                    const newValues = [...prev];
                    newValues[index] = item.value || item;
                    return newValues;
                });
            }, index * staggerDelay);
        });

        setTimeout(() => {
            setIsAnimating(false);
        }, data.length * staggerDelay + animationDuration);
    }, [data, staggerDelay, animationDuration]);

    const renderBarChart = () => (
        <div className="flex items-end justify-between space-x-2" style={{ height }}>
            {data.map((item, index) => {
                const value = item.value || item;
                const label = item.label || `Item ${index + 1}`;
                const animatedValue = animatedValues[index] || 0;
                const percentage = (animatedValue / calculatedMaxValue) * 100;
                const color = colors[index % colors.length];

                return (
                    <div key={index} className="flex-1 flex flex-col items-center space-y-2">
                        <div 
                            className="w-full rounded-t-lg relative overflow-hidden"
                            style={{ 
                                height: `${percentage}%`,
                                minHeight: '4px',
                                backgroundColor: color,
                                transition: `height ${animationDuration}ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`,
                                boxShadow: `0 4px 12px ${color}40`
                            }}
                        >
                            {/* Shine effect */}
                            <div 
                                className="absolute inset-0 bg-gradient-to-t from-transparent to-white/20"
                                style={{
                                    animation: isAnimating ? 'none' : 'pulse 2s ease-in-out infinite alternate'
                                }}
                            />
                            
                            {showValues && animatedValue > 0 && (
                                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-xs font-medium text-white/90">
                                    {Math.round(animatedValue)}
                                </div>
                            )}
                        </div>
                        
                        {showLabels && (
                            <div className="text-xs text-white/70 text-center max-w-full truncate">
                                {label}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );

    const renderProgressBars = () => (
        <div className="space-y-4">
            {data.map((item, index) => {
                const value = item.value || item;
                const label = item.label || `Item ${index + 1}`;
                const animatedValue = animatedValues[index] || 0;
                const percentage = (animatedValue / calculatedMaxValue) * 100;
                const color = colors[index % colors.length];

                return (
                    <div key={index} className="space-y-2">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-white/90">{label}</span>
                            {showValues && (
                                <span className="text-sm font-medium text-white/70">
                                    {Math.round(animatedValue)}
                                </span>
                            )}
                        </div>
                        
                        <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                            <div
                                className="h-full rounded-full relative"
                                style={{
                                    width: `${percentage}%`,
                                    backgroundColor: color,
                                    transition: `width ${animationDuration}ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`,
                                    transitionDelay: `${index * staggerDelay}ms`
                                }}
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/20" />
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );

    const renderDonutChart = () => {
        const total = data.reduce((sum, item) => sum + (item.value || item), 0);
        let currentAngle = -90; // Start from top
        const radius = 60;
        const strokeWidth = 12;
        const normalizedRadius = radius - strokeWidth * 2;
        const circumference = normalizedRadius * 2 * Math.PI;

        return (
            <div className="flex items-center justify-center" style={{ height }}>
                <div className="relative">
                    <svg
                        height={radius * 2}
                        width={radius * 2}
                        className="transform -rotate-90"
                    >
                        {data.map((item, index) => {
                            const value = item.value || item;
                            const animatedValue = animatedValues[index] || 0;
                            const percentage = (animatedValue / total) * 100;
                            const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;
                            const strokeDashoffset = -((currentAngle + 90) / 360) * circumference;
                            const color = colors[index % colors.length];
                            
                            currentAngle += (percentage / 100) * 360;

                            return (
                                <circle
                                    key={index}
                                    stroke={color}
                                    fill="transparent"
                                    strokeWidth={strokeWidth}
                                    strokeDasharray={strokeDasharray}
                                    strokeDashoffset={strokeDashoffset}
                                    r={normalizedRadius}
                                    cx={radius}
                                    cy={radius}
                                    style={{
                                        transition: `stroke-dasharray ${animationDuration}ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`,
                                        transitionDelay: `${index * staggerDelay}ms`,
                                        filter: `drop-shadow(0 2px 4px ${color}40)`
                                    }}
                                />
                            );
                        })}
                    </svg>
                    
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                            <div className="text-xl font-bold text-white">
                                {Math.round(animatedValues.reduce((sum, val) => sum + val, 0))}
                            </div>
                            <div className="text-xs text-white/60">Total</div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderChart = () => {
        switch (type) {
            case 'progress':
                return renderProgressBars();
            case 'donut':
                return renderDonutChart();
            case 'bar':
            default:
                return renderBarChart();
        }
    };

    return (
        <div ref={chartRef} className={`animated-chart ${className}`}>
            {renderChart()}
            
            <style jsx>{`
                .animated-chart {
                    will-change: contents;
                }
                
                @keyframes pulse {
                    0% { opacity: 0.8; }
                    100% { opacity: 1; }
                }
            `}</style>
        </div>
    );
};

export default AnimatedChart;