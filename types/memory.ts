export type MemoryCategory =
  | 'hackathon_experience'
  | 'preference'
  | 'weakness'
  | 'skill'
  | 'project_history'
  | 'requirement'
  | 'system_learning';

export interface MemoryItem {
  id: string;
  content: string;
  category: MemoryCategory;
  importance: number; // 1 (low) to 5 (critical)
  source: 'omi_voice' | 'user_input' | 'agent_synthesizer' | 'workflow_result' | 'seed';
  timestamp: string;
  tags: string[];
  userId?: string;
  similarity?: number;
  metadata?: Record<string, any>;
}

export interface MemorySearchParams {
  query: string;
  limit?: number;
  minScore?: number;
  category?: MemoryCategory;
  userId?: string;
}

export interface MemoryStoreResponse {
  success: boolean;
  memoryId: string;
  vectorId?: string | number;
  storedAt: string;
  message?: string;
}

export interface QdrantConnectionStatus {
  connected: boolean;
  provider: 'qdrant_cloud' | 'qdrant_local' | 'local_fallback';
  collectionName: string;
  totalVectors: number;
  latencyMs?: number;
  error?: string;
}
