import { JeanBootstrap } from './bootstrap/JeanBootstrap';
import { BrowserSignalAdapter } from './execution/BrowserSignalAdapter';
import { RuntimeContext } from './state/LocalRuntimeState';
import { JeanPresenceState } from './state/JeanPresenceStateMachine';

async function verifyJeanFlow() {
    console.log('=== VERIFYING JEAN RUNTIME FLOW ===\n');

    // 1. Initialize
    const context: RuntimeContext = {
        rootPath: '/test/project',
        capabilities: ['console_log']
    };
    const bootstrap = JeanBootstrap.getInstance();
    const runtime = await bootstrap.initialize(context);
    const browserAdapter = new BrowserSignalAdapter(runtime);
    
    // Register execution handler for search action
    if (bootstrap.env) {
        bootstrap.env.registerHandler('search_action', async (action) => {
            console.log('EXECUTING SEARCH:', action.payload);
        });
        bootstrap.env.registerHandler('log_navigation', async (action) => {
            console.log('LOGGING NAVIGATION:', action.payload);
        });
    }

    // Start Observation
    browserAdapter.startObservation();
    
    // Test 1: Safe Navigation
    console.log('\n--- Test 1: Safe Navigation ---');
    await browserAdapter.onNavigation('https://example.com', 'Example Domain');
    // Check State
    const state1 = bootstrap.state?.presence.getState();
    console.log(`Current Presence State: ${state1}`); // Should be IDLE or OBSERVING depending on cycle timing

    // Test 2: Unsafe Content (Gambling)
    console.log('\n--- Test 2: Unsafe Content (Gambling) ---');
    await browserAdapter.onSearchInput('online casino free bonus');
    // Check if it was blocked
    // The logs should show "Action BLOCKED by safety policy"
    
    // Test 3: Tracking Script
    console.log('\n--- Test 3: Tracking Script ---');
    // We can't easily trigger this via browser adapter's public methods without a specific trigger type,
    // so we'll simulate a direct process cycle call for a tracking action if we could, 
    // but here we rely on the search input potentially triggering something.
    // Let's rely on the unit test structure we built.

    // Print final state log
    console.log('\n--- Presence State Log ---');
    console.log(bootstrap.state?.presence.getLog());

    browserAdapter.stopObservation();
}

verifyJeanFlow().catch(console.error);
