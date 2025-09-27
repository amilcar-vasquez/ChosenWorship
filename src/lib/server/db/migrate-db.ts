/**
 * Database connection for migration scripts
 * Uses direct environment variable access instead of SvelteKit's $env
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import { drizzle as drizzleSqlite } from 'drizzle-orm/better-sqlite3';
import postgres from 'postgres';
import Database from 'better-sqlite3';
import { config } from 'dotenv';

// Load environment variables
config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
	throw new Error('DATABASE_URL is not set');
}

// Support both PostgreSQL and SQLite based on URL
const isSqlite = DATABASE_URL.startsWith('sqlite:');

export const db = isSqlite 
	? drizzleSqlite(new Database(DATABASE_URL.replace('sqlite:', '')))
	: drizzle(postgres(DATABASE_URL));