"use client";

import React, { useState } from 'react';
import { Save, Plus } from 'lucide-react';

export default function ProfileSettingsPage() {
  const [platforms, setPlatforms] = useState(['Instagram', 'LinkedIn']);
  const availablePlatforms = ['Twitter', 'TikTok', 'Facebook', 'Pinterest', 'YouTube'];

  return (
    <div className="p-8 font-sans">
      <div className="flex items-center justify-between mb-8 pb-6 border-b border-text-secondary/10">
        <div>
          <h2 className="text-xl font-semibold text-text-primary">Business Profile</h2>
          <p className="text-sm text-text-secondary mt-1">Manage standard identity and content strategy defaults.</p>
        </div>
        <button className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity">
          <Save size={16} /> Save Changes
        </button>
      </div>

      <div className="space-y-12">
        {/* Identity Section */}
        <section>
          <div className="mb-6">
            <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">Identity</h3>
            <p className="text-xs text-text-secondary mt-1">Core business tone and branding output.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-text-primary">Brand Tone</label>
              <select className="w-full p-3 bg-background border border-text-secondary/10 rounded-lg text-sm text-text-primary focus:outline-none focus:border-primary">
                <option value="Professional & Authoritative">Professional & Authoritative</option>
                <option value="Casual & Friendly">Casual & Friendly</option>
                <option value="Humorous & Edgy">Humorous & Edgy</option>
                <option value="Educational & Direct">Educational & Direct</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-semibold text-text-primary">Output Language</label>
              <select className="w-full p-3 bg-background border border-text-secondary/10 rounded-lg text-sm text-text-primary focus:outline-none focus:border-primary">
                <option value="English (US)">English (US)</option>
                <option value="English (UK)">English (UK)</option>
                <option value="Spanish">Spanish</option>
              </select>
            </div>
          </div>
        </section>

        <hr className="border-text-secondary/10" />

        {/* Content Strategy Section */}
        <section>
          <div className="mb-6">
            <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">Content Strategy</h3>
            <p className="text-xs text-text-secondary mt-1">Where and how often you will be generating content.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-text-primary">Posting Frequency</label>
              <select className="w-full p-3 bg-background border border-text-secondary/10 rounded-lg text-sm text-text-primary focus:outline-none focus:border-primary">
                <option>1-3 times per week</option>
                <option>Daily</option>
                <option>Multiple times a day</option>
                <option>Custom schedule</option>
              </select>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-semibold text-text-primary">Preferred Platforms</label>
            <div className="flex flex-wrap gap-2">
              {platforms.map(p => (
                <div key={p} className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-md text-xs font-semibold border border-primary/20">
                  {p}
                  <button onClick={() => setPlatforms(platforms.filter(x => x !== p))} className="hover:text-red-500 font-bold ml-1">&times;</button>
                </div>
              ))}
              <div className="flex items-center">
                <select 
                  className="bg-background text-text-secondary border border-text-secondary/20 rounded-md px-3 py-1.5 text-xs focus:outline-none focus:border-text-secondary/40 font-semibold"
                  onChange={(e) => {
                    if (e.target.value && !platforms.includes(e.target.value)) {
                      setPlatforms([...platforms, e.target.value]);
                      e.target.value = "";
                    }
                  }}
                >
                  <option value="">+ Add Platform...</option>
                  {availablePlatforms.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>
          </div>
        </section>

        <hr className="border-text-secondary/10" />

        {/* Audience Goals Section */}
        <section>
          <div className="mb-6">
            <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">Audience Goals</h3>
            <p className="text-xs text-text-secondary mt-1">Demographics and key messaging focuses.</p>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-text-primary">Target Audience Definition</label>
              <textarea 
                rows={4}
                className="w-full p-4 bg-background border border-text-secondary/10 rounded-lg text-sm text-text-primary focus:outline-none focus:border-primary resize-none"
                placeholder="E.g. B2B SaaS Founders, Marketing Managers aged 25-45 looking for automation tools."
                defaultValue="B2B Founders and Marketing Directors interested in Social Media Automation."
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
