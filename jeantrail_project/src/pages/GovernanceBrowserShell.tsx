import React, { useState } from 'react';

export default function GovernanceBrowserShell() {
  const [activeTab, setActiveTab] = useState<string>('Web');
  
  // Static Data
  const tabs = [
    { key: 'Proxies', icon: '🛡️' },
    { key: 'Local Device', icon: '💻' },
    { key: 'Web', icon: '🌐' },
    { key: 'Mobile App Emulator', icon: '📱' }
  ];

  return (
    <div className="flex flex-col h-screen bg-gray-100 font-sans text-gray-900 overflow-hidden">
      
      {/* --- TOP BROWSER BAR --- */}
      <header className="bg-gray-50 border-b border-gray-400 p-2 flex items-start gap-4 shadow-sm select-none">
        
        {/* LEFT SECTION: Ads, 2x2 Grid, Jean Icon */}
        <div className="flex items-start gap-3">
          
          {/* 1. Ad Box (Sponsors) - Top-Left */}
          <div className="w-20 h-20 border border-gray-300 bg-white flex flex-col shadow-sm relative group cursor-default">
             <div className="absolute top-0 left-0 right-0 bg-gray-100 text-[8px] text-center text-gray-500 border-b border-gray-200">Sponsors</div>
             <div className="flex-1 flex flex-col justify-center items-center gap-1 p-1 mt-3">
               <div className="text-[9px] font-bold text-blue-800">PARTNER A</div>
               <div className="text-[9px] font-bold text-red-800">PARTNER B</div>
               <div className="text-[9px] font-bold text-green-800">PARTNER C</div>
             </div>
          </div>

          {/* 2. 2x2 Icons Grid (Profile, Settings, Accounts, Services) */}
          <div className="w-20 h-20 grid grid-cols-2 grid-rows-2 gap-px bg-gray-300 border border-gray-400 shadow-sm">
            <div className="bg-gray-100 hover:bg-gray-200 flex items-center justify-center cursor-pointer" title="Profile">👤</div>
            <div className="bg-gray-100 hover:bg-gray-200 flex items-center justify-center cursor-pointer" title="Settings">⚙️</div>
            <div className="bg-gray-100 hover:bg-gray-200 flex items-center justify-center cursor-pointer" title="Accounts">👥</div>
            <div className="bg-gray-100 hover:bg-gray-200 flex items-center justify-center cursor-pointer" title="Services">🛠️</div>
          </div>

          {/* 3. Circular Jean Icon (Equal size to 2x2 combined -> w-20 h-20) */}
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 border-2 border-white shadow-md flex items-center justify-center text-white text-3xl font-bold">
            J
          </div>

        </div>

        {/* CENTER SECTION */}
        <div className="flex-1 flex flex-col items-center">
          
          {/* Two horizontal bars (Visual decoration) */}
          <div className="w-full flex flex-col gap-1 mb-2 opacity-30">
            <div className="h-[1px] bg-gray-800 w-1/3 mx-auto"></div>
            <div className="h-[1px] bg-gray-800 w-1/4 mx-auto"></div>
          </div>

          {/* Four Static Tabs */}
          <div className="flex items-center gap-2 mb-2">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`
                  relative px-4 py-1 rounded-t-lg border-t border-x border-b-0 text-xs font-medium transition-all
                  flex items-center gap-2
                  ${activeTab === tab.key 
                    ? 'bg-white border-gray-400 shadow-[0_2px_0_0_white] z-10' 
                    : 'bg-gray-200 border-gray-300 text-gray-500 hover:bg-gray-100'}
                `}
              >
                <span className={`text-sm ${activeTab === tab.key ? 'text-blue-600' : 'text-gray-400'}`}>
                  {tab.icon}
                </span>
                {tab.key}
              </button>
            ))}
          </div>

          {/* Address Bar & Icons Area */}
          <div className="w-full max-w-4xl bg-white border border-gray-300 rounded px-2 py-1 flex items-center gap-3 shadow-inner">
            
            {/* Address Input (Non-functional) */}
            <div className="flex-1 bg-gray-50 border border-gray-200 rounded px-2 py-1 text-sm text-gray-500 select-none cursor-not-allowed flex items-center">
              <span className="text-gray-400 mr-2">🔒</span>
              jean://{activeTab.toLowerCase().replace(/ /g, '-')}
            </div>

            {/* Right Icons: Extensions, Favorites, Info */}
            <div className="flex items-center gap-2 text-gray-600">
              <div className="p-1 hover:bg-gray-100 rounded cursor-pointer" title="Extensions">
                🧩
              </div>
              <div className="p-1 hover:bg-gray-100 rounded cursor-pointer" title="Favorites">
                ⭐
              </div>
              <div className="relative group p-1 hover:bg-gray-100 rounded cursor-pointer">
                ℹ️
                {/* Info Hover Tooltip */}
                <div className="absolute top-full right-0 mt-2 w-48 p-2 bg-black text-white text-[10px] rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                  <p>Site Info: JeanTrail Secure</p>
                  <p className="text-gray-400">Verified Static Content</p>
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* RIGHT SPACER (To balance layout if needed, or just empty) */}
        <div className="w-20 hidden md:block"></div>

      </header>

      {/* --- MAIN CONTENT AREA (Placeholder) --- */}
      <main className="flex-1 flex items-center justify-center bg-gray-100 relative overflow-hidden">
        <div className="text-center opacity-50 select-none pointer-events-none">
          <div className="text-6xl mb-4 grayscale">
            {tabs.find(t => t.key === activeTab)?.icon}
          </div>
          <h1 className="text-2xl font-bold text-gray-400 uppercase tracking-widest">
            {activeTab} VIEW
          </h1>
          <p className="text-sm text-gray-400 mt-2">Static UI Review • Non-Operational</p>
        </div>

        {/* Diagonal Watermark */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden">
             <div className="transform -rotate-12 text-gray-200 text-9xl font-black opacity-20 whitespace-nowrap select-none">
               REVIEW ONLY
             </div>
        </div>
      </main>

      {/* --- BOTTOM BAR (Footer) --- */}
      <footer className="h-7 bg-gray-800 text-gray-300 border-t border-gray-700 flex items-center justify-between px-4 text-[10px] select-none">
        <div className="flex items-center gap-4">
          <span className="font-mono">v1.1-ui-review</span>
          <span className="hidden sm:inline">|</span>
          <span className="text-yellow-500">⚠️ Governance Restrictions Active</span>
        </div>
        
        {/* Static Footer Icons */}
        <div className="flex items-center gap-3">
          <span title="Security Level" className="cursor-help">🛡️ High</span>
          <span title="Network Status" className="cursor-help text-red-400">📡 Offline</span>
          <span title="CPU Usage" className="cursor-help">⚡ 0%</span>
          <span title="Privacy" className="cursor-help">👁️‍🗨️ Blocked</span>
        </div>
      </footer>

    </div>
  );
}
