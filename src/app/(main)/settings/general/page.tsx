"use client";

import React from "react";
import { Factory } from "lucide-react";
import { Button, Card, Select } from "@/components/common";

export default function GeneralSettingsPage() {
  return (
    <Card className="rounded-[40px] p-10 shadow-sm animate-in fade-in duration-500">
      <div className="flex items-start gap-5 mb-8">
        <div className="p-4 bg-primary/10 text-primary rounded-3xl">
          <Factory size={24} strokeWidth={1.5} />
        </div>
        <div>
          <h3 className="text-xl font-black text-text-primary">General Settings</h3>
          <p className="text-sm text-text-secondary font-medium mt-1">Application preferences and regional settings.</p>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-[10px] font-black text-text-secondary mb-2.5 uppercase tracking-[0.2em]">Language</label>
          <Select className="w-full max-w-xs px-6 py-4 border-2 bg-background border-text-secondary/10 rounded-[20px] text-[15px] font-black text-text-primary">
            <option>English (US)</option>
            <option>English (UK)</option>
            <option>Spanish</option>
          </Select>
        </div>

        <div>
          <label className="block text-[10px] font-black text-text-secondary mb-2.5 uppercase tracking-[0.2em]">Timezone</label>
          <Select className="w-full max-w-xs px-6 py-4 border-2 bg-background border-text-secondary/10 rounded-[20px] text-[15px] font-black text-text-primary">
            <option>Asia/Karachi (PKT +5:00)</option>
            <option>America/New_York (EST -5:00)</option>
            <option>Europe/London (GMT +0:00)</option>
          </Select>
        </div>

        <div>
          <label className="block text-[10px] font-black text-text-secondary mb-2.5 uppercase tracking-[0.2em]">Date Format</label>
          <Select className="w-full max-w-xs px-6 py-4 border-2 bg-background border-text-secondary/10 rounded-[20px] text-[15px] font-black text-text-primary">
            <option>DD/MM/YYYY</option>
            <option>MM/DD/YYYY</option>
            <option>YYYY-MM-DD</option>
          </Select>
        </div>
      </div>

      <Button className="mt-10 px-8 py-3.5 rounded-2xl text-sm shadow-lg shadow-primary/20 uppercase tracking-widest">
        Save Preferences
      </Button>
    </Card>
  );
}
