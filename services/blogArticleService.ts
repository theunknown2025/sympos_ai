import { supabase, TABLES, STORAGE_BUCKETS } from '../supabase';
import { BlogArticle } from '../types';

const TABLE_NAME = TABLES.BLOG_ARTICLES;

/**
 * Remove undefined values from an object recursively
 */
const removeUndefined = (obj: any): any => {
  if (obj === null || obj === undefined) {
    return null;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => removeUndefined(item));
  }
  
  if (typeof obj === 'object') {
    const cleaned: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = obj[key];
        if (value !== undefined) {
          cleaned[key] = removeUndefined(value);
        }
      }
    }
    return cleaned;
  }
  
  return obj;
};

/**
 * Generate a URL-friendly slug from a title
 */
const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
};

/**
 * Save a new blog article
 */
export const saveBlogArticle = async (
  userId: string,
  article: Omit<BlogArticle, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
): Promise<string> => {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }
    
    if (!article.title || !article.title.trim()) {
      throw new Error('Article title is required');
    }
    
    if (!article.content || !article.content.trim()) {
      throw new Error('Article content is required');
    }
    
    const cleanedArticle = removeUndefined(article);
    
    // Generate slug if not provided
    const slug = cleanedArticle.slug?.trim() || generateSlug(cleanedArticle.title);
    
    // Check if slug already exists for this user
    const { data: existing } = await supabase
      .from(TABLE_NAME)
      .select('id')
      .eq('user_id', userId)
      .eq('slug', slug)
      .single();
    
    if (existing) {
      throw new Error('An article with this slug already exists. Please use a different title.');
    }
    
    const insertData: any = {
      user_id: userId,
      title: cleanedArticle.title.trim(),
      slug: slug,
      content: cleanedArticle.content,
      status: cleanedArticle.status || 'draft',
    };
    
    if (cleanedArticle.excerpt !== undefined) {
      insertData.excerpt = cleanedArticle.excerpt.trim();
    }
    if (cleanedArticle.featuredImage !== undefined) {
      insertData.featured_image = cleanedArticle.featuredImage;
    }
    if (cleanedArticle.publishedAt !== undefined) {
      insertData.published_at = cleanedArticle.publishedAt.toISOString();
    }
    if (cleanedArticle.tags !== undefined) {
      insertData.tags = JSON.stringify(cleanedArticle.tags);
    }
    if (cleanedArticle.authorName !== undefined) {
      insertData.author_name = cleanedArticle.authorName.trim();
    }
    if (cleanedArticle.metaDescription !== undefined) {
      insertData.meta_description = cleanedArticle.metaDescription.trim();
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
    console.error('Error saving blog article:', error);
    throw new Error(error.message || 'Failed to save blog article');
  }
};

/**
 * Update an existing blog article
 */
export const updateBlogArticle = async (
  articleId: string,
  article: Partial<Omit<BlogArticle, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
): Promise<void> => {
  try {
    if (!articleId) {
      throw new Error('Article ID is required');
    }
    
    const cleanedArticle = removeUndefined(article);
    
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };
    
    if (cleanedArticle.title !== undefined) {
      updateData.title = cleanedArticle.title.trim();
      // Regenerate slug if title changed
      if (!cleanedArticle.slug) {
        updateData.slug = generateSlug(cleanedArticle.title);
      }
    }
    if (cleanedArticle.slug !== undefined) {
      updateData.slug = cleanedArticle.slug.trim();
    }
    if (cleanedArticle.excerpt !== undefined) {
      updateData.excerpt = cleanedArticle.excerpt.trim();
    }
    if (cleanedArticle.content !== undefined) {
      updateData.content = cleanedArticle.content;
    }
    if (cleanedArticle.featuredImage !== undefined) {
      updateData.featured_image = cleanedArticle.featuredImage;
    }
    if (cleanedArticle.status !== undefined) {
      updateData.status = cleanedArticle.status;
    }
    if (cleanedArticle.publishedAt !== undefined) {
      updateData.published_at = cleanedArticle.publishedAt.toISOString();
    } else if (cleanedArticle.status === 'published' && cleanedArticle.publishedAt === null) {
      // Auto-set published_at when status changes to published
      const { data: existing } = await supabase
        .from(TABLE_NAME)
        .select('published_at')
        .eq('id', articleId)
        .single();
      
      if (existing && !existing.published_at) {
        updateData.published_at = new Date().toISOString();
      }
    }
    if (cleanedArticle.tags !== undefined) {
      updateData.tags = JSON.stringify(cleanedArticle.tags);
    }
    if (cleanedArticle.authorName !== undefined) {
      updateData.author_name = cleanedArticle.authorName.trim();
    }
    if (cleanedArticle.metaDescription !== undefined) {
      updateData.meta_description = cleanedArticle.metaDescription.trim();
    }
    
    const { error } = await supabase
      .from(TABLE_NAME)
      .update(updateData)
      .eq('id', articleId);
    
    if (error) {
      throw error;
    }
  } catch (error: any) {
    console.error('Error updating blog article:', error);
    throw new Error(error.message || 'Failed to update blog article');
  }
};

