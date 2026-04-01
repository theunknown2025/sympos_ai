import { supabase, TABLES, STORAGE_BUCKETS } from '../supabase';
import { PresenterEvent, PresenterPanel, PresenterSpeaker, PanelSpeaker } from '../types';

const EVENTS_TABLE = TABLES.PRESENTER_EVENTS;
const PANELS_TABLE = TABLES.PRESENTER_PANELS;
const SPEAKERS_TABLE = TABLES.PRESENTER_SPEAKERS;

/**
 * Event Management
 */
export const savePresenterEvent = async (
  userId: string,
  event: Omit<PresenterEvent, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
): Promise<string> => {
  try {
    const { data, error } = await supabase
      .from(EVENTS_TABLE)
      .insert({
        user_id: userId,
        name: event.name,
        place: event.place || null,
        date: event.date ? (event.date instanceof Date ? event.date.toISOString().split('T')[0] : event.date) : null,
        link: event.link || null,
      })
      .select()
      .single();

    if (error) throw error;
    return data.id;
  } catch (error: any) {
    console.error('Error saving presenter event:', error);
    throw new Error(error.message || 'Failed to save event');
  }
};

export const updatePresenterEvent = async (
  eventId: string,
  event: Partial<Omit<PresenterEvent, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
): Promise<void> => {
  try {
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (event.name !== undefined) updateData.name = event.name;
    if (event.place !== undefined) updateData.place = event.place || null;
    if (event.date !== undefined) {
      updateData.date = event.date 
        ? (event.date instanceof Date ? event.date.toISOString().split('T')[0] : event.date)
        : null;
    }
    if (event.link !== undefined) updateData.link = event.link || null;

    const { error } = await supabase
      .from(EVENTS_TABLE)
      .update(updateData)
      .eq('id', eventId);

    if (error) throw error;
  } catch (error: any) {
    console.error('Error updating presenter event:', error);
    throw new Error(error.message || 'Failed to update event');
  }
};

