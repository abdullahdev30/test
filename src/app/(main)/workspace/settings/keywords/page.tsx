"use client";

import React, { useMemo, useState, useTransition } from 'react';
import { Plus, Trash2, Edit3, Key } from 'lucide-react';
import { useWorkspace } from '@/hooks/useWorkspace';
import { Alert, Button, Input, Select, Spinner } from '@/components/common';

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
          <Button
            onClick={handleReplaceUsingVisible}
            disabled={isPending || isLoading}
            variant="outline"
            size="sm"
            className="text-text-secondary text-xs hover:bg-background"
          >
            Bulk Replace
          </Button>
          <Button
            onClick={handleAddKeyword}
            disabled={isPending || isLoading || !newKeyword.trim()}
            isLoading={isPending}
            className="gap-2 px-5 py-2 bg-text-primary text-background rounded-lg text-sm font-semibold hover:opacity-90"
          >
            <Plus size={16} /> Add Keyword
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="alert" className="mb-4 text-xs">
          {error}
        </Alert>
      )}

      {/* Utilities */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-3 w-full max-w-xl">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search keywords..."
            className="w-64 border-text-secondary/10 rounded-lg"
            variant="filled"
            size="sm"
          />
          <Input
            value={newKeyword}
            onChange={(e) => setNewKeyword(e.target.value)}
            placeholder="New keyword..."
            className="flex-1 border-text-secondary/10 rounded-lg"
            variant="filled"
            size="sm"
          />
          <Select
            value={newType}
            onChange={(e) => setNewType((e.target.value === 'secondary' ? 'secondary' : 'primary'))}
            className="border-text-secondary/10 rounded-lg"
            variant="filled"
            size="sm"
          >
            <option value="primary">Primary</option>
            <option value="secondary">Secondary</option>
          </Select>
        </div>
        <Button
          onClick={handleClearAll}
          disabled={isPending || isLoading || keywords.length === 0}
          variant="ghost"
          size="sm"
          className="text-xs font-semibold text-red-500 hover:text-red-700"
        >
          <Trash2 size={12} /> Clear All
        </Button>
      </div>

      {/* Grid View Table */}
      <div className="w-full border border-text-secondary/10 rounded-lg overflow-hidden bg-background flex-1">
        {isLoading ? (
            <div className="h-full min-h-[320px] flex items-center justify-center">
            <Spinner size="lg" className="text-primary/70" />
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
                          <Input
                            value={editKeyword}
                            onChange={(e) => setEditKeyword(e.target.value)}
                            className="w-full border-text-secondary/20 rounded-md"
                            variant="filled"
                            size="sm"
                          />
                        ) : (
                          <span className="text-sm font-semibold text-text-primary">{kw.keyword}</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {isEditingRow ? (
                          <Select
                            value={editType}
                            onChange={(e) => setEditType((e.target.value === 'secondary' ? 'secondary' : 'primary'))}
                            className="border-text-secondary/20 rounded-md"
                            variant="filled"
                            size="sm"
                          >
                            <option value="primary">Primary</option>
                            <option value="secondary">Secondary</option>
                          </Select>
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
                              <Button
                                onClick={handleSaveEdit}
                                disabled={isPending || !editKeyword.trim()}
                                variant="ghost"
                                size="sm"
                                className="hover:text-emerald-600 text-xs font-semibold"
                              >
                                Save
                              </Button>
                              <Button onClick={() => setEditingId(null)} variant="ghost" size="sm" className="hover:text-text-primary text-xs font-semibold">
                                Cancel
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                onClick={() => handleStartEdit(kw.id, kw.keyword, kw.keywordType)}
                                variant="ghost"
                                size="icon"
                                className="hover:text-text-primary"
                              >
                                <Edit3 size={16} strokeWidth={1.5} />
                              </Button>
                              <Button onClick={() => handleDeleteKeyword(kw.id)} variant="ghost" size="icon" className="hover:text-red-500">
                                <Trash2 size={16} strokeWidth={1.5} />
                              </Button>
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
