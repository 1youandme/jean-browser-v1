import { ContextDescriptor, ExecutionContextId } from './ExecutionContextTypes';

const WEB_CAPABILITIES = ['symbolic_ui', 'route_only', 'audit_log'];
const WEB_RESTRICTIONS = ['no_network', 'no_device', 'no_shared_state', 'no_cross_context_memory'];
const WEB_AUDIT = ['user_consent_required', 'explicit_switch', 'symbolic_logging'];

const PROXY_CAPABILITIES = ['symbolic_proxy', 'route_only', 'audit_log'];
const PROXY_RESTRICTIONS = ['no_network', 'no_device', 'no_shared_state', 'no_cross_context_memory'];
const PROXY_AUDIT = ['user_consent_required', 'explicit_switch', 'symbolic_logging'];

const LOCAL_CAPABILITIES = ['symbolic_local', 'route_only', 'audit_log'];
const LOCAL_RESTRICTIONS = ['no_network', 'no_device', 'no_shared_state', 'no_cross_context_memory'];
const LOCAL_AUDIT = ['user_consent_required', 'explicit_switch', 'symbolic_logging'];

const EMULATOR_CAPABILITIES = ['symbolic_emulator', 'route_only', 'audit_log'];
const EMULATOR_RESTRICTIONS = ['no_network', 'no_device', 'no_shared_state', 'no_cross_context_memory'];
const EMULATOR_AUDIT = ['user_consent_required', 'explicit_switch', 'symbolic_logging'];

export function getContextDescriptor(id: ExecutionContextId): ContextDescriptor {
  if (id === 'web') {
    return {
      id,
      capabilities: [...WEB_CAPABILITIES],
      restrictions: [...WEB_RESTRICTIONS],
      auditBoundaries: [...WEB_AUDIT]
    };
  }
  if (id === 'proxy') {
    return {
      id,
      capabilities: [...PROXY_CAPABILITIES],
      restrictions: [...PROXY_RESTRICTIONS],
      auditBoundaries: [...PROXY_AUDIT]
    };
  }
  if (id === 'local') {
    return {
      id,
      capabilities: [...LOCAL_CAPABILITIES],
      restrictions: [...LOCAL_RESTRICTIONS],
      auditBoundaries: [...LOCAL_AUDIT]
    };
  }
  return {
    id: 'emulator',
    capabilities: [...EMULATOR_CAPABILITIES],
    restrictions: [...EMULATOR_RESTRICTIONS],
    auditBoundaries: [...EMULATOR_AUDIT]
  };
}

export function listContexts(): ContextDescriptor[] {
  return [
    getContextDescriptor('web'),
    getContextDescriptor('proxy'),
    getContextDescriptor('local'),
    getContextDescriptor('emulator')
  ];
}
