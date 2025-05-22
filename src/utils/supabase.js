import { createClient } from '@supabase/supabase-js'

const supabaseUrl     = process.env.REACT_APP_SUPABASE_URL
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY

console.log('SUPABASE_URL:',    supabaseUrl)
console.log('ANON KEY (first 10):', supabaseAnonKey?.slice(0,10))

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
