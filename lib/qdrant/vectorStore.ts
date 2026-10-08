import { getQdrantClient } from './client';
import { getEmbedding, cosineSimilarity } from './embeddings';
import { MemoryItem, MemoryCategory } from '@/types/memory';
import fs from 'fs';
import path from 'path';

const COLLECTION_NAME = process.env.QDRANT_COLLECTION_NAME || 'flowmesh_memories';
const LOCAL_STORE_PATH = path.join(process.cwd(), '.data', 'memories.json');

// In-memory fallback / local vector pool cache
interface StoredMemoryRecord {
  item: MemoryItem;
  vector: number[];
}

let localStoreCache: StoredMemoryRecord[] | null = null;

function ensureDataDirectory() {
  const dir = path.join(process.cwd(), '.data');
  if (!fs.existsSync(dir)) {
    try {
      fs.mkdirSync(dir, { recursive: true });
    } catch {
      // ignore
    }
  }
}

function loadLocalStore(): StoredMemoryRecord[] {
  if (localStoreCache) return localStoreCache;

  ensureDataDirectory();
  if (fs.existsSync(LOCAL_STORE_PATH)) {
    try {
      const data = fs.readFileSync(LOCAL_STORE_PATH, 'utf-8');
      localStoreCache = JSON.parse(data);
      return localStoreCache || [];
    } catch (err) {
      console.warn('Error reading local memory cache:', err);
    }
  }

  localStoreCache = [];
  return localStoreCache;
}

