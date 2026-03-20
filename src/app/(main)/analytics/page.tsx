import React from 'react';
import { BarChart3 } from 'lucide-react';

export default function AnalyticsPage() {
  return (
    <div className="max-w-5xl mx-auto p-6 lg:p-10 font-sans relative">
      <div className="mb-8">
        <h1 className="text-4xl font-black text-gray-900 tracking-tight">Analytics</h1>
        <p className="text-gray-400 mt-2 font-medium">Insights and performance metrics for your accounts</p>
      </div>

      <div className="bg-white rounded-[32px] border border-gray-100 p-8 shadow-sm">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-6">
            <BarChart3 size={32} />
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-2">Analytics Overview</h2>
          <p className="text-gray-500 font-medium max-w-sm">
            Connect an account or publish a post to start seeing performance analytics.
          </p>
        </div>
      </div>
    </div>
  );
}