/**
 * Get a single blog article by ID
 */
export const getBlogArticle = async (articleId: string): Promise<BlogArticle | null> => {
  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('id', articleId)
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
    
    // Deserialize JSON fields
    const tags = typeof data.tags === 'string' 
      ? JSON.parse(data.tags) 
      : (data.tags || []);
    
    return {
      id: data.id,
      userId: data.user_id,
      title: data.title,
      slug: data.slug,
      excerpt: data.excerpt || undefined,
      content: data.content,
      featuredImage: data.featured_image || undefined,
      status: data.status,
      publishedAt: data.published_at ? new Date(data.published_at) : undefined,
      tags: tags.length > 0 ? tags : undefined,
      authorName: data.author_name || undefined,
      metaDescription: data.meta_description || undefined,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  } catch (error: any) {
    console.error('Error getting blog article:', error);
    throw error;
  }
};

/**
 * Get all blog articles for a user
 */
export const getUserBlogArticles = async (userId: string): Promise<BlogArticle[]> => {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }
    
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
    
    return data.map(doc => {
      // Deserialize JSON fields
      const tags = typeof doc.tags === 'string' 
        ? JSON.parse(doc.tags) 
        : (doc.tags || []);
      
      return {
        id: doc.id,
        userId: doc.user_id,
        title: doc.title,
        slug: doc.slug,
        excerpt: doc.excerpt || undefined,
        content: doc.content,
        featuredImage: doc.featured_image || undefined,
        status: doc.status,
        publishedAt: doc.published_at ? new Date(doc.published_at) : undefined,
        tags: tags.length > 0 ? tags : undefined,
        authorName: doc.author_name || undefined,
        metaDescription: doc.meta_description || undefined,
        createdAt: new Date(doc.created_at),
        updatedAt: new Date(doc.updated_at),
      };
    });
  } catch (error: any) {
    console.error('Error getting user blog articles:', error);
    throw new Error(error.message || 'Failed to load blog articles');
  }
};

/**
 * Delete a blog article
 */
export const deleteBlogArticle = async (articleId: string): Promise<void> => {
  try {
    if (!articleId) {
      throw new Error('Article ID is required');
    }
    
    // Get article to delete featured image if exists
    const article = await getBlogArticle(articleId);
    if (article && article.featuredImage) {
      try {
        // Extract file path from URL if it's a full URL
        let filePath = article.featuredImage;
        if (article.featuredImage.includes(STORAGE_BUCKETS.MEDIA)) {
          const urlMatch = article.featuredImage.match(new RegExp(`${STORAGE_BUCKETS.MEDIA}/(.+)`));
          if (urlMatch && urlMatch[1]) {
            filePath = urlMatch[1].split('?')[0]; // Remove query params
          }
        }
        
        await supabase.storage
          .from(STORAGE_BUCKETS.MEDIA)
          .remove([filePath]);
      } catch (err) {
        console.error('Error deleting featured image:', err);
        // Continue even if image deletion fails
      }
    }
    
    const { error } = await supabase
      .from(TABLE_NAME)
      .delete()
      .eq('id', articleId);
    
    if (error) {
      throw error;
    }
  } catch (error: any) {
    console.error('Error deleting blog article:', error);
    throw new Error(error.message || 'Failed to delete blog article');
  }
};

/**
 * Upload a featured image for a blog article
 */
export const uploadBlogArticleImage = async (
  userId: string,
  file: File
): Promise<string> => {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }
    
    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `blog/${userId}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    
    // Upload the file to Supabase Storage
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKETS.MEDIA)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (error) {
      throw error;
    }
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from(STORAGE_BUCKETS.MEDIA)
      .getPublicUrl(data.path);
    
    return urlData.publicUrl;
  } catch (error: any) {
    console.error('Error uploading blog article image:', error);
    throw new Error(error.message || 'Failed to upload image');
  }
};
