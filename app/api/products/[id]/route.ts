import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

function isAdmin(cookieHeader: string) {
  return /admin=true/.test(cookieHeader);
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data, error } = await supabase.from('products').select('*').eq('id', id).single();
  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json(data, { status: 200 });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = isAdmin(req.headers.get('cookie') || '');
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { id } = await params;
  const body = await req.json();
  const updates: any = {};
  for (const key of [ 'name','category','price','stock','image','sku' ]) {
    if (body[key] !== undefined) updates[key] = body[key];
  }
  const { data, error } = await supabase.from('products').update(updates).eq('id', id).select('*').single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data, { status: 200 });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = isAdmin(req.headers.get('cookie') || '');
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { id } = await params;
  const { data, error } = await supabase.from('products').delete().eq('id', id).select('*');
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data, { status: 200 });
}
