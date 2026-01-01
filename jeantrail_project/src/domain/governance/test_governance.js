import { GovernanceEngine } from './GovernanceEngine.js';
async function testGovernance() {
    console.log('--- Governance Engine Test ---\n');
    // 1. Setup (Admin Role)
    const adminEngine = new GovernanceEngine('ADMIN');
    adminEngine.on('state_changed', (state, payload) => {
        console.log(`[STATE] -> ${state}`, payload ? JSON.stringify(payload) : '');
    });
    console.log('Initial State:', adminEngine.getState());
    // 2. Request Review
    console.log('\n[Action] Requesting Review...');
    const request = {
        id: 'req_1',
        type: 'EXECUTION_START',
        description: 'Run Cinematic Pipeline',
        metadata: {},
        timestamp: Date.now()
    };
    adminEngine.requestReview('graph_1', request);
    // 3. Approve
    console.log('\n[Action] Approving...');
    adminEngine.approve('admin_user', 'Looks good');
    // 4. Start Execution
    console.log('\n[Action] Starting Execution...');
    adminEngine.startExecution('admin_user');
    // 5. Pause
    console.log('\n[Action] Pausing...');
    adminEngine.pause('admin_user');
    // 6. Resume
    console.log('\n[Action] Resuming...');
    adminEngine.resume('admin_user');
    // 7. Kill Switch
    console.log('\n[Action] KILL SWITCH...');
    adminEngine.halt('admin_user', 'Safety Violation Detected');
    // --- Permission Test (Viewer) ---
    console.log('\n--- Permission Test (Viewer) ---');
    const viewerEngine = new GovernanceEngine('VIEWER');
    try {
        console.log('Viewer attempting to HALT...');
        viewerEngine.halt('viewer_user', 'Malicious Act');
    }
    catch (e) {
        console.log('Success: Viewer blocked:', e.message);
    }
}
testGovernance();
