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

  // Public methods for API routes
  prepare(sql: string): Database.Statement {
    return this.db.prepare(sql);
  }

  exec(sql: string): void {
    this.db.exec(sql);
  }

  all<T = unknown>(sql: string, params?: readonly any[]): T[] {
    const stmt = this.db.prepare(sql);
    return params ? stmt.all(params) as T[] : stmt.all() as T[];
  }

  get<T = unknown>(sql: string, params?: readonly any[]): T | undefined {
    const stmt = this.db.prepare(sql);
    return params ? stmt.get(params) as T | undefined : stmt.get() as T | undefined;
  }

  run(sql: string, params?: readonly any[]): Database.RunResult {
    const stmt = this.db.prepare(sql);
    return params ? stmt.run(params) : stmt.run();
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
