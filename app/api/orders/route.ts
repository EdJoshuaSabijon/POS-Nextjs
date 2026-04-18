import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

function isAdmin(cookieHeader: string) {
  return /admin=true/.test(cookieHeader);
}

export async function GET(req: NextRequest) {
  const { data, error } = await supabase.from('orders').select('*');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? [], { status: 200 });
}

export async function POST(req: NextRequest) {
  const admin = isAdmin(req.headers.get('cookie') || '');
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const body = await req.json();
  const { customer, items } = body;
  const total = items?.reduce((acc: number, it: any) => acc + it.qty * it.price, 0) ?? 0;
  const { data, error } = await supabase.from('orders').insert([{ 
    customer: customer || 'Walk-in Customer', 
    date: new Date().toISOString(), 
    total, 
    status: 'Completed',
    items: items || [] 
  }]).select('*');
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data, { status: 201 });
}
