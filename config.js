// Supabase設定（trainee-manager と同じプロジェクトを共用）
const SUPABASE_URL = 'https://ajmdpkwqyeyzemeoojwd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqbWRwa3dxeWV5emVtZW9vandkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxMjIwMzAsImV4cCI6MjA5MDY5ODAzMH0.AfpGFcYvVrS25qTr9RTGWqsvWMKykU2QcXZPtiNxAqY';

var supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 管理画面を開くための簡易パスワード（クライアント側のみの軽いゲート）
const ADMIN_PASSWORD = 'grop2026';
