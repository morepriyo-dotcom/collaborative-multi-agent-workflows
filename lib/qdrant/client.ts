import { QdrantClient } from '@qdrant/js-client-rest';

let qdrantClientInstance: QdrantClient | null = null;

export function getQdrantClient(): QdrantClient | null {
  const url = process.env.QDRANT_URL;
  const apiKey = process.env.QDRANT_API_KEY;

  if (!url) {
    return null;
  }

  if (!qdrantClientInstance) {
    try {
      qdrantClientInstance = new QdrantClient({
        url,
        apiKey: apiKey || undefined,
        checkCompatibility: false,
      });
    } catch (err) {
      console.error('Failed to initialize QdrantClient:', err);
      return null;
    }
  }

  return qdrantClientInstance;
}

export async function checkQdrantHealth(): Promise<{
  connected: boolean;
  provider: 'qdrant_cloud' | 'qdrant_local' | 'local_fallback';
  collectionName: string;
  totalVectors: number;
  latencyMs?: number;
  error?: string;
}> {
  const collectionName = process.env.QDRANT_COLLECTION_NAME || 'flowmesh_memories';
  const client = getQdrantClient();

  if (!client) {
    const { getStoredMemoryCount } = await import('./vectorStore');
    const localCount = await getStoredMemoryCount().catch(() => 0);
    return {
      connected: false,
      provider: 'local_fallback',
      collectionName,
      totalVectors: localCount,
      error: 'QDRANT_URL not configured in environment',
    };
  }

  const start = Date.now();
  try {
    const collections = await client.getCollections();
    const latencyMs = Date.now() - start;
    const exists = collections.collections?.some((c) => c.name === collectionName);

    let count = 0;
    if (exists) {
      const info = await client.getCollection(collectionName);
      count = info.points_count || 0;
    }

    const isCloud = (process.env.QDRANT_URL || '').includes('cloud.qdrant.io');

    return {
      connected: true,
      provider: isCloud ? 'qdrant_cloud' : 'qdrant_local',
      collectionName,
      totalVectors: count,
      latencyMs,
    };
  } catch (err: any) {
    const { getStoredMemoryCount } = await import('./vectorStore');
    const localCount = await getStoredMemoryCount().catch(() => 0);
    return {
      connected: false,
      provider: 'local_fallback',
      collectionName,
      totalVectors: localCount,
      error: err?.message || 'Failed to ping Qdrant endpoint',
    };
  }
}
