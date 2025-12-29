// Social Feed Service Interface and Implementation
export interface Post {
  id: string;
  author: User;
  content: string;
  media?: MediaContent[];
  hashtags: string[];
  mentions: string[];
  likes: number;
  comments: number;
  shares: number;
  isLiked: boolean;
  isBookmarked: boolean;
  visibility: 'public' | 'friends' | 'private';
  location?: Location;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
  bio?: string;
  verified: boolean;
  followerCount: number;
  followingCount: number;
  postCount: number;
  isFollowing: boolean;
  isBlocked: boolean;
  joinedAt: Date;
}

export interface MediaContent {
  id: string;
  type: 'image' | 'video' | 'audio' | 'gif';
  url: string;
  thumbnail?: string;
  duration?: number;
  size: number;
  metadata?: Record<string, any>;
}

export interface Comment {
  id: string;
  postId: string;
  author: User;
  content: string;
  media?: MediaContent[];
  likes: number;
  isLiked: boolean;
  parentId?: string;
  replies: Comment[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Location {
  name: string;
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}

export interface Story {
  id: string;
  author: User;
  media: MediaContent[];
  viewers: string[];
  createdAt: Date;
  expiresAt: Date;
  isViewed: boolean;
}

export interface SocialFeedService {
  // Feed management
  getFeed: (type?: 'home' | 'trending' | 'following', limit?: number) => Promise<Post[]>;
  getPost: (id: string) => Promise<Post>;
  createPost: (content: string, media?: File[], visibility?: string) => Promise<Post>;
  updatePost: (id: string, content: string) => Promise<Post>;
  deletePost: (id: string) => Promise<void>;
  
  // Post interactions
  likePost: (postId: string) => Promise<void>;
  unlikePost: (postId: string) => Promise<void>;
  sharePost: (postId: string, message?: string) => Promise<Post>;
  bookmarkPost: (postId: string) => Promise<void>;
  unbookmarkPost: (postId: string) => Promise<void>;
  
  // Comments
  getComments: (postId: string) => Promise<Comment[]>;
  createComment: (postId: string, content: string, media?: File[], parentId?: string) => Promise<Comment>;
  updateComment: (commentId: string, content: string) => Promise<Comment>;
  deleteComment: (commentId: string) => Promise<void>;
  likeComment: (commentId: string) => Promise<void>;
  unlikeComment: (commentId: string) => Promise<void>;
  
  // User management
  getUserProfile: (username: string) => Promise<User>;
  getUserPosts: (username: string) => Promise<Post[]>;
  followUser: (username: string) => Promise<void>;
  unfollowUser: (username: string) => Promise<void>;
  blockUser: (username: string) => Promise<void>;
  unblockUser: (username: string) => Promise<void>;
  getFollowers: (username: string) => Promise<User[]>;
  getFollowing: (username: string) => Promise<User[]>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<User>;
  
  // Stories
  getStories: () => Promise<Story[]>;
  getUserStories: (username: string) => Promise<Story[]>;
  createStory: (media: File[], duration?: number) => Promise<Story>;
  viewStory: (storyId: string) => Promise<void>;
  deleteStory: (storyId: string) => Promise<void>;
  
  // Search and discovery
  searchPosts: (query: string, filters?: SearchFilters) => Promise<Post[]>;
  searchUsers: (query: string) => Promise<User[]>;
  getTrendingHashtags: () => Promise<TrendingHashtag[]>;
  getForYouFeed: () => Promise<Post[]>;
  
  // Notifications
  getNotifications: () => Promise<Notification[]>;
  markNotificationRead: (notificationId: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  
  // Media upload
  uploadMedia: (file: File) => Promise<MediaContent>;
  deleteMedia: (mediaId: string) => Promise<void>;
}

export interface UserProfile {
  displayName: string;
  bio?: string;
  avatar?: string;
  headerImage?: string;
  location?: string;
  website?: string;
  birthdate?: string;
  private: boolean;
}

export interface SearchFilters {
  type?: 'posts' | 'users' | 'hashtags';
  dateRange?: {
    from: Date;
    to: Date;
  };
  mediaType?: 'image' | 'video' | 'all';
  sortBy?: 'relevance' | 'recent' | 'popular';
}

export interface TrendingHashtag {
  tag: string;
  posts: number;
  growth: number;
}

export interface Notification {
  id: string;
  type: 'like' | 'comment' | 'follow' | 'mention' | 'share' | 'story_view';
  message: string;
  user: User;
  postId?: string;
  commentId?: string;
  storyId?: string;
  isRead: boolean;
  createdAt: Date;
}

class SocialFeedServiceImpl implements SocialFeedService {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:8080') {
    this.baseUrl = baseUrl;
  }

  async getFeed(type?: 'home' | 'trending' | 'following', limit?: number): Promise<Post[]> {
    const params = new URLSearchParams();
    if (type) params.append('type', type);
    if (limit) params.append('limit', limit.toString());

    const response = await fetch(`${this.baseUrl}/api/social/feed?${params}`);
    if (!response.ok) throw new Error('Failed to get feed');
    return response.json();
  }

  async getPost(id: string): Promise<Post> {
    const response = await fetch(`${this.baseUrl}/api/social/posts/${id}`);
    if (!response.ok) throw new Error('Failed to get post');
    return response.json();
  }

  async createPost(content: string, media?: File[], visibility?: string): Promise<Post> {
    const formData = new FormData();
    formData.append('content', content);
    if (visibility) formData.append('visibility', visibility);
    if (media) {
      media.forEach(file => formData.append('media', file));
    }

    const response = await fetch(`${this.baseUrl}/api/social/posts`, {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) throw new Error('Failed to create post');
    return response.json();
  }

  async updatePost(id: string, content: string): Promise<Post> {
    const response = await fetch(`${this.baseUrl}/api/social/posts/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });
    if (!response.ok) throw new Error('Failed to update post');
    return response.json();
  }

  async deletePost(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/social/posts/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete post');
  }

  async likePost(postId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/social/posts/${postId}/like`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to like post');
  }

  async unlikePost(postId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/social/posts/${postId}/like`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to unlike post');
  }

  async sharePost(postId: string, message?: string): Promise<Post> {
    const response = await fetch(`${this.baseUrl}/api/social/posts/${postId}/share`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    });
    if (!response.ok) throw new Error('Failed to share post');
    return response.json();
  }

  async bookmarkPost(postId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/social/posts/${postId}/bookmark`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to bookmark post');
  }

  async unbookmarkPost(postId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/social/posts/${postId}/bookmark`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to unbookmark post');
  }

  async getComments(postId: string): Promise<Comment[]> {
    const response = await fetch(`${this.baseUrl}/api/social/posts/${postId}/comments`);
    if (!response.ok) throw new Error('Failed to get comments');
    return response.json();
  }

  async createComment(postId: string, content: string, media?: File[], parentId?: string): Promise<Comment> {
    const formData = new FormData();
    formData.append('content', content);
    if (parentId) formData.append('parentId', parentId);
    if (media) {
      media.forEach(file => formData.append('media', file));
    }

    const response = await fetch(`${this.baseUrl}/api/social/posts/${postId}/comments`, {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) throw new Error('Failed to create comment');
    return response.json();
  }

  async updateComment(commentId: string, content: string): Promise<Comment> {
    const response = await fetch(`${this.baseUrl}/api/social/comments/${commentId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });
    if (!response.ok) throw new Error('Failed to update comment');
    return response.json();
  }

  async deleteComment(commentId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/social/comments/${commentId}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete comment');
  }

  async likeComment(commentId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/social/comments/${commentId}/like`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to like comment');
  }

  async unlikeComment(commentId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/social/comments/${commentId}/like`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to unlike comment');
  }

  async getUserProfile(username: string): Promise<User> {
    const response = await fetch(`${this.baseUrl}/api/social/users/${username}`);
    if (!response.ok) throw new Error('Failed to get user profile');
    return response.json();
  }

  async getUserPosts(username: string): Promise<Post[]> {
    const response = await fetch(`${this.baseUrl}/api/social/users/${username}/posts`);
    if (!response.ok) throw new Error('Failed to get user posts');
    return response.json();
  }

  async followUser(username: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/social/users/${username}/follow`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to follow user');
  }

  async unfollowUser(username: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/social/users/${username}/follow`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to unfollow user');
  }

  async blockUser(username: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/social/users/${username}/block`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to block user');
  }

  async unblockUser(username: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/social/users/${username}/block`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to unblock user');
  }

  async getFollowers(username: string): Promise<User[]> {
    const response = await fetch(`${this.baseUrl}/api/social/users/${username}/followers`);
    if (!response.ok) throw new Error('Failed to get followers');
    return response.json();
  }

  async getFollowing(username: string): Promise<User[]> {
    const response = await fetch(`${this.baseUrl}/api/social/users/${username}/following`);
    if (!response.ok) throw new Error('Failed to get following');
    return response.json();
  }

  async updateProfile(updates: Partial<UserProfile>): Promise<User> {
    const response = await fetch(`${this.baseUrl}/api/social/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!response.ok) throw new Error('Failed to update profile');
    return response.json();
  }

  async getStories(): Promise<Story[]> {
    const response = await fetch(`${this.baseUrl}/api/social/stories`);
    if (!response.ok) throw new Error('Failed to get stories');
    return response.json();
  }

  async getUserStories(username: string): Promise<Story[]> {
    const response = await fetch(`${this.baseUrl}/api/social/users/${username}/stories`);
    if (!response.ok) throw new Error('Failed to get user stories');
    return response.json();
  }

  async createStory(media: File[], duration?: number): Promise<Story> {
    const formData = new FormData();
    media.forEach(file => formData.append('media', file));
    if (duration) formData.append('duration', duration.toString());

    const response = await fetch(`${this.baseUrl}/api/social/stories`, {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) throw new Error('Failed to create story');
    return response.json();
  }

  async viewStory(storyId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/social/stories/${storyId}/view`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to view story');
  }

  async deleteStory(storyId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/social/stories/${storyId}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete story');
  }

  async searchPosts(query: string, filters?: SearchFilters): Promise<Post[]> {
    const params = new URLSearchParams({ query });
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, String(value));
        }
      });
    }