export const getPresenterEvent = async (eventId: string): Promise<PresenterEvent | null> => {
  try {
    const { data, error } = await supabase
      .from(EVENTS_TABLE)
      .select('*')
      .eq('id', eventId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    if (!data) return null;

    return {
      id: data.id,
      userId: data.user_id,
      name: data.name,
      place: data.place || undefined,
      date: data.date ? new Date(data.date) : undefined,
      link: data.link || undefined,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  } catch (error: any) {
    console.error('Error getting presenter event:', error);
    throw error;
  }
};

export const getUserPresenterEvents = async (userId: string): Promise<PresenterEvent[]> => {
  try {
    const { data, error } = await supabase
      .from(EVENTS_TABLE)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(item => ({
      id: item.id,
      userId: item.user_id,
      name: item.name,
      place: item.place || undefined,
      date: item.date ? new Date(item.date) : undefined,
      link: item.link || undefined,
      createdAt: new Date(item.created_at),
      updatedAt: new Date(item.updated_at),
    }));
  } catch (error: any) {
    console.error('Error getting user presenter events:', error);
    throw new Error(error.message || 'Failed to load events');
  }
};

export const deletePresenterEvent = async (eventId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from(EVENTS_TABLE)
      .delete()
      .eq('id', eventId);

    if (error) throw error;
  } catch (error: any) {
    console.error('Error deleting presenter event:', error);
    throw new Error(error.message || 'Failed to delete event');
  }
};

/**
 * Panel Management
 */
export const savePresenterPanel = async (
  userId: string,
  panel: Omit<PresenterPanel, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
): Promise<string> => {
  try {
    const { data, error } = await supabase
      .from(PANELS_TABLE)
      .insert({
        user_id: userId,
        event_id: panel.eventId,
        title: panel.title,
        moderator_name: panel.moderatorName || null,
        moderator_title: panel.moderatorTitle || null,
        moderator_entity: panel.moderatorEntity || null,
        moderator_picture: panel.moderatorPicture || null,
        speakers: JSON.stringify(panel.speakers || []),
        display_order: panel.displayOrder || 0,
      })
      .select()
      .single();

    if (error) throw error;
    return data.id;
  } catch (error: any) {
    console.error('Error saving presenter panel:', error);
    throw new Error(error.message || 'Failed to save panel');
  }
};

export const updatePresenterPanel = async (
  panelId: string,
  panel: Partial<Omit<PresenterPanel, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
): Promise<void> => {
  try {
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (panel.title !== undefined) updateData.title = panel.title;
    if (panel.moderatorName !== undefined) updateData.moderator_name = panel.moderatorName || null;
    if (panel.moderatorTitle !== undefined) updateData.moderator_title = panel.moderatorTitle || null;
    if (panel.moderatorEntity !== undefined) updateData.moderator_entity = panel.moderatorEntity || null;
    if (panel.moderatorPicture !== undefined) updateData.moderator_picture = panel.moderatorPicture || null;
    if (panel.speakers !== undefined) updateData.speakers = JSON.stringify(panel.speakers);
    if (panel.displayOrder !== undefined) updateData.display_order = panel.displayOrder;

    const { error } = await supabase
      .from(PANELS_TABLE)
      .update(updateData)
      .eq('id', panelId);

    if (error) throw error;
  } catch (error: any) {
    console.error('Error updating presenter panel:', error);
    throw new Error(error.message || 'Failed to update panel');
  }
};

export const getPresenterPanel = async (panelId: string): Promise<PresenterPanel | null> => {
  try {
    const { data, error } = await supabase
      .from(PANELS_TABLE)
      .select('*')
      .eq('id', panelId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    if (!data) return null;

    const speakers = typeof data.speakers === 'string' 
      ? JSON.parse(data.speakers) 
      : (data.speakers || []);

    return {
      id: data.id,
      userId: data.user_id,
      eventId: data.event_id,
      title: data.title,
      moderatorName: data.moderator_name || undefined,
      moderatorTitle: data.moderator_title || undefined,
      moderatorEntity: data.moderator_entity || undefined,
      moderatorPicture: data.moderator_picture || undefined,
      speakers: speakers,
      displayOrder: data.display_order || 0,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  } catch (error: any) {
    console.error('Error getting presenter panel:', error);
    throw error;
  }
};

export const getEventPanels = async (eventId: string): Promise<PresenterPanel[]> => {
  try {
    const { data, error } = await supabase
      .from(PANELS_TABLE)
      .select('*')
      .eq('event_id', eventId)
      .order('display_order', { ascending: true });

    if (error) throw error;

    return (data || []).map(item => {
      const speakers = typeof item.speakers === 'string' 
        ? JSON.parse(item.speakers) 
        : (item.speakers || []);

      return {
        id: item.id,
        userId: item.user_id,
        eventId: item.event_id,
        title: item.title,
        moderatorName: item.moderator_name || undefined,
        moderatorTitle: item.moderator_title || undefined,
        moderatorEntity: item.moderator_entity || undefined,
        moderatorPicture: item.moderator_picture || undefined,
        speakers: speakers,
        displayOrder: item.display_order || 0,
        createdAt: new Date(item.created_at),
        updatedAt: new Date(item.updated_at),
      };
    });
  } catch (error: any) {
    console.error('Error getting event panels:', error);
    throw new Error(error.message || 'Failed to load panels');
  }
};

export const deletePresenterPanel = async (panelId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from(PANELS_TABLE)
      .delete()
      .eq('id', panelId);

    if (error) throw error;
  } catch (error: any) {
    console.error('Error deleting presenter panel:', error);
    throw new Error(error.message || 'Failed to delete panel');
  }
};

/**
 * Speaker Management
 */
export const savePresenterSpeaker = async (
  userId: string,
  speaker: Omit<PresenterSpeaker, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
): Promise<string> => {
  try {
    const { data, error } = await supabase
      .from(SPEAKERS_TABLE)
      .insert({
        user_id: userId,
        event_id: speaker.eventId,
        name: speaker.name,
        title: speaker.title || null,
        entity: speaker.entity || null,
        picture: speaker.picture || null,
        intervention_title: speaker.interventionTitle || null,
        speaker_info: speaker.speakerInfo || null,
        display_order: speaker.displayOrder || 0,
      })
      .select()
      .single();

    if (error) throw error;
    return data.id;
  } catch (error: any) {
    console.error('Error saving presenter speaker:', error);
    throw new Error(error.message || 'Failed to save speaker');
  }
};

export const updatePresenterSpeaker = async (
  speakerId: string,
  speaker: Partial<Omit<PresenterSpeaker, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
): Promise<void> => {
  try {
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (speaker.name !== undefined) updateData.name = speaker.name;
    if (speaker.title !== undefined) updateData.title = speaker.title || null;
    if (speaker.entity !== undefined) updateData.entity = speaker.entity || null;
    if (speaker.picture !== undefined) updateData.picture = speaker.picture || null;
    if (speaker.interventionTitle !== undefined) updateData.intervention_title = speaker.interventionTitle || null;
    if (speaker.speakerInfo !== undefined) updateData.speaker_info = speaker.speakerInfo || null;
    if (speaker.displayOrder !== undefined) updateData.display_order = speaker.displayOrder;

    const { error } = await supabase
      .from(SPEAKERS_TABLE)
      .update(updateData)
      .eq('id', speakerId);

    if (error) throw error;
  } catch (error: any) {
    console.error('Error updating presenter speaker:', error);
    throw new Error(error.message || 'Failed to update speaker');
  }
};

export const getPresenterSpeaker = async (speakerId: string): Promise<PresenterSpeaker | null> => {
  try {
    const { data, error } = await supabase
      .from(SPEAKERS_TABLE)
      .select('*')
      .eq('id', speakerId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    if (!data) return null;

    return {
      id: data.id,
      userId: data.user_id,
      eventId: data.event_id,
      name: data.name,
      title: data.title || undefined,
      entity: data.entity || undefined,
      picture: data.picture || undefined,
      interventionTitle: data.intervention_title || undefined,
      speakerInfo: data.speaker_info || undefined,
      displayOrder: data.display_order || 0,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  } catch (error: any) {
    console.error('Error getting presenter speaker:', error);
    throw error;
  }
};

export const getEventSpeakers = async (eventId: string): Promise<PresenterSpeaker[]> => {
  try {
    const { data, error } = await supabase
      .from(SPEAKERS_TABLE)
      .select('*')
      .eq('event_id', eventId)
      .order('display_order', { ascending: true });

    if (error) throw error;

    return (data || []).map(item => ({
      id: item.id,
      userId: item.user_id,
      eventId: item.event_id,
      name: item.name,
      title: item.title || undefined,
      entity: item.entity || undefined,
      picture: item.picture || undefined,
      interventionTitle: item.intervention_title || undefined,
      speakerInfo: item.speaker_info || undefined,
      displayOrder: item.display_order || 0,
      createdAt: new Date(item.created_at),
      updatedAt: new Date(item.updated_at),
    }));
  } catch (error: any) {
    console.error('Error getting event speakers:', error);
    throw new Error(error.message || 'Failed to load speakers');
  }
};

export const deletePresenterSpeaker = async (speakerId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from(SPEAKERS_TABLE)
      .delete()
      .eq('id', speakerId);

    if (error) throw error;
  } catch (error: any) {
    console.error('Error deleting presenter speaker:', error);
    throw new Error(error.message || 'Failed to delete speaker');
  }
};

/**
 * Image Upload
 */
export const uploadPresenterImage = async (
  userId: string,
  file: File
): Promise<string> => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `presenter/${userId}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKETS.MEDIA)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from(STORAGE_BUCKETS.MEDIA)
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  } catch (error: any) {
    console.error('Error uploading presenter image:', error);
    throw new Error(error.message || 'Failed to upload image');
  }
};
