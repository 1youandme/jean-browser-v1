import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { useAuthStore } from '@/store';
import { useUIStore } from '@/store';
import { 
  Home as HomeIcon, 
  Globe, 
  Folder, 
  Smartphone, 
  Shield, 
  Zap,
  Users,
  TrendingUp,
  Settings
} from 'lucide-react';
import { JeanAvatar3D } from '@/components/JeanAvatar3D';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const { language, addNotification } = useUIStore();

  const isRTL = language === 'ar';

  useEffect(() => {
    if (!isAuthenticated) {
      addNotification({
        id: 'welcome',
        type: 'info',
        title: isRTL ? 'مرحباً بك' : 'Welcome to JeanTrail OS',
        message: isRTL 
          ? 'استكشف مستقبل التصفح مع المساعد الذكي Jean' 
          : 'Explore the future of browsing with Jean AI assistant',
      });
    }
  }, [isAuthenticated, language, addNotification]);

  const features = [
    {
      icon: <Globe className="h-8 w-8 text-blue-500" />,
      title: isRTL ? 'المتصفح الذكي' : 'Smart Browser',
      description: isRTL 
        ? '4-strip architecture للتصفح متعدد البيئات' 
        : '4-strip architecture for multi-environment browsing',
      action: () => navigate('/browser'),
    },
    {
      icon: <HomeIcon className="h-8 w-8 text-green-500" />,
      title: isRTL ? 'الجهاز المحلي' : 'Local Device',
      description: isRTL 
        ? 'تصفح الملفات المحلية وتشغيل التطبيقات' 
        : 'Browse local files and run desktop applications',
      action: () => navigate('/local'),
    },
    {
      icon: <Shield className="h-8 w-8 text-purple-500" />,
      title: isRTL ? 'شبكة الوكيل' : 'Proxy Network',
      description: isRTL 
        ? 'تصفح آمن وخاص مع شبكة الوكيل الذكية' 
        : 'Secure and private browsing with smart proxy network',
      action: () => navigate('/proxy'),
    },
    {
      icon: <Smartphone className="h-8 w-8 text-orange-500" />,
      title: isRTL ? 'محاكي الجوال' : 'Mobile Emulator',
      description: isRTL 
        ? 'جرب تطبيقات الجوال في المتصفح' 
        : 'Experience mobile apps in your browser',
      action: () => navigate('/mobile'),
    },
  ];

  const quickActions = [
    {
      icon: <Users className="h-5 w-5" />,
      label: isRTL ? 'المشاريع' : 'Projects',
      description: isRTL ? 'إدارة مشاريعك' : 'Manage your projects',
      action: () => navigate('/projects'),
    },
    {
      icon: <Settings className="h-5 w-5" />,
      label: isRTL ? 'الإعدادات' : 'Settings',
      description: isRTL ? 'تخصيص التجربة' : 'Customize your experience',
      action: () => navigate('/settings'),
    },
    {
      icon: <TrendingUp className="h-5 w-5" />,
      label: isRTL ? 'اللوحة' : 'Dashboard',
      description: isRTL ? 'مراقبة النظام' : 'System monitoring',
      action: () => navigate('/dashboard'),
    },
    {
      icon: <Zap className="h-5 w-5" />,
      label: isRTL ? 'خدمات AI' : 'AI Services',
      description: isRTL ? 'الخدمات الذكية' : 'Intelligent services',
      action: () => navigate('/ai'),
    },
  ];

  return (
    <div className={`min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Header */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <JeanAvatar3D />
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                {isRTL ? 'JeanTrail OS' : 'JeanTrail OS'}
              </h1>
              <p className="text-gray-300 mt-2">
                {isRTL ? 'المتصفح الذكي المدعوم بالذكاء الاصطناعي' : 'AI-Powered Smart Browser'}
              </p>
            </div>
          </div>
          
          {user && (
            <div className="text-right">
              <p className="text-sm text-gray-400">{isRTL ? 'مرحباً بعودتك' : 'Welcome back'}</p>
              <p className="font-semibold">{user.name || user.email}</p>
            </div>
          )}
        </div>

        {/* Hero Section */}
        <div className="mt-12 text-center">
          <h2 className="text-5xl font-bold mb-6">
            {isRTL ? 'مستقبل التصفح هنا' : 'The Future of Browsing is Here'}
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
            {isRTL 
              ? 'اكتشف تجربة تصفح ثورية مع Jean AI assistant، 4-strip architecture، والخدمات الذكية المتكاملة'
              : 'Discover a revolutionary browsing experience with Jean AI assistant, 4-strip architecture, and integrated intelligent services'
            }
          </p>
          
          <div className="flex justify-center gap-4">
            <Button 
              variant="jean" 
              size="xl"
              onClick={() => navigate('/browser')}
              className="shadow-2xl"
            >
              <Globe className="mr-2 h-5 w-5" />
              {isRTL ? 'ابدأ التصفح' : 'Start Browsing'}
            </Button>
            <Button 
              variant="glass" 
              size="xl"
              onClick={() => navigate('/projects')}
            >
              {isRTL ? 'استكشف الميزات' : 'Explore Features'}
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/20 transition-all duration-300 cursor-pointer group" onClick={feature.action}>
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 p-3 bg-black/20 rounded-full group-hover:bg-black/30 transition-colors">
                  {feature.icon}
                </div>
                <CardTitle className="text-white text-lg">
                  {feature.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-300 text-center">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mt-16">
          <h3 className="text-2xl font-bold text-center mb-8">
            {isRTL ? 'إجراءات سريعة' : 'Quick Actions'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <Button
                key={index}
                variant="glass"
                size="lg"
                onClick={action.action}
                className="h-auto p-4 flex flex-col items-center space-y-2 hover:bg-white/30"
              >
                {action.icon}
                <span className="font-medium">{action.label}</span>
                <span className="text-xs text-gray-300">{action.description}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Stats Section */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-r from-blue-500/20 to-blue-600/20 border-blue-400/30">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-blue-300">4</div>
              <div className="text-blue-200">
                {isRTL ? 'بيئات تصفح' : 'Browsing Environments'}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-r from-purple-500/20 to-purple-600/20 border-purple-400/30">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-purple-300">AI</div>
              <div className="text-purple-200">
                {isRTL ? 'مساعد ذكي متكامل' : 'Integrated Smart Assistant'}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-r from-green-500/20 to-green-600/20 border-green-400/30">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-green-300">100%</div>
              <div className="text-green-200">
                {isRTL ? 'خصوصية وأمان' : 'Privacy & Security'}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};