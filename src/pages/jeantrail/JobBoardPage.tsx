import React from 'react';
import { Briefcase, Search, MapPin, DollarSign, Clock, Users } from 'lucide-react';

export const JobBoardPage: React.FC = () => {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Briefcase className="w-8 h-8 text-blue-600" />
            JeanTrail Job Board
          </h1>
          <p className="text-gray-600 mt-2">
            Connect with opportunities from top companies worldwide
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Job title, keywords, or company"
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Location or remote"
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium">
            Search Jobs
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-gray-900">2,847</div>
              <div className="text-sm text-gray-600">Active Jobs</div>
            </div>
            <Briefcase className="w-8 h-8 text-blue-100" />
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-gray-900">523</div>
              <div className="text-sm text-gray-600">Companies</div>
            </div>
            <Users className="w-8 h-8 text-green-100" />
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-gray-900">89</div>
              <div className="text-sm text-gray-600">Remote Jobs</div>
            </div>
            <MapPin className="w-8 h-8 text-purple-100" />
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-gray-900">156</div>
              <div className="text-sm text-gray-600">New Today</div>
            </div>
            <Clock className="w-8 h-8 text-orange-100" />
          </div>
        </div>
      </div>

      {/* Job Categories */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Browse by Category</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[
            { name: 'Engineering', icon: '💻', count: 342 },
            { name: 'Design', icon: '🎨', count: 128 },
            { name: 'Marketing', icon: '📱', count: 234 },
            { name: 'Sales', icon: '💰', count: 189 },
            { name: 'Finance', icon: '📊', count: 156 },
            { name: 'Healthcare', icon: '🏥', count: 98 },
            { name: 'Education', icon: '📚', count: 87 },
            { name: 'Customer Service', icon: '🎧', count: 76 },
            { name: 'Operations', icon: '⚙️', count: 145 },
            { name: 'HR', icon: '👥', count: 64 },
            { name: 'Legal', icon: '⚖️', count: 43 },
            { name: 'Data Science', icon: '📈', count: 112 }
          ].map((category) => (
            <div
              key={category.name}
              className="bg-white rounded-lg p-4 text-center border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="text-2xl mb-2">{category.icon}</div>
              <div className="text-sm font-medium text-gray-900">{category.name}</div>
              <div className="text-xs text-gray-500">{category.count} jobs</div>
            </div>
          ))}
        </div>
      </div>

      {/* Featured Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Featured Companies</h3>
          <div className="space-y-4">
            {[
              { name: 'TechCorp Inc.', location: 'San Francisco, CA', openJobs: 12 },
              { name: 'Design Studio', location: 'New York, NY', openJobs: 8 },
              { name: 'Global Finance', location: 'London, UK', openJobs: 15 },
              { name: 'HealthTech Solutions', location: 'Boston, MA', openJobs: 6 }
            ].map((company) => (
              <div key={company.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900">{company.name}</div>
                  <div className="text-sm text-gray-600">{company.location}</div>
                </div>
                <div className="text-sm text-blue-600 font-medium">{company.openJobs} jobs</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Job Seeker Resources</h3>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm">1</div>
              <div>
                <div className="font-medium text-gray-900">Resume Builder</div>
                <div className="text-sm text-gray-600">Create professional resumes with AI assistance</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm">2</div>
              <div>
                <div className="font-medium text-gray-900">Interview Prep</div>
                <div className="text-sm text-gray-600">Practice interviews and get personalized feedback</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm">3</div>
              <div>
                <div className="font-medium text-gray-900">Career Insights</div>
                <div className="text-sm text-gray-600">Salary data and career path recommendations</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Coming Soon Section */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-8 border border-blue-200">
        <div className="text-center">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Advanced Job Board Features</h3>
          <p className="text-gray-600 mb-6">
            Full job board functionality coming soon including AI-powered job matching, 
            application tracking, salary negotiations, and professional networking.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-4">
              <DollarSign className="w-8 h-8 text-green-600 mb-2" />
              <div className="font-medium text-gray-900">Salary Calculator</div>
              <div className="text-sm text-gray-600">Know your worth</div>
            </div>
            <div className="bg-white rounded-lg p-4">
              <Users className="w-8 h-8 text-blue-600 mb-2" />
              <div className="font-medium text-gray-900">Networking</div>
              <div className="text-sm text-gray-600">Connect with professionals</div>
            </div>
            <div className="bg-white rounded-lg p-4">
              <Briefcase className="w-8 h-8 text-purple-600 mb-2" />
              <div className="font-medium text-gray-900">Career Path</div>
              <div className="text-sm text-gray-600">Plan your journey</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};