import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET() {
  const { data, error } = await supabase
    .from('add_ons')
    .select('*')
    .order('name');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? [], { status: 200 });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, price, available } = body;
  if (!name || price == null) {
    return NextResponse.json({ error: 'Name and price are required.' }, { status: 400 });
  }
  const { data, error } = await supabase
    .from('add_ons')
    .insert([{ name, price: parseFloat(price), available: available !== false }])
    .select('*');
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data, { status: 201 });
}
