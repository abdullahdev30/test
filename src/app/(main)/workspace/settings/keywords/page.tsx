"use client";

import React from 'react';
import { Plus, Trash2, Edit3, MoreVertical, Key } from 'lucide-react';

const mockKeywords = [
  { id: 1, word: "social media automation", type: "Primary", updated: "Oct 24, 2026" },
  { id: 2, word: "ai content generator", type: "Primary", updated: "Oct 24, 2026" },
  { id: 3, word: "agency software tools", type: "Secondary", updated: "Oct 22, 2026" },
  { id: 4, word: "b2b marketing automation", type: "Secondary", updated: "Oct 15, 2026" },
];

export default function KeywordStrategyPage() {
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
              <p className="text-xs text-text-secondary"><strong className="text-text-primary">24</strong> Total</p>
              <span className="w-px h-3 bg-text-secondary/20 mt-0.5"></span>
              <p className="text-xs text-text-secondary"><strong className="text-text-primary">5</strong> Primary</p>
              <span className="w-px h-3 bg-text-secondary/20 mt-0.5"></span>
              <p className="text-xs text-text-secondary"><strong className="text-text-primary">19</strong> Secondary</p>
            </div>
          </div>
        </div>
        

        <div className="flex items-center gap-3">
          <button className="px-4 py-2 border border-text-secondary/20 text-text-secondary text-xs font-semibold rounded-lg hover:bg-background transition-colors">
            Bulk Replace
          </button>
          <button className="flex items-center gap-2 px-5 py-2 bg-text-primary text-background rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity">
            <Plus size={16} /> Add Keyword
          </button>
        </div>
      </div>

      {/* Utilities */}
      <div className="flex justify-between items-center mb-4">
        <input 
          placeholder="Search keywords..." 
          className="px-4 py-2 text-sm bg-background border border-text-secondary/10 rounded-lg w-64 focus:outline-none focus:border-primary"
        />
        <button className="text-xs font-semibold text-red-500 hover:text-red-700 transition-colors flex items-center gap-1">
          <Trash2 size={12} /> Clear All
        </button>
      </div>

      {/* Grid View Table */}
      <div className="w-full border border-text-secondary/10 rounded-lg overflow-hidden bg-background flex-1">
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
            {mockKeywords.map((kw) => (
              <tr key={kw.id} className="border-b border-text-secondary/5 hover:bg-bg-primary/50 transition-colors">
                <td className="px-6 py-4">
                  <span className="text-sm font-semibold text-text-primary">{kw.word}</span>
                </td>
                <td className="px-6 py-4">
                  {kw.type === "Primary" ? (
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
                  {kw.updated}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-3 text-text-secondary">
                    <button className="hover:text-text-primary"><Edit3 size={16} strokeWidth={1.5} /></button>
                    <button className="hover:text-red-500"><Trash2 size={16} strokeWidth={1.5} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {/* Footer info */}
        <div className="p-4 flex items-center justify-between border-t border-text-secondary/10 bg-bg-primary text-xs text-text-secondary">
          <span>Showing 4 of 24 Keywords</span>
          <div className="flex gap-2">
            <button className="px-3 py-1 border border-text-secondary/10 rounded hover:bg-background">Prev</button>
            <button className="px-3 py-1 border border-text-secondary/10 rounded hover:bg-background">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}
