import { AgentManifest } from './AgentDefinition';

/**
 * AgentRegistry
 * 
 * A static registry for Agent Definitions.
 * NO runtime wiring or execution logic here.
 * Stores metadata only.
 */

class AgentRegistryImpl {
  private agents: Map<string, AgentManifest> = new Map();

  public register(manifest: AgentManifest): void {
    if (this.agents.has(manifest.id)) {
      console.warn(`Overwriting existing agent definition for ${manifest.id}`);
    }
    this.agents.set(manifest.id, manifest);
  }

  public get(id: string): AgentManifest | undefined {
    return this.agents.get(id);
  }

  public getAll(): AgentManifest[] {
    return Array.from(this.agents.values());
  }

  public findByIntent(intentType: string): AgentManifest[] {
    return this.getAll().filter(agent => agent.intentTypes.includes(intentType));
  }

  public clear(): void {
    this.agents.clear();
  }
}

export const AgentRegistry = new AgentRegistryImpl();
