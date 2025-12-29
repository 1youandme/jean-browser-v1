import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/store';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { 
  User, 
  Mail, 
  Calendar, 
  MapPin, 
  Link as LinkIcon, 
  Edit,
  Camera,
  Shield,
  Activity,
  Download,
  Award,
  Clock
} from 'lucide-react';

export const Profile: React.FC = () => {
  const { user, isAuthenticated } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    bio: '',
    location: '',
    website: '',
    phone: '',
  });

  const isRTL = false; // Could be from UI store

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        bio: user.bio || '',
        location: user.location || '',
        website: user.website || '',
        phone: user.phone || '',
      });
    }
  }, [user]);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // API call to update profile
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        bio: user.bio || '',
        location: user.location || '',
        website: user.website || '',
        phone: user.phone || '',
      });
    }
    setIsEditing(false);
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">
              {isRTL ? 'غير مصادق' : 'Not Authenticated'}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {isRTL ? 'يرجى تسجيل الدخول لعرض ملفك الشخصي' : 'Please login to view your profile'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const stats = [
    {
      label: isRTL ? 'المشاريع' : 'Projects',
      value: '12',
      icon: <Activity className="h-4 w-4" />,
      color: 'text-blue-500',
    },
    {
      label: isRTL ? 'المهام المكتملة' : 'Tasks Completed',
      value: '156',
      icon: <Award className="h-4 w-4" />,
      color: 'text-green-500',
    },
    {
      label: isRTL ? 'ساعات النشاط' : 'Active Hours',
      value: '1,234',
      icon: <Clock className="h-4 w-4" />,
      color: 'text-purple-500',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <User className="h-8 w-8" />
            {isRTL ? 'الملف الشخصي' : 'Profile'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            {isRTL ? 'إدارة ملفك الشخصي ومعلوماتك' : 'Manage your profile and personal information'}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Profile Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                        {user.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
                      </div>
                      <Button
                        size="icon"
                        className="absolute bottom-0 right-0 h-8 w-8 rounded-full"
                        variant="outline"
                      >
                        <Camera className="h-4 w-4" />
                      </Button>
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {user.name || 'User'}
                      </h2>
                      <p className="text-gray-600 dark:text-gray-400">{user.email}</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    {isEditing ? (
                      <>
                        <Button
                          onClick={handleSave}
                          disabled={isLoading}
                          loading={isLoading}
                        >
                          {isRTL ? 'حفظ' : 'Save'}
                        </Button>
                        <Button variant="outline" onClick={handleCancel}>
                          {isRTL ? 'إلغاء' : 'Cancel'}
                        </Button>
                      </>
                    ) : (
                      <Button onClick={() => setIsEditing(true)}>
                        <Edit className="mr-2 h-4 w-4" />
                        {isRTL ? 'تعديل' : 'Edit'}
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {isEditing ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label={isRTL ? 'الاسم الكامل' : 'Full Name'}
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                    <Input
                      label={isRTL ? 'البريد الإلكتروني' : 'Email'}
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      disabled
                    />
                    <Input
                      label={isRTL ? 'الموقع' : 'Location'}
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      startIcon={<MapPin className="h-4 w-4" />}
                    />
                    <Input
                      label={isRTL ? 'الموقع الإلكتروني' : 'Website'}
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      startIcon={<LinkIcon className="h-4 w-4" />}
                    />
                    <Input
                      label={isRTL ? 'رقم الهاتف' : 'Phone'}
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <Mail className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {isRTL ? 'البريد الإلكتروني' : 'Email'}
                        </p>
                        <p className="font-medium">{user.email}</p>
                      </div>
                    </div>
                    
                    {user.location && (
                      <div className="flex items-center space-x-3">
                        <MapPin className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {isRTL ? 'الموقع' : 'Location'}
                          </p>
                          <p className="font-medium">{user.location}</p>
                        </div>
                      </div>
                    )}
                    
                    {user.website && (
                      <div className="flex items-center space-x-3">
                        <LinkIcon className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {isRTL ? 'الموقع الإلكتروني' : 'Website'}
                          </p>
                          <a 
                            href={user.website} 
                            className="font-medium text-blue-500 hover:underline"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {user.website}
                          </a>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center space-x-3">
                      <Calendar className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {isRTL ? 'تاريخ الانضمام' : 'Joined'}
                        </p>
                        <p className="font-medium">
                          {new Date(user.createdAt || '').toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {isEditing && (
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      {isRTL ? 'السيرة الذاتية' : 'Bio'}
                    </label>
                    <textarea
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      rows={4}
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      placeholder={isRTL ? 'اكتب شيئاً عن نفسك...' : 'Write something about yourself...'}
                    />
                  </div>
                )}
                
                {!isEditing && user.bio && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                      {isRTL ? 'السيرة الذاتية' : 'Bio'}
                    </p>
                    <p className="text-gray-700 dark:text-gray-300">{user.bio}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Stats Card */}
            <Card>
              <CardHeader>
                <CardTitle>
                  {isRTL ? 'إحصائيات النشاط' : 'Activity Stats'}
                </CardTitle>
                <CardDescription>
                  {isRTL ? 'نظرة عامة على نشاطك في JeanTrail OS' : 'Overview of your activity in JeanTrail OS'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {stats.map((stat, index) => (
                    <div key={index} className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className={`${stat.color} mb-2 flex justify-center`}>
                        {stat.icon}
                      </div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {stat.value}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {stat.label}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {isRTL ? 'إجراءات سريعة' : 'Quick Actions'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="ghost" className="w-full justify-start">
                  <Shield className="mr-2 h-4 w-4" />
                  {isRTL ? 'الأمان والخصوصية' : 'Security & Privacy'}
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  <Download className="mr-2 h-4 w-4" />
                  {isRTL ? 'تحميل البيانات' : 'Download Data'}
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  <Activity className="mr-2 h-4 w-4" />
                  {isRTL ? 'سجل النشاط' : 'Activity Log'}
                </Button>
              </CardContent>
            </Card>

            {/* Account Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {isRTL ? 'معلومات الحساب' : 'Account Info'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {isRTL ? 'حالة الحساب' : 'Account Status'}
                  </span>
                  <span className="text-sm font-medium text-green-600">
                    {isRTL ? 'نشط' : 'Active'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {isRTL ? 'نوع الحساب' : 'Account Type'}
                  </span>
                  <span className="text-sm font-medium">
                    {isRTL ? 'مطور' : 'Developer'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {isRTL ? 'المساحة المستخدمة' : 'Storage Used'}
                  </span>
                  <span className="text-sm font-medium">2.3 GB</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {isRTL ? 'آخر تسجيل دخول' : 'Last Login'}
                  </span>
                  <span className="text-sm font-medium">2 hours ago</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};