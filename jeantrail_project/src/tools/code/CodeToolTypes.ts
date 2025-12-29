export type CodeTaskKind = 'app' | 'site' | 'game';
export interface CodeTask {
  kind: CodeTaskKind;
  name: string;
  spec?: string;
}
export type CodeResultStatus = 'symbolic' | 'unsupported';
export interface CodeResult {
  status: CodeResultStatus;
  placeholder?: string;
  reason?: string;
}

