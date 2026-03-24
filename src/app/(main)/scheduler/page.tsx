import React from 'react';
import { Calendar } from 'lucide-react';

export default function SchedulerPage() {
  return (
    <div className="max-w-5xl mx-auto p-6 lg:p-10 font-sans relative">
      <div className="mb-8">
        <h1 className="text-4xl font-black text-text-primary tracking-tight">Scheduler</h1>
        <p className="text-text-secondary mt-2 font-medium">Plan and schedule your upcoming content</p>
      </div>

      <div className="bg-bg-primary rounded-[32px] border border-text-secondary/10 p-8 shadow-sm">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 bg-[#F3E8FF] text-[#7C3AED] rounded-full flex items-center justify-center mb-6">
            <Calendar size={32} />
          </div>
          <h2 className="text-2xl font-black text-text-primary mb-2">No Scheduled Posts</h2>
          <p className="text-text-secondary font-medium mb-8 max-w-sm">
            You don't have any posts scheduled for the upcoming days. Create a new post to get started.
          </p>
          <button className="px-6 py-3 bg-[#7C3AED] text-white rounded-xl font-bold hover:opacity-90 transition-opacity">
            Create Post
          </button>
        </div>
      </div>
    </div>
  );
}
