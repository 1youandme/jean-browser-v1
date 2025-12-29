import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { useUIStore } from '@/store';
import { 
  Globe, 
  Home, 
  Shield, 
  Smartphone, 
  ArrowLeft, 
  ArrowRight, 
  RefreshCw,
  Bookmark,
  Search,
  Plus,
  Grid,
  List,
  Settings
} from 'lucide-react';
import { JeanAvatar3D } from '@/components/JeanAvatar3D';
import { HeaderRedesigned } from '@/components/HeaderRedesigned';
import { Camera, QrCode, XCircle } from 'lucide-react';

export const Browser: React.FC = () => {
  const navigate = useNavigate();
  const { language, sidebarOpen } = useUIStore();
  
  const [activeStrip, setActiveStrip] = useState<'local' | 'proxy' | 'web' | 'mobile'>('web');
  const [url, setUrl] = useState('https://www.google.com');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [tabs, setTabs] = useState([
    { id: 1, title: 'Google', url: 'https://www.google.com', active: true },
    { id: 2, title: 'JeanTrail OS', url: 'https://jeantrail.com', active: false },
  ]);

  // Visual Reference Selector state
  const [selectorConsentOpen, setSelectorConsentOpen] = useState(false);
  const [selectorActive, setSelectorActive] = useState(false);
  const [selectorSessionExpiresAt, setSelectorSessionExpiresAt] = useState<number | null>(null);
  const [anchorPoint, setAnchorPoint] = useState<{ x: number; y: number } | null>(null);
  const [selectionBox, setSelectionBox] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [vrtCounter, setVrtCounter] = useState(0);
  const [vrtList, setVrtList] = useState<Array<{ id: string; label: string; box: { x: number; y: number; width: number; height: number }; screenshotHash: string | null }>>([]);
  const webContainerRef = useRef<HTMLDivElement>(null);

  const [cameraConsentOpen, setCameraConsentOpen] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraSessionExpiresAt, setCameraSessionExpiresAt] = useState<number | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [captureMode, setCaptureMode] = useState<'qr' | 'text'>('qr');
  const [cameraOutput, setCameraOutput] = useState<{ decodedText?: string; imageDataUrl?: string; refusal?: string } | null>(null);
  const [cameraAudit, setCameraAudit] = useState<Array<{ type: 'consent_granted' | 'consent_revoked' | 'refusal_triggered' | 'halt_triggered' | 'capture_frame'; ts: number; details?: Record<string, unknown> }>>([]);
  const [tabAudit, setTabAudit] = useState<Array<{ tab: 'local' | 'web' | 'mobile' | 'proxy'; type: string; ts: number; details?: Record<string, unknown> }>>([]);
  const [webDomainScope, setWebDomainScope] = useState<string>('');
  const [webAnalysisTimestamps, setWebAnalysisTimestamps] = useState<number[]>([]);
  const [providerConsentOpen, setProviderConsentOpen] = useState(false);
  const [pendingProvider, setPendingProvider] = useState<{ id: string; name: string } | null>(null);
  const [webRefusal, setWebRefusal] = useState<string | null>(null);

  const isRTL = language === 'ar';

  const strips = [
    {
      id: 'local',
      title: isRTL ? 'الجهاز المحلي' : 'Local Device',
      icon: <Home className="h-5 w-5" />,
      description: isRTL ? 'تصفح الملفات المحلية' : 'Browse local files',
      color: 'from-green-500 to-emerald-600',
    },
    {
      id: 'proxy',
      title: isRTL ? 'شبكة الوكيل' : 'Proxy Network',
      icon: <Shield className="h-5 w-5" />,
      description: isRTL ? 'تصفح آمن وخاص' : 'Secure & private browsing',
      color: 'from-purple-500 to-indigo-600',
    },
    {
      id: 'web',
      title: isRTL ? 'الويب العادي' : 'Standard Web',
      icon: <Globe className="h-5 w-5" />,
      description: isRTL ? 'تصفح الويب التقليدي' : 'Traditional web browsing',
      color: 'from-blue-500 to-cyan-600',
    },
    {
      id: 'mobile',
      title: isRTL ? 'محاكي الجوال' : 'Mobile Emulator',
      icon: <Smartphone className="h-5 w-5" />,
      description: isRTL ? 'تجربة الجوال' : 'Mobile experience',
      color: 'from-orange-500 to-red-600',
    },
  ];

  const handleNavigation = (direction: 'back' | 'forward' | 'refresh') => {
    // Handle browser navigation
    console.log(`Navigating ${direction}`);
  };

  const handleTabSwitch = (tabId: number) => {
    setTabs(tabs.map(tab => ({
      ...tab,
      active: tab.id === tabId
    })));
  };

  const handleNewTab = () => {
    const newTab = {
      id: tabs.length + 1,
      title: isRTL ? 'علامة تبويب جديدة' : 'New Tab',
      url: 'about:blank',
      active: true,
    };
    setTabs([...tabs.map(tab => ({ ...tab, active: false })), newTab]);
  };

  const handleStripChange = (stripId: typeof activeStrip) => {
    setActiveStrip(stripId);
  };

  // Selector session timeout
  useEffect(() => {
    if (!selectorActive || !selectorSessionExpiresAt) return;
    const remaining = selectorSessionExpiresAt - Date.now();
    if (remaining <= 0) {
      setSelectorActive(false);
      setAnchorPoint(null);
      setSelectionBox(null);
      setSelectorSessionExpiresAt(null);
      return;
    }
    const t = setTimeout(() => {
      setSelectorActive(false);
      setAnchorPoint(null);
      setSelectionBox(null);
      setSelectorSessionExpiresAt(null);
    }, remaining);
    return () => clearTimeout(t);
  }, [selectorActive, selectorSessionExpiresAt]);

  const startVisualSelector = () => {
    setSelectorConsentOpen(true);
  };

  const startCameraConsent = () => {
    setCameraConsentOpen(true);
  };

  const acceptSelectorConsent = () => {
    setSelectorConsentOpen(false);
    setSelectorActive(true);
    setAnchorPoint(null);
    setSelectionBox(null);
    setSelectorSessionExpiresAt(Date.now() + 60000);
  };

  const logCameraEvent = (type: 'consent_granted' | 'consent_revoked' | 'refusal_triggered' | 'halt_triggered' | 'capture_frame', details?: Record<string, unknown>) => {
    setCameraAudit(prev => [...prev, { type, ts: Date.now(), details }]);
  };

  const logTabEvent = (tab: 'local' | 'web' | 'mobile' | 'proxy', type: string, details?: Record<string, unknown>) => {
    setTabAudit(prev => [...prev, { tab, type, ts: Date.now(), details }]);
  };

  const acceptCameraConsent = async () => {
    setCameraConsentOpen(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      setCameraStream(stream);
      setCameraActive(true);
      setCameraSessionExpiresAt(Date.now() + 120000);
      setCameraOutput(null);
      logCameraEvent('consent_granted', { mode: captureMode });
    } catch (e) {
      setCameraOutput({ refusal: isRTL ? 'تم رفض الوصول إلى الكاميرا بواسطة النظام.' : 'Camera access denied by the system.' });
      logCameraEvent('refusal_triggered', { reason: 'system_camera_denied' });
    }
  };

  const cancelSelectorConsent = () => {
    setSelectorConsentOpen(false);
  };

  const cancelCameraConsent = () => {
    setCameraConsentOpen(false);
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!selectorActive || !webContainerRef.current) return;
    const rect = webContainerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    if (!anchorPoint) {
      setAnchorPoint({ x, y });
      return;
    }
    const x0 = Math.min(anchorPoint.x, x);
    const y0 = Math.min(anchorPoint.y, y);
    const w = Math.abs(x - anchorPoint.x);
    const h = Math.abs(y - anchorPoint.y);
    const box = { x: Math.round(x0), y: Math.round(y0), width: Math.round(w), height: Math.round(h) };
    setSelectionBox(box);
    const next = vrtCounter + 1;
    const id = `VRT_${next}`;
    setVrtCounter(next);
    setVrtList(prev => [...prev, { id, label: id, box, screenshotHash: null }]);
    setSelectorActive(false);
    setAnchorPoint(null);
    setSelectorSessionExpiresAt(null);
    setSelectionBox(null);
  };

  const stopCameraSession = (reason?: string) => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(t => t.stop());
    }
    setCameraStream(null);
    setCameraActive(false);
    setCameraSessionExpiresAt(null);
    setCameraOutput(null);
    logCameraEvent('consent_revoked', { reason: reason || 'user_stop_or_timeout' });
  };

  const enforceBoundary = (tab: 'local' | 'web' | 'mobile' | 'proxy', action: string, details?: Record<string, unknown>): { allowed: boolean; refusal?: string } => {
    if (tab === 'local') {
      if (action !== 'capture_frame') {
        logTabEvent('local', 'halt_triggered', { action, reason: 'forbidden_action' });
        return { allowed: false, refusal: isRTL ? 'رفض — الإجراء غير مسموح في الجهاز المحلي.' : 'Refused — action not permitted in Local Device.' };
      }
      return { allowed: true };
    }
    if (tab === 'web') {
      if (!webDomainScope || webDomainScope.trim().length === 0) {
        logTabEvent('web', 'halt_triggered', { action, reason: 'missing_domain_scope' });
        return { allowed: false, refusal: isRTL ? 'رفض — يجب تحديد النطاق.' : 'Refused — domain scope required.' };
      }
      if (action === 'scrape_login' || action === 'credential_access') {
        logTabEvent('web', 'halt_triggered', { action, reason: 'no_credentials' });
        return { allowed: false, refusal: isRTL ? 'رفض — لا يمكن الوصول إلى بيانات الاعتماد.' : 'Refused — no credential access.' };
      }
      if (action === 'identity_correlation' || action === 'behavioral_profiling') {
        logTabEvent('web', 'halt_triggered', { action, reason: 'profile_block' });
        return { allowed: false, refusal: isRTL ? 'رفض — ممنوع الارتباط بالهوية أو التوصيف السلوكي.' : 'Refused — identity correlation and profiling blocked.' };
      }
      if (action === 'analysis') {
        const now = Date.now();
        const windowMs = 60000;
        const recent = webAnalysisTimestamps.filter(ts => now - ts < windowMs);
        if (recent.length >= 3) {
          logTabEvent('web', 'halt_triggered', { action, reason: 'rate_limit', count: recent.length });
          return { allowed: false, refusal: isRTL ? 'رفض — تجاوز الحد الزمني.' : 'Refused — rate limit exceeded.' };
        }
        setWebAnalysisTimestamps([...recent, now]);
        logTabEvent('web', 'analysis_requested', { scope: webDomainScope });
        return { allowed: true };
      }
      return { allowed: true };
    }
    if (tab === 'mobile') {
      if (action === 'execute' || action === 'external_io') {
        logTabEvent('mobile', 'halt_triggered', { action, reason: 'simulation_only' });
        return { allowed: false, refusal: isRTL ? 'رفض — المحاكي للتجربة فقط.' : 'Refused — emulator is simulation-only.' };
      }
      logTabEvent('mobile', 'simulation_preview', details);
      return { allowed: true };
    }
    if (tab === 'proxy') {
      if (action === 'provider_call') {
        if (!pendingProvider) {
          logTabEvent('proxy', 'halt_triggered', { action, reason: 'missing_provider_identity' });
          return { allowed: false, refusal: isRTL ? 'رفض — يجب الإفصاح عن المزود.' : 'Refused — provider identity required.' };
        }
        setProviderConsentOpen(true);
        logTabEvent('proxy', 'provider_disclosed', { provider: pendingProvider });
        return { allowed: false, refusal: isRTL ? 'يتطلب موافقة لكل طلب.' : 'Per-call consent required.' };
      }
      if (action === 'hidden_chaining') {
        logTabEvent('proxy', 'halt_triggered', { action, reason: 'no_hidden_chaining' });
        return { allowed: false, refusal: isRTL ? 'رفض — ممنوع التسلسل الخفي.' : 'Refused — hidden chaining forbidden.' };
      }
      return { allowed: true };
    }
    return { allowed: false, refusal: isRTL ? 'رفض — علامة غير معروفة.' : 'Refused — unknown tab.' };
  };

  const applyPolicyGates = (text?: string): { allowed: boolean; refusal?: string; halt?: boolean } => {
    if (!cameraActive) return { allowed: false, refusal: isRTL ? 'انتهت الجلسة.' : 'Session ended.', halt: true };
    if (!captureMode || (captureMode !== 'qr' && captureMode !== 'text')) {
      return { allowed: false, refusal: isRTL ? 'رفض — الوضع غير مسموح.' : 'Refused — mode not permitted.', halt: true };
    }
    if (text && /face|biometric|recognition/i.test(text)) {
      return { allowed: false, refusal: isRTL ? 'رفض — القياسات الحيوية غير مسموح بها.' : 'Refused — biometric detection is not allowed.', halt: true };
    }
    if (text && /\b(run|execute|delete|format|pay|purchase|click|navigate|open)\b/i.test(text)) {
      return { allowed: false, refusal: isRTL ? 'رفض — لا تنفيذ تلقائي.' : 'Refused — no automation or execution.', halt: true };
    }
    if (text && /\b(address|street|city|zip|latitude|longitude|gps|venue)\b/i.test(text)) {
      return { allowed: false, refusal: isRTL ? 'رفض — ممنوع استنتاج الموقع.' : 'Refused — location inference blocked.', halt: true };
    }
    if (text && /(\bssn\b|\bpassport\b|\bdriver\b|@[a-zA-Z0-9_.-]+|(\+?\d{10,}))/i.test(text)) {
      return { allowed: false, refusal: isRTL ? 'رفض — ممنوع إعادة بناء الهوية.' : 'Refused — identity reconstruction blocked.', halt: true };
    }
    return { allowed: true };
  };

  const captureSingleFrame = () => {
    if (!cameraActive || !videoRef.current) {
      setCameraOutput({ refusal: isRTL ? 'جلسة غير نشطة.' : 'Session not active.' });
      logCameraEvent('halt_triggered', { reason: 'inactive_session' });
      return;
    }
    const video = videoRef.current;
    const w = video.videoWidth;
    const h = video.videoHeight;
    if (!w || !h) {
      setCameraOutput({ refusal: isRTL ? 'غموض — غير قادر على الالتقاط.' : 'Ambiguity — unable to capture.' });
      logCameraEvent('halt_triggered', { reason: 'ambiguous_frame' });
      return;
    }
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setCameraOutput({ refusal: isRTL ? 'تعذر المعالجة محلياً.' : 'Local processing unavailable.' });
      logCameraEvent('halt_triggered', { reason: 'no_canvas_ctx' });
      return;
    }
    ctx.drawImage(video, 0, 0, w, h);
    const dataUrl = canvas.toDataURL('image/png');
    let decodedText: string | undefined;
    if (captureMode === 'qr') {
      decodedText = '';
    } else {
      decodedText = '';
    }
    const gate = applyPolicyGates(decodedText);
    if (!gate.allowed) {
      setCameraOutput({ refusal: gate.refusal });
      logCameraEvent(gate.halt ? 'halt_triggered' : 'refusal_triggered', { mode: captureMode, reason: gate.refusal });
      stopCameraSession('policy_gate_violation');
      return;
    }
    setCameraOutput({ decodedText, imageDataUrl: dataUrl });
    logCameraEvent('capture_frame', { mode: captureMode });
    stopCameraSession('single_frame_complete');
  };

  useEffect(() => {
    if (!cameraActive || !cameraSessionExpiresAt) return;
    const remaining = cameraSessionExpiresAt - Date.now();
    if (remaining <= 0) {
      stopCameraSession('ttl_expired');
      return;
    }
    const t = setTimeout(() => {
      stopCameraSession('ttl_expired');
    }, remaining);
    return () => clearTimeout(t);
  }, [cameraActive, cameraSessionExpiresAt]);

  useEffect(() => {
    if (videoRef.current && cameraStream) {
      (videoRef.current as any).srcObject = cameraStream;
    }
  }, [cameraStream]);
  useEffect(() => {
    if (!webRefusal) return;
    const t = setTimeout(() => setWebRefusal(null), 4000);
    return () => clearTimeout(t);
  }, [webRefusal]);

  const currentStrip = strips.find(s => s.id === activeStrip);

  if (isFullscreen) {
    return (
      <div className="h-screen flex flex-col bg-gray-900">
        {/* Fullscreen Header */}
        <div className="flex items-center justify-between p-2 bg-gray-800 border-b border-gray-700">
          <div className="flex items-center space-x-2">
            <Button size="sm" variant="ghost" onClick={() => handleNavigation('back')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => handleNavigation('forward')}>
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => handleNavigation('refresh')}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-96 h-8"
              placeholder={isRTL ? 'أدخل URL...' : 'Enter URL...'}
            />
          </div>
          <Button size="sm" variant="ghost" onClick={() => setIsFullscreen(false)}>
            <Grid className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Browser Content */}
        <div className="flex-1 bg-white">
          <iframe
            src={url}
            className="w-full h-full border-0"
            title="Browser"
          />
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Header */}
      <HeaderRedesigned
        currentUrl={url}
        onUrlChange={setUrl}
