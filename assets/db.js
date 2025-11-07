// db.js
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = "https://yliiqpqycawgpajonwof.supabase.co"
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlsaWlxcHF5Y2F3Z3Bham9ud29mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxODc3MTUsImV4cCI6MjA3Nzc2MzcxNX0.EL2OrECuIYMEqrxnq_DGJJ2Z-fak2eyWwN_SHwzK8Ss"

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
