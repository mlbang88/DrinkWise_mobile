import React from 'react';
import { XCircle } from 'lucide-react';

const MessageBox = ({ message, type, onClose }) => {
    if (!message) return null;
    const typeClasses = { success: "bg-green-500", error: "bg-red-500", info: "bg-blue-500" };
    return (
        <div className={`fixed bottom-4 left-1/2 -translate-x-1/2 p-4 rounded-lg shadow-lg text-white z-50 flex items-center justify-between ${typeClasses[type] || "bg-gray-700"}`}>
            <span>{message}</span>
            <button onClick={onClose} className="ml-4 p-1 rounded-full hover:bg-white/20"><XCircle size={20} /></button>
        </div>
    );
};

export default MessageBox;