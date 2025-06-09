import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertInventionSchema, insertCommentSchema, insertLikeSchema } from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs";

// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  dest: uploadDir,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow PDFs, images, and common document types
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, images, and documents are allowed.'));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Invention routes
  app.get('/api/inventions', async (req, res) => {
    try {
      const { status, tags } = req.query;
      const filters: any = {};
      
      if (status && typeof status === 'string') {
        filters.status = status;
      }
      
      if (tags && typeof tags === 'string') {
        filters.tags = tags.split(',');
      }
      
      const inventions = await storage.getInventions(filters);
      res.json(inventions);
    } catch (error) {
      console.error("Error fetching inventions:", error);
      res.status(500).json({ message: "Failed to fetch inventions" });
    }
  });

  app.get('/api/inventions/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const invention = await storage.getInvention(id);
      
      if (!invention) {
        return res.status(404).json({ message: "Invention not found" });
      }
      
      res.json(invention);
    } catch (error) {
      console.error("Error fetching invention:", error);
      res.status(500).json({ message: "Failed to fetch invention" });
    }
  });

  app.post('/api/inventions', isAuthenticated, upload.array('files', 10), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Parse tags from JSON string if needed
      let tags = req.body.tags;
      if (typeof tags === 'string') {
        try {
          tags = JSON.parse(tags);
        } catch {
          tags = tags.split(',').map((tag: string) => tag.trim());
        }
      }
      
      const inventionData = insertInventionSchema.parse({
        ...req.body,
        tags: tags || [],
      });
      
      const invention = await storage.createInvention({
        ...inventionData,
        authorId: userId,
      });

      // Handle file uploads
      if (req.files && Array.isArray(req.files)) {
        for (const file of req.files) {
          await storage.saveFileInfo({
            filename: file.filename,
            originalName: file.originalname,
            mimeType: file.mimetype,
            size: file.size,
            inventionId: invention.id,
          });
        }
      }

      res.status(201).json(invention);
    } catch (error) {
      console.error("Error creating invention:", error);
      res.status(500).json({ message: "Failed to create invention" });
    }
  });

  // Admin only: Update invention status
  app.patch('/api/inventions/:id/status', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied. Admin role required." });
      }
      
      const id = parseInt(req.params.id);
      const { status, fundingAmount } = req.body;
      
      const updatedInvention = await storage.updateInventionStatus(id, status, fundingAmount);
      
      if (!updatedInvention) {
        return res.status(404).json({ message: "Invention not found" });
      }
      
      res.json(updatedInvention);
    } catch (error) {
      console.error("Error updating invention status:", error);
      res.status(500).json({ message: "Failed to update invention status" });
    }
  });

  // Comment routes
  app.post('/api/inventions/:id/comments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const inventionId = parseInt(req.params.id);
      const commentData = insertCommentSchema.parse({
        ...req.body,
        inventionId,
      });
      
      const comment = await storage.createComment({
        ...commentData,
        authorId: userId,
      });
      
      res.status(201).json(comment);
    } catch (error) {
      console.error("Error creating comment:", error);
      res.status(500).json({ message: "Failed to create comment" });
    }
  });

  // Like/Dislike routes
  app.post('/api/inventions/:id/like', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const inventionId = parseInt(req.params.id);
      const { isLike } = req.body;
      
      await storage.toggleLike({
        inventionId,
        isLike: Boolean(isLike),
        userId,
      });
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error toggling like:", error);
      res.status(500).json({ message: "Failed to toggle like" });
    }
  });

  app.get('/api/inventions/:id/user-like', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const inventionId = parseInt(req.params.id);
      
      const like = await storage.getUserLike(inventionId, userId);
      res.json(like);
    } catch (error) {
      console.error("Error fetching user like:", error);
      res.status(500).json({ message: "Failed to fetch user like" });
    }
  });

  // File download route
  app.get('/api/files/:filename', async (req, res) => {
    try {
      const filename = req.params.filename;
      const filePath = path.join(uploadDir, filename);
      
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: "File not found" });
      }
      
      res.download(filePath);
    } catch (error) {
      console.error("Error downloading file:", error);
      res.status(500).json({ message: "Failed to download file" });
    }
  });

  // Statistics route
  app.get('/api/stats', async (req, res) => {
    try {
      const stats = await storage.getStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
