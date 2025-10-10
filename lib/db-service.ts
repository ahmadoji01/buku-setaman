import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import type { User } from './types';

class DatabaseService {
  private db: Database.Database;

  constructor() {
    this.db = new Database('bukusetaman.db');
    this.db.pragma('foreign_keys = ON');
  }

  // User authentication methods
  async findUserByEmail(email: string): Promise<User | null> {
    try {
      const stmt = this.db.prepare('SELECT * FROM users WHERE email = ?');
      const user = stmt.get(email) as any;

      if (!user) return null;

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: new Date(user.created_at),
        updatedAt: new Date(user.updated_at),
      };
    } catch (error) {
      console.error('Error finding user by email:', error);
      return null;
    }
  }

  async authenticateUser(email: string, password: string): Promise<User | null> {
    try {
      const stmt = this.db.prepare('SELECT * FROM users WHERE email = ?');
      const user = stmt.get(email) as any;

      if (!user) return null;

      // For demo purposes, we'll do a simple password comparison
      // In production, you'd use bcrypt.compare()
      const isValidPassword = user.password === password;

      if (!isValidPassword) return null;

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: new Date(user.created_at),
        updatedAt: new Date(user.updated_at),
      };
    } catch (error) {
      console.error('Error authenticating user:', error);
      return null;
    }
  }

  // Helper method to hash passwords (for future use)
  async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  // Helper method to verify passwords (for future use)
  async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  close(): void {
    this.db.close();
  }
}

// Singleton instance
let dbServiceInstance: DatabaseService | null = null;

export function getDatabaseService(): DatabaseService {
  if (!dbServiceInstance) {
    dbServiceInstance = new DatabaseService();
  }
  return dbServiceInstance;
}

export default DatabaseService;
