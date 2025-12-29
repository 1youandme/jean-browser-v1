export enum ActionType {
  speak = 'speak',
  listen = 'listen',
  animate = 'animate',
  wait = 'wait',
  ignore = 'ignore'
}

export type EligibilityDecision = 'allowed' | 'denied';

export type PresenceState = 'idle' | 'observing' | 'responding';

