import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { JeanBetaHome } from './pages/JeanBetaHome';
import { JeanTrailDemo } from './pages/JeanTrailDemo';
import { JeanDeveloperDashboard } from './pages/JeanDeveloperDashboard';
import { DomainServicesDashboard } from './pages/DomainServicesDashboard';
import { ReportsCenter } from './pages/ReportsCenter';
import { ClientServices } from './pages/ClientServices';
import { DecisionReplayViewer } from './pages/DecisionReplayViewer';
import { PresenceView } from './pages/PresenceView';
import { RouteToggleHotkey } from './components/RouteToggleHotkey';
import GovernanceBrowserShell from './pages/GovernanceBrowserShell';
import JeanHomepage from './pages/JeanHomepage';

function App() {
  return (
    <BrowserRouter>
      <RouteToggleHotkey />
      <Routes>
        <Route path="/" element={<JeanHomepage />} />
        <Route path="/developer" element={<JeanDeveloperDashboard />} />
        <Route path="/shell" element={<JeanTrailDemo />} />
        <Route path="/governance-shell" element={<GovernanceBrowserShell />} />
        <Route path="/services/domains" element={<DomainServicesDashboard />} />
        <Route path="/services/reports" element={<ReportsCenter />} />
        <Route path="/services/clients" element={<ClientServices />} />
        <Route path="/developer/replay" element={<DecisionReplayViewer />} />
        <Route path="/presence" element={<PresenceView />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
