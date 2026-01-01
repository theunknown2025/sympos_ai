import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { User } from '@supabase/supabase-js';

export const useAuth = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
      setCurrentUser(session?.user ?? null);
      } catch (error) {
        console.error('Error getting session:', error);
        setCurrentUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    getInitialSession();

    // Listen to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setCurrentUser(session?.user ?? null);
        setIsLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { currentUser, isLoading };
};

