import { useState, useEffect, useCallback } from 'react';
import { GovernanceEngine } from '../domain/governance/GovernanceEngine.js';
// Singleton instance to persist state across component re-renders
// In a full app, this would be provided via React Context
const engine = new GovernanceEngine('ADMIN');
export function useKernelGovernance() {
    const [state, setState] = useState(engine.getState());
    const [permissions, setPermissions] = useState(engine.getPermissions());
    const [context, setContext] = useState(engine.getContext());
    useEffect(() => {
        const handleStateChange = (newState) => {
            setState(newState);
            setContext(engine.getContext());
        };
        engine.on('state_changed', handleStateChange);
        return () => {
            engine.off('state_changed', handleStateChange);
        };
    }, []);
    // --- Actions ---
    const requestReview = useCallback((graphId, request) => {
        try {
            engine.requestReview(graphId, request);
        }
        catch (e) {
            console.error(e);
        }
    }, []);
    const approveExecution = useCallback((notes = '') => {
        try {
            engine.approve('USER_ACTION', notes);
        }
        catch (e) {
            console.error(e);
        }
    }, []);
    const denyExecution = useCallback((reason) => {
        try {
            engine.deny('USER_ACTION', reason);
        }
        catch (e) {
            console.error(e);
        }
    }, []);
    const startExecution = useCallback(() => {
        try {
            engine.startExecution('USER_ACTION');
        }
        catch (e) {
            console.error(e);
        }
    }, []);
    const pauseExecution = useCallback(() => {
        try {
            engine.pause('USER_ACTION');
        }
        catch (e) {
            console.error(e);
        }
    }, []);
    const resumeExecution = useCallback(() => {
        try {
            engine.resume('USER_ACTION');
        }
        catch (e) {
            console.error(e);
        }
    }, []);
    const killSwitch = useCallback((reason = 'EMERGENCY STOP') => {
        try {
            engine.halt('USER_ACTION', reason);
        }
        catch (e) {
            console.error(e);
        }
    }, []);
    return {
        state,
        permissions,
        context,
        actions: {
            requestReview,
            approveExecution,
            denyExecution,
            startExecution,
            pauseExecution,
            resumeExecution,
            killSwitch
        }
    };
}
