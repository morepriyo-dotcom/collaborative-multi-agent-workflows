'use client';

import React, { useState, useEffect } from 'react';
import {
  Database,
  Search,
  Plus,
  Tag,
  Clock,
  Sparkles,
  CheckCircle2,
  Filter,
} from 'lucide-react';
import { MemoryItem, MemoryCategory } from '@/types/memory';

interface MemoryExplorerProps {
  retrievedMemories?: MemoryItem[];
}

export const MemoryExplorer: React.FC<MemoryExplorerProps> = ({ retrievedMemories = [] }) => {
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  // New memory form state
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState<MemoryCategory>('hackathon_experience');
  const [newImportance, setNewImportance] = useState(4);
  const [newTags, setNewTags] = useState('hackathon, custom');

  const fetchMemories = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/memory/list');
      const data = await res.json();
      if (data.memories) {
        setMemories(data.memories);
      }
    } catch (err) {
      console.warn('Failed to fetch memories:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMemories();
  }, []);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) {
      fetchMemories();
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/memory/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: searchQuery.trim(),
          category: selectedCategory === 'all' ? undefined : selectedCategory,
          limit: 12,
        }),
      });
      const data = await res.json();
      if (data.results) {
        setMemories(data.results);
      }
    } catch (err) {
      console.warn('Search failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;

    try {
      const tags = newTags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const res = await fetch('/api/memory/store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newContent.trim(),
          category: newCategory,
          importance: newImportance,
          source: 'user_input',
          tags,
        }),
      });

      if (res.ok) {
        setNewContent('');
        setIsAdding(false);
        fetchMemories();
      }
    } catch (err) {
      console.warn('Error saving memory:', err);
    }
  };

  const categories = [
    { id: 'all', label: 'All Vectors' },
    { id: 'hackathon_experience', label: 'Hackathon Experiences' },
    { id: 'weakness', label: 'Known Weaknesses' },
    { id: 'preference', label: 'User Preferences' },
    { id: 'requirement', label: 'Judging Rules' },
    { id: 'system_learning', label: 'Agent Learnings' },
  ];

  const filteredMemories = memories.filter((m) =>
    selectedCategory === 'all' ? true : m.category === selectedCategory
  );

  return (
    <div className="space-y-6 text-left">
      {/* Header & Stats Banner */}
      <div className="glass-panel rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Database className="h-4 w-4" />
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Qdrant Vector Memory Explorer
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            Shared high-dimensional memory layer coordinating inter-agent intelligence across tasks.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700/80 text-center">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">
              Indexed Vectors
            </span>
            <span className="text-lg font-extrabold text-cyan-400 font-mono">
              {memories.length}
            </span>
          </div>

          <button
            onClick={() => setIsAdding(!isAdding)}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-lg shadow-indigo-600/20"
          >
            <Plus className="h-4 w-4" />
            <span>Store New Vector</span>
          </button>
        </div>
      </div>

      {/* Add Memory Modal/Card */}
      {isAdding && (
        <form
          onSubmit={handleAddMemory}
          className="glass-panel-elevated rounded-2xl p-5 border border-indigo-500/40 space-y-4 animate-in fade-in"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-indigo-400" />
              Embed &amp; Store New Memory in Qdrant
            </h3>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Cancel
            </button>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Memory Content / Fact
            </label>
            <textarea
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              rows={2}
              required
              placeholder="e.g. User excels at building modular full-stack architectures but needs practice with live audio streaming."
              className="w-full rounded-xl bg-slate-900 border border-slate-700 p-3 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Category</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as MemoryCategory)}
                className="w-full rounded-lg bg-slate-900 border border-slate-700 p-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="hackathon_experience">Hackathon Experience</option>
                <option value="weakness">Known Weakness</option>
                <option value="preference">User Preference</option>
                <option value="requirement">Judging Rule</option>
                <option value="system_learning">System Learning</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Importance (1 - 5)
              </label>
              <input
                type="number"
                min={1}
                max={5}
                value={newImportance}
                onChange={(e) => setNewImportance(Number(e.target.value))}
                className="w-full rounded-lg bg-slate-900 border border-slate-700 p-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Tags (comma-separated)
              </label>
              <input
                type="text"
                value={newTags}
                onChange={(e) => setNewTags(e.target.value)}
                placeholder="audio, weakness, hackathon"
                className="w-full rounded-lg bg-slate-900 border border-slate-700 p-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md transition-all"
            >
              Generate Embedding &amp; Upsert to Qdrant
            </button>
          </div>
        </form>
      )}

      {/* Retrieved for Current Task Section */}
      {retrievedMemories.length > 0 && (
        <div className="glass-panel rounded-2xl p-5 border border-emerald-500/30">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-emerald-300 uppercase tracking-wider">
                Retrieved Vectors For Active Workflow
              </h3>
            </div>
            <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-800">
              {retrievedMemories.length} matched vectors
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {retrievedMemories.map((mem) => (
              <div
                key={mem.id}
                className="p-3 rounded-xl bg-slate-900/80 border border-emerald-500/20 text-xs text-slate-200 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-emerald-400">{mem.category}</span>
                  {mem.similarity !== undefined && (
                    <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
                      Similarity: {(mem.similarity * 100).toFixed(1)}%
                    </span>
                  )}
                </div>
                <p className="text-slate-300 leading-relaxed">{mem.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search & Category Filter Controls */}
      <div className="glass-panel rounded-2xl p-4 space-y-3">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Qdrant using vector semantic similarity (e.g. 'hackathon video length', 'weakness')..."
              className="w-full rounded-xl bg-slate-900/90 border border-slate-700/80 pl-10 pr-4 py-2.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all font-sans"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-md shadow-cyan-600/20"
          >
            <Search className="h-3.5 w-3.5" />
            <span>Vector Search</span>
          </button>
        </form>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <Filter className="h-3.5 w-3.5 text-slate-400 shrink-0 mr-1" />
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1 rounded-lg transition-all text-xs whitespace-nowrap font-medium ${
                selectedCategory === cat.id
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-slate-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Memory Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full py-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
            <Database className="h-4 w-4 text-cyan-400 animate-spin" />
            Querying Qdrant vector database...
          </div>
        ) : filteredMemories.length === 0 ? (
          <div className="col-span-full py-12 text-center text-xs text-slate-500">
            No memories match the filter criteria. Try another semantic search query.
          </div>
        ) : (
          filteredMemories.map((mem) => (
            <div
              key={mem.id}
              className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 hover:bg-slate-900 transition-all flex flex-col justify-between space-y-3 group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-cyan-950/60 text-cyan-300 border border-cyan-800/40">
                    {mem.category}
                  </span>
                  <div className="flex items-center gap-2">
                    {mem.similarity !== undefined && (
                      <span className="text-[10px] font-mono text-emerald-400">
                        Score: {(mem.similarity * 100).toFixed(0)}%
                      </span>
                    )}
                    <span className="text-[10px] font-semibold text-amber-400">
                      ★ {mem.importance}/5
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-200 leading-relaxed font-sans">{mem.content}</p>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500">
                <span className="flex items-center gap-1">
                  <Tag className="h-2.5 w-2.5" />
                  {mem.tags.slice(0, 3).join(', ')}
                </span>
                <span className="flex items-center gap-1 font-mono">
                  <Clock className="h-2.5 w-2.5" />
                  {new Date(mem.timestamp).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