function saveLocalStore(records: StoredMemoryRecord[]) {
  localStoreCache = records;
  ensureDataDirectory();
  try {
    fs.writeFileSync(LOCAL_STORE_PATH, JSON.stringify(records, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Error writing local memory cache:', err);
  }
}

/**
 * Initialize Qdrant collection if not exists
 */
export async function initVectorStore(): Promise<boolean> {
  const client = getQdrantClient();
  if (!client) {
    // Initialize local seed
    await seedInitialMemoriesIfEmpty();
    return false;
  }

  try {
    const collections = await client.getCollections();
    const exists = collections.collections?.some((c) => c.name === COLLECTION_NAME);

    if (!exists) {
      await client.createCollection(COLLECTION_NAME, {
        vectors: {
          size: 768,
          distance: 'Cosine',
        },
      });
      console.log(`[Qdrant] Created collection '${COLLECTION_NAME}' (768 dim, Cosine)`);
    }

    await seedInitialMemoriesIfEmpty();
    return true;
  } catch (err) {
    console.warn('[Qdrant] Could not initialize remote collection, falling back to local vector store:', err);
    await seedInitialMemoriesIfEmpty();
    return false;
  }
}

/**
 * Search memories via vector similarity (Qdrant Cloud/Local or Local Semantic Projection)
 */
export async function searchMemories(
  query: string,
  limit = 5,
  category?: MemoryCategory
): Promise<MemoryItem[]> {
  const queryVector = await getEmbedding(query);
  const client = getQdrantClient();

  if (client) {
    try {
      const filter = category
        ? {
            must: [
              {
                key: 'category',
                match: { value: category },
              },
            ],
          }
        : undefined;

      const queryResponse = await client.query(COLLECTION_NAME, {
        query: queryVector,
        limit,
        with_payload: true,
        filter: filter as any,
      });

      const points = queryResponse?.points || [];
      if (points.length > 0) {
        return points.map((pt: any) => {
          const payload = (pt.payload || {}) as Record<string, any>;
          return {
            id: String(pt.id),
            content: payload.content || '',
            category: payload.category || 'system_learning',
            importance: payload.importance || 3,
            source: payload.source || 'agent_synthesizer',
            timestamp: payload.timestamp || new Date().toISOString(),
            tags: payload.tags || [],
            similarity: Number((pt.score ?? 0.85).toFixed(4)),
            metadata: payload.metadata,
          };
        });
      }
    } catch (err) {
      console.warn('[Qdrant] Search failed, falling back to local vector engine:', err);
    }
  }

  // Local vector search fallback
  const records = loadLocalStore();
  if (records.length === 0) {
    await seedInitialMemoriesIfEmpty();
  }

  const activeRecords = loadLocalStore();
  const scored = activeRecords
    .filter((r) => (!category ? true : r.item.category === category))
    .map((r) => ({
      item: {
        ...r.item,
        similarity: Number(cosineSimilarity(queryVector, r.vector).toFixed(4)),
      },
      score: cosineSimilarity(queryVector, r.vector),
    }));

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((s) => s.item);
}

/**
 * Store a new memory item into Qdrant & local store
 */
export async function storeMemory(item: Omit<MemoryItem, 'id' | 'timestamp'> & { id?: string; timestamp?: string }): Promise<MemoryItem> {
  const id = item.id || `mem_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const timestamp = item.timestamp || new Date().toISOString();
  const memoryItem: MemoryItem = {
    ...item,
    id,
    timestamp,
  };

  const vector = await getEmbedding(memoryItem.content);
  const client = getQdrantClient();

  let storedInQdrant = false;
  if (client) {
    try {
      // Qdrant point id can be UUID or unsigned int
      const pointId = Math.floor(Math.random() * 1000000000) + 1;
      await client.upsert(COLLECTION_NAME, {
        points: [
          {
            id: pointId,
            vector,
            payload: {
              memory_id: memoryItem.id,
              content: memoryItem.content,
              category: memoryItem.category,
              importance: memoryItem.importance,
              source: memoryItem.source,
              timestamp: memoryItem.timestamp,
              tags: memoryItem.tags,
              metadata: memoryItem.metadata || {},
            },
          },
        ],
      });
      storedInQdrant = true;
    } catch (err) {
      console.warn('[Qdrant] Upsert error, storing locally:', err);
    }
  }

  // Always keep in local records
  const records = loadLocalStore();
  const existingIdx = records.findIndex((r) => r.item.id === memoryItem.id);
  if (existingIdx >= 0) {
    records[existingIdx] = { item: memoryItem, vector };
  } else {
    records.unshift({ item: memoryItem, vector });
  }
  saveLocalStore(records);

  return {
    ...memoryItem,
    metadata: {
      ...memoryItem.metadata,
      storedInQdrant,
    },
  };
}

/**
 * Retrieve all memories for the Memory Explorer
 */
export async function getAllMemories(): Promise<MemoryItem[]> {
  const records = loadLocalStore();
  if (records.length === 0) {
    await seedInitialMemoriesIfEmpty();
    return loadLocalStore().map((r) => r.item);
  }
  return records.map((r) => r.item);
}

/**
 * Delete a memory item by ID
 */
export async function deleteMemory(id: string): Promise<boolean> {
  const records = loadLocalStore();
  const filtered = records.filter((r) => r.item.id !== id);
  saveLocalStore(filtered);
  return true;
}

/**
 * Seed high-quality initial memories relevant to the hackathon scenario
 */
export async function seedInitialMemoriesIfEmpty(): Promise<void> {
  const records = loadLocalStore();
  if (records.length > 0) return;

  const seedData: Array<Omit<MemoryItem, 'id' | 'timestamp'>> = [
    {
      content: 'Past Hackathon Experience: Built an autonomous agent workflow in 2025. Struggled with demo video length management and rushed the architectural explanation at the end.',
      category: 'hackathon_experience',
      importance: 5,
      source: 'seed',
      tags: ['hackathon', 'past_experience', 'demo_video', 'time_management'],
    },
    {
      content: 'Identified Weak Area: Frontend visual observability for multi-agent DAG execution. Judges need to see step-by-step agent transitions rather than just a final text output.',
      category: 'weakness',
      importance: 5,
      source: 'seed',
      tags: ['weakness', 'observability', 'dag', 'ui'],
    },
    {
      content: 'User Preference: Prefers structured checklists with clear P0/P1/P2 prioritization, estimated hours, and explicit verification criteria.',
      category: 'preference',
      importance: 4,
      source: 'seed',
      tags: ['preference', 'prioritization', 'checklist'],
    },
    {
      content: 'Official Hackathon Judging Rule: Working software and observable agentic workflows account for 60%+ of the final score. Solo entries only.',
      category: 'requirement',
      importance: 5,
      source: 'seed',
      tags: ['hackathon_rules', 'evaluation', 'solo', 'weights'],
    },
    {
      content: 'Core Architectural Directive: Voice-triggered execution pipelines where specialized agents coordinate using a shared Qdrant vector memory layer.',
      category: 'requirement',
      importance: 5,
      source: 'seed',
      tags: ['architecture', 'track_rules', 'voice', 'qdrant', 'lyzr'],
    },
    {
      content: 'Technical Skill Profile: Strong in TypeScript, Next.js App Router, REST APIs, and LLM prompt engineering; moderate experience in Web Audio streaming APIs.',
      category: 'skill',
      importance: 4,
      source: 'seed',
      tags: ['skills', 'typescript', 'nextjs', 'audio_apis'],
    },
    {
      content: 'System Learning: Always run a Critic Agent verification cycle before returning final plan to detect missing hackathon submission deliverables.',
      category: 'system_learning',
      importance: 4,
      source: 'seed',
      tags: ['critic_loop', 'verification', 'workflow_optimization'],
    },
  ];

  for (const s of seedData) {
    await storeMemory(s);
  }
}