onNavigate={(action) => handleNavigation(action as 'back' | 'forward' | 'refresh')}
        activeMode={activeStrip}
        onModeChange={handleStripChange}
      />
      
      <div className="flex h-screen pt-16">
        {/* Sidebar */}
        {sidebarOpen && (
          <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
              {isRTL ? 'بيئات التصفح' : 'Browsing Environments'}
            </h3>
            
            <div className="space-y-2">
              {strips.map((strip) => (
                <Button
                  key={strip.id}
                  variant={activeStrip === strip.id ? 'default' : 'ghost'}
                  className={`w-full justify-start h-auto p-3 ${
                    activeStrip === strip.id 
                      ? `bg-gradient-to-r ${strip.color} text-white` 
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                  onClick={() => handleStripChange(strip.id as typeof activeStrip)}
                >
                  <div className="flex items-center space-x-3">
                    {strip.icon}
                    <div>
                      <div className="font-medium">{strip.title}</div>
                      <div className="text-xs opacity-75">{strip.description}</div>
                    </div>
                  </div>
                </Button>
              ))}
            </div>
            
            <div className="mt-6 space-y-2">
              <Button variant="ghost" className="w-full justify-start">
                <Bookmark className="mr-2 h-4 w-4" />
                {isRTL ? 'الإشارات المرجعية' : 'Bookmarks'}
              </Button>
              <Button variant="ghost" className="w-full justify-start">
                <Search className="mr-2 h-4 w-4" />
                {isRTL ? 'السجل' : 'History'}
              </Button>
              <Button variant="ghost" className="w-full justify-start">
                <Settings className="mr-2 h-4 w-4" />
                {isRTL ? 'الإعدادات' : 'Settings'}
              </Button>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Browser Toolbar */}
          <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Button size="sm" variant="outline" onClick={() => handleNavigation('back')}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleNavigation('forward')}>
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleNavigation('refresh')}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
                
                <Input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-96"
                  placeholder={isRTL ? 'أدخل URL أو ابحث...' : 'Enter URL or search...'}
                  startIcon={<Search className="h-4 w-4 text-gray-400" />}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Button size="sm" variant="outline" onClick={handleNewTab}>
                  <Plus className="h-4 w-4" />
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                >
                  {viewMode === 'grid' ? <List className="h-4 w-4" /> : <Grid className="h-4 w-4" />}
                </Button>
                <Button size="sm" variant="jean" onClick={() => setIsFullscreen(true)}>
                  <Globe className="h-4 w-4" />
                </Button>
                {activeStrip === 'web' && (
                  <Button size="sm" variant="outline" onClick={startVisualSelector}>
                    {isRTL ? 'محدد المرجع البصري' : 'Visual Reference Selector'}
                  </Button>
                )}
                {activeStrip === 'web' && (
                  <Button size="sm" variant="outline" onClick={startCameraConsent}>
                    {isRTL ? 'الكاميرا (QR/نص)' : 'Camera (QR/Text)'}
                  </Button>
                )}
                {activeStrip === 'web' && (
                  <>
                    <Input
                      value={webDomainScope}
                      onChange={(e) => setWebDomainScope(e.target.value)}
                      className="w-48"
                      placeholder={isRTL ? 'نطاق النطاق' : 'Domain scope'}
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const res = enforceBoundary('web', 'analysis');
                        if (!res.allowed) {
                          setWebRefusal(res.refusal || (isRTL ? 'مرفوض.' : 'Refused.'));
                          logTabEvent('web', 'refusal_feedback', { reason: res.refusal });
                        }
                      }}
                    >
                      {isRTL ? 'ملخص الصفحة' : 'Summarize Page'}
                    </Button>
                  </>
                )}
              </div>
            </div>
            
            {/* Tabs */}
            <div className="flex items-center space-x-1 mt-3 overflow-x-auto">
              {tabs.map((tab) => (
                <Button
                  key={tab.id}
                  variant={tab.active ? 'default' : 'ghost'}
                  size="sm"
                  className={`flex items-center space-x-2 min-w-max ${
                    tab.active ? 'bg-blue-500 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                  onClick={() => handleTabSwitch(tab.id)}
                >
                  <Globe className="h-3 w-3" />
                  <span className="truncate max-w-32">{tab.title}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Browser Content Area */}
          <div className="flex-1 bg-gray-100 dark:bg-gray-900 p-4">
            {currentStrip && (
              <div className="h-full">
                <div className={`bg-gradient-to-r ${currentStrip.color} text-white p-4 rounded-t-lg`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {currentStrip.icon}
                      <div>
                        <h3 className="font-semibold text-lg">{currentStrip.title}</h3>
                        <p className="text-sm opacity-90">{currentStrip.description}</p>
                      </div>
                    </div>
                    <JeanAvatar3D />
                  </div>
                </div>
                
                <div className="bg-white dark:bg-gray-800 p-6 rounded-b-lg shadow-lg h-full">
                  {activeStrip === 'local' && (
                    <div className="text-center py-12">
                      <Home className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                        {isRTL ? 'الجهاز المحلي' : 'Local Device'}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-6">
                        {isRTL ? 'تصفح الملفات والمجلدات المحلية' : 'Browse local files and folders'}
                      </p>
                      <Button onClick={() => navigate('/local')}>
                        {isRTL ? 'فتح متصفح الملفات' : 'Open File Browser'}
                      </Button>
                    </div>
                  )}
                  
                  {activeStrip === 'proxy' && (
                    <div className="text-center py-12">
                      <Shield className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                        {isRTL ? 'شبكة الوكيل' : 'Proxy Network'}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-6">
                        {isRTL ? 'تصفح آمن وخاص عبر شبكة الوكيل' : 'Secure and private browsing via proxy network'}
                      </p>
                      <div className="flex items-center justify-center gap-3">
                        <Button onClick={() => navigate('/proxy')}>
                          {isRTL ? 'فتح شبكة الوكيل' : 'Open Proxy Network'}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setPendingProvider({ id: 'provider.demo', name: 'Demo Provider' });
                            const res = enforceBoundary('proxy', 'provider_call');
                            if (res.allowed) {
                              logTabEvent('proxy', 'provider_call_allowed', { provider: pendingProvider });
                            }
                          }}
                        >
                          {isRTL ? 'طلب المزود' : 'Call Provider'}
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {activeStrip === 'web' && (
                    <div className="h-full relative" ref={webContainerRef}>
                      <iframe
                        src={url}
                        className="w-full h-full border rounded-lg"
                        title="Web Browser"
                      />
                      {cameraActive && (
                        <div className="absolute top-2 left-2 right-2 z-30">
                          <div className="flex items-center justify-between bg-black/80 text-white text-xs px-3 py-2 rounded">
                            <div className="flex items-center gap-2">
                              <Camera className="h-4 w-4" />
                              <span>{isRTL ? 'الكاميرا نشطة — للمرجع فقط' : 'Camera active — reference-only'}</span>
                              <span className="opacity-75">{captureMode === 'qr' ? (isRTL ? 'وضع: QR' : 'Mode: QR') : (isRTL ? 'وضع: نص' : 'Mode: Text')}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button size="sm" variant="outline" onClick={captureSingleFrame}>
                                {isRTL ? 'التقاط إطار' : 'Capture frame'}
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => stopCameraSession('user_stop')}>
                                <XCircle className="h-4 w-4 mr-1" />
                                {isRTL ? 'إيقاف' : 'STOP'}
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                      {cameraActive && (
                        <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center">
                          <div className="bg-black/60 rounded p-2">
                            <video ref={videoRef} className="max-h-64 rounded" autoPlay playsInline muted />
                            <canvas ref={canvasRef} className="hidden" />
                          </div>
                        </div>
                      )}
                      {selectorActive && (
                        <div
                          className="absolute inset-0 z-20 bg-transparent"
                          style={{ cursor: 'crosshair' }}
                          onClick={handleOverlayClick}
                        >
                          {/* Instruction banner */}
                          <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-3 py-2 rounded shadow">
                            {isRTL ? 'نقرتان لتعريف مربع المرجع' : 'Two clicks to define a reference box'}
                          </div>
                          {/* Anchor indicator */}
                          {anchorPoint && (
                            <div
                              className="absolute w-2 h-2 bg-blue-500 rounded-full"
                              style={{ left: anchorPoint.x - 1, top: anchorPoint.y - 1 }}
                            />
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {activeStrip === 'mobile' && (
                    <div className="text-center py-12">
                      <Smartphone className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                        {isRTL ? 'محاكي الجوال' : 'Mobile Emulator'}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-6">
                        {isRTL ? 'تجربة فقط — محاكاة وخطوات افتراضية' : 'Simulation only — hypothetical flows and previews'}
                      </p>
                      <div className="flex items-center justify-center gap-3">
                        <Button onClick={() => navigate('/mobile')}>
                          {isRTL ? 'فتح محاكي الجوال' : 'Open Mobile Emulator'}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            const res = enforceBoundary('mobile', 'simulation_preview', { steps: 3 });
                            if (!res.allowed) {
                              logTabEvent('mobile', 'halt_triggered', { reason: res.refusal });
                            }
                          }}
                        >
                          {isRTL ? 'معاينة الخطوات' : 'Preview Steps'}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Consent modal */}
      {selectorConsentOpen && (
        <div className="fixed inset-0 z-30 bg-black/50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {isRTL ? 'موافقة جلسة محدد المرجع البصري' : 'Visual Reference Selector — Session Consent'}
            </h3>
            <div className="text-sm text-gray-700 dark:text-gray-300 space-y-2 mb-4">
              <p>{isRTL ? 'إشارة فقط. بدون تنفيذ.' : 'Referential only. No execution.'}</p>
              <ul className="list-disc ml-5 space-y-1">
                <li>{isRTL ? 'وصول الشاشة يقتصر على النافذة المرئية فقط' : 'Screen access scoped to visible window only'}</li>
                <li>{isRTL ? 'بدون سحب، بدون أتمتة، بدون تتبع مستمر' : 'No drag, no automation, no continuous tracking'}</li>
                <li>{isRTL ? 'ينتهي تلقائياً بعد الاستخدام أو بعد دقيقة' : 'Auto-ends after use or 1 minute'}</li>
              </ul>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={cancelSelectorConsent}>
                {isRTL ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button variant="jean" onClick={acceptSelectorConsent}>
                {isRTL ? 'أوافق' : 'I Consent'}
              </Button>
            </div>
          </div>
        </div>
      )}
      {providerConsentOpen && pendingProvider && (
        <div className="fixed inset-0 z-30 bg-black/50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {isRTL ? 'تأكيد المزود' : 'Provider Confirmation'}
            </h3>
            <div className="text-sm text-gray-700 dark:text-gray-300 space-y-2 mb-4">
              <p>{isRTL ? 'المزوّد:' : 'Provider:'} {pendingProvider.name} ({pendingProvider.id})</p>
              <p>{isRTL ? 'النطاق:' : 'Scope:'} {webDomainScope || (isRTL ? 'غير محدد' : 'unset')}</p>
              <p>{isRTL ? 'يتطلب موافقة لكل طلب.' : 'Per-call user confirmation required.'}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => { setProviderConsentOpen(false); setPendingProvider(null); logTabEvent('proxy', 'consent_revoked', { provider: pendingProvider }); }}>
                {isRTL ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button variant="jean" onClick={() => { logTabEvent('proxy', 'consent_granted', { provider: pendingProvider }); setProviderConsentOpen(false); setPendingProvider(null); }}>
                {isRTL ? 'أوافق' : 'I Consent'}
              </Button>
            </div>
          </div>
        </div>
      )}
      {cameraConsentOpen && (
        <div className="fixed inset-0 z-30 bg-black/50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {isRTL ? 'جلسة الكاميرا — QR/نص (للمرجع فقط)' : 'Camera Session — QR/Text (Reference Only)'}
            </h3>
            <div className="text-sm text-gray-700 dark:text-gray-300 space-y-2 mb-4">
              <p>{isRTL ? 'معالجة محلية فقط؛ بدون رفع.' : 'Local-only processing; no uploads.'}</p>
              <p>{isRTL ? 'المخرجات مرجعية فقط؛ لا يتم تنفيذ أي إجراءات.' : 'Reference outputs only; no actions are performed.'}</p>
              <p>{isRTL ? 'الجلسة محدودة زمنياً؛ زر الإيقاف يلغي فوراً.' : 'Session is time-bound; STOP revokes immediately.'}</p>
              <div className="flex items-center gap-2 mt-2">
                <Button size="sm" variant={captureMode === 'qr' ? 'default' : 'outline'} onClick={() => setCaptureMode('qr')}>
                  <QrCode className="h-4 w-4 mr-1" /> QR
                </Button>
                <Button size="sm" variant={captureMode === 'text' ? 'default' : 'outline'} onClick={() => setCaptureMode('text')}>
                  {isRTL ? 'نص' : 'Text'}
                </Button>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={cancelCameraConsent}>
                {isRTL ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button variant="jean" onClick={acceptCameraConsent}>
                {isRTL ? 'أوافق' : 'I Consent'}
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* Last VRT toast */}
      {vrtList.length > 0 && (
        <div className="fixed bottom-4 right-4 z-30 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow px-4 py-3">
          <div className="text-sm font-medium text-gray-900 dark:text-white">
            {isRTL ? 'تم إنشاء رمز مرجعي بصري' : 'Visual Reference Token created'}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">
            {vrtList[vrtList.length - 1].label} — {isRTL ? 'تحديد' : 'box'} ({vrtList[vrtList.length - 1].box.x},{vrtList[vrtList.length - 1].box.y}) {vrtList[vrtList.length - 1].box.width}×{vrtList[vrtList.length - 1].box.height}
          </div>
          <div className="text-xs text-gray-500">
            {isRTL ? 'الاستخدام: التخطيط والشرح فقط' : 'Use: plans and explanations only'}
          </div>
        </div>
      )}
      {webRefusal && (
        <div className="fixed bottom-4 right-4 z-30 bg-white dark:bg-gray-800 border border-red-300 dark:border-red-700 rounded-lg shadow px-4 py-3">
          <div className="text-sm font-medium text-red-600 dark:text-red-400">
            {webRefusal}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {isRTL ? 'تم الرفض وفق سياسات الأمان.' : 'Refused per safety policy.'}
          </div>
        </div>
      )}
      {cameraOutput && (
        <div className="fixed bottom-4 left-4 z-30 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow px-4 py-3 max-w-sm">
          <div className="text-sm font-medium text-gray-900 dark:text-white">
            {isRTL ? 'نتيجة الكاميرا — للمرجع فقط' : 'Camera Output — Reference Only'}
          </div>
          {cameraOutput.refusal ? (
            <div className="text-xs text-red-600 dark:text-red-400 mt-1">
              {cameraOutput.refusal}
            </div>
          ) : (
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              {(cameraOutput.decodedText && cameraOutput.decodedText.length > 0) ? cameraOutput.decodedText : (isRTL ? 'تم الالتقاط — لا يوجد نص مفكك.' : 'Captured — no decoded text.')}
            </div>
          )}
          <div className="text-xs text-gray-500 mt-1">
            {isRTL ? 'المخرجات مرجعية فقط؛ لا تنفيذ.' : 'Outputs are reference-only; no execution.'}
          </div>
        </div>
      )}
    </div>
  );
};
