import { supabase, TABLES } from '../supabase';
import type { ProgramCard, Venue, ProgramBuilderConfig } from '../components/Admin/Tools/ProgramBuilder/ProgramBuilder';

export interface SavedProgram {
  id: string;
  userId: string;
  title: string;
  description?: string;
  config: ProgramBuilderConfig;
  venues: Venue[];
  cards: ProgramCard[];
  createdAt: string;
  updatedAt: string;
}

const TABLE_NAME = TABLES.PROGRAMS;

/**
 * Save a new program
 */
export const saveProgram = async (
  userId: string,
  title: string,
  description: string | undefined,
  config: ProgramBuilderConfig,
  venues: Venue[],
  cards: ProgramCard[]
): Promise<string> => {
  try {
    if (!title || !title.trim()) {
      throw new Error('Program title is required');
    }

    if (!userId) {
      throw new Error('User ID is required');
    }

    // Serialize JSON fields for Supabase storage
    const insertData: any = {
      user_id: userId,
      title: title.trim(),
      config: JSON.stringify(config),
      venues: JSON.stringify(venues),
      cards: JSON.stringify(cards),
    };

    if (description) {
      insertData.description = description.trim();
    }

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
    console.error('Error saving program:', error);
    throw new Error(error.message || 'Failed to save program');
  }
};

/**
 * Update an existing program
 */
export const updateProgram = async (
  programId: string,
  title: string,
  description: string | undefined,
  config: ProgramBuilderConfig,
  venues: Venue[],
  cards: ProgramCard[]
): Promise<void> => {
  try {
    if (!title || !title.trim()) {
      throw new Error('Program title is required');
    }

    const updateData: any = {
      title: title.trim(),
      config: JSON.stringify(config),
      venues: JSON.stringify(venues),
      cards: JSON.stringify(cards),
      updated_at: new Date().toISOString(),
    };

    if (description !== undefined) {
      updateData.description = description ? description.trim() : null;
    }

    const { error } = await supabase
      .from(TABLE_NAME)
      .update(updateData)
      .eq('id', programId);

    if (error) {
      throw error;
    }
  } catch (error: any) {
    console.error('Error updating program:', error);
    throw new Error(error.message || 'Failed to update program');
  }
};

/**
 * Get all programs for a user
 */
export const getUserPrograms = async (userId: string): Promise<SavedProgram[]> => {
  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) {
      throw error;
    }

    if (!data) {
      return [];
    }

    // Parse JSON fields
    return data.map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      title: row.title,
      description: row.description,
      config: JSON.parse(row.config),
      venues: JSON.parse(row.venues),
      cards: JSON.parse(row.cards),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  } catch (error: any) {
    console.error('Error fetching programs:', error);
    throw new Error(error.message || 'Failed to fetch programs');
  }
};

/**
 * Get a single program by ID
 */
export const getProgramById = async (programId: string): Promise<SavedProgram | null> => {
  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('id', programId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return null;
      }
      throw error;
    }

    if (!data) {
      return null;
    }

    // Parse JSON fields
    return {
      id: data.id,
      userId: data.user_id,
      title: data.title,
      description: data.description,
      config: JSON.parse(data.config),
      venues: JSON.parse(data.venues),
      cards: JSON.parse(data.cards),
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  } catch (error: any) {
    console.error('Error fetching program:', error);
    throw new Error(error.message || 'Failed to fetch program');
  }
};

/**
 * Delete a program
 */
export const deleteProgram = async (programId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from(TABLE_NAME)
      .delete()
      .eq('id', programId);

    if (error) {
      throw error;
    }
  } catch (error: any) {
    console.error('Error deleting program:', error);
    throw new Error(error.message || 'Failed to delete program');
  }
};

