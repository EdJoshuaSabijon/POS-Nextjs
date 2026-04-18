import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

function isAdmin(cookieHeader: string) {
  return /admin=true/.test(cookieHeader);
}

export async function GET(req: NextRequest) {
  const { data, error } = await supabase.from('products').select('*');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? [], { status: 200 });
}

export async function POST(req: NextRequest) {
  const admin = isAdmin(req.headers.get('cookie') || '');
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const body = await req.json();
  const { name, category, price, stock, image, sku } = body;
  const { data, error } = await supabase.from('products').insert([{ name, category, price, stock, image, sku }]).select('*');
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data, { status: 201 });
}
