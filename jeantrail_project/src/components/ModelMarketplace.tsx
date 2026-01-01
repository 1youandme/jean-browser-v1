import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { modelMarketplaceService } from '../services/modelMarketplace';
import type { MarketplaceModelItem, Pipeline } from '../types';
import { Shield, Plug, Plus, X, CheckCircle } from 'lucide-react';

interface Props {
  ownerUserId: string;
}

export default function ModelMarketplace({ ownerUserId }: Props) {
  const [items, setItems] = useState<MarketplaceModelItem[]>([]);
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [search, setSearch] = useState('');
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
  const [newPipelineName, setNewPipelineName] = useState('');
  const [newPipelineDescription, setNewPipelineDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const filtered = useMemo(() => {
    if (!search) return items;
    const q = search.toLowerCase();
    return items.filter(
      (i) =>
        i.displayName.toLowerCase().includes(q) ||
        i.modelType.toLowerCase().includes(q) ||
        i.backendType.toLowerCase().includes(q)
    );
  }, [items, search]);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    const models = await modelMarketplaceService.listModels(ownerUserId);
    const pls = modelMarketplaceService.getPipelines(ownerUserId);
    setItems(models);
    setPipelines(pls);
    setIsLoading(false);
  }, [ownerUserId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createPipeline = useCallback(() => {
    if (!newPipelineName.trim()) return;
    const p = modelMarketplaceService.createPipeline(ownerUserId, newPipelineName.trim(), newPipelineDescription.trim());
    setNewPipelineName('');
    setNewPipelineDescription('');
    setPipelines((prev) => [p, ...prev]);
  }, [ownerUserId, newPipelineName, newPipelineDescription]);

  const bindPipeline = useCallback(
    (modelId: string, pipelineId: string) => {
      modelMarketplaceService.bindModelToPipeline(ownerUserId, modelId, pipelineId);
      refresh();
    },
    [ownerUserId, refresh]
  );

  const setEnabled = useCallback(
    (modelId: string, enabled: boolean) => {
      try {
        modelMarketplaceService.setEnabled(ownerUserId, modelId, enabled);
        refresh();
      } catch (e) {
        console.error(e);
      }
    },
    [ownerUserId, refresh]
  );

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Model Marketplace</h3>
            <span className="px-2 py-1 text-xs font-medium text-blue-600 bg-blue-100 rounded-full">{items.length}</span>
          </div>
          <div className="flex items-center space-x-2">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search models..."
              className="px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
        <div className="md:col-span-2">
          {isLoading ? (
            <div className="flex justify-center p-8">Loading...</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filtered.map((m) => (
                <div key={m.modelId} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-medium text-gray-900">{m.displayName}</div>
                      <div className="text-xs text-gray-600">{m.modelType.toUpperCase()} • {m.backendType.toUpperCase()}</div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs rounded ${m.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                        {m.enabled ? 'Enabled' : 'Disabled'}
                      </span>
                      <button
                        onClick={() => setSelectedModelId(m.modelId)}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                        title="Configure pipeline"
                      >
                        <Plug className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center space-x-2">
                    <button
                      onClick={() => setEnabled(m.modelId, true)}
                      className="px-2 py-1 text-xs rounded bg-green-100 text-green-700 disabled:opacity-50"
                      disabled={!m.pipelineId}
                    >
                      Enable
                    </button>
                    <button
                      onClick={() => setEnabled(m.modelId, false)}
                      className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-700"
                    >
                      Disable
                    </button>
                    {m.pipelineId ? (
                      <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700">Pipeline linked</span>
                    ) : (
                      <span className="text-xs px-2 py-1 rounded bg-yellow-100 text-yellow-700">Pipeline required</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="font-medium text-gray-900">Pipelines</div>
            <Plus className="w-4 h-4 text-gray-600" />
          </div>
          <div className="space-y-2">
            {pipelines.length === 0 ? (
              <div className="text-sm text-gray-600">No pipelines</div>
            ) : (
              pipelines.map((p) => (
                <div key={p.id} className="flex items-center justify-between bg-gray-50 rounded p-2">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{p.name}</div>
                    <div className="text-xs text-gray-600">{new Date(p.updatedAt).toLocaleString()}</div>
                  </div>
                  {selectedModelId && (
                    <button
                      onClick={() => bindPipeline(selectedModelId, p.id)}
                      className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-700"
                    >
                      Link
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
          <div className="mt-3">
            <div className="text-sm font-medium text-gray-900 mb-2">Create Pipeline</div>
            <input
              value={newPipelineName}
              onChange={(e) => setNewPipelineName(e.target.value)}
              placeholder="Name"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2"
            />
            <input
              value={newPipelineDescription}
              onChange={(e) => setNewPipelineDescription(e.target.value)}
              placeholder="Description"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2"
            />
            <button onClick={createPipeline} className="px-3 py-2 rounded bg-blue-600 text-white w-full">Create</button>
          </div>

          <div className="mt-4">
            {selectedModelId && (
              <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded p-2">
                <div className="text-xs text-blue-800">Select a pipeline to link</div>
                <button onClick={() => setSelectedModelId(null)} className="p-1 text-blue-700 hover:bg-blue-100 rounded">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
          <div className="mt-3 text-xs text-gray-600 flex items-center space-x-1">
            <CheckCircle className="w-3 h-3 text-green-600" />
            <span>Models are disabled by default. Enable only with user-owned pipelines.</span>
          </div>
        </div>
      </div>
    </div>
  );
}

