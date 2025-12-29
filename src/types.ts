export interface Tab {
  id: string;
  title: string;
  url?: string;
  path?: string;
  type: 'local' | 'proxy' | 'web' | 'mobile';
  isActive: boolean;
  isPinned: boolean;
  favicon?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface JeanMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  actions?: JeanAction[];
}

export interface JeanAction {
  type: 'open_tab' | 'close_tab' | 'navigate' | 'open_local_path';
  targetBar: 'local' | 'proxy' | 'web' | 'mobile';
  payload: Record<string, any>;
}

export interface Workspace {
  id: string;
  userId: string;
  name: string;
  layoutJson: SplitLayout;
  createdAt: Date;
  updatedAt: Date;
}

export interface SplitLayout {
  panes: SplitPane[];
  direction: 'horizontal' | 'vertical';
}

export interface SplitPane {
  id: string;
  viewType: 'local' | 'proxy' | 'web' | 'mobile';
  tabId?: string;
  size?: number;
}

export interface ProxyNode {
  id: string;
  userId: string;
  host: string;
  port: number;
  protocol: string;
  status: 'active' | 'inactive' | 'error';
  lastCheckedAt?: Date;
  createdAt: Date;
}

export interface ProxySession {
  id: string;
  userId: string;
  nodeId: string;
  startedAt: Date;
  endedAt?: Date;
  bytesUp?: number;
  bytesDown?: number;
}

export interface FileEntry {
  name: string;
  path: string;
  isDirectory: boolean;
  size?: number;
  modified?: string;
}

export interface AIResponse {
  response: string;
  actions?: JeanAction[];
}

export interface AIRequest {
  prompt: string;
  contextJson?: string;
  model?: string;
}

export type ViewType = 'local' | 'proxy' | 'web' | 'mobile';

// Marketplace Types
export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  rating: number;
  description: string;
  inStock: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CartItem extends Product {
  quantity: number;
  addedAt: Date;
}

export interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  totalAmount: number;
  currency: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  shippingAddress: string;
  paymentMethod: string;
  createdAt: Date;
  updatedAt: Date;
}

// Messenger Types
export interface User {
  id: string;
  name: string;
  avatar: string;
  status: 'online' | 'offline' | 'away';
  lastSeen?: string;
  unreadCount?: number;
  createdAt: Date;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  timestamp: Date;
  isRead: boolean;
  isDelivered: boolean;
  chatId: string;
}

export interface Chat {
  id: string;
  participants: string[];
  lastMessage?: Message;
  unreadCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// Wallet Types
export interface Transaction {
  id: string;
  userId: string;
  type: 'income' | 'expense';
  amount: number;
  currency: string;
  description: string;
  category: string;
  timestamp: Date;
  status: 'completed' | 'pending' | 'failed';
  balance: number;
}

export interface Currency {
  code: string;
  symbol: string;
  rate: number;
  flag: string;
}

export interface WalletBalance {
  userId: string;
  balance: number;
  currency: string;
  updatedAt: Date;
}

// Jean Avatar Types
export interface AvatarState {
  state: 'idle' | 'listening' | 'speaking' | 'processing' | 'error';
  mood: 'neutral' | 'happy' | 'concerned' | 'excited' | 'thoughtful' | 'confused';
  connection_status: 'connected' | 'connecting' | 'disconnected';
  battery_level: number;
  current_viseme: VisemeData | null;
  error_message?: string;
}

export interface VisemeData {
  viseme_id: number;
  confidence: number;
  blend_shapes: {
    jawOpen: number;
    lipsRound: number;
    lipsPressed: number;
    [key: string]: number;
  };
  timestamp: number;
}

export type AvatarMood = 'neutral' | 'happy' | 'concerned' | 'excited' | 'thoughtful' | 'confused';

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}