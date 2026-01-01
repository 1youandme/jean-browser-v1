import { 
  TravelItem, 
  TransparentPrice, 
  BookingProposal, 
  BookingPipelineStep,
  PriceComponent
} from './TravelTypes';

/**
 * The Travel Service enforces "Read-Only Default" and "Transparent Pricing".
 * Execution is strictly separated from Searching.
 */
export class TravelService {
  private proposals: Map<string, BookingProposal> = new Map();

  /**
   * READ-ONLY: Search for options.
   * Guaranteed to have NO side effects (no reservations, no "holding" calls).
   */
  async searchFlights(origin: string, dest: string, date: string): Promise<TravelItem[]> {
    // Mock data - in real life, this fetches from providers
    const basePrice = 400;
    const tax = 50;
    const fee = 25;
    
    const flight: TravelItem = {
      id: 'fl-101',
      providerId: 'aa-air',
      name: 'Flight AA101',
      description: 'Direct flight',
      price: this.constructPrice(basePrice, [
        { label: 'Base Fare', amount: basePrice, currency: 'USD', type: 'base_fare', isMandatory: true },
        { label: 'Gov Taxes', amount: tax, currency: 'USD', type: 'tax', isMandatory: true, recipient: 'US Gov' },
        { label: 'Booking Fee', amount: fee, currency: 'USD', type: 'service_fee', isMandatory: true, recipient: 'Platform' }
      ]),
      tags: ['verified_price', 'data_minimized', 'strict_cancellation'],
      availableSeatsOrRooms: 100, // No false scarcity
      sourceDataHash: 'sha256-mock-hash-123'
    };

    return [flight];
  }

  /**
   * GOVERNANCE GATE: Price Audit
   * Ensures the displayed total matches the sum of mandatory components.
   * Prevents "Drip Pricing" (hidden resort fees).
   */
  private auditPrice(price: TransparentPrice): boolean {
    const calculatedTotal = price.breakdown
      .filter(c => c.isMandatory)
      .reduce((sum, c) => sum + c.amount, 0);
    
    // Allow small float variance
    return Math.abs(calculatedTotal - price.total) < 0.01;
  }

  /**
   * PHASE 1: Proposal Creation
   * User selects items. System creates a static proposal.
   * Still Read-Only.
   */
  createProposal(items: TravelItem[]): BookingProposal {
    // 1. Audit prices
    for (const item of items) {
      if (!this.auditPrice(item.price)) {
        throw new Error(`Governance Alert: Item ${item.name} has misleading pricing. Total does not match mandatory components.`);
      }
    }

    // 2. Aggregate Totals
    const grandTotal = items.reduce((sum, item) => sum + item.price.total, 0);
    
    const proposal: BookingProposal = {
      id: `prop-${Date.now()}`,
      items,
      totalPrice: {
        total: grandTotal,
        currency: items[0].price.currency,
        breakdown: items.flatMap(i => i.price.breakdown), // Flatten all components
        isLocked: true
      },
      status: 'draft',
      passengerDataHash: '' // Empty until PII phase
    };

    this.proposals.set(proposal.id, proposal);
    return proposal;
  }

  /**
   * PHASE 2: Execution Binding
   * To proceed, the user must provide an "Execution Pipeline".
   * This is where "Dark Patterns" are impossible because the user controls the pipeline.
   */
  async bindPipelineToProposal(proposalId: string, pipelineId: string, passengerHash: string): Promise<BookingPipelineStep[]> {
    const proposal = this.proposals.get(proposalId);
    if (!proposal) throw new Error('Proposal not found');

    if (proposal.status !== 'draft') throw new Error('Proposal already processed');

    proposal.passengerDataHash = passengerHash;
    proposal.status = 'pipeline_ready';

    // Generate the required steps for the User's Pipeline to execute
    // The Service dictates "What" needs to happen, the Pipeline dictates "How"
    return [
      { stepId: 'step-1', action: 'verify_identity', status: 'pending' },
      { stepId: 'step-2', action: 'payment_hold', status: 'pending' }, // Auth first
      { stepId: 'step-3', action: 'provider_confirm', status: 'pending' }, // Book
      { stepId: 'step-4', action: 'payment_capture', status: 'pending' } // Charge
    ];
  }

  private constructPrice(base: number, components: PriceComponent[]): TransparentPrice {
    const total = components.reduce((sum, c) => sum + c.amount, 0);
    return {
      total,
      currency: components[0].currency,
      breakdown: components,
      isLocked: true
    };
  }
}
