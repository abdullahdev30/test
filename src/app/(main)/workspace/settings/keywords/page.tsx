"use client";

import React, { useMemo, useState, useTransition } from 'react';
import { Plus, Trash2, Edit3, Key, Loader2 } from 'lucide-react';
import { useWorkspace } from '@/hooks/useWorkspace';

export default function KeywordStrategyPage() {
  const { keywords, isLoading, addKeyword, updateKeyword, deleteKeyword, deleteAllKeywords, replaceKeywords } = useWorkspace();
  const [query, setQuery] = useState('');
  const [newKeyword, setNewKeyword] = useState('');
  const [newType, setNewType] = useState<'primary' | 'secondary'>('primary');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editKeyword, setEditKeyword] = useState('');
  const [editType, setEditType] = useState<'primary' | 'secondary'>('primary');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filteredKeywords = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return keywords;
    return keywords.filter((k) => k.keyword.toLowerCase().includes(q));
  }, [keywords, query]);

  const stats = useMemo(() => {
    const primary = keywords.filter((k) => String(k.keywordType).toLowerCase() === 'primary').length;
    const secondary = keywords.length - primary;
    return { total: keywords.length, primary, secondary };
  }, [keywords]);

  const handleAddKeyword = () => {
    if (!newKeyword.trim()) return;
    setError(null);

    startTransition(async () => {
      const result = await addKeyword({ keyword: newKeyword.trim(), keywordType: newType });
      if (!result.success) {
        setError(result.error ?? 'Failed to add keyword');
        return;
      }
      setNewKeyword('');
      setNewType('primary');
    });
  };

  const handleStartEdit = (id: string, keyword: string, type: string) => {
    setEditingId(id);
    setEditKeyword(keyword);
    setEditType(String(type).toLowerCase() === 'secondary' ? 'secondary' : 'primary');
  };

  const handleSaveEdit = () => {
    if (!editingId || !editKeyword.trim()) return;
    setError(null);

    startTransition(async () => {
      const result = await updateKeyword(editingId, {
        keyword: editKeyword.trim(),
        keywordType: editType,
      });

      if (!result.success) {
        setError(result.error ?? 'Failed to update keyword');
        return;
      }

      setEditingId(null);
      setEditKeyword('');
    });
  };

  const handleDeleteKeyword = (id: string) => {
    setError(null);
    startTransition(async () => {
      const result = await deleteKeyword(id);
      if (!result.success) {
        setError(result.error ?? 'Failed to delete keyword');
      }
    });
  };

  const handleClearAll = () => {
    setError(null);
    startTransition(async () => {
      const result = await deleteAllKeywords();
      if (!result.success) {
        setError(result.error ?? 'Failed to clear keywords');
      }
    });
  };

  const handleReplaceUsingVisible = () => {
    setError(null);
    startTransition(async () => {
      const payload = filteredKeywords.map((k) => ({
        keyword: k.keyword,
        keywordType: String(k.keywordType).toLowerCase() === 'secondary' ? 'secondary' : 'primary',
      }));
      const result = await replaceKeywords({ keywords: payload });
      if (!result.success) {
        setError(result.error ?? 'Failed to replace keywords');
      }
    });
  };

  return (
    <div className="p-8 font-sans h-full flex flex-col">
      {/* Top Bar Summary */}
      <div className="flex items-center justify-between mb-8 pb-6 border-b border-text-secondary/10">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-indigo-500/10 text-indigo-500 flex items-center justify-center rounded-lg">
            <Key size={24} strokeWidth={1.5} />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-text-primary">Keyword Strategy</h2>
            <div className="flex gap-4 mt-2">
              <p className="text-xs text-text-secondary"><strong className="text-text-primary">{stats.total}</strong> Total</p>
              <span className="w-px h-3 bg-text-secondary/20 mt-0.5"></span>
              <p className="text-xs text-text-secondary"><strong className="text-text-primary">{stats.primary}</strong> Primary</p>
              <span className="w-px h-3 bg-text-secondary/20 mt-0.5"></span>
              <p className="text-xs text-text-secondary"><strong className="text-text-primary">{stats.secondary}</strong> Secondary</p>
            </div>
          </div>
        </div>


        <div className="flex items-center gap-3">
          <button
            onClick={handleReplaceUsingVisible}
            disabled={isPending || isLoading}
            className="px-4 py-2 border border-text-secondary/20 text-text-secondary text-xs font-semibold rounded-lg hover:bg-background transition-colors disabled:opacity-50"
          >
            Bulk Replace
          </button>
          <button
            onClick={handleAddKeyword}
            disabled={isPending || isLoading || !newKeyword.trim()}
            className="flex items-center gap-2 px-5 py-2 bg-text-primary text-background rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isPending ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} Add Keyword
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 px-3 py-2 text-xs rounded-lg bg-red-500/10 border border-red-500/20 text-red-600">
          {error}
        </div>
      )}

      {/* Utilities */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-3 w-full max-w-xl">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search keywords..."
            className="px-4 py-2 text-sm bg-background border border-text-secondary/10 rounded-lg w-64 focus:outline-none focus:border-primary"
          />
          <input
            value={newKeyword}
            onChange={(e) => setNewKeyword(e.target.value)}
            placeholder="New keyword..."
            className="px-4 py-2 text-sm bg-background border border-text-secondary/10 rounded-lg flex-1 focus:outline-none focus:border-primary"
          />
          <select
            value={newType}
            onChange={(e) => setNewType((e.target.value === 'secondary' ? 'secondary' : 'primary'))}
            className="px-3 py-2 text-sm bg-background border border-text-secondary/10 rounded-lg focus:outline-none focus:border-primary"
          >
            <option value="primary">Primary</option>
            <option value="secondary">Secondary</option>
          </select>
        </div>
        <button
          onClick={handleClearAll}
          disabled={isPending || isLoading || keywords.length === 0}
          className="text-xs font-semibold text-red-500 hover:text-red-700 transition-colors flex items-center gap-1 disabled:opacity-50"
        >
          <Trash2 size={12} /> Clear All
        </button>
      </div>

      {/* Grid View Table */}
      <div className="w-full border border-text-secondary/10 rounded-lg overflow-hidden bg-background flex-1">
        {isLoading ? (
          <div className="h-full min-h-[320px] flex items-center justify-center">
            <Loader2 size={28} className="animate-spin text-primary/70" />
          </div>
        ) : (
          <>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-bg-primary border-b border-text-secondary/10">
                  <th className="px-6 py-4 text-xs font-bold text-text-secondary uppercase tracking-wider w-1/2">Keyword</th>
                  <th className="px-6 py-4 text-xs font-bold text-text-secondary uppercase tracking-wider">Type</th>
                  <th className="px-6 py-4 text-xs font-bold text-text-secondary uppercase tracking-wider">Date Updated</th>
                  <th className="px-6 py-4 text-xs font-bold text-text-secondary uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredKeywords.map((kw) => {
                  const isEditingRow = editingId === kw.id;
                  const type = String(kw.keywordType).toLowerCase() === 'secondary' ? 'secondary' : 'primary';
                  const updated = kw.updatedAt ? new Date(kw.updatedAt).toLocaleDateString() : '-';
                  return (
                    <tr key={kw.id} className="border-b border-text-secondary/5 hover:bg-bg-primary/50 transition-colors">
                      <td className="px-6 py-4">
                        {isEditingRow ? (
                          <input
                            value={editKeyword}
                            onChange={(e) => setEditKeyword(e.target.value)}
                            className="px-3 py-1.5 text-sm bg-background border border-text-secondary/20 rounded-md focus:outline-none focus:border-primary w-full"
                          />
                        ) : (
                          <span className="text-sm font-semibold text-text-primary">{kw.keyword}</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {isEditingRow ? (
                          <select
                            value={editType}
                            onChange={(e) => setEditType((e.target.value === 'secondary' ? 'secondary' : 'primary'))}
                            className="px-2 py-1 text-xs bg-background border border-text-secondary/20 rounded-md focus:outline-none focus:border-primary"
                          >
                            <option value="primary">Primary</option>
                            <option value="secondary">Secondary</option>
                          </select>
                        ) : type === 'primary' ? (
                          <span className="inline-block px-2.5 py-1 bg-emerald-500/10 text-emerald-600 text-[10px] font-bold rounded-md uppercase tracking-wider border border-emerald-500/20">
                            Primary
                          </span>
                        ) : (
                          <span className="inline-block px-2.5 py-1 bg-text-secondary/10 text-text-secondary text-[10px] font-bold rounded-md uppercase tracking-wider border border-text-secondary/10">
                            Secondary
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-text-secondary">
                        {updated}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-3 text-text-secondary">
                          {isEditingRow ? (
                            <>
                              <button
                                onClick={handleSaveEdit}
                                disabled={isPending || !editKeyword.trim()}
                                className="hover:text-emerald-600 text-xs font-semibold disabled:opacity-50"
                              >
                                Save
                              </button>
                              <button onClick={() => setEditingId(null)} className="hover:text-text-primary text-xs font-semibold">
                                Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => handleStartEdit(kw.id, kw.keyword, kw.keywordType)}
                                className="hover:text-text-primary"
                              >
                                <Edit3 size={16} strokeWidth={1.5} />
                              </button>
                              <button onClick={() => handleDeleteKeyword(kw.id)} className="hover:text-red-500">
                                <Trash2 size={16} strokeWidth={1.5} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="p-4 flex items-center justify-between border-t border-text-secondary/10 bg-bg-primary text-xs text-text-secondary">
              <span>Showing {filteredKeywords.length} of {keywords.length} keywords</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
