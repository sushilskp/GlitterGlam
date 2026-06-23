// Reviews & Video-reviews store. Persists to localStorage as the offline
// fallback and mirrors to Supabase when configured. Public users can submit
// reviews; only approved ones are shown to other visitors. Admin moderation
// happens in the Admin Panel.
import { Review, VideoReview } from '../types';
import { supabase, isSupabaseConfigured } from './supabaseClient';

const REVIEWS_KEY = 'gg_reviews';
const VIDEOS_KEY = 'gg_video_reviews';

// ---------- helpers ----------
function safeParse<T>(raw: string | null, fallback: T): T {
  try {
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function readLocal<T>(key: string): T[] {
  if (typeof window === 'undefined') return [];
  return safeParse<T[]>(window.localStorage.getItem(key), []);
}

function writeLocal<T>(key: string, list: T[]) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(list));
  } catch (err) {
    console.warn(`Local write failed for ${key}:`, err);
  }
}

// ---------- Reviews ----------
export async function loadReviews(): Promise<Review[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data) {
        const mapped: Review[] = data.map((r: any) => ({
          id: r.id,
          productSku: r.product_sku || '',
          name: r.name,
          rating: r.rating,
          comment: r.comment || '',
          location: r.location,
          approved: r.approved ?? true,
          verified: r.verified ?? true,
          createdAt: r.created_at,
        }));
        writeLocal(REVIEWS_KEY, mapped);
        return mapped;
      }
    } catch (err) {
      console.warn('Supabase reviews load failed, falling back to local:', err);
    }
  }
  return readLocal<Review>(REVIEWS_KEY);
}

export async function saveReview(review: Review): Promise<Review> {
  const all = readLocal<Review>(REVIEWS_KEY);
  const next = [review, ...all.filter(r => r.id !== review.id)];
  writeLocal(REVIEWS_KEY, next);
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .upsert({
          id: review.id,
          name: review.name,
          rating: review.rating,
          comment: review.comment,
          location: review.location,
          product_sku: review.productSku,
          approved: review.approved ?? true,
        })
        .select()
        .single();
      if (!error && data) {
        // Replace local with server record
        const synced: Review = {
          id: data.id,
          name: data.name,
          rating: data.rating,
          comment: data.comment || '',
          location: data.location,
          productSku: data.product_sku || '',
          approved: data.approved ?? true,
          verified: data.verified ?? true,
          createdAt: data.created_at,
        };
        const merged = readLocal<Review>(REVIEWS_KEY).map(r => (r.id === synced.id ? synced : r));
        writeLocal(REVIEWS_KEY, merged);
        return synced;
      }
    } catch (err) {
      console.warn('Supabase review save failed (kept local):', err);
    }
  }
  return review;
}

export async function deleteReview(reviewId: string): Promise<void> {
  const next = readLocal<Review>(REVIEWS_KEY).filter(r => r.id !== reviewId);
  writeLocal(REVIEWS_KEY, next);
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('reviews').delete().eq('id', reviewId);
    } catch (err) {
      console.warn('Supabase review delete failed (local removed):', err);
    }
  }
}

export function getReviewsForProduct(reviews: Review[], sku: string): Review[] {
  return reviews
    .filter(r => r.productSku === sku && (r.approved ?? true))
    .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
}

export function averageRating(reviews: Review[], sku: string): { avg: number; count: number } {
  const list = reviews.filter(r => r.productSku === sku);
  if (list.length === 0) return { avg: 0, count: 0 };
  const sum = list.reduce((acc, r) => acc + (r.rating || 0), 0);
  return { avg: sum / list.length, count: list.length };
}

// ---------- Video Reviews ----------
export async function loadVideoReviews(): Promise<VideoReview[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('video_reviews')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data) {
        const mapped: VideoReview[] = data.map((v: any) => ({
          id: v.id,
          productSku: v.product_sku || '',
          title: v.title,
          url: v.url,
          thumbnail: v.thumbnail,
          createdAt: v.created_at,
        }));
        writeLocal(VIDEOS_KEY, mapped);
        return mapped;
      }
    } catch (err) {
      console.warn('Supabase video-reviews load failed:', err);
    }
  }
  return readLocal<VideoReview>(VIDEOS_KEY);
}

export async function saveVideoReview(video: VideoReview): Promise<VideoReview> {
  const all = readLocal<VideoReview>(VIDEOS_KEY);
  const next = [video, ...all.filter(v => v.id !== video.id)];
  writeLocal(VIDEOS_KEY, next);
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('video_reviews')
        .upsert({
          id: video.id,
          title: video.title,
          url: video.url,
          thumbnail: video.thumbnail,
          product_sku: video.productSku,
        })
        .select()
        .single();
      if (!error && data) {
        const synced: VideoReview = {
          id: data.id,
          productSku: data.product_sku || '',
          title: data.title,
          url: data.url,
          thumbnail: data.thumbnail,
          createdAt: data.created_at,
        };
        const merged = readLocal<VideoReview>(VIDEOS_KEY).map(v => (v.id === synced.id ? synced : v));
        writeLocal(VIDEOS_KEY, merged);
        return synced;
      }
    } catch (err) {
      console.warn('Supabase video-review save failed:', err);
    }
  }
  return video;
}

export async function deleteVideoReview(id: string): Promise<void> {
  const next = readLocal<VideoReview>(VIDEOS_KEY).filter(v => v.id !== id);
  writeLocal(VIDEOS_KEY, next);
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('video_reviews').delete().eq('id', id);
    } catch (err) {
      console.warn('Supabase video-review delete failed:', err);
    }
  }
}

export function getVideosForProduct(videos: VideoReview[], sku: string): VideoReview[] {
  return videos.filter(v => v.productSku === sku);
}

// ---------- URL parsing ----------
// Accepts https://youtu.be/XYZ, https://www.youtube.com/watch?v=XYZ,
// https://www.youtube.com/shorts/XYZ, https://www.instagram.com/reel/XYZ/
// Returns the canonical embed URL.
export function toEmbedUrl(rawUrl: string): { embed: string; type: 'youtube' | 'instagram' | 'mp4' | 'unknown' } {
  if (!rawUrl) return { embed: '', type: 'unknown' };
  try {
    const url = new URL(rawUrl);
    const host = url.hostname.toLowerCase();

    if (host.includes('youtu.be')) {
      const id = url.pathname.replace(/^\//, '');
      return { embed: `https://www.youtube.com/embed/${id}`, type: 'youtube' };
    }
    if (host.includes('youtube.com')) {
      if (url.pathname === '/watch') {
        const id = url.searchParams.get('v') || '';
        return { embed: `https://www.youtube.com/embed/${id}`, type: 'youtube' };
      }
      if (url.pathname.startsWith('/embed/')) {
        return { embed: rawUrl, type: 'youtube' };
      }
      if (url.pathname.startsWith('/shorts/')) {
        const id = url.pathname.split('/shorts/')[1]?.split('/')[0] || '';
        return { embed: `https://www.youtube.com/embed/${id}`, type: 'youtube' };
      }
    }
    if (host.includes('instagram.com')) {
      // Instagram embeds need the full URL with trailing slash
      const normalised = rawUrl.endsWith('/') ? rawUrl : rawUrl + '/';
      return { embed: `${normalised}embed`, type: 'instagram' };
    }
    if (rawUrl.match(/\.(mp4|webm|ogg)(\?.*)?$/i)) {
      return { embed: rawUrl, type: 'mp4' };
    }
    return { embed: rawUrl, type: 'unknown' };
  } catch {
    return { embed: rawUrl, type: 'unknown' };
  }
}
