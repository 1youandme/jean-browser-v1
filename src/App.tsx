import React, { useState } from 'react';
import { JeanTrailDemo } from './pages/JeanTrailDemo';
import { JeanIcon } from './components/JeanIcon';

function App() {
  const [isDemoMode, setIsDemoMode] = useState(true);

  // Toggle between demo and production mode
  if (isDemoMode) {
    return <JeanTrailDemo />;
  }

  // Production mode would go here
  return (
    <div className="h-screen flex flex-col bg-gray-900 text-white">
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="mb-6">
            <JeanIcon size={64} isActive={true} />
          </div>
          <h1 className="text-3xl font-bold mb-4">JeanTrail OS</h1>
          <p className="text-gray-400 mb-6">المتصفح الذكي المستقبلي</p>
          <button
            onClick={() => setIsDemoMode(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg transition-colors"
          >
            عرض العرض التجريبي
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;