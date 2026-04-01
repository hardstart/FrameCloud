/**
 * Run with: npx tsx src/lib/db/migrate.ts
 * Creates all tables if they don't exist.
 */
import { neon } from "@neondatabase/serverless";
import "dotenv/config";

const sql = neon(process.env.DATABASE_URL!);

async function migrate() {
  console.log("Running migrations...");

  await sql`
    CREATE TABLE IF NOT EXISTS tenants (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'owner',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`CREATE INDEX IF NOT EXISTS users_tenant_idx ON users(tenant_id)`;
  await sql`CREATE INDEX IF NOT EXISTS users_email_idx ON users(email)`;

  await sql`
    CREATE TABLE IF NOT EXISTS sessions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`CREATE INDEX IF NOT EXISTS sessions_user_idx ON sessions(user_id)`;

  await sql`
    CREATE TABLE IF NOT EXISTS albums (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      slug TEXT NOT NULL,
      description TEXT,
      cover_key TEXT,
      is_password_protected BOOLEAN NOT NULL DEFAULT FALSE,
      password_hash TEXT,
      photo_count INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`CREATE INDEX IF NOT EXISTS albums_tenant_idx ON albums(tenant_id)`;
  await sql`CREATE INDEX IF NOT EXISTS albums_slug_tenant_idx ON albums(tenant_id, slug)`;

  await sql`
    CREATE TABLE IF NOT EXISTS photos (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      album_id UUID NOT NULL REFERENCES albums(id) ON DELETE CASCADE,
      tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      filename TEXT NOT NULL,
      r2_key TEXT NOT NULL,
      caption TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0,
      width INTEGER,
      height INTEGER,
      size_bytes INTEGER,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`CREATE INDEX IF NOT EXISTS photos_album_idx ON photos(album_id)`;
  await sql`CREATE INDEX IF NOT EXISTS photos_tenant_idx ON photos(tenant_id)`;

  await sql`
    CREATE TABLE IF NOT EXISTS share_links (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      album_id UUID NOT NULL REFERENCES albums(id) ON DELETE CASCADE,
      tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      token TEXT NOT NULL UNIQUE,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      expires_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`CREATE INDEX IF NOT EXISTS share_links_token_idx ON share_links(token)`;
  await sql`CREATE INDEX IF NOT EXISTS share_links_album_idx ON share_links(album_id)`;

  console.log("Migrations complete!");
}

migrate().catch(console.error);
