import {
  users,
  inventions,
  comments,
  likes,
  files,
  type User,
  type UpsertUser,
  type Invention,
  type InsertInvention,
  type Comment,
  type InsertComment,
  type Like,
  type InsertLike,
  type File,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, inArray } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations
  // (IMPORTANT) these user operations are mandatory for Replit Auth.
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Invention operations
  createInvention(invention: InsertInvention & { authorId: string }): Promise<Invention>;
  getInventions(filters?: { status?: string; tags?: string[] }): Promise<(Invention & { author: User; _count: { likes: number; dislikes: number; comments: number; files: number } })[]>;
  getInvention(id: number): Promise<(Invention & { author: User; files: File[]; comments: (Comment & { author: User })[]; likes: Like[] }) | undefined>;
  updateInventionStatus(id: number, status: string, fundingAmount?: number): Promise<Invention | undefined>;
  
  // Comment operations
  createComment(comment: InsertComment & { authorId: string }): Promise<Comment & { author: User }>;
  getCommentsByInvention(inventionId: number): Promise<(Comment & { author: User })[]>;
  
  // Like operations
  toggleLike(like: InsertLike & { userId: string }): Promise<void>;
  getUserLike(inventionId: number, userId: string): Promise<Like | undefined>;
  
  // File operations
  saveFileInfo(fileInfo: { filename: string; originalName: string; mimeType: string; size: number; inventionId: number }): Promise<File>;
  getFilesByInvention(inventionId: number): Promise<File[]>;
  
  // Statistics
  getStats(): Promise<{ total: number; pending: number; approved: number; rejected: number }>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  // (IMPORTANT) these user operations are mandatory for Replit Auth.

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Invention operations
  async createInvention(invention: InsertInvention & { authorId: string }): Promise<Invention> {
    const [newInvention] = await db
      .insert(inventions)
      .values(invention)
      .returning();
    return newInvention;
  }

  async getInventions(filters?: { status?: string; tags?: string[] }): Promise<(Invention & { author: User; _count: { likes: number; dislikes: number; comments: number; files: number } })[]> {
    // Get all inventions with authors
    const allInventions = await db
      .select()
      .from(inventions)
      .innerJoin(users, eq(inventions.authorId, users.id))
      .orderBy(desc(inventions.createdAt));

    const results = [];
    
    for (const inv of allInventions) {
      // Filter by status if provided
      if (filters?.status && inv.inventions.status !== filters.status) {
        continue;
      }
      
      // Filter by tags if provided
      if (filters?.tags && filters.tags.length > 0) {
        const hasMatchingTag = filters.tags.some(tag => 
          inv.inventions.tags.includes(tag)
        );
        if (!hasMatchingTag) {
          continue;
        }
      }

      // Get counts for this invention
      const likesData = await db
        .select({ isLike: likes.isLike })
        .from(likes)
        .where(eq(likes.inventionId, inv.inventions.id));
      
      const commentsCount = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(comments)
        .where(eq(comments.inventionId, inv.inventions.id));
      
      const filesCount = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(files)
        .where(eq(files.inventionId, inv.inventions.id));

      const likesCount = likesData.filter(l => l.isLike === true).length;
      const dislikesCount = likesData.filter(l => l.isLike === false).length;

      results.push({
        ...inv.inventions,
        author: inv.users,
        _count: {
          likes: likesCount,
          dislikes: dislikesCount,
          comments: commentsCount[0]?.count || 0,
          files: filesCount[0]?.count || 0,
        },
      });
    }

    return results;
  }

  async getInvention(id: number): Promise<(Invention & { author: User; files: File[]; comments: (Comment & { author: User })[]; likes: Like[] }) | undefined> {
    const [invention] = await db
      .select()
      .from(inventions)
      .innerJoin(users, eq(inventions.authorId, users.id))
      .where(eq(inventions.id, id));

    if (!invention || !invention.users) return undefined;

    const inventionFiles = await db
      .select()
      .from(files)
      .where(eq(files.inventionId, id));

    const inventionComments = await db
      .select()
      .from(comments)
      .innerJoin(users, eq(comments.authorId, users.id))
      .where(eq(comments.inventionId, id))
      .orderBy(desc(comments.createdAt));

    const inventionLikes = await db
      .select()
      .from(likes)
      .where(eq(likes.inventionId, id));

    // Transform comments to include author data
    const commentsWithAuthors = inventionComments.map(comment => ({
      ...comment.comments,
      author: comment.users,
    }));

    return {
      ...invention.inventions,
      author: invention.users,
      files: inventionFiles,
      comments: commentsWithAuthors,
      likes: inventionLikes,
    };
  }

  async updateInventionStatus(id: number, status: string, fundingAmount?: number): Promise<Invention | undefined> {
    const updateData: any = { status, updatedAt: new Date() };
    if (fundingAmount !== undefined) {
      updateData.fundingAmount = fundingAmount;
    }

    const [updatedInvention] = await db
      .update(inventions)
      .set(updateData)
      .where(eq(inventions.id, id))
      .returning();

    return updatedInvention;
  }

  // Comment operations
  async createComment(comment: InsertComment & { authorId: string }): Promise<Comment & { author: User }> {
    const [newComment] = await db
      .insert(comments)
      .values(comment)
      .returning();

    const [author] = await db
      .select()
      .from(users)
      .where(eq(users.id, comment.authorId));

    return { ...newComment, author: author! };
  }

  async getCommentsByInvention(inventionId: number): Promise<(Comment & { author: User })[]> {
    return await db
      .select({
        id: comments.id,
        content: comments.content,
        inventionId: comments.inventionId,
        authorId: comments.authorId,
        createdAt: comments.createdAt,
        author: users,
      })
      .from(comments)
      .leftJoin(users, eq(comments.authorId, users.id))
      .where(eq(comments.inventionId, inventionId))
      .orderBy(desc(comments.createdAt));
  }

  // Like operations
  async toggleLike(like: InsertLike & { userId: string }): Promise<void> {
    const existingLike = await db
      .select()
      .from(likes)
      .where(
        and(
          eq(likes.inventionId, like.inventionId),
          eq(likes.userId, like.userId)
        )
      );

    if (existingLike.length > 0) {
      const existing = existingLike[0];
      if (existing.isLike === like.isLike) {
        // Remove the like/dislike
        await db
          .delete(likes)
          .where(eq(likes.id, existing.id));
      } else {
        // Update the like/dislike
        await db
          .update(likes)
          .set({ isLike: like.isLike })
          .where(eq(likes.id, existing.id));
      }
    } else {
      // Create new like/dislike
      await db.insert(likes).values(like);
    }
  }

  async getUserLike(inventionId: number, userId: string): Promise<Like | undefined> {
    const [like] = await db
      .select()
      .from(likes)
      .where(
        and(
          eq(likes.inventionId, inventionId),
          eq(likes.userId, userId)
        )
      );
    return like;
  }

  // File operations
  async saveFileInfo(fileInfo: { filename: string; originalName: string; mimeType: string; size: number; inventionId: number }): Promise<File> {
    const [file] = await db
      .insert(files)
      .values(fileInfo)
      .returning();
    return file;
  }

  async getFilesByInvention(inventionId: number): Promise<File[]> {
    return await db
      .select()
      .from(files)
      .where(eq(files.inventionId, inventionId));
  }

  // Statistics
  async getStats(): Promise<{ total: number; pending: number; approved: number; rejected: number }> {
    const [stats] = await db
      .select({
        total: sql<number>`COUNT(*)`,
        pending: sql<number>`COUNT(CASE WHEN ${inventions.status} = 'pending' THEN 1 END)`,
        approved: sql<number>`COUNT(CASE WHEN ${inventions.status} = 'approved' THEN 1 END)`,
        rejected: sql<number>`COUNT(CASE WHEN ${inventions.status} = 'rejected' THEN 1 END)`,
      })
      .from(inventions);

    return stats;
  }
}

export const storage = new DatabaseStorage();
