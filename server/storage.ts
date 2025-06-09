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
    let query = db
      .select({
        id: inventions.id,
        title: inventions.title,
        description: inventions.description,
        tags: inventions.tags,
        status: inventions.status,
        fundingAmount: inventions.fundingAmount,
        authorId: inventions.authorId,
        createdAt: inventions.createdAt,
        updatedAt: inventions.updatedAt,
        author: users,
        _count: {
          likes: sql<number>`COUNT(CASE WHEN ${likes.isLike} = true THEN 1 END)`,
          dislikes: sql<number>`COUNT(CASE WHEN ${likes.isLike} = false THEN 1 END)`,
          comments: sql<number>`COUNT(DISTINCT ${comments.id})`,
          files: sql<number>`COUNT(DISTINCT ${files.id})`,
        },
      })
      .from(inventions)
      .leftJoin(users, eq(inventions.authorId, users.id))
      .leftJoin(likes, eq(inventions.id, likes.inventionId))
      .leftJoin(comments, eq(inventions.id, comments.inventionId))
      .leftJoin(files, eq(inventions.id, files.inventionId))
      .groupBy(inventions.id, users.id);

    if (filters?.status) {
      query = query.where(eq(inventions.status, filters.status));
    }

    if (filters?.tags && filters.tags.length > 0) {
      query = query.where(
        sql`${inventions.tags} && ${filters.tags}`
      );
    }

    return await query.orderBy(desc(inventions.createdAt));
  }

  async getInvention(id: number): Promise<(Invention & { author: User; files: File[]; comments: (Comment & { author: User })[]; likes: Like[] }) | undefined> {
    const [invention] = await db
      .select()
      .from(inventions)
      .leftJoin(users, eq(inventions.authorId, users.id))
      .where(eq(inventions.id, id));

    if (!invention) return undefined;

    const inventionFiles = await db
      .select()
      .from(files)
      .where(eq(files.inventionId, id));

    const inventionComments = await db
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
      .where(eq(comments.inventionId, id))
      .orderBy(desc(comments.createdAt));

    const inventionLikes = await db
      .select()
      .from(likes)
      .where(eq(likes.inventionId, id));

    return {
      ...invention.inventions,
      author: invention.users!,
      files: inventionFiles,
      comments: inventionComments,
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
