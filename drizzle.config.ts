import { defineConfig } from 'drizzle-kit';

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set');

const isSqlite = process.env.DATABASE_URL.startsWith('sqlite:');

export default defineConfig({
	schema: './src/lib/server/db/schema-sqlite.ts',
	dialect: isSqlite ? 'sqlite' : 'postgresql',
	dbCredentials: isSqlite 
		? { url: process.env.DATABASE_URL.replace('sqlite:', '') }
		: { url: process.env.DATABASE_URL },
	verbose: true,
	strict: true
});
