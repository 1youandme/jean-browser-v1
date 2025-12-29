import React from 'react';

export const FreezeBanner: React.FC = () => (
    <div className="bg-red-900/20 border-b border-red-500/50 p-2 text-center select-none">
        <span className="text-red-400 text-xs font-mono uppercase tracking-widest">
            🔒 DECISION FREEZE ACTIVE: NO NEW FEATURES ALLOWED
        </span>
    </div>
);
