import { RoadmapPath, RoadmapEngine } from './roadmapEngine';

interface CacheEntry {
  paths: RoadmapPath[];
  timestamp: number;
}

export class CacheService {
  private static cache = new Map<string, CacheEntry>();
  private static readonly MAX_ENTRIES = 500;
  // TTL of 24 hours in milliseconds
  private static readonly TTL = 24 * 60 * 60 * 1000;

  private static getCacheKey(fromNodeId: string, toNodeId: string, maxDepth: number): string {
    return `${fromNodeId}-${toNodeId}-${maxDepth}`;
  }

  public static get(fromNodeId: string, toNodeId: string, maxDepth: number): RoadmapPath[] | null {
    const key = this.getCacheKey(fromNodeId, toNodeId, maxDepth);
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check expiration
    if (Date.now() - entry.timestamp > this.TTL) {
      this.cache.delete(key);
      return null;
    }

    // Refresh position for LRU
    this.cache.delete(key);
    this.cache.set(key, entry);

    return entry.paths;
  }

  public static set(fromNodeId: string, toNodeId: string, maxDepth: number, paths: RoadmapPath[]): void {
    const key = this.getCacheKey(fromNodeId, toNodeId, maxDepth);
    
    // Evict least recently used (first inserted key in Map iteration order) if cache is full
    if (this.cache.size >= this.MAX_ENTRIES && !this.cache.has(key)) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, {
      paths,
      timestamp: Date.now()
    });
  }

  public static clear(): void {
    this.cache.clear();
    RoadmapEngine.clearGraphCache();
    console.log('Roadmap Engine Cache cleared successfully.');
  }
}
