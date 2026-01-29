import { supabase, TABLES } from '../supabase';

const TABLE_NAME = 'projects';

export interface Task {
  id: string;
  description: string;
  responsables: string[]; // Array of personnel IDs or names
  priority: 'low' | 'medium' | 'high' | 'urgent';
  startDate?: string; // ISO date string
  endDate?: string; // ISO date string
  comment?: string;
}

export interface Axe {
  id: string;
  name: string;
  tasks: Task[];
}

export interface Project {
  id: string;
  userId: string;
  eventId: string;
  name: string;
  description?: string;
  axes: Axe[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProjectData {
  eventId?: string;
  name: string;
  description?: string;
  axes: Axe[];
}

/**
 * Create a new project
 */
export const createProject = async (
  userId: string,
  projectData: CreateProjectData
): Promise<string> => {
  try {
    const insertData: any = {
      user_id: userId,
      name: projectData.name,
      description: projectData.description || null,
      axes: JSON.stringify(projectData.axes || []),
    };

    // Only include event_id if provided
    if (projectData.eventId) {
      insertData.event_id = projectData.eventId;
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
    console.error('Error creating project:', error);
    throw new Error(error.message || 'Failed to create project');
  }
};

/**
 * Get all projects for a user
 */
export const getProjects = async (userId: string): Promise<Project[]> => {
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
      eventId: item.event_id,
      name: item.name,
      description: item.description,
      axes: item.axes ? JSON.parse(item.axes as string) : [],
      createdAt: new Date(item.created_at),
      updatedAt: new Date(item.updated_at),
    }));
  } catch (error: any) {
    console.error('Error getting projects:', error);
    throw error;
  }
};

/**
 * Get projects by event ID
 */
export const getProjectsByEvent = async (
  userId: string,
  eventId: string
): Promise<Project[]> => {
  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('user_id', userId)
      .eq('event_id', eventId)
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
      eventId: item.event_id,
      name: item.name,
      description: item.description,
      axes: item.axes ? JSON.parse(item.axes as string) : [],
      createdAt: new Date(item.created_at),
      updatedAt: new Date(item.updated_at),
    }));
  } catch (error: any) {
    console.error('Error getting projects by event:', error);
    throw error;
  }
};

/**
 * Get a single project by ID
 */
export const getProjectById = async (projectId: string): Promise<Project | null> => {
  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('id', projectId)
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
      eventId: data.event_id,
      name: data.name,
      description: data.description,
      axes: data.axes ? JSON.parse(data.axes as string) : [],
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  } catch (error: any) {
    console.error('Error getting project:', error);
    throw error;
  }
};

/**
 * Update a project
 */
export const updateProject = async (
  projectId: string,
  updates: Partial<Omit<Project, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
): Promise<void> => {
  try {
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.eventId !== undefined) updateData.event_id = updates.eventId;
    if (updates.axes !== undefined) updateData.axes = JSON.stringify(updates.axes);

    const { error } = await supabase
      .from(TABLE_NAME)
      .update(updateData)
      .eq('id', projectId);

    if (error) {
      throw error;
    }
  } catch (error: any) {
    console.error('Error updating project:', error);
    throw new Error(error.message || 'Failed to update project');
  }
};

/**
 * Delete a project
 */
export const deleteProject = async (projectId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from(TABLE_NAME)
      .delete()
      .eq('id', projectId);

    if (error) {
      throw error;
    }
  } catch (error: any) {
    console.error('Error deleting project:', error);
    throw new Error(error.message || 'Failed to delete project');
  }
};

