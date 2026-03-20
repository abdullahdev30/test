import React from 'react';
import { Archive } from 'lucide-react';

export default function ContentLibraryPage() {
  return (
    <div className="max-w-5xl mx-auto p-6 lg:p-10 font-sans relative">
      <div className="mb-8">
        <h1 className="text-4xl font-black text-gray-900 tracking-tight">Content Library</h1>
        <p className="text-gray-400 mt-2 font-medium">Store and manage your media and templates</p>
      </div>

      <div className="bg-white rounded-[32px] border border-gray-100 p-8 shadow-sm">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mb-6">
            <Archive size={32} />
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-2">Your Library is Empty</h2>
          <p className="text-gray-500 font-medium mb-8 max-w-sm">
            Upload images, videos, and templates to reuse them across your social posts.
          </p>
          <button className="px-6 py-3 bg-[#7C3AED] text-white rounded-xl font-bold hover:opacity-90 transition-opacity">
            Upload Media
          </button>
        </div>
      </div>
    </div>
  );
}
