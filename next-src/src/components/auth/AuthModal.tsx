'use client';

import { useState } from 'react';
import { X, Mail, Lock, User, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useUserStore } from '@/stores/useUserStore';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const login = useUserStore((s) => s.login);
  const migrateFromLocalStorage = useUserStore((s) => s.migrateFromLocalStorage);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (!isSupabaseConfigured || !supabase) {
      setError('Supabase 尚未配置。请在 .env.local 中设置 NEXT_PUBLIC_SUPABASE_URL 和 NEXT_PUBLIC_SUPABASE_ANON_KEY。');
      setLoading(false);
      return;
    }

    try {
      if (mode === 'register') {
        const { error: authError } = await supabase.auth.signUp({
          email,
          password,
        });
        if (authError) {
          setError(authError.message);
          return;
        }
        setSuccess('注册成功！请查收邮箱确认链接，确认后即可登录。');
      } else {
        const { error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (authError) {
          setError(authError.message);
          return;
        }
        // Login success
        login();
        migrateFromLocalStorage();
        setSuccess('登录成功！');
        setTimeout(() => onClose(), 800);
      }
    } catch {
      setError('操作失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-gray-900 p-8">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-white/40 transition-colors hover:bg-white/10 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20">
            <User className="h-6 w-6 text-blue-400" />
          </div>
          <h2 className="text-xl font-bold text-white">
            {mode === 'login' ? '登录' : '注册'}
          </h2>
          <p className="mt-1 text-sm text-white/40">
            {mode === 'login' ? '登录以同步收藏和评分到云端' : '创建账号开始使用'}
          </p>
        </div>

        {!isSupabaseConfigured && (
          <div className="mb-4 flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
            <div className="text-xs text-amber-400/80">
              <p className="font-medium">Supabase 未连接</p>
              <p className="mt-1 text-amber-400/50">请在项目根目录创建 <code className="rounded bg-amber-500/10 px-1">.env.local</code> 并填入：</p>
              <pre className="mt-2 rounded-lg bg-black/30 p-2 text-[11px] text-amber-300/60 overflow-x-auto">{'NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co\nNEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...'}</pre>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="邮箱"
                required
                className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-4 text-sm text-white outline-none placeholder:text-white/30 focus:border-blue-500/50"
              />
            </div>
          </div>

          <div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="密码（至少6位）"
                required
                minLength={6}
                className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-4 text-sm text-white outline-none placeholder:text-white/30 focus:border-blue-500/50"
              />
            </div>
          </div>

          {error && (
            <p className="rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400">{error}</p>
          )}

          {success && (
            <p className="rounded-lg bg-emerald-500/10 px-3 py-2 text-xs text-emerald-400">{success}</p>
          )}

          <button
            type="submit"
            disabled={loading || !isSupabaseConfigured}
            className={cn(
              'w-full rounded-xl py-3 text-sm font-medium text-white transition-colors',
              isSupabaseConfigured
                ? 'bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed'
                : 'bg-white/10 cursor-not-allowed text-white/30'
            )}
          >
            {loading ? (
              <Loader2 className="mx-auto h-4 w-4 animate-spin" />
            ) : mode === 'login' ? '登录' : '注册'}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-white/30">
          {mode === 'login' ? (
            <>没有账号？{' '}
              <button onClick={() => { setMode('register'); setError(''); setSuccess(''); }} className="text-blue-400 hover:underline">
                注册
              </button>
            </>
          ) : (
            <>已有账号？{' '}
              <button onClick={() => { setMode('login'); setError(''); setSuccess(''); }} className="text-blue-400 hover:underline">
                登录
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
