import React, { useState } from 'react';

export const DecisionReplayViewer: React.FC = () => {
  const [entries, setEntries] = useState<any[]>([]);

  const handleFile = async (file: File) => {
    const text = await file.text();
    try {
      const data = JSON.parse(text);
      const arr = Array.isArray(data) ? data : data.entries || [];
      setEntries(arr);
    } catch {
      setEntries([]);
    }
  };

  return (
    <div className="min-h-screen bg-black text-gray-300 font-mono text-sm p-6">
      <h1 className="text-xl uppercase tracking-widest text-gray-400 mb-4">Decision Replay Viewer</h1>
      <input type="file" accept="application/json" onChange={e => e.target.files && handleFile(e.target.files[0])} className="mb-4" />
      {entries.length === 0 ? (
        <div className="text-gray-600">Load decision_replay.json to view entries.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {entries.map((e, i) => (
            <div key={i} className="border border-gray-800 rounded p-3">
              <div className="flex justify-between">
                <span className="text-gray-500">{e.timestamp}</span>
                <span className={e.equal ? 'text-green-400' : 'text-yellow-400'}>{e.equal ? 'equal' : 'diff'}</span>
              </div>
              <div className="mt-2 text-gray-200">{e.context}</div>
              <div className="text-[11px] text-gray-500">{e.decision_type}</div>
              <div className="mt-2">
                <div className="text-[11px] text-gray-500">ninja</div>
                <div className="text-gray-300">{e.ninja_advisory}</div>
              </div>
              <div className="mt-2">
                <div className="text-[11px] text-gray-500">internal</div>
                <div className="text-gray-300">{e.internal_advisory}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
