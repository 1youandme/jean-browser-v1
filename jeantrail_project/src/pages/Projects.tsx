import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { useProjectsStore } from '@/store';
import { useUIStore } from '@/store';
import { 
  Folder, 
  Plus, 
  Search, 
  Filter, 
  Grid, 
  List, 
  Calendar,
  User,
  Activity,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Code,
  Database,
  Globe
} from 'lucide-react';

export const Projects: React.FC = () => {
  const navigate = useNavigate();
  const { 
    projects, 
    activeProject, 
    isLoading, 
    createProject, 
    updateProject, 
    deleteProject, 
    setActiveProject,
    loadProjects 
  } = useProjectsStore();
  
  const { language, addNotification } = useUIStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'web',
    tags: [] as string[],
  });

  const isRTL = language === 'ar';

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const projectTypes = [
    { value: 'web', label: 'Web Application', icon: <Globe className="h-4 w-4" /> },
    { value: 'mobile', label: 'Mobile App', icon: <Smartphone className="h-4 w-4" /> },
    { value: 'ai', label: 'AI Project', icon: <Cpu className="h-4 w-4" /> },
    { value: 'database', label: 'Database', icon: <Database className="h-4 w-4" /> },
    { value: 'api', label: 'API Service', icon: <Code className="h-4 w-4" /> },
  ];

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleCreateProject = async () => {
    try {
      await createProject(formData);
      setShowCreateModal(false);
      setFormData({ name: '', description: '', type: 'web', tags: [] });
      addNotification({
        id: 'project-created',
        type: 'success',
        title: isRTL ? 'تم إنشاء المشروع' : 'Project Created',
        message: isRTL ? 'تم إنشاء المشروع بنجاح' : 'Project created successfully',
      });
    } catch (error) {
      addNotification({
        id: 'project-create-error',
        type: 'error',
        title: isRTL ? 'خطأ' : 'Error',
        message: isRTL ? 'فشل إنشاء المشروع' : 'Failed to create project',
      });
    }
  };

  const handleEditProject = async () => {
    if (!selectedProject) return;
    
    try {
      await updateProject(selectedProject.id, formData);
      setShowEditModal(false);
      setSelectedProject(null);
      setFormData({ name: '', description: '', type: 'web', tags: [] });
      addNotification({
        id: 'project-updated',
        type: 'success',
        title: isRTL ? 'تم تحديث المشروع' : 'Project Updated',
        message: isRTL ? 'تم تحديث المشروع بنجاح' : 'Project updated successfully',
      });
    } catch (error) {
      addNotification({
        id: 'project-update-error',
        type: 'error',
        title: isRTL ? 'خطأ' : 'Error',
        message: isRTL ? 'فشل تحديث المشروع' : 'Failed to update project',
      });
    }
  };

  const handleDeleteProject = async () => {
    if (!selectedProject) return;
    
    try {
      await deleteProject(selectedProject.id);
      setShowDeleteModal(false);
      setSelectedProject(null);
      addNotification({
        id: 'project-deleted',
        type: 'success',
        title: isRTL ? 'تم حذف المشروع' : 'Project Deleted',
        message: isRTL ? 'تم حذف المشروع بنجاح' : 'Project deleted successfully',
      });
    } catch (error) {
      addNotification({
        id: 'project-delete-error',
        type: 'error',
        title: isRTL ? 'خطأ' : 'Error',
        message: isRTL ? 'فشل حذف المشروع' : 'Failed to delete project',
      });
    }
  };

  const openEditModal = (project: Project) => {
    setSelectedProject(project);
    setFormData({
      name: project.name,
      description: project.description,
      type: project.type,
      tags: project.tags,
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (project: Project) => {
    setSelectedProject(project);
    setShowDeleteModal(true);
  };

  const getProjectTypeIcon = (type: string) => {
    const projectType = projectTypes.find(t => t.value === type);
    return projectType?.icon || <Folder className="h-4 w-4" />;
  };

  const getProjectTypeLabel = (type: string) => {
    const projectType = projectTypes.find(t => t.value === type);
    return projectType?.label || type;
  };

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Folder className="h-8 w-8 text-blue-500" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {isRTL ? 'المشاريع' : 'Projects'}
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {isRTL ? 'إدارة مشاريعك وتطبيقاتك' : 'Manage your projects and applications'}
                </p>
              </div>
            </div>
            
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="mr-2 h-4 w-4" />
              {isRTL ? 'مشروع جديد' : 'New Project'}
            </Button>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder={isRTL ? 'البحث عن مشاريع...' : 'Search projects...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-80"
                />
              </div>
              
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                {isRTL ? 'تصفية' : 'Filter'}
              </Button>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-6">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-12">
            <Folder className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {isRTL ? 'لا توجد مشاريع' : 'No Projects Found'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {isRTL ? 'ابدأ بإنشاء مشروع جديد' : 'Start by creating a new project'}
            </p>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="mr-2 h-4 w-4" />
              {isRTL ? 'إنشاء مشروع' : 'Create Project'}
            </Button>
          </div>
        ) : (
          <>
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProjects.map((project) => (
                  <Card key={project.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                            {getProjectTypeIcon(project.type)}
                          </div>
                          <div>
                            <CardTitle className="text-lg">{project.name}</CardTitle>
                            <CardDescription className="text-sm">
                              {getProjectTypeLabel(project.type)}
                            </CardDescription>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                        {project.description}
                      </p>
                      
                      <div className="flex flex-wrap gap-1 mb-4">
                        {project.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-xs rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                        {project.tags.length > 3 && (
                          <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-xs rounded-full">
                            +{project.tags.length - 3}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span>{new Date(project.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Activity className="h-3 w-3" />
                          <span>{project.updatedAt ? new Date(project.updatedAt).toLocaleDateString() : 'Never'}</span>
                        </div>
                      </div>
                      
                      <div className="flex space-x-2 mt-4">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => setActiveProject(project)}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          {isRTL ? 'عرض' : 'View'}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditModal(project)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openDeleteModal(project)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredProjects.map((project) => (
                  <Card key={project.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                            {getProjectTypeIcon(project.type)}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                              {project.name}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                              {project.description}
                            </p>
                            <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                              <span>{getProjectTypeLabel(project.type)}</span>
                              <div className="flex items-center space-x-1">
                                <Calendar className="h-3 w-3" />
                                <span>{new Date(project.createdAt).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Button size="sm" variant="outline" onClick={() => setActiveProject(project)}>
                            <Eye className="h-4 w-4 mr-1" />
                            {isRTL ? 'عرض' : 'View'}
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => openEditModal(project)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => openDeleteModal(project)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title={isRTL ? 'إنشاء مشروع جديد' : 'Create New Project'}
      >
        <div className="space-y-4">
          <Input
            label={isRTL ? 'اسم المشروع' : 'Project Name'}
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder={isRTL ? 'أدخل اسم المشروع...' : 'Enter project name...'}
          />
          
          <div>
            <label className="text-sm font-medium mb-2 block">
              {isRTL ? 'الوصف' : 'Description'}
            </label>
            <textarea
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder={isRTL ? 'وصف المشروع...' : 'Project description...'}
            />
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">
              {isRTL ? 'نوع المشروع' : 'Project Type'}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {projectTypes.map((type) => (
                <Button
                  key={type.value}
                  variant={formData.type === type.value ? 'default' : 'outline'}
                  onClick={() => setFormData({ ...formData, type: type.value })}
                  className="justify-start"
                >
                  {type.icon}
                  <span className="ml-2">{type.label}</span>
                </Button>
              ))}
            </div>
          </div>
        </div>
        
        <div className="flex justify-end space-x-3 mt-6">
          <Button variant="outline" onClick={() => setShowCreateModal(false)}>
            {isRTL ? 'إلغاء' : 'Cancel'}
          </Button>
          <Button onClick={handleCreateProject} disabled={!formData.name}>
            {isRTL ? 'إنشاء' : 'Create'}
          </Button>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title={isRTL ? 'تحرير المشروع' : 'Edit Project'}
      >
        <div className="space-y-4">
          <Input
            label={isRTL ? 'اسم المشروع' : 'Project Name'}
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          
          <div>
            <label className="text-sm font-medium mb-2 block">
              {isRTL ? 'الوصف' : 'Description'}
            </label>
            <textarea
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
        </div>
        
        <div className="flex justify-end space-x-3 mt-6">
          <Button variant="outline" onClick={() => setShowEditModal(false)}>
            {isRTL ? 'إلغاء' : 'Cancel'}
          </Button>
          <Button onClick={handleEditProject} disabled={!formData.name}>
            {isRTL ? 'حفظ' : 'Save'}
          </Button>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title={isRTL ? 'حذف المشروع' : 'Delete Project'}
      >
        <div className="space-y-4">
          <p className="text-gray-700 dark:text-gray-300">
            {isRTL 
              ? 'هل أنت متأكد من أنك تريد حذف هذا المشروع؟ هذا الإجراء لا يمكن التراجع عنه.' 
              : 'Are you sure you want to delete this project? This action cannot be undone.'
            }
          </p>
          {selectedProject && (
            <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <p className="font-medium">{selectedProject.name}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{selectedProject.description}</p>
            </div>
          )}
        </div>
        
        <div className="flex justify-end space-x-3 mt-6">
          <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
            {isRTL ? 'إلغاء' : 'Cancel'}
          </Button>
          <Button variant="destructive" onClick={handleDeleteProject}>
            {isRTL ? 'حذف' : 'Delete'}
          </Button>
        </div>
      </Modal>
    </div>
  );
};