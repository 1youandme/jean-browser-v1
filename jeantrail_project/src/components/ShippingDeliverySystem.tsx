import React, { useState, useEffect, useCallback } from 'react';
import {
  Truck,
  Package,
  MapPin,
  Clock,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Eye,
  Download,
  Upload,
  Globe,
  Plane,
  Ship,
  Train,
  Warehouse,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  Weight,
  Box,
  FileText,
  Settings,
  BarChart3,
  Activity,
  Navigation,
  Zap,
  Wrench,
  Tools,
  HardHat
} from 'lucide-react';

// Types
interface Shipment {
  id: string;
  trackingNumber: string;
  orderNumber: string;
  status: 'pending' | 'processing' | 'shipped' | 'in_transit' | 'customs' | 'out_for_delivery' | 'delivered' | 'returned' | 'lost' | 'damaged';
  carrier: {
    id: string;
    name: string;
    type: 'express' | 'standard' | 'economy' | 'freight';
    logo?: string;
    trackingUrl?: string;
  };
  origin: {
    address: string;
    city: string;
    country: string;
    postalCode: string;
    coordinates?: { latitude: number; longitude: number };
  };
  destination: {
    address: string;
    city: string;
    country: string;
    postalCode: string;
    coordinates?: { latitude: number; longitude: number };
  };
  recipient: {
    name: string;
    phone: string;
    email: string;
  };
  package: {
    weight: number;
    dimensions: {
      length: number;
      width: number;
      height: number;
    };
    description: string;
    value: number;
    currency: string;
    insurance: boolean;
  };
  shipping: {
    method: string;
    cost: number;
    estimatedDelivery: string;
    actualDelivery?: string;
    serviceType: 'standard' | 'express' | 'overnight' | 'international' | 'freight';
  };
  tracking: {
    events: TrackingEvent[];
    currentLocation?: string;
    estimatedDelivery: string;
    delayReason?: string;
  };
  documents: {
    invoice?: string;
    customsForm?: string;
    packingList?: string;
    certificate?: string;
  };
  costs: {
    shipping: number;
    insurance: number;
    customs: number;
    taxes: number;
    fuel: number;
    handling: number;
    total: number;
    currency: string;
  };
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface TrackingEvent {
  timestamp: string;
  status: string;
  location: string;
  description: string;
  coordinates?: { latitude: number; longitude: number };
}

interface Carrier {
  id: string;
  name: string;
  type: 'express' | 'standard' | 'economy' | 'freight';
  services: string[];
  coverage: string[];
  rating: number;
  reviews: number;
  contactInfo: {
    phone: string;
    email: string;
    website: string;
  };
  pricing: {
    baseRate: number;
    perKg: number;
    perKm: number;
    fuelSurcharge: number;
  };
  features: string[];
  isAvailable: boolean;
}

interface ServiceRequest {
  id: string;
  type: 'shipping' | 'pickup' | 'packaging' | 'insurance' | 'customs' | 'repair' | 'maintenance';
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  description: string;
  customerId: string;
  shipmentId?: string;
  scheduledDate?: string;
  estimatedCost?: number;
  actualCost?: number;
  assignedAgent?: string;
  timeline: ServiceTimeline[];
  attachments: string[];
  createdAt: string;
  updatedAt: string;
}

interface ServiceTimeline {
  timestamp: string;
  action: string;
  description: string;
  performedBy: string;
}

// Mock data
const MOCK_CARRIERS: Carrier[] = [
  {
    id: 'dhl-express',
    name: 'DHL Express',
    type: 'express',
    services: ['International Express', 'Domestic Express', 'Same Day'],
    coverage: ['Worldwide', '220+ countries'],
    rating: 4.5,
    reviews: 15420,
    contactInfo: {
      phone: '+1-800-225-5345',
      email: 'support@dhl.com',
      website: 'https://www.dhl.com'
    },
    pricing: {
      baseRate: 25,
      perKg: 4.5,
      perKm: 0.15,
      fuelSurcharge: 0.12
    },
    features: ['Real-time tracking', 'Insurance options', 'Customs clearance', 'Express delivery'],
    isAvailable: true
  },
  {
    id: 'fedex',
    name: 'FedEx',
    type: 'express',
    services: ['FedEx Express', 'FedEx Ground', 'FedEx Freight'],
    coverage: ['Worldwide', '200+ countries'],
    rating: 4.4,
    reviews: 12890,
    contactInfo: {
      phone: '+1-800-463-3339',
      email: 'support@fedex.com',
      website: 'https://www.fedex.com'
    },
    pricing: {
      baseRate: 22,
      perKg: 4.2,
      perKm: 0.14,
      fuelSurcharge: 0.11
    },
    features: ['Overnight delivery', 'Saturday delivery', 'Hold at location', 'Signature required'],
    isAvailable: true
  },
  {
    id: 'aramex',
    name: 'Aramex',
    type: 'standard',
    services: ['Standard Shipping', 'Express Shipping', 'Freight'],
    coverage: ['Middle East', 'Asia', 'Europe', 'Africa'],
    rating: 4.2,
    reviews: 8765,
    contactInfo: {
      phone: '+966-920000237',
      email: 'info@aramex.com',
      website: 'https://www.aramex.com'
    },
    pricing: {
      baseRate: 18,
      perKg: 3.8,
      perKm: 0.12,
      fuelSurcharge: 0.10
    },
    features: ['Regional expertise', 'Cash on delivery', 'Easy returns', 'Warehouse storage'],
    isAvailable: true
  },
  {
    id: 'sf-express',
    name: 'SF Express',
    type: 'express',
    services: ['Express', 'Economy Express', 'Freight'],
    coverage: ['China', 'Asia Pacific', 'International'],
    rating: 4.6,
    reviews: 18920,
    contactInfo: {
      phone: '+86-400-811-1111',
      email: 'service@sf-express.com',
      website: 'https://www.sf-express.com'
    },
    pricing: {
      baseRate: 20,
      perKg: 3.5,
      perKm: 0.10,
      fuelSurcharge: 0.09
    },
    features: ['China specialist', 'Fast customs clearance', 'Temperature controlled', 'Large cargo'],
    isAvailable: true
  }
];

const MOCK_SHIPMENTS: Shipment[] = [
  {
    id: 'ship-1',
    trackingNumber: 'DHL1234567890',
    orderNumber: 'JEAN-2024-001',
    status: 'in_transit',
    carrier: MOCK_CARRIERS[0],
    origin: {
      address: '123 Manufacturing St, Building A',
      city: 'Shenzhen',
      country: 'China',
      postalCode: '518000'
    },
    destination: {
      address: '456 Business Ave, Suite 100',
      city: 'Riyadh',
      country: 'Saudi Arabia',
      postalCode: '11564'
    },
    recipient: {
      name: 'Ahmed Al Rashid',
      phone: '+966 50 123 4567',
      email: 'ahmed.rashid@example.com'
    },
    package: {
      weight: 2.5,
      dimensions: { length: 30, width: 20, height: 15 },
      description: 'Electronics Package - Wireless Earbuds',
      value: 500,
      currency: 'USD',
      insurance: true
    },
    shipping: {
      method: 'International Express',
      cost: 85,
      estimatedDelivery: '2024-01-25',
      serviceType: 'international'
    },
    tracking: {
      events: [
        {
          timestamp: '2024-01-20T08:00:00Z',
          status: 'picked_up',
          location: 'Shenzhen, China',
          description: 'Package picked up from sender'
        },
        {
          timestamp: '2024-01-20T14:30:00Z',
          status: 'processed',
          location: 'Shenzhen, China',
          description: 'Processed at sort facility'
        },
        {
          timestamp: '2024-01-21T02:15:00Z',
          status: 'in_transit',
          location: 'Hong Kong, Hong Kong',
          description: 'In transit to destination'
        }
      ],
      currentLocation: 'Hong Kong, Hong Kong',
      estimatedDelivery: '2024-01-25'
    },
    documents: {
      invoice: 'INV-2024-001.pdf',
      customsForm: 'CNF-2024-001.pdf',
      packingList: 'PKL-2024-001.pdf'
    },
    costs: {
      shipping: 65,
      insurance: 10,
      customs: 15,
      taxes: 8,
      fuel: 12,
      handling: 5,
      total: 115,
      currency: 'USD'
    },
    notes: 'Fragile electronic items - handle with care',
    createdAt: '2024-01-20T07:30:00Z',
    updatedAt: '2024-01-21T02:15:00Z'
  },
  {
    id: 'ship-2',
    trackingNumber: 'FED9876543210',
    orderNumber: 'JEAN-2024-002',
    status: 'delivered',
    carrier: MOCK_CARRIERS[1],
    origin: {
      address: '789 Factory Road',
      city: 'Guangzhou',
      country: 'China',
      postalCode: '510000'
    },
    destination: {
      address: '321 Shopping Mall',
      city: 'Dubai',
      country: 'UAE',
      postalCode: '00000'
    },
    recipient: {
      name: 'Fatima Salem',
      phone: '+971 55 987 6543',
      email: 'fatima.salem@example.com'
    },
    package: {
      weight: 1.8,
      dimensions: { length: 25, width: 18, height: 10 },
      description: 'Cosmetics Package - Skincare Set',
      value: 150,
      currency: 'USD',
      insurance: false
    },
    shipping: {
      method: 'Standard International',
      cost: 45,
      estimatedDelivery: '2024-01-18',
      actualDelivery: '2024-01-17',
      serviceType: 'standard'
    },
    tracking: {
      events: [
        {
          timestamp: '2024-01-15T09:00:00Z',
          status: 'picked_up',
          location: 'Guangzhou, China',
          description: 'Package picked up from sender'
        },
        {
          timestamp: '2024-01-17T14:20:00Z',
          status: 'delivered',
          location: 'Dubai, UAE',
          description: 'Delivered to recipient'
        }
      ],
      currentLocation: 'Dubai, UAE',
      estimatedDelivery: '2024-01-18'
    },
    documents: {
      invoice: 'INV-2024-002.pdf',
      customsForm: 'CNF-2024-002.pdf'
    },
    costs: {
      shipping: 35,
      insurance: 0,
      customs: 8,
      taxes: 5,
      fuel: 8,
      handling: 3,
      total: 59,
      currency: 'USD'
    },
    createdAt: '2024-01-15T08:15:00Z',
    updatedAt: '2024-01-17T14:20:00Z'
  }
];

const MOCK_SERVICE_REQUESTS: ServiceRequest[] = [
  {
    id: 'req-1',
    type: 'pickup',
    status: 'confirmed',
    priority: 'medium',
    title: 'Package Pickup Request',
    description: 'Schedule pickup for 3 packages from warehouse',
    customerId: 'customer-1',
    scheduledDate: '2024-01-22T10:00:00Z',
    estimatedCost: 25,
    assignedAgent: 'driver-1',
    timeline: [
      {
        timestamp: '2024-01-20T15:30:00Z',
        action: 'created',
        description: 'Request created by customer',
        performedBy: 'Ahmed Al Rashid'
      },
      {
        timestamp: '2024-01-20T16:00:00Z',
        action: 'confirmed',
        description: 'Pickup scheduled for tomorrow 10 AM',
        performedBy: 'System'
      }
    ],
    attachments: [],
    createdAt: '2024-01-20T15:30:00Z',
    updatedAt: '2024-01-20T16:00:00Z'
  }
];

export const ShippingDeliverySystem: React.FC = () => {
  const [shipments, setShipments] = useState<Shipment[]>(MOCK_SHIPMENTS);
  const [carriers, setCarriers] = useState<Carrier[]>(MOCK_CARRIERS);
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>(MOCK_SERVICE_REQUESTS);
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [selectedCarrier, setSelectedCarrier] = useState<Carrier | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [carrierFilter, setCarrierFilter] = useState('');
  const [showShipmentDetails, setShowShipmentDetails] = useState(false);
  const [showCarrierDetails, setShowCarrierDetails] = useState(false);
  const [activeTab, setActiveTab] = useState<'shipments' | 'carriers' | 'services'>('shipments');
  const [isLoading, setIsLoading] = useState(false);

  // Get status color
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'shipped':
      case 'in_transit': return 'bg-blue-100 text-blue-800';
      case 'pending':
      case 'processing': return 'bg-yellow-100 text-yellow-800';
      case 'customs': return 'bg-purple-100 text-purple-800';
      case 'out_for_delivery': return 'bg-indigo-100 text-indigo-800';
      case 'returned': return 'bg-orange-100 text-orange-800';
      case 'lost':
      case 'damaged': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered': return <CheckCircle className="w-4 h-4" />;
      case 'shipped':
      case 'in_transit': return <Truck className="w-4 h-4" />;
      case 'pending':
      case 'processing': return <Clock className="w-4 h-4" />;
      case 'customs': return <Shield className="w-4 h-4" />;
      case 'out_for_delivery': return <Navigation className="w-4 h-4" />;
      case 'returned': return <RefreshCw className="w-4 h-4" />;
      case 'lost':
      case 'damaged': return <XCircle className="w-4 h-4" />;
      default: return <Package className="w-4 h-4" />;
    }
  };

  // Format currency
  const formatCurrency = (amount: number, currency: string = 'USD'): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  // Format weight
  const formatWeight = (weight: number): string => {
    return `${weight} kg`;
  };

  // Track shipment
  const trackShipment = useCallback(async (trackingNumber: string) => {
    setIsLoading(true);
    // Mock tracking update
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsLoading(false);
  }, []);

  // Filter shipments
  const filteredShipments = shipments.filter(shipment => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        shipment.trackingNumber.toLowerCase().includes(query) ||
        shipment.orderNumber.toLowerCase().includes(query) ||
        shipment.recipient.name.toLowerCase().includes(query) ||
        shipment.destination.city.toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }

    if (statusFilter && shipment.status !== statusFilter) return false;
    if (carrierFilter && shipment.carrier.id !== carrierFilter) return false;

    return true;
  });

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <Truck className="w-5 h-5 mr-2 text-blue-500" />
              Shipping & Delivery System
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Comprehensive logistics, tracking, and maintenance services
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
              <Download className="w-4 h-4 inline mr-2" />
              Export
            </button>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <Plus className="w-4 h-4 inline mr-2" />
              New Shipment
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex space-x-8">
          {[
            { id: 'shipments', label: 'Shipments', count: shipments.length },
            { id: 'carriers', label: 'Carriers', count: carriers.length },
            { id: 'services', label: 'Services', count: serviceRequests.length }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
              <span className="ml-2 bg-gray-200 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Shipments Tab */}
      {activeTab === 'shipments' && (
        <div>
          {/* Search and Filters */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search by tracking number, order, recipient..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="in_transit">In Transit</option>
                  <option value="customs">Customs</option>
                  <option value="out_for_delivery">Out for Delivery</option>
                  <option value="delivered">Delivered</option>
                  <option value="returned">Returned</option>
                </select>
                <select
                  value={carrierFilter}
                  onChange={(e) => setCarrierFilter(e.target.value)}
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Carriers</option>
                  {carriers.map(carrier => (
                    <option key={carrier.id} value={carrier.id}>{carrier.name}</option>
                  ))}
                </select>
                <button className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
                  <Filter className="w-4 h-4 inline mr-2" />
                  More Filters
                </button>
              </div>
            </div>
          </div>

          {/* Shipments List */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Shipment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Route
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Carrier
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Delivery
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cost
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredShipments.map(shipment => (
                  <tr key={shipment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">
                          {shipment.trackingNumber}
                        </div>
                        <div className="text-gray-500">{shipment.orderNumber}</div>
                        <div className="text-gray-500">{shipment.recipient.name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div className="flex items-center">
                          <MapPin className="w-3 h-3 mr-1 text-gray-400" />
                          {shipment.origin.city}
                        </div>
                        <div className="text-gray-500">to</div>
                        <div className="flex items-center">
                          <MapPin className="w-3 h-3 mr-1 text-gray-400" />
                          {shipment.destination.city}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
                          <Truck className="w-4 h-4 text-gray-600" />
                        </div>
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">{shipment.carrier.name}</div>
                          <div className="text-gray-500">{shipment.shipping.method}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(shipment.status)}`}>
                        <span className="mr-1">{getStatusIcon(shipment.status)}</span>
                        {shipment.status.replace('_', ' ').charAt(0).toUpperCase() + shipment.status.slice(1).replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>
                        <div>Est: {new Date(shipment.shipping.estimatedDelivery).toLocaleDateString()}</div>
                        {shipment.shipping.actualDelivery && (
                          <div>Actual: {new Date(shipment.shipping.actualDelivery).toLocaleDateString()}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(shipment.costs.total, shipment.costs.currency)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setSelectedShipment(shipment);
                            setShowShipmentDetails(true);
                          }}
                          className="text-blue-600 hover:text-blue-900"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => trackShipment(shipment.trackingNumber)}
                          className="text-green-600 hover:text-green-900"
                          title="Track Shipment"
                        >
                          <Navigation className="w-4 h-4" />
                        </button>
                        <button
                          className="text-gray-600 hover:text-gray-900"
                          title="Edit Shipment"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Carriers Tab */}
      {activeTab === 'carriers' && (
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {carriers.map(carrier => (
              <div key={carrier.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Truck className="w-6 h-6 text-gray-600" />
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    carrier.isAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {carrier.isAvailable ? 'Available' : 'Unavailable'}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{carrier.name}</h3>
                <div className="flex items-center mb-3">
                  <div className="flex items-center mr-4">
                    <Star className="w-4 h-4 text-yellow-500 mr-1" />
                    <span className="text-sm font-medium">{carrier.rating}</span>
                  </div>
                  <span className="text-sm text-gray-500">({carrier.reviews.toLocaleString()} reviews)</span>
                </div>
                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <div>
                    <span className="font-medium">Type:</span> {carrier.type}
                  </div>
                  <div>
                    <span className="font-medium">Coverage:</span> {carrier.coverage.join(', ')}
                  </div>
                  <div>
                    <span className="font-medium">Base Rate:</span> {formatCurrency(carrier.pricing.baseRate)}
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 mb-4">
                  {carrier.features.slice(0, 3).map((feature, index) => (
                    <span key={index} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                      {feature}
                    </span>
                  ))}
                </div>
                <button
                  onClick={() => {
                    setSelectedCarrier(carrier);
                    setShowCarrierDetails(true);
                  }}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  View Details
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Services Tab */}
      {activeTab === 'services' && (
        <div className="p-6">
          <div className="space-y-4">
            {serviceRequests.map(request => (
              <div key={request.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="font-semibold text-gray-900">{request.title}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        request.status === 'completed' ? 'bg-green-100 text-green-800' :
                        request.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                        request.status === 'confirmed' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {request.status.replace('_', ' ')}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        request.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                        request.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                        request.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {request.priority} priority
                      </span>
                    </div>
                    <p className="text-gray-600 mb-3">{request.description}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      {request.scheduledDate && (
                        <div className="flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          {new Date(request.scheduledDate).toLocaleDateString()}
                        </div>
                      )}
                      {request.estimatedCost && (
                        <div className="flex items-center">
                          <DollarSign className="w-3 h-3 mr-1" />
                          {formatCurrency(request.estimatedCost)}
                        </div>
                      )}
                      {request.assignedAgent && (
                        <div className="flex items-center">
                          <User className="w-3 h-3 mr-1" />
                          {request.assignedAgent}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                      <Edit className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Shipment Details Modal */}
      {showShipmentDetails && selectedShipment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">
                  Shipment Details - {selectedShipment.trackingNumber}
                </h3>
                <button
                  onClick={() => setShowShipmentDetails(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Shipment Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Shipment Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Order Number:</span>
                      <span className="font-medium">{selectedShipment.orderNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedShipment.status)}`}>
                        {selectedShipment.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Carrier:</span>
                      <span className="font-medium">{selectedShipment.carrier.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Service:</span>
                      <span className="font-medium">{selectedShipment.shipping.method}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Recipient Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Name:</span>
                      <span className="font-medium">{selectedShipment.recipient.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Phone:</span>
                      <span className="font-medium">{selectedShipment.recipient.phone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Email:</span>
                      <span className="font-medium">{selectedShipment.recipient.email}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Route Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Origin</h4>
                  <div className="space-y-1 text-sm">
                    <p className="font-medium">{selectedShipment.origin.address}</p>
                    <p className="text-gray-600">
                      {selectedShipment.origin.city}, {selectedShipment.origin.country}
                    </p>
                    <p className="text-gray-600">{selectedShipment.origin.postalCode}</p>
                  </div>
                </div>

                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Destination</h4>
                  <div className="space-y-1 text-sm">
                    <p className="font-medium">{selectedShipment.destination.address}</p>
                    <p className="text-gray-600">
                      {selectedShipment.destination.city}, {selectedShipment.destination.country}
                    </p>
                    <p className="text-gray-600">{selectedShipment.destination.postalCode}</p>
                  </div>
                </div>
              </div>

              {/* Package Information */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">Package Information</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <span className="text-sm text-gray-600">Weight</span>
                    <p className="font-semibold">{formatWeight(selectedShipment.package.weight)}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Dimensions</span>
                    <p className="font-semibold">
                      {selectedShipment.package.dimensions.length}×{selectedShipment.package.dimensions.width}×{selectedShipment.package.dimensions.height}cm
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Value</span>
                    <p className="font-semibold">
                      {formatCurrency(selectedShipment.package.value, selectedShipment.package.currency)}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Insurance</span>
                    <p className="font-semibold">
                      {selectedShipment.package.insurance ? 'Yes' : 'No'}
                    </p>
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-sm text-gray-600">Description:</span>
                  <p className="text-sm text-gray-900">{selectedShipment.package.description}</p>
                </div>
              </div>

              {/* Tracking Events */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">Tracking History</h4>
                <div className="space-y-3">
                  {selectedShipment.tracking.events.map((event, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        {getStatusIcon(event.status)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-gray-900">{event.status.replace('_', ' ')}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(event.timestamp).toLocaleDateString()} {new Date(event.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                        <p className="text-sm text-gray-600">{event.description}</p>
                        <p className="text-sm text-gray-500">{event.location}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowShipmentDetails(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  Close
                </button>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  <Download className="w-4 h-4 inline mr-2" />
                  Download Documents
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};