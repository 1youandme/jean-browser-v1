import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Badge } from '@/components/ui/Badge';
import { Lock, Shield, AlertCircle, CheckCircle } from 'lucide-react';
import { useKernelGovernance } from '@/hooks/useKernelGovernance';
function iconForState(state) {
    switch (state) {
        case 'HALTED': return _jsx(Lock, { className: "w-3 h-3" });
        case 'DENIED': return _jsx(Lock, { className: "w-3 h-3" });
        case 'PAUSED': return _jsx(Shield, { className: "w-3 h-3" });
        case 'REVIEW_PENDING': return _jsx(AlertCircle, { className: "w-3 h-3" });
        case 'APPROVED': return _jsx(CheckCircle, { className: "w-3 h-3" });
        case 'EXECUTING': return _jsx(CheckCircle, { className: "w-3 h-3" });
        case 'COMPLETED': return _jsx(CheckCircle, { className: "w-3 h-3" });
        case 'IDLE': return _jsx(Shield, { className: "w-3 h-3" });
        default: return _jsx(Shield, { className: "w-3 h-3" });
    }
}
function mapGovernanceStateToBadge(state) {
    if (state === 'HALTED')
        return { label: 'Halted', color: 'destructive' };
    if (state === 'DENIED')
        return { label: 'Denied', color: 'destructive' };
    if (state === 'PAUSED')
        return { label: 'Paused', color: 'warning' };
    if (state === 'REVIEW_PENDING')
        return { label: 'Review', color: 'info' };
    if (state === 'APPROVED')
        return { label: 'Approved', color: 'success' };
    if (state === 'EXECUTING')
        return { label: 'Executing', color: 'success' };
    if (state === 'COMPLETED')
        return { label: 'Completed', color: 'success' };
    if (state === 'IDLE')
        return { label: 'Idle', color: 'default' };
    return { label: 'Unknown', color: 'default' };
}
export const PolicyBadge = () => {
    const { state } = useKernelGovernance();
    const badge = mapGovernanceStateToBadge(state);
    return (_jsxs(Badge, { variant: badge.color, className: "flex items-center gap-1 select-none", children: [iconForState(state), badge.label] }));
};
