import { JeanRuntimeBoundary, TriggerData } from '../core/JeanRuntimeBoundary';

/**
 * BrowserSignalAdapter
 * 
 * Captures browser events and normalizes them into TriggerData for the Jean Runtime.
 * Sole responsibility:
 * - Capture: search input, navigation intent, page load/URL change, basic canvas selection
 * - Normalize: Convert to TriggerData
 * - Forward: To JeanRuntimeBoundary.processCycle(trigger)
 */
export class BrowserSignalAdapter {
    private runtime: JeanRuntimeBoundary;
    private isObserving: boolean = false;

    constructor(runtime: JeanRuntimeBoundary) {
        this.runtime = runtime;
    }

    /**
     * Starts observing browser signals.
     * In a real extension, this would attach event listeners to the window/document.
     * Here we expose methods to be called by the shell or mock events.
     */
    public startObservation(): void {
        this.isObserving = true;
        this.attachMockListeners();
        console.log('[Browser Signal Adapter] Observation started.');
    }

    public stopObservation(): void {
        this.isObserving = false;
        this.detachMockListeners();
        console.log('[Browser Signal Adapter] Observation stopped.');
    }

    /**
     * Called when a navigation event occurs (e.g. URL change).
     */
    public async onNavigation(url: string, title: string): Promise<void> {
        if (!this.isObserving) return;

        const trigger: TriggerData = {
            source: 'browser',
            type: 'navigation_intent',
            payload: { url, title },
            timestamp: Date.now()
        };

        await this.runtime.processCycle(trigger);
    }

    /**
     * Called when the user types in a search box.
     */
    public async onSearchInput(query: string): Promise<void> {
        if (!this.isObserving) return;

        const trigger: TriggerData = {
            source: 'browser',
            type: 'search_input',
            payload: { query },
            timestamp: Date.now()
        };

        await this.runtime.processCycle(trigger);
    }

    /**
     * Called when text or element is selected on the page.
     */
    public async onSelection(selectionText: string, context: any): Promise<void> {
        if (!this.isObserving) return;

        const trigger: TriggerData = {
            source: 'browser',
            type: 'canvas_selection',
            payload: { text: selectionText, context },
            timestamp: Date.now()
        };

        await this.runtime.processCycle(trigger);
    }

    // Mock Listeners for demonstration/simulation
    private attachMockListeners() {
        if (typeof window !== 'undefined') {
            window.addEventListener('jean-mock-navigation', this.handleMockNavigation as EventListener);
        }
    }

    private detachMockListeners() {
        if (typeof window !== 'undefined') {
            window.removeEventListener('jean-mock-navigation', this.handleMockNavigation as EventListener);
        }
    }

    private handleMockNavigation = (event: CustomEvent) => {
        this.onNavigation(event.detail.url, event.detail.title);
    }
}
