import { supabase, TABLES } from '../supabase';

const TABLE_NAME = 'personnel';

export interface Personnel {
  id: string;
  userId: string;
  authUserId?: string; // Reference to auth user if created
  fullName: string;
  phoneNumber?: string;
  email: string;
  role: string;
  roleDescription?: string;
  imageUrl?: string;
  login?: string;
  password?: string; // Password (only for manually created personnel, null for participants)
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePersonnelData {
  fullName: string;
  phoneNumber?: string;
  email: string;
  role: string;
  roleDescription?: string;
  imageUrl?: string;
  login: string;
  password: string;
}

export interface CreatePersonnelFromParticipantData {
  fullName: string;
  phoneNumber?: string;
  email: string;
  role: string;
  roleDescription?: string;
}

/**
 * Create a new personnel member and auth user
 */
export const createPersonnel = async (
  userId: string,
  personnelData: CreatePersonnelData
): Promise<string> => {
  try {
    // Check if email already exists in personnel table
    const { data: existingPersonnel } = await supabase
      .from(TABLE_NAME)
      .select('id')
      .eq('email', personnelData.email)
      .limit(1);

    if (existingPersonnel && existingPersonnel.length > 0) {
      throw new Error('A personnel member with this email already exists');
    }

    // Note: Creating auth users with admin privileges requires server-side code
    // For now, we'll use signUp which works client-side
    // In production, you should create an edge function to handle this with admin.createUser
    
    // Create auth user with role 'assistant'
    // Note: signUp requires email confirmation by default
    // To auto-confirm, you'll need to either:
    // 1. Use an edge function with admin.createUser (recommended)
    // 2. Configure Supabase to auto-confirm emails
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: personnelData.email,
      password: personnelData.password,
      options: {
        data: {
          role: 'assistant',
          fullName: personnelData.fullName,
        },
        emailRedirectTo: undefined, // No redirect needed for auto-confirmed users
      },
    });

    if (authError) {
      // Check if user already exists
      if (authError.message?.includes('already registered') || authError.message?.includes('already exists')) {
        throw new Error('An account with this email already exists');
      }
      throw new Error(`Failed to create auth user: ${authError.message}`);
    }

    if (!authData.user) {
      throw new Error('Failed to create auth user');
    }
    
    // Note: The user will need to confirm their email unless you have auto-confirm enabled
    // or use an edge function with admin.createUser

    // Create personnel record
    // Note: We set auth_user_id to null because:
    // 1. Client-side signUp creates the user but it might not be immediately available in auth.users
    // 2. RLS policies might prevent us from seeing the user immediately
    // 3. The auth user is created successfully, but we can't reliably link it client-side
    // 4. In production, use an edge function with admin.createUser to properly link the auth user
    // The personnel record will be created without the auth_user_id link, but the auth account exists
    const insertData: any = {
      user_id: userId,
      full_name: personnelData.fullName,
      email: personnelData.email,
      role: personnelData.role,
      login: personnelData.login || personnelData.email,
      // auth_user_id is omitted (will default to NULL)
      // The auth user was created via signUp, but we can't reliably link it client-side
    };
    
    // Save password for manually created personnel
    // Note: In production, consider encrypting passwords before storing
    insertData.password = personnelData.password;
    
    // Only include optional fields if they have values
    if (personnelData.phoneNumber) {
      insertData.phone_number = personnelData.phoneNumber;
    }
    if (personnelData.roleDescription) {
      insertData.role_description = personnelData.roleDescription;
    }
    if (personnelData.imageUrl) {
      insertData.image_url = personnelData.imageUrl;
    }

    const { data, error } = await supabase
      .from(TABLE_NAME)
      .insert(insertData)
      .select()
      .single();

    if (error) {
      // If personnel creation fails, we can't delete the auth user client-side
      // (admin.deleteUser requires server-side access)
      // The auth user will remain but won't be linked to personnel
      throw error;
    }

    return data.id;
  } catch (error: any) {
    console.error('Error creating personnel:', error);
    throw new Error(error.message || 'Failed to create personnel');
  }
};

/**
 * Create a new personnel member from an existing participant
 * This does NOT create an auth user since the participant already has one
 * Note: auth_user_id will be null since we can't access admin APIs client-side
 * In production, use an edge function to link the auth user if needed
 */
