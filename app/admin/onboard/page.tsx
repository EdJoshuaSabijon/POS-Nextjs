"use client";

import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function AdminOnboard() {
  const [userId, setUserId] = useState('');
  const [status, setStatus] = useState<string | null>(null);

  const addAdmin = async () => {
    if (!userId) return setStatus('Please provide a user_id');
    try {
      const { data, error } = await supabase.from('admins').insert([{ user_id: userId }]).select('*');
      if (error) { setStatus(`Error: ${error.message}`); return; }
      setStatus(`Admin added: ${data[0].user_id}`);
    } catch (e) {
      setStatus('Failed to add admin');
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Admin Onboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-xl">
        <div>
          <label className="block text-sm mb-1">User ID</label>
          <input className="w-full border rounded px-3 py-2" value={userId} onChange={(e)=>setUserId(e.target.value)} placeholder="Auth user_id"/>
        </div>
        <div className="flex items-end">
          <button className="px-4 py-2 bg-green-700 text-white rounded" onClick={addAdmin}>Add Admin</button>
        </div>
      </div>
      {status && <div className="mt-3 text-sm text-on-surface-variant">{status}</div>}
    </div>
  );
}
