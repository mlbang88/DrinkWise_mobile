import React, { useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { useFirebase } from '../contexts/FirebaseContext';

const GeminiDebugger = () => {
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState(null);
    const { functions } = useFirebase();

    const testModels = async () => {
        setLoading(true);
        try {
            const listGeminiModels = httpsCallable(functions, 'listGeminiModels');
            const result = await listGeminiModels();
            setResults(result.data);
            console.log('🔍 Résultats des modèles Gemini:', result.data);
        } catch (error) {
            console.error('❌ Erreur test modèles:', error);
            setResults({ success: false, error: error.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 bg-gray-100 rounded-lg m-4">
            <h3 className="text-lg font-bold mb-4">🔍 Debug Gemini Models</h3>
            
            <button 
                onClick={testModels}
                disabled={loading}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
            >
                {loading ? 'Testing...' : 'Test Available Models'}
            </button>

            {results && (
                <div className="mt-4">
                    <h4 className="font-semibold mb-2">Résultats:</h4>
                    <pre className="bg-white p-2 rounded text-sm overflow-auto max-h-96">
                        {JSON.stringify(results, null, 2)}
                    </pre>
                </div>
            )}
        </div>
    );
};

export default GeminiDebugger;