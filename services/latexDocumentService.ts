import { supabase } from '../supabase';

export interface LatexDocument {
  id: string;
  userId: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Fetch all LaTeX documents for the current user
 */
export const fetchLatexDocuments = async (userId: string): Promise<LatexDocument[]> => {
  try {
    const { data, error } = await supabase
      .from('latex_documents')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching LaTeX documents:', error);
      throw error;
    }

    return (data || []).map((doc) => ({
      id: doc.id,
      userId: doc.user_id,
      title: doc.title,
      content: doc.content || '',
      createdAt: new Date(doc.created_at),
      updatedAt: new Date(doc.updated_at),
    }));
  } catch (error: any) {
    console.error('Error fetching LaTeX documents:', error);
    throw new Error(error.message || 'Failed to fetch LaTeX documents');
  }
};

/**
 * Fetch a single LaTeX document by ID
 */
export const fetchLatexDocument = async (documentId: string): Promise<LatexDocument | null> => {
  try {
    const { data, error } = await supabase
      .from('latex_documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (error) {
      console.error('Error fetching LaTeX document:', error);
      throw error;
    }

    if (!data) {
      return null;
    }

    return {
      id: data.id,
      userId: data.user_id,
      title: data.title,
      content: data.content || '',
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  } catch (error: any) {
    console.error('Error fetching LaTeX document:', error);
    throw new Error(error.message || 'Failed to fetch LaTeX document');
  }
};

/**
 * Save a new LaTeX document
 */
export const saveLatexDocument = async (
  userId: string,
  title: string,
  content: string
): Promise<LatexDocument> => {
  try {
    const { data, error } = await supabase
      .from('latex_documents')
      .insert({
        user_id: userId,
        title: title.trim(),
        content: content || '',
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving LaTeX document:', error);
      throw error;
    }

    return {
      id: data.id,
      userId: data.user_id,
      title: data.title,
      content: data.content || '',
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  } catch (error: any) {
    console.error('Error saving LaTeX document:', error);
    throw new Error(error.message || 'Failed to save LaTeX document');
  }
};

/**
 * Update an existing LaTeX document
 */
export const updateLatexDocument = async (
  documentId: string,
  title: string,
  content: string
): Promise<LatexDocument> => {
  try {
    const { data, error } = await supabase
      .from('latex_documents')
      .update({
        title: title.trim(),
        content: content || '',
      })
      .eq('id', documentId)
      .select()
      .single();

    if (error) {
      console.error('Error updating LaTeX document:', error);
      throw error;
    }

    return {
      id: data.id,
      userId: data.user_id,
      title: data.title,
      content: data.content || '',
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  } catch (error: any) {
    console.error('Error updating LaTeX document:', error);
    throw new Error(error.message || 'Failed to update LaTeX document');
  }
};

/**
 * Delete a LaTeX document
 */
export const deleteLatexDocument = async (documentId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('latex_documents')
      .delete()
      .eq('id', documentId);

    if (error) {
      console.error('Error deleting LaTeX document:', error);
      throw error;
    }
  } catch (error: any) {
    console.error('Error deleting LaTeX document:', error);
    throw new Error(error.message || 'Failed to delete LaTeX document');
  }
};
