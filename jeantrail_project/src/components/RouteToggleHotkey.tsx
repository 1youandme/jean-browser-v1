import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export const RouteToggleHotkey: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (document.activeElement && (document.activeElement.tagName || '').toLowerCase()) || '';
      if (tag === 'input' || tag === 'textarea' || (document.activeElement as any)?.isContentEditable) return;
      if (e.ctrlKey && e.shiftKey && (e.key === 'J' || e.key === 'j')) {
        const path = location.pathname;
        if (path.startsWith('/shell')) navigate('/presence');
        else navigate('/shell');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [location.pathname, navigate]);

  return null;
};
