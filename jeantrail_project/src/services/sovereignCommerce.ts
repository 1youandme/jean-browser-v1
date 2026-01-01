import { 
  SovereignSupplier, 
  SovereignProduct, 
  SovereignOrder, 
  GovernanceTag, 
  SupplierStatus 
} from '../types';

/**
 * Sovereign Commerce System
 * 
 * Architecture:
 * - UI-Only: Browsing, Searching, Supplier Profiles. Safe, no side effects.
 * - Execution-Eligible: Ordering, Payment, Fulfillment. Requires user-owned pipeline.
 */

export class SovereignCommerceService {
  private suppliers: Map<string, SovereignSupplier> = new Map();
  private products: Map<string, SovereignProduct> = new Map();
  private orders: Map<string, SovereignOrder> = new Map();

  // --- Supplier Lifecycle ---

  async registerSupplier(userId: string, name: string, location: string, proofs: string[]): Promise<SovereignSupplier> {
    const supplier: SovereignSupplier = {
      id: `sup-${Date.now()}`,
      name,
      ownerDid: userId,
      status: 'pending_verification', // Manual onboarding only
      verificationProofs: proofs,
      location,
      rating: 0,
      joinedAt: new Date().toISOString()
    };
    this.suppliers.set(supplier.id, supplier);
    return supplier;
  }

  async verifySupplier(adminUserId: string, supplierId: string, approved: boolean): Promise<SovereignSupplier> {
    // In a real system, verify adminUserId privileges here
    const supplier = this.suppliers.get(supplierId);
    if (!supplier) throw new Error('Supplier not found');

    supplier.status = approved ? 'verified' : 'rejected';
    this.suppliers.set(supplier.id, supplier);
    return supplier;
  }

  // --- Product Management with Governance Gates ---

  async listProduct(supplierId: string, data: Omit<SovereignProduct, 'id' | 'supplierId' | 'createdAt' | 'updatedAt'>): Promise<SovereignProduct> {
    const supplier = this.suppliers.get(supplierId);
    if (!supplier) throw new Error('Supplier not found');
    
    // Gate 1: Supplier Verification
    if (supplier.status !== 'verified') {
      throw new Error('Governance Gate Failed: Supplier must be verified to list products.');
    }

    // Gate 2: Governance Tag Compliance
    if (data.governanceTags.includes('sensitive') && !data.governanceTags.includes('review_only')) {
        // Example policy: Sensitive items must be review-only initially
        data.governanceTags.push('review_only');
    }

    const product: SovereignProduct = {
      id: `prod-${Date.now()}`,
      supplierId,
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.products.set(product.id, product);
    return product;
  }

  // --- Execution & Ordering ---

  async createOrder(buyerUserId: string, items: { productId: string; quantity: number }[], buyerPipelineId?: string): Promise<SovereignOrder> {
    let totalAmount = 0;
    const orderItems = [];
    const governanceLog = [];

    for (const item of items) {
      const product = this.products.get(item.productId);
      if (!product) throw new Error(`Product ${item.productId} not found`);

      // Gate 3: Pipeline Requirement
      if (product.fulfillmentType === 'digital_pipeline' && !buyerPipelineId) {
        throw new Error(`Governance Gate Failed: Product ${product.name} requires an execution pipeline.`);
      }

      // Gate 4: Stock & Availability (Standard check)
      if (!product.inStock) {
        throw new Error(`Product ${product.name} is out of stock`);
      }

      orderItems.push({
        productId: product.id,
        quantity: item.quantity,
        priceAtTime: product.price
      });
      totalAmount += product.price * item.quantity;
      
      governanceLog.push({
        check: `Product ${product.id} availability and pipeline check`,
        passed: true,
        timestamp: new Date().toISOString()
      });
    }

    const order: SovereignOrder = {
      id: `ord-${Date.now()}`,
      buyerUserId,
      supplierId: orderItems[0] ? this.products.get(orderItems[0].productId)!.supplierId : 'mixed', // Simplified
      items: orderItems,
      totalAmount,
      currency: 'USD', // Default for now
      status: 'awaiting_payment', // No automatic fulfillment
      buyerPipelineId,
      governanceAuditLog: governanceLog,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.orders.set(order.id, order);
    return order;
  }

  // --- UI Data Access (Read-Only) ---

  async getProduct(productId: string): Promise<SovereignProduct | undefined> {
    return this.products.get(productId);
  }

  async searchProducts(query: string, governanceFilter?: GovernanceTag[]): Promise<SovereignProduct[]> {
    return Array.from(this.products.values()).filter(p => {
      const matchesQuery = p.name.toLowerCase().includes(query.toLowerCase());
      const matchesGovernance = governanceFilter 
        ? governanceFilter.every(tag => p.governanceTags.includes(tag))
        : true;
      return matchesQuery && matchesGovernance;
    });
  }
}
