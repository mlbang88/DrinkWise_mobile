import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import App from './App.jsx';
import MobileTestPage from './components/MobileTestPage.jsx';
import ClassementTest from './components/ClassementTest.jsx';
import ResponsiveCheck from './components/ResponsiveCheck.jsx';
import NotificationTest from './components/NotificationTest.jsx';
import NotificationTester from './components/NotificationTester.jsx';

const TestApp = () => {
    return (
        <Router>
            <div>
                <nav style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.9)',
                    padding: '6px',
                    zIndex: 1000,
                    display: 'flex',
                    gap: '4px',
                    justifyContent: 'center',
                    flexWrap: 'wrap'
                }}>
                    <Link 
                        to="/"
                        style={{
                            color: 'white',
                            textDecoration: 'none',
                            padding: '3px 6px',
                            backgroundColor: '#3b82f6',
                            borderRadius: '3px',
                            fontSize: '9px'
                        }}
                    >
                        App
                    </Link>
                    <Link 
                        to="/test"
                        style={{
                            color: 'white',
                            textDecoration: 'none',
                            padding: '3px 6px',
                            backgroundColor: '#22c55e',
                            borderRadius: '3px',
                            fontSize: '9px'
                        }}
                    >
                        Mobile
                    </Link>
                    <Link 
                        to="/classement"
                        style={{
                            color: 'white',
                            textDecoration: 'none',
                            padding: '3px 6px',
                            backgroundColor: '#f59e0b',
                            borderRadius: '3px',
                            fontSize: '9px'
                        }}
                    >
                        Classement
                    </Link>
                    <Link 
                        to="/check"
                        style={{
                            color: 'white',
                            textDecoration: 'none',
                            padding: '3px 6px',
                            backgroundColor: '#8b5cf6',
                            borderRadius: '3px',
                            fontSize: '9px'
                        }}
                    >
                        Bilan
                    </Link>
                    <Link 
                        to="/notifications"
                        style={{
                            color: 'white',
                            textDecoration: 'none',
                            padding: '3px 6px',
                            backgroundColor: '#ef4444',
                            borderRadius: '3px',
                            fontSize: '9px'
                        }}
                    >
                        🔔 Notifs
                    </Link>
                    <Link 
                        to="/notification-tester"
                        style={{
                            color: 'white',
                            textDecoration: 'none',
                            padding: '3px 6px',
                            backgroundColor: '#10b981',
                            borderRadius: '3px',
                            fontSize: '9px'
                        }}
                    >
                        🧪 Test
                    </Link>
                </nav>
                
                <div style={{ paddingTop: '40px' }}>
                    <Routes>
                        <Route path="/" element={<App />} />
                        <Route path="/test" element={<MobileTestPage />} />
                        <Route path="/classement" element={<ClassementTest />} />
                        <Route path="/check" element={<ResponsiveCheck />} />
                        <Route path="/notifications" element={<NotificationTest />} />
                        <Route path="/notification-tester" element={<NotificationTester />} />
                    </Routes>
                </div>
            </div>
        </Router>
    );
};

export default TestApp;
