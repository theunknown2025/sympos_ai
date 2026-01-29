import { supabase, TABLES } from '../supabase';
import { Committee, FieldOfIntervention } from '../types';

const TABLE_NAME = TABLES.COMMITTEES;

/**
 * Save a new committee
 */
export const saveCommittee = async (
  userId: string,
  committee: Omit<Committee, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
): Promise<string> => {
  try {
    // Serialize fields of intervention for Supabase storage
    const insertData: any = {
      user_id: userId,
      name: committee.name.trim(),
      description: committee.description?.trim() || null,
      fields_of_intervention: JSON.stringify(committee.fieldsOfIntervention || []),
    };

    const { data, error } = await supabase
      .from(TABLE_NAME)
      .insert(insertData)
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    return data.id;
  } catch (error: any) {
    console.error('Error saving committee:', error);
    throw new Error(error.message || 'Failed to save committee');
  }
};

/**
 * Update an existing committee
 */
export const updateCommittee = async (
  committeeId: string,
  committee: Partial<Omit<Committee, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
): Promise<void> => {
  try {
    // Get existing committee
    const { data: existingCommittee, error: fetchError } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('id', committeeId)
      .single();
    
    if (fetchError || !existingCommittee) {
      throw new Error('Committee not found');
    }

    // Prepare update data
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };
    
    if (committee.name !== undefined) updateData.name = committee.name.trim();
    if (committee.description !== undefined) {
      updateData.description = committee.description?.trim() || null;
    }
    if (committee.fieldsOfIntervention !== undefined) {
      updateData.fields_of_intervention = JSON.stringify(committee.fieldsOfIntervention);
    }

    const { error } = await supabase
      .from(TABLE_NAME)
      .update(updateData)
      .eq('id', committeeId);
    
    if (error) {
      throw error;
    }
  } catch (error: any) {
    console.error('Error updating committee:', error);
    throw new Error(error.message || 'Failed to update committee');
  }
};

/**
 * Get all committees for a user
 */
export const getCommittees = async (userId: string): Promise<Committee[]> => {
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
    
    return data.map(doc => {
      // Deserialize fields of intervention from Supabase storage
      const fieldsOfIntervention: FieldOfIntervention[] = doc.fields_of_intervention 
        ? JSON.parse(doc.fields_of_intervention as string) 
        : [];
      
      return {
        id: doc.id,
        userId: doc.user_id,
        name: doc.name,
        description: doc.description || undefined,
        fieldsOfIntervention,
        createdAt: new Date(doc.created_at),
        updatedAt: new Date(doc.updated_at),
      } as Committee;
    });
  } catch (error: any) {
    console.error('Error getting committees:', error);
    throw new Error(error.message || 'Failed to get committees');
  }
};

/**
 * Get a single committee by ID
 */
export const getCommittee = async (committeeId: string): Promise<Committee | null> => {
  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('id', committeeId)
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
    
    // Deserialize fields of intervention from Supabase storage
    const fieldsOfIntervention: FieldOfIntervention[] = data.fields_of_intervention 
      ? JSON.parse(data.fields_of_intervention as string) 
      : [];
    
    return {
      id: data.id,
      userId: data.user_id,
      name: data.name,
      description: data.description || undefined,
      fieldsOfIntervention,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    } as Committee;
  } catch (error: any) {
    console.error('Error getting committee:', error);
    throw new Error(error.message || 'Failed to get committee');
  }
};

/**
 * Delete a committee
 */
export const deleteCommittee = async (committeeId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from(TABLE_NAME)
      .delete()
      .eq('id', committeeId);
    
    if (error) {
      throw error;
    }
  } catch (error: any) {
    console.error('Error deleting committee:', error);
    throw new Error(error.message || 'Failed to delete committee');
  }
};

