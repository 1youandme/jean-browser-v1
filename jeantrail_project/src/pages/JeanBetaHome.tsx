import React, { useEffect, useState } from 'react';
import { JeanPresenceView } from '../components/JeanPresenceView';
import { JeanBootstrap } from '../jean-runtime/bootstrap/JeanBootstrap';
import { useNavigate } from 'react-router-dom';

export const JeanBetaHome: React.FC = () => {
  const [isReady, setIsReady] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const init = async () => {
      try {
        // Initialize Jean Runtime (Sovereign Bootstrap)
        const bootstrap = JeanBootstrap.getInstance();
        // Provide minimal context
        await bootstrap.initialize({
          rootPath: '/',
          capabilities: ['presence']
        });
        setIsReady(true);
      } catch (err) {
        console.error("Runtime init failed", err);
      }
    };
    init();
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center relative overflow-hidden text-white selection:bg-blue-500 selection:text-white">
      {/* Ambient Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-900 to-black z-0" />
      
      {/* Jean Presence Layer */}
      <div className="z-10 w-full max-w-4xl h-[60vh] flex items-center justify-center">
         <JeanPresenceView className="w-full h-full" />
      </div>

      {/* Minimal UI Layer */}
      <div className="z-20 text-center space-y-8 animate-fade-in-up">
        <h1 className="text-2xl font-light tracking-widest text-gray-400 uppercase">
          Jean Runtime <span className="text-blue-500 font-bold">Beta</span>
        </h1>
        
        <div className="opacity-90 transition-opacity duration-500 hover:opacity-100">
          <button 
            onClick={() => navigate('/shell')}
            className="group relative px-8 py-3 bg-transparent border border-gray-700 rounded-full overflow-hidden transition-all hover:border-blue-500 hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] cursor-pointer"
          >
            <span className="relative z-10 text-sm font-medium tracking-wide group-hover:text-blue-400 transition-colors">
              ENTER SOVEREIGN SHELL
            </span>
            <div className="absolute inset-0 bg-blue-900/10 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500" />
          </button>
        </div>
      </div>

      {/* Footer / Status */}
      <div className="absolute bottom-8 text-xs text-gray-600 tracking-wider">
        LOCAL RUNTIME ACTIVE • ZERO TELEMETRY
      </div>
    </div>
  );
};
