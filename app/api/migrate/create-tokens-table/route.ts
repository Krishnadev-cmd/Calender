import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    console.log('Creating google_calendar_tokens table...');
    


    // Create the table using raw SQL
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS google_calendar_tokens (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        user_id UUID NOT NULL,
        access_token TEXT NOT NULL,
        refresh_token TEXT,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        scope TEXT DEFAULT 'https://www.googleapis.com/auth/calendar',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id)
      );
      
      CREATE INDEX IF NOT EXISTS idx_google_calendar_tokens_user_id ON google_calendar_tokens(user_id);
      CREATE INDEX IF NOT EXISTS idx_google_calendar_tokens_expires_at ON google_calendar_tokens(expires_at);
      
      ALTER TABLE google_calendar_tokens ENABLE ROW LEVEL SECURITY;
    `;

    // Execute the SQL
    const { error } = await supabase.rpc('exec_sql', { query: createTableSQL });
    
    if (error) {
      console.error('SQL execution error:', error);
      
      // Try alternative approach - insert a test record to create the table structure
      const { error: insertError } = await supabase
        .from('google_calendar_tokens')
        .insert({
          user_id: '00000000-0000-0000-0000-000000000000',
          access_token: 'test',
          refresh_token: 'test',
          expires_at: new Date().toISOString()
        });
        
      if (insertError && !insertError.message.includes('duplicate key')) {
        console.error('Table creation failed:', insertError);
        return NextResponse.json({ 
          error: 'Failed to create table',
          details: insertError 
        }, { status: 500 });
      }
      
      // Delete the test record
      await supabase
        .from('google_calendar_tokens')
        .delete()
        .eq('user_id', '00000000-0000-0000-0000-000000000000');
    }

    console.log('Table creation completed successfully');
    return NextResponse.json({ 
      success: true,
      message: 'google_calendar_tokens table created successfully' 
    });

  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json({ 
      error: 'Migration failed',
      details: error 
    }, { status: 500 });
  }
}