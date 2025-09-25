// Placeholder.jsx
import React from 'react';
import { Construction } from 'lucide-react';

const Placeholder = ({ sectionLabel }) => {
    return (
        <div className="flex flex-col items-center justify-center h-full bg-slate-800/60 border border-slate-700/50 rounded-lg p-8 text-center">
            <Construction className="h-16 w-16 text-orange-500 mb-6" />
            <h2 className="text-2xl font-bold text-white mb-2">{sectionLabel}</h2>
            <p className="text-slate-400">Esta sección se encuentra actualmente en desarrollo.</p>
            <p className="text-slate-500 mt-1">Vuelve pronto para ver las actualizaciones.</p>
        </div>
    );
};

export default Placeholder;