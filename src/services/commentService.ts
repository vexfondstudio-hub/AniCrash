import { Comment } from '../types';

const COMMENTS_STORAGE_KEY = 'anicrash_real_user_comments_v1';

export function getStoredComments(): Record<string, Comment[]> {
  try {
    const raw = localStorage.getItem(COMMENTS_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Error loading comments from storage:', e);
  }
  return {};
}

export function saveStoredComments(data: Record<string, Comment[]>): void {
  try {
    localStorage.setItem(COMMENTS_STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Error saving comments to storage:', e);
  }
}

export function getCommentsForAnime(animeId: string): Comment[] {
  const all = getStoredComments();
  return all[animeId] || [];
}

export function addComment(
  animeId: string,
  text: string,
  rating: number,
  author: { username: string; avatar: string }
): Comment {
  const all = getStoredComments();
  const animeComments = all[animeId] || [];

  const newComment: Comment = {
    id: `comm_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    animeId,
    userName: author.username.trim() || 'Аноним',
    avatar: author.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
    rating: Math.min(10, Math.max(1, rating)),
    text: text.trim(),
    createdAt: 'Только что',
    likes: 0,
  };

  const updated = [newComment, ...animeComments];
  all[animeId] = updated;
  saveStoredComments(all);

  return newComment;
}

export function deleteComment(animeId: string, commentId: string, username: string): boolean {
  const all = getStoredComments();
  const animeComments = all[animeId] || [];
  const comment = animeComments.find((c) => c.id === commentId);

  if (!comment || comment.userName !== username) {
    return false;
  }

  all[animeId] = animeComments.filter((c) => c.id !== commentId);
  saveStoredComments(all);
  return true;
}

export function likeComment(animeId: string, commentId: string): number {
  const LIKED_KEY = 'anicrash_liked_comments';
  let isLiked = false;
  let likedObj: Record<string, boolean> = {};

  try {
    const likedStr = localStorage.getItem(LIKED_KEY);
    likedObj = likedStr ? JSON.parse(likedStr) : {};
    isLiked = !!likedObj[commentId];
  } catch (e) {
    console.error('Error with likes storage:', e);
  }

  const all = getStoredComments();
  const animeComments = all[animeId] || [];
  const comment = animeComments.find((c) => c.id === commentId);
  if (!comment) return 0;

  if (isLiked) {
    comment.likes = Math.max(0, (comment.likes || 0) - 1);
    delete likedObj[commentId];
  } else {
    comment.likes = (comment.likes || 0) + 1;
    likedObj[commentId] = true;
  }

  try {
    localStorage.setItem(LIKED_KEY, JSON.stringify(likedObj));
  } catch (e) {}

  saveStoredComments(all);
  return comment.likes;
}

export function isCommentLiked(commentId: string): boolean {
  const LIKED_KEY = 'anicrash_liked_comments';
  try {
    const likedStr = localStorage.getItem(LIKED_KEY);
    if (!likedStr) return false;
    const likedObj = JSON.parse(likedStr);
    return !!likedObj[commentId];
  } catch (e) {
    return false;
  }
}
