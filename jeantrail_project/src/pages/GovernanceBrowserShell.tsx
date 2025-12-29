import React, { useState } from 'react';

export default function GovernanceBrowserShell() {
  const tabs = [
    { key: 'Proxy', icon: 'P' },
    { key: 'Local Device', icon: 'L' },
    { key: 'Web', icon: 'W' },
    { key: 'Mobile Emulator', icon: 'M' }
  ];
  const [activeTab, setActiveTab] = useState<string>('Web');
  const [showAds, setShowAds] = useState(false);
  const homepage = 'https://jeantrail.com';
  return (
    <div className="min-h-screen bg-gray-100 text-gray-900">
      <div className="fixed top-0 left-0 right-0 bg-white border-b border-gray-300">
        <div className="h-14 px-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              type="button"
              className="w-14 h-14 bg-gray-50 border border-gray-300 flex items-center justify-center text-xs font-semibold"
              onClick={() => setShowAds(!showAds)}
              aria-label="Ads"
            >
              Ads
            </button>
          </div>
          <div className="flex flex-col items-center w-1/2">
            <div className="w-full h-6 border-t border-b border-gray-300 bg-white flex items-center justify-center">
              <nav className="flex items-center gap-2" aria-label="Top Tabs">
                {tabs.map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    className={`h-5 px-3 text-xs border ${
                      activeTab === t.key ? 'bg-gray-200 border-gray-400 font-semibold' : 'bg-gray-50 border-gray-300'
                    } flex items-center gap-2`}
                    onClick={() => setActiveTab(t.key)}
                    aria-current={activeTab === t.key ? 'page' : undefined}
                  >
                    <span
                      className={`w-4 h-4 border ${
                        activeTab === t.key ? 'bg-gray-500 border-gray-600' : 'bg-gray-100 border-gray-300'
                      } flex items-center justify-center text-[10px] text-white`}
                      aria-hidden="true"
                    >
                      {t.icon}
                    </span>
                    {t.key}
                  </button>
                ))}
              </nav>
            </div>
            <div className="w-full h-6 border-t border-b border-gray-300 bg-white"></div>
            <div className="w-full h-9 bg-gray-50 border border-gray-300 px-3 text-sm flex items-center justify-between group">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 border border-gray-300 bg-white text-[10px] flex items-center justify-center">Ext</div>
                <div className="w-6 h-6 border border-gray-300 bg-white text-[10px] flex items-center justify-center">Fav</div>
                <input
                  className="w-[36rem] h-6 bg-white border border-gray-300 px-2 text-xs"
                  value={homepage}
                  readOnly
                  aria-readonly="true"
                />
              </div>
              <div className="w-6 h-6 border border-gray-300 bg-white text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                Info
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 grid grid-cols-2 grid-rows-2 gap-px">
              <div className="bg-gray-50 border border-gray-300 flex items-center justify-center text-[10px]" aria-label="Profile">Profile</div>
              <div className="bg-gray-50 border border-gray-300 flex items-center justify-center text-[10px]" aria-label="Settings">Settings</div>
              <div className="bg-gray-50 border border-gray-300 flex items-center justify-center text-[10px]" aria-label="Accounts">Accounts</div>
              <div className="bg-gray-50 border border-gray-300 flex items-center justify-center text-[10px]" aria-label="Services">Services</div>
            </div>
            <div className="w-14 h-14 rounded-full bg-gray-50 border border-gray-300 flex items-center justify-center">
              <div className="w-10 h-[2px] bg-gray-700"></div>
              <div className="w-10 h-[2px] bg-gray-700 mt-1"></div>
            </div>
          </div>
        </div>
        {showAds && (
          <div className="px-6 pb-3">
            <div className="w-[260px] border border-gray-300 bg-white p-3 text-xs">
              <div className="text-[11px] text-gray-600 mb-2">Sponsored (Static)</div>
              <div className="grid grid-cols-3 gap-2">
                <div className="h-12 border border-gray-300 bg-gray-50 flex items-center justify-center">Company A</div>
                <div className="h-12 border border-gray-300 bg-gray-50 flex items-center justify-center">Company B</div>
                <div className="h-12 border border-gray-300 bg-gray-50 flex items-center justify-center">Company C</div>
              </div>
              <div className="mt-2 text-[10px] text-gray-500">No tracking • No rotation • Static assets</div>
            </div>
          </div>
        )}
      </div>
      <div className="fixed top-14 left-0 right-0 h-8 bg-black text-white border-b border-black px-6 flex items-center justify-center text-xs tracking-wide">
        Public Review – Non-Operational Build
      </div>
      <div className="fixed top-[5.5rem] left-0 right-0 h-10 bg-red-600 text-white border-b border-red-700 px-6 flex items-center justify-center text-sm">
        STOP / HALT: Actions are disabled by governance policy
      </div>
      <div className="fixed bottom-20 left-4 bg-white border border-gray-300 px-3 py-2 text-xs">
        Session TTL: 15m
      </div>
      <div className="fixed bottom-20 right-4 bg-white border border-red-400 text-red-700 px-4 py-3 text-xs">
        Refusal: Operation denied per policy. Visible notice required.
      </div>
      <div className="pt-[7.5rem]">
        <div className="flex">
          <aside className="w-64 bg-white border-r border-gray-300 min-h-[calc(100vh-3.5rem)] p-4">
            <div className="text-xs font-semibold mb-4">Tabs</div>
            <nav className="space-y-2" aria-label="Side Tabs">
              {tabs.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  className={`w-full h-10 px-3 text-sm border ${
                    activeTab === t.key ? 'bg-gray-200 border-gray-400 font-semibold' : 'bg-gray-50 border-gray-300'
                  } flex items-center`}
                  onClick={() => setActiveTab(t.key)}
                  aria-current={activeTab === t.key ? 'page' : undefined}
                >
                  {t.key}
                </button>
              ))}
            </nav>
          </aside>
          <main className="flex-1 min-h-[calc(100vh-3.5rem)] bg-white p-6">
            <div className="border border-gray-300 h-full bg-gray-50">
              {activeTab === 'Web' ? (
                <>
                  <div className="h-12 border-b border-gray-300 bg-white px-4 flex items-center justify-between text-sm">
                    <div>Web Tab</div>
                    <div className="flex items-center gap-3">
                      <button
                        className="h-9 px-4 bg-gray-50 border border-gray-300 text-sm"
                        disabled
                        aria-disabled="true"
                      >
                        Summarize Page
                      </button>
                      <div className="h-9 px-3 bg-gray-100 border border-red-400 text-red-700 text-xs flex items-center">
                        Refused per policy
                      </div>
                    </div>
                  </div>
                  <div className="p-4 text-sm">
                    <div className="w-full h-[calc(100%-1rem)] min-h-[400px] border border-gray-300 bg-white">
                      <div className="h-10 border-b border-gray-300 bg-gray-50 px-3 flex items-center text-xs">
                        Page view container
                      </div>
                      <div className="p-3 text-xs text-gray-700">
                        Display-only content
                      </div>
                    </div>
                  </div>
                </>
              ) : activeTab === 'Proxy' ? (
                <>
                  <div className="h-12 border-b border-gray-300 bg-white px-4 flex items-center text-sm">
                    Proxy Tab
                  </div>
                  <div className="p-4 text-sm">
                    <div className="border border-gray-300 bg-white">
                      <div className="h-10 border-b border-gray-300 bg-gray-50 px-3 flex items-center text-xs">
                        Provider selection
                      </div>
                      <div className="p-4">
                        <div className="border border-gray-300 bg-gray-50 p-4">
                          <div className="text-sm font-semibold">Provider: Aegis Proxy Ltd.</div>
                          <div className="text-xs text-gray-700 mt-2">
                            Jurisdiction: EU • Endpoint: proxy.aegis.example • ID: PRX-001
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="fixed inset-0 bg-gray-900/40 flex items-center justify-center">
                      <div className="w-[520px] bg-white border border-gray-300">
                        <div className="h-12 border-b border-gray-300 bg-gray-50 px-4 flex items-center text-sm">
                          Consent Required
                        </div>
                        <div className="p-4 text-xs text-gray-800">
                          Provider identity: Aegis Proxy Ltd. • proxy.aegis.example • PRX-001
                          This provider will handle outbound web requests. No hidden routing,
                          no chaining. Explicit consent is required.
                        </div>
                        <div className="px-4 pb-4 flex justify-end gap-2">
                          <button className="h-9 px-4 bg-gray-50 border border-gray-300 text-sm" aria-disabled="true" disabled>
                            Agree
                          </button>
                          <button className="h-9 px-4 bg-gray-50 border border-gray-300 text-sm" aria-disabled="true" disabled>
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : activeTab === 'Local Device' ? (
                <>
                  <div className="h-12 border-b border-gray-300 bg-white px-4 flex items-center justify-between text-sm">
                    <div>Local Device</div>
                    <div className="flex items-center gap-3">
                      <button
                        className="h-9 px-4 bg-gray-50 border border-gray-300 text-sm"
                        disabled
                        aria-disabled="true"
                      >
                        Open with system
                      </button>
                    </div>
                  </div>
                  <div className="p-4 text-sm">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="col-span-1 border border-gray-300 bg-white">
                        <div className="h-10 border-b border-gray-300 bg-gray-50 px-3 flex items-center text-xs">
                          File tree
                        </div>
                        <div className="p-3 text-xs text-gray-800">
                          <ul className="space-y-2">
                            <li className="border border-gray-300 bg-gray-50 px-2 py-1">Documents</li>
                            <li className="border border-gray-300 bg-gray-50 px-2 py-1">Downloads</li>
                            <li className="border border-gray-300 bg-gray-50 px-2 py-1">Pictures</li>
                            <li className="border border-gray-300 bg-gray-50 px-2 py-1">Videos</li>
                          </ul>
                          <div className="mt-3 text-gray-600">
                            Manual selection only. No background scanning.
                          </div>
                        </div>
                      </div>
                      <div className="col-span-2 border border-gray-300 bg-white">
                        <div className="h-10 border-b border-gray-300 bg-gray-50 px-3 flex items-center text-xs">
                          Selected file preview
                        </div>
                        <div className="p-3 text-xs text-gray-700">
                          No file selected. No auto indexing.
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : activeTab === 'Mobile Emulator' ? (
                <>
                  <div className="h-12 border-b border-gray-300 bg-white px-4 flex items-center text-sm">
                    Mobile Emulator
                  </div>
                  <div className="p-4 text-sm">
                    <div className="mb-4 flex items-center gap-3">
                      <select
                        className="h-9 px-3 bg-gray-50 border border-gray-300 text-sm"
                        disabled
                        aria-disabled="true"
                        aria-label="Screen size selector"
                      >
                        <option>375 x 667 (Portrait)</option>
                        <option>414 x 896 (Portrait)</option>
                        <option>390 x 844 (Portrait)</option>
                      </select>
                      <div className="flex items-center gap-2">
                        <button className="h-9 px-4 bg-gray-50 border border-gray-300 text-sm" disabled aria-disabled="true">
                          Portrait
                        </button>
                        <button className="h-9 px-4 bg-gray-50 border border-gray-300 text-sm" disabled aria-disabled="true">
                          Landscape
                        </button>
                      </div>
                    </div>
                    <div className="border border-gray-300 bg-white w-full max-w-[420px] min-h-[720px]">
                      <div className="h-10 border-b border-gray-300 bg-gray-50 px-3 flex items-center text-xs">
                        Device frame preview
                      </div>
                      <div className="p-3 text-xs text-gray-700">
                        375 x 667 • Portrait • Preview only
                      </div>
                      <div className="mx-3 mb-3 border border-gray-300 bg-gray-50 h-[600px]"></div>
                      <div className="px-3 pb-3 text-[11px] text-gray-600">
                        No install. No automation.
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="h-12 border-b border-gray-300 bg-white px-4 flex items-center text-sm">
                    Page Title
                  </div>
                  <div className="p-4 text-sm">
                    Content area
                  </div>
                </>
              )}
            </div>
          </main>
        </div>
      </div>
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-300 px-6 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 border border-gray-300 bg-gray-50 text-[10px] flex items-center justify-center">Lock</div>
            <div className="w-6 h-6 border border-gray-300 bg-gray-50 text-[10px] flex items-center justify-center">Local</div>
            <div className="w-6 h-6 border border-gray-300 bg-gray-50 text-[10px] flex items-center justify-center">NoTel</div>
            <div className="w-6 h-6 border border-gray-300 bg-gray-50 text-[10px] flex items-center justify-center">Review</div>
          </div>
          <div className="text-xs font-semibold">v1 – Governance Locked</div>
          <div className="text-xs text-gray-600">Local-first. Deny-by-default. No telemetry.</div>
        </div>
      </div>
    </div>
  );
}
