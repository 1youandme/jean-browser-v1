import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useKernelGovernance } from '../../hooks/useKernelGovernance';
function mapGovernanceStateToBadge(state) {
    if (state === 'HALTED')
        return { label: 'Halted', color: '#ef4444' };
    if (state === 'DENIED')
        return { label: 'Denied', color: '#ef4444' };
    if (state === 'PAUSED')
        return { label: 'Paused', color: '#f59e0b' };
    if (state === 'REVIEW_PENDING')
        return { label: 'Review', color: '#0ea5e9' };
    if (state === 'APPROVED')
        return { label: 'Approved', color: '#22c55e' };
    if (state === 'EXECUTING')
        return { label: 'Executing', color: '#22c55e' };
    if (state === 'COMPLETED')
        return { label: 'Completed', color: '#22c55e' };
    if (state === 'IDLE')
        return { label: 'Idle', color: '#6b7280' };
    return { label: 'Unknown', color: '#6b7280' };
}
function decisionLabel(state) {
    if (state === 'HALTED')
        return 'Halted';
    if (state === 'DENIED')
        return 'Denied';
    if (state === 'APPROVED')
        return 'Approved';
    if (state === 'REVIEW_PENDING')
        return 'Pending Review';
    if (state === 'IDLE')
        return 'Idle';
    return 'N/A';
}
function edgeColor(perms, kind) {
    if (kind === 'approve')
        return perms.canApprove ? '#22c55e' : '#9ca3af';
    if (kind === 'halt')
        return perms.canHalt ? '#ef4444' : '#9ca3af';
    return perms.canPause ? '#f59e0b' : '#9ca3af';
}
export const ExecutionGraphViewer = () => {
    const { state, context, permissions } = useKernelGovernance();
    const theme = mapGovernanceStateToBadge(state);
    const intentX = 60;
    const intentY = 140;
    const govX = 280;
    const govY = 80;
    const decisionX = 520;
    const decisionY = 140;
    const nodeW = 140;
    const nodeH = 48;
    const radius = 8;
    const graphIdLabel = typeof context.graphId === 'string' && context.graphId.length > 0 ? context.graphId : 'no-graph';
    const decisionText = decisionLabel(state);
    return (_jsx("div", { style: { width: '100%', display: 'flex', justifyContent: 'center' }, children: _jsxs("svg", { width: 640, height: 240, viewBox: "0 0 640 240", children: [_jsx("rect", { x: 0, y: 0, width: 640, height: 240, fill: "#0b0f19" }), _jsx("text", { x: 16, y: 24, fill: "#94a3b8", fontSize: 12, fontFamily: "ui-monospace,sfmono-regular,menlo,monaco", children: "Governance ExecutionGraph" }), _jsx("rect", { x: intentX, y: intentY, rx: radius, ry: radius, width: nodeW, height: nodeH, fill: "#1f2937", stroke: "#334155", strokeWidth: 1 }), _jsx("text", { x: intentX + 12, y: intentY + 20, fill: "#e5e7eb", fontSize: 13, fontWeight: 600, fontFamily: "ui-sans-serif", children: "Intent" }), _jsx("text", { x: intentX + 12, y: intentY + 36, fill: "#9ca3af", fontSize: 11, fontFamily: "ui-monospace", children: graphIdLabel }), _jsx("rect", { x: govX, y: govY, rx: radius, ry: radius, width: nodeW, height: nodeH, fill: "#1f2937", stroke: theme.color, strokeWidth: 2 }), _jsx("text", { x: govX + 12, y: govY + 20, fill: "#e5e7eb", fontSize: 13, fontWeight: 600, fontFamily: "ui-sans-serif", children: "Governance" }), _jsx("text", { x: govX + 12, y: govY + 36, fill: theme.color, fontSize: 11, fontFamily: "ui-monospace", children: theme.label }), _jsx("rect", { x: decisionX, y: decisionY, rx: radius, ry: radius, width: nodeW, height: nodeH, fill: "#1f2937", stroke: "#334155", strokeWidth: 1 }), _jsx("text", { x: decisionX + 12, y: decisionY + 20, fill: "#e5e7eb", fontSize: 13, fontWeight: 600, fontFamily: "ui-sans-serif", children: "Decision" }), _jsx("text", { x: decisionX + 12, y: decisionY + 36, fill: "#9ca3af", fontSize: 11, fontFamily: "ui-monospace", children: decisionText }), _jsx("line", { x1: intentX + nodeW, y1: intentY + nodeH / 2, x2: govX, y2: govY + nodeH / 2, stroke: "#475569", strokeWidth: 2 }), _jsx("line", { x1: govX + nodeW, y1: govY + nodeH / 2, x2: decisionX, y2: decisionY + nodeH / 2, stroke: edgeColor(permissions, 'approve'), strokeWidth: 2 }), _jsx("text", { x: govX + nodeW + 8, y: govY + nodeH / 2 - 8, fill: edgeColor(permissions, 'approve'), fontSize: 10, fontFamily: "ui-monospace", children: "approve" }), _jsx("line", { x1: govX + nodeW, y1: govY + nodeH / 2 + 18, x2: decisionX, y2: decisionY + nodeH / 2 + 18, stroke: edgeColor(permissions, 'pause'), strokeWidth: 2, strokeDasharray: "4 4" }), _jsx("text", { x: govX + nodeW + 8, y: govY + nodeH / 2 + 10, fill: edgeColor(permissions, 'pause'), fontSize: 10, fontFamily: "ui-monospace", children: "pause" }), _jsx("line", { x1: govX + nodeW, y1: govY + nodeH / 2 - 18, x2: decisionX, y2: decisionY + nodeH / 2 - 18, stroke: edgeColor(permissions, 'halt'), strokeWidth: 2 }), _jsx("text", { x: govX + nodeW + 8, y: govY + nodeH / 2 - 26, fill: edgeColor(permissions, 'halt'), fontSize: 10, fontFamily: "ui-monospace", children: "halt" })] }) }));
};
export default ExecutionGraphViewer;