    const response = await fetch(`${this.baseUrl}/api/social/search/posts?${params}`);
    if (!response.ok) throw new Error('Failed to search posts');
    return response.json();
  }

  async searchUsers(query: string): Promise<User[]> {
    const response = await fetch(`${this.baseUrl}/api/social/search/users?q=${encodeURIComponent(query)}`);
    if (!response.ok) throw new Error('Failed to search users');
    return response.json();
  }

  async getTrendingHashtags(): Promise<TrendingHashtag[]> {
    const response = await fetch(`${this.baseUrl}/api/social/trending/hashtags`);
    if (!response.ok) throw new Error('Failed to get trending hashtags');
    return response.json();
  }

  async getForYouFeed(): Promise<Post[]> {
    const response = await fetch(`${this.baseUrl}/api/social/feed/for-you`);
    if (!response.ok) throw new Error('Failed to get for you feed');
    return response.json();
  }

  async getNotifications(): Promise<Notification[]> {
    const response = await fetch(`${this.baseUrl}/api/social/notifications`);
    if (!response.ok) throw new Error('Failed to get notifications');
    return response.json();
  }

  async markNotificationRead(notificationId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/social/notifications/${notificationId}/read`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to mark notification as read');
  }

  async markAllNotificationsRead(): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/social/notifications/read-all`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to mark all notifications as read');
  }

  async uploadMedia(file: File): Promise<MediaContent> {
    const formData = new FormData();
    formData.append('media', file);

    const response = await fetch(`${this.baseUrl}/api/social/media/upload`, {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) throw new Error('Failed to upload media');
    return response.json();
  }

  async deleteMedia(mediaId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/social/media/${mediaId}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete media');
  }
}

export const socialFeedService = new SocialFeedServiceImpl();
export const useSocialFeedService = () => socialFeedService;