export const createPersonnelFromParticipant = async (
  userId: string,
  personnelData: CreatePersonnelFromParticipantData
): Promise<string> => {
  try {
    // Check if email already exists in personnel table
    const { data: existingPersonnel } = await supabase
      .from(TABLE_NAME)
      .select('id')
      .eq('email', personnelData.email)
      .limit(1);

    if (existingPersonnel && existingPersonnel.length > 0) {
      throw new Error('A personnel member with this email already exists');
    }

    // Create personnel record (without creating new auth user)
    // auth_user_id is set to null - participant already has an account
    // In production, use an edge function to link the auth user if needed
    const insertData: any = {
      user_id: userId,
      full_name: personnelData.fullName,
      email: personnelData.email,
      role: personnelData.role,
      login: personnelData.email, // Use email as login
    };
    
    // Only include fields that have values (to avoid inserting empty strings)
    if (personnelData.phoneNumber) {
      insertData.phone_number = personnelData.phoneNumber;
    }
    if (personnelData.roleDescription) {
      insertData.role_description = personnelData.roleDescription;
    }
    // Explicitly set auth_user_id to null (or omit it if the constraint doesn't allow null)
    // If the constraint requires a value, we'll need to find the auth user first
    // For now, we'll omit it and let the database use the default (NULL)
    
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .insert(insertData)
      .select()
      .single();

    if (error) {
      // Provide more detailed error message
      if (error.code === '23503') { // Foreign key violation
        console.error('Foreign key constraint violation:', error);
        throw new Error('Database constraint error. Please ensure the auth_user_id constraint allows NULL values. Run the fix script: scripts/fix-personnel-auth-user-id-constraint.sql');
      }
      throw error;
    }

    return data.id;
  } catch (error: any) {
    console.error('Error creating personnel from participant:', error);
    if (error.message) {
      throw error;
    }
    throw new Error(error.message || 'Failed to create personnel from participant');
  }
};

/**
 * Get all personnel for a user
 */
export const getPersonnel = async (userId: string): Promise<Personnel[]> => {
  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    if (!data) {
      return [];
    }

    return data.map((item) => ({
      id: item.id,
      userId: item.user_id,
      authUserId: item.auth_user_id,
      fullName: item.full_name,
      phoneNumber: item.phone_number,
      email: item.email,
      role: item.role,
      roleDescription: item.role_description,
      imageUrl: item.image_url,
      login: item.login,
      password: item.password || undefined, // Password (only for manually created)
      createdAt: new Date(item.created_at),
      updatedAt: new Date(item.updated_at),
    }));
  } catch (error: any) {
    console.error('Error getting personnel:', error);
    throw error;
  }
};

/**
 * Get a single personnel member by ID
 */
export const getPersonnelById = async (personnelId: string): Promise<Personnel | null> => {
  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('id', personnelId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }

    if (!data) {
      return null;
    }

    return {
      id: data.id,
      userId: data.user_id,
      authUserId: data.auth_user_id,
      fullName: data.full_name,
      phoneNumber: data.phone_number,
      email: data.email,
      role: data.role,
      roleDescription: data.role_description,
      imageUrl: data.image_url,
      login: data.login,
      password: data.password || undefined, // Password (only for manually created)
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  } catch (error: any) {
    console.error('Error getting personnel:', error);
    throw error;
  }
};

/**
 * Update a personnel member
 */
export const updatePersonnel = async (
  personnelId: string,
  updates: Partial<Omit<Personnel, 'id' | 'userId' | 'authUserId' | 'createdAt' | 'updatedAt'>>
): Promise<void> => {
  try {
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (updates.fullName !== undefined) updateData.full_name = updates.fullName;
    if (updates.phoneNumber !== undefined) updateData.phone_number = updates.phoneNumber;
    if (updates.email !== undefined) updateData.email = updates.email;
    if (updates.role !== undefined) updateData.role = updates.role;
    if (updates.roleDescription !== undefined) updateData.role_description = updates.roleDescription;
    if (updates.imageUrl !== undefined) updateData.image_url = updates.imageUrl;
    if (updates.login !== undefined) updateData.login = updates.login;
    if (updates.password !== undefined) updateData.password = updates.password; // Update password if provided

    // If email is being updated, check for duplicates
    if (updates.email) {
      const { data: existingPersonnel } = await supabase
        .from(TABLE_NAME)
        .select('id')
        .eq('email', updates.email)
        .limit(1);

      const duplicate = existingPersonnel?.find((p) => p.id !== personnelId);
      if (duplicate) {
        throw new Error('A personnel member with this email already exists');
      }
    }

    const { error } = await supabase
      .from(TABLE_NAME)
      .update(updateData)
      .eq('id', personnelId);

    if (error) {
      throw error;
    }

    // Note: Updating auth user email/metadata requires admin privileges
    // For now, we'll skip auth user updates from client-side
    // In production, create an edge function to handle this with admin.updateUserById
    // The personnel record is updated, but auth user metadata won't be updated client-side
  } catch (error: any) {
    console.error('Error updating personnel:', error);
    throw new Error(error.message || 'Failed to update personnel');
  }
};

/**
 * Delete a personnel member
 */
export const deletePersonnel = async (personnelId: string): Promise<void> => {
  try {
    // Get personnel to check if there's an auth user
    const personnel = await getPersonnelById(personnelId);
    
    if (!personnel) {
      throw new Error('Personnel member not found');
    }

    // Delete from personnel table (auth user will be deleted via CASCADE or SET NULL)
    const { error } = await supabase
      .from(TABLE_NAME)
      .delete()
      .eq('id', personnelId);

    if (error) {
      throw error;
    }

    // Note: Deleting auth users requires admin privileges (server-side)
    // The personnel record is deleted, but the auth user remains
    // In production, create an edge function to handle auth user deletion if needed
    // For now, auth users are kept for audit purposes
  } catch (error: any) {
    console.error('Error deleting personnel:', error);
    throw new Error(error.message || 'Failed to delete personnel');
  }
};

