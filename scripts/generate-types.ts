import { createClient } from '@supabase/supabase-js'
import { writeFileSync } from 'fs'
import { config } from 'dotenv-safe'
import path from 'path'

// Load environment variables from .env.local
config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase URL or key in .env.local')
  process.exit(1)
}

async function generateTypes() {
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  try {
    // Get all tables
    const { data: tables, error: tablesError } = await supabase
      .from('_types')
      .select('*')
      .eq('type', 'table')
    
    if (tablesError) throw tablesError

    // Get all functions
    const { data: functions, error: functionsError } = await supabase
      .rpc('get_functions')
    
    if (functionsError) throw functionsError

    // Get all enums
    const { data: enums, error: enumsError } = await supabase
      .rpc('get_enums')
    
    if (enumsError) throw enumsError
    
    // Write the types to a file
    const types = `export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      ${tables?.map(table => `
      ${table.name}: {
        Row: ${table.row_type}
        Insert: ${table.insert_type}
        Update: ${table.update_type}
      }`).join('\n') || ''}
    }
    Functions: {
      ${functions?.map(func => `
      ${func.name}: {
        Args: ${func.args_type || 'Record<string, never>'}
        Returns: ${func.return_type || 'unknown'}
      }`).join('\n') || ''}
    }
    Enums: {
      ${enums?.map(enum_ => `
      ${enum_.name}: ${enum_.values}`).join('\n') || ''}
    }
  }
}`

    // Write to types_db.ts in the root directory instead of types/supabase.ts
    writeFileSync(
      path.join(process.cwd(), 'types_db.ts'),
      types
    )
    
    console.log('Types generated successfully!')
  } catch (error) {
    console.error('Error generating types:', error)
  }
}

generateTypes()
