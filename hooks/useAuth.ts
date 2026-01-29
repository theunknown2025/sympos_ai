import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { User } from '@supabase/supabase-js';
import { SubscriptionRole } from '../types';

export const useAuth = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<SubscriptionRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const getUserRole = (user: User | null): SubscriptionRole | null => {
    if (!user) return null;
    
    // Get role from user metadata
    const role = user.user_metadata?.role as SubscriptionRole;
    
    // Validate role
    if (role === 'Organizer' || role === 'Participant') {
      return role;
    }
    
    // Default to Participant if no role is set (for backward compatibility)
    return 'Participant';
  };

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user ?? null;
        setCurrentUser(user);
        setUserRole(getUserRole(user));
      } catch (error) {
        console.error('Error getting session:', error);
        setCurrentUser(null);
        setUserRole(null);
      } finally {
        setIsLoading(false);
      }
    };

    getInitialSession();

    // Listen to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const user = session?.user ?? null;
        setCurrentUser(user);
        setUserRole(getUserRole(user));
        setIsLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const isOrganizer = userRole === 'Organizer';
  const isParticipant = userRole === 'Participant';

  return { currentUser, userRole, isOrganizer, isParticipant, isLoading };
};

