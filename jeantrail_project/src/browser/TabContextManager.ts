import { JeanKernel } from '../kernel/JeanKernel';
import { OSSession } from '../kernel/KernelState';

/**
 * TabContextManager
 * 
 * Manages the "Tab-Aware Presence" and isolation.
 * - Each tab is a sovereign territory with its own OSSession.
 * - Enforces strict isolation by default.
 * - Manages cross-tab leakage consent.
 */

export interface TabContext {
  tabId: string;
  sessionId: string; // Maps to a JeanKernel OSSession
  url: string;
  title: string;
  isolationLevel: 'strict' | 'permeable';
  intentSummary?: string; // Symbolic summary of what the user is doing in this tab
  activeExtensions: Set<string>;
  allowedLeakageTargets: Set<string>; // Tab IDs this tab is allowed to share data with
}

export class TabContextManager {
  private kernel: JeanKernel;
  private tabs: Map<string, TabContext>;

  constructor(kernel: JeanKernel) {
    this.kernel = kernel;
    this.tabs = new Map();
  }

  /**
   * Registers a new tab and creates a sovereign session for it.
   */
  public async registerTab(tabId: string, url: string, title: string): Promise<TabContext> {
    // Create a new session in the kernel for this tab
    // We default to 'strict' isolation as per Phase 26 rules.
    const sessionId = this.kernel.createSession(`user_tab_${tabId}`, 'strict');

    const context: TabContext = {
      tabId,
      sessionId,
      url,
      title,
      isolationLevel: 'strict',
      activeExtensions: new Set(),
      allowedLeakageTargets: new Set()
    };

    this.tabs.set(tabId, context);
    return context;
  }

  /**
   * Updates the tab's state (URL, title) and refreshes intent if needed.
   */
  public updateTab(tabId: string, updates: Partial<Pick<TabContext, 'url' | 'title' | 'intentSummary'>>): void {
    const context = this.tabs.get(tabId);
    if (!context) return;

    if (updates.url) context.url = updates.url;
    if (updates.title) context.title = updates.title;
    if (updates.intentSummary) context.intentSummary = updates.intentSummary;
  }

  /**
   * Closes a tab and destroys its session/memory.
   */
  public closeTab(tabId: string): void {
    const context = this.tabs.get(tabId);
    if (context) {
      this.kernel.endSession(context.sessionId);
      this.tabs.delete(tabId);
    }
  }

  /**
   * Explicitly allows data to flow from one tab to another.
   * Requires user consent (assumed to be obtained by caller).
   */
  public allowCrossTabLeakage(sourceTabId: string, targetTabId: string): void {
    const source = this.tabs.get(sourceTabId);
    if (!source) throw new Error(`Source tab ${sourceTabId} not found`);
    
    // Validate target exists
    if (!this.tabs.has(targetTabId)) throw new Error(`Target tab ${targetTabId} not found`);

    source.allowedLeakageTargets.add(targetTabId);
    // Note: We might want to relax the kernel session isolation level here if needed,
    // or handle the data transfer explicitly through a bridge.
  }

  /**
   * Checks if data can flow from source to target.
   */
  public canLeak(sourceTabId: string, targetTabId: string): boolean {
    const source = this.tabs.get(sourceTabId);
    if (!source) return false;
    return source.allowedLeakageTargets.has(targetTabId);
  }

  public getContext(tabId: string): TabContext | undefined {
    return this.tabs.get(tabId);
  }
}
