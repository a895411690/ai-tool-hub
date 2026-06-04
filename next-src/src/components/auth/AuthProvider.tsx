'use client';

import { useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useUserStore } from '@/stores/useUserStore';
import { migrateLocalDataToCloud, fetchCloudFavorites, fetchCloudRatings } from '@/lib/auth';

// This component wraps the app and keeps auth state in sync.
// Add it to layout.tsx alongside Navbar/Footer.
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { login, logout } = useUserStore();

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    // Check existing session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        login();
        syncCloudData(session.user.id);
      }
    });

    // Listen for auth changes (login/logout/token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          login();

          // On first login, migrate localStorage data to cloud
          const store = useUserStore.getState();
          if (store.favorites.length > 0 || Object.keys(store.ratings).length > 0) {
            await migrateLocalDataToCloud(
              session.user.id,
              store.favorites,
              store.ratings
            );
          }

          await syncCloudData(session.user.id);
        }

        if (event === 'SIGNED_OUT') {
          logout();
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [login, logout]);

  return <>{children}</>;
}

async function syncCloudData(userId: string) {
  try {
    const [cloudFavs, cloudRatings] = await Promise.all([
      fetchCloudFavorites(userId),
      fetchCloudRatings(userId),
    ]);

    const store = useUserStore.getState();
    // Merge: union of local + cloud favorites
    const mergedFavs = Array.from(new Set([...store.favorites, ...cloudFavs]));
    // Merge: cloud ratings take precedence
    const mergedRatings = { ...store.ratings, ...cloudRatings };

    useUserStore.setState({
      favorites: mergedFavs,
      ratings: mergedRatings,
      pendingMigration: false,
    });
  } catch (err) {
    console.error('Failed to sync cloud data:', err);
  }
}
