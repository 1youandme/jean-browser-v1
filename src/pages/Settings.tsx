import React, { useState } from 'react';
import { useUIStore } from '@/store';
import { useAuthStore } from '@/store';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { 
  Settings as SettingsIcon,
  User,
  Globe,
  Palette,
  Shield,
  Bell,
  Database,
  Download,
  Upload,
  Trash2,
  Eye,
  EyeOff,
  Save,
  RotateCcw
} from 'lucide-react';

export const Settings: React.FC = () => {
  const { 
    theme, 
    language, 
    setTheme, 
    setLanguage, 
    notifications,
    removeNotification 
  } = useUIStore();
  
  const { user, logout } = useAuthStore();
  
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);

  const isRTL = language === 'ar';

  const themes = [
    { value: 'light', label: isRTL ? 'فاتح' : 'Light', icon: <Sun className="h-4 w-4" /> },
    { value: 'dark', label: isRTL ? 'داكن' : 'Dark', icon: <Moon className="h-4 w-4" /> },
    { value: 'auto', label: isRTL ? 'تلقائي' : 'Auto', icon: <Monitor className="h-4 w-4" /> },
  ];

  const languages = [
    { value: 'en', label: 'English', flag: '🇺🇸' },
    { value: 'ar', label: 'العربية', flag: '🇸🇦' },
  ];

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      return;
    }
    
    // API call to change password
    setShowPasswordModal(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleAccountDelete = async () => {
    // API call to delete account
    logout();
  };

  const exportData = () => {
    const data = {
      user,
      settings: { theme, language },
      exportDate: new Date().toISOString(),
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'jeantrail-data.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 ${isRTL ? 'rtl' : 'ltr'}`}>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <SettingsIcon className="h-8 w-8" />
            {isRTL ? 'الإعدادات' : 'Settings'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            {isRTL ? 'تخصيص تجربة JeanTrail OS' : 'Customize your JeanTrail OS experience'}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Section */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  {isRTL ? 'الملف الشخصي' : 'Profile'}
                </CardTitle>
                <CardDescription>
                  {isRTL ? 'إدارة معلومات حسابك' : 'Manage your account information'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                    {user?.email?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {user?.name || user?.email}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{user?.email}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label={isRTL ? 'الاسم الكامل' : 'Full Name'}
                    placeholder={isRTL ? 'أدخل اسمك' : 'Enter your name'}
                    defaultValue={user?.name || ''}
                  />
                  <Input
                    label={isRTL ? 'البريد الإلكتروني' : 'Email'}
                    type="email"
                    value={user?.email || ''}
                    disabled
                  />
                </div>

                <div className="flex gap-3">
                  <Button onClick={() => setShowPasswordModal(true)}>
                    <Shield className="mr-2 h-4 w-4" />
                    {isRTL ? 'تغيير كلمة المرور' : 'Change Password'}
                  </Button>
                  <Button variant="outline">
                    <Save className="mr-2 h-4 w-4" />
                    {isRTL ? 'حفظ التغييرات' : 'Save Changes'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Appearance Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  {isRTL ? 'المظهر' : 'Appearance'}
                </CardTitle>
                <CardDescription>
                  {isRTL ? 'تخصيص شكل واجهة المستخدم' : 'Customize the user interface appearance'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Theme Selection */}
                <div>
                  <label className="text-sm font-medium mb-3 block">
                    {isRTL ? 'المظهر' : 'Theme'}
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {themes.map((t) => (
                      <Button
                        key={t.value}
                        variant={theme === t.value ? 'default' : 'outline'}
                        onClick={() => setTheme(t.value as any)}
                        className="justify-start"
                      >
                        {t.icon}
                        <span className="ml-2">{t.label}</span>
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Language Selection */}
                <div>
                  <label className="text-sm font-medium mb-3 block">
                    {isRTL ? 'اللغة' : 'Language'}
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {languages.map((lang) => (
                      <Button
                        key={lang.value}
                        variant={language === lang.value ? 'default' : 'outline'}
                        onClick={() => setLanguage(lang.value as any)}
                        className="justify-start"
                      >
                        <span className="mr-2">{lang.flag}</span>
                        <span>{lang.label}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Data Management */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  {isRTL ? 'إدارة البيانات' : 'Data Management'}
                </CardTitle>
                <CardDescription>
                  {isRTL ? 'تصدير واستيراد بياناتك وحذف الحساب' : 'Export, import your data and delete account'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Button variant="outline" onClick={exportData}>
                    <Download className="mr-2 h-4 w-4" />
                    {isRTL ? 'تصدير البيانات' : 'Export Data'}
                  </Button>
                  <Button variant="outline">
                    <Upload className="mr-2 h-4 w-4" />
                    {isRTL ? 'استيراد البيانات' : 'Import Data'}
                  </Button>
                </div>
                
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <Button 
                    variant="destructive" 
                    onClick={() => setShowDeleteModal(true)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    {isRTL ? 'حذف الحساب' : 'Delete Account'}
                  </Button>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    {isRTL 
                      ? 'هذا الإجراء لا يمكن التراجع عنه. سيتم حذف جميع بياناتك بشكل دائم.' 
                      : 'This action cannot be undone. All your data will be permanently deleted.'
                    }
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {isRTL ? 'إعدادات سريعة' : 'Quick Settings'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button variant="ghost" className="w-full justify-start">
                  <Bell className="mr-2 h-4 w-4" />
                  {isRTL ? 'الإشعارات' : 'Notifications'}
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  <Shield className="mr-2 h-4 w-4" />
                  {isRTL ? 'الخصوصية' : 'Privacy'}
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  <Globe className="mr-2 h-4 w-4" />
                  {isRTL ? 'الشبكة' : 'Network'}
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  <RotateCcw className="mr-2 h-4 w-4" />
                  {isRTL ? 'استعادة الإعدادات' : 'Reset Settings'}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {isRTL ? 'حالة النظام' : 'System Status'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">{isRTL ? 'النسخة' : 'Version'}</span>
                  <span className="text-sm font-mono">1.0.0</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">{isRTL ? 'المساحة المستخدمة' : 'Storage Used'}</span>
                  <span className="text-sm font-mono">2.3 GB</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">{isRTL ? 'آخر مزامنة' : 'Last Sync'}</span>
                  <span className="text-sm font-mono">2 min ago</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Password Change Modal */}
      <Modal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        title={isRTL ? 'تغيير كلمة المرور' : 'Change Password'}
      >
        <div className="space-y-4">
          <Input
            label={isRTL ? 'كلمة المرور الحالية' : 'Current Password'}
            type={showPasswords ? 'text' : 'password'}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            endIcon={
              <button
                onClick={() => setShowPasswords(!showPasswords)}
                className="text-gray-400 hover:text-gray-600"
              >
                {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            }
          />
          <Input
            label={isRTL ? 'كلمة المرور الجديدة' : 'New Password'}
            type={showPasswords ? 'text' : 'password'}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <Input
            label={isRTL ? 'تأكيد كلمة المرور الجديدة' : 'Confirm New Password'}
            type={showPasswords ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            error={confirmPassword && newPassword !== confirmPassword ? 
              (isRTL ? 'كلمات المرور غير متطابقة' : 'Passwords do not match') : undefined}
          />
        </div>
        
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={() => setShowPasswordModal(false)}>
            {isRTL ? 'إلغاء' : 'Cancel'}
          </Button>
          <Button onClick={handlePasswordChange} disabled={!currentPassword || !newPassword || newPassword !== confirmPassword}>
            {isRTL ? 'تغيير' : 'Change'}
          </Button>
        </div>
      </Modal>

      {/* Delete Account Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title={isRTL ? 'حذف الحساب' : 'Delete Account'}
      >
        <div className="space-y-4">
          <p className="text-gray-700 dark:text-gray-300">
            {isRTL 
              ? 'هل أنت متأكد من أنك تريد حذف حسابك؟ هذا الإجراء لا يمكن التراجع عنه وسيؤدي إلى فقدان جميع بياناتك بشكل دائم.' 
              : 'Are you sure you want to delete your account? This action cannot be undone and will result in permanent loss of all your data.'
            }
          </p>
          <Input
            placeholder={isRTL ? 'اكتب "DELETE" للتأكيد' : 'Type "DELETE" to confirm'}
          />
        </div>
        
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
            {isRTL ? 'إلغاء' : 'Cancel'}
          </Button>
          <Button variant="destructive" onClick={handleAccountDelete}>
            {isRTL ? 'حذف الحساب' : 'Delete Account'}
          </Button>
        </div>
      </Modal>
    </div>
  );
};