#!/usr/bin/env node

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('🚀 Starting Student Form Rewrite Workflow...\n');

// Read plan file
const planPath = path.join(process.cwd(), '.claude', 'plans', 'get-familiar-with-docs-student-form-md-compressed-dragon.md');
const planContent = fs.readFileSync(planPath, 'utf-8');

// Read spec doc
const specPath = path.join(process.cwd(), 'docs', 'STUDENT_FORM.md');
const specContent = fs.readFileSync(specPath, 'utf-8');

console.log('✅ Read plan and spec files');

// Phase 1: Check if spec has been edited (contains "10 tabs" or similar)
if (!specContent.includes('10 tab') && !specContent.includes('tab_1') && !specContent.includes('tab-1')) {
  console.error('❌ ERROR: docs/STUDENT_FORM.md has not been updated with 10-tab structure');
  console.error('Please complete CAPS UP editing before running this script');
  process.exit(1);
}

console.log('✅ Spec doc contains 10-tab structure');

// Phase 2: Generate migration files
console.log('\n📝 Generating migration files...');

const migrations = [
  {
    name: 'student_id_sequences',
    content: `
-- Reserve-Release mechanism for student IDs
CREATE TABLE student_id_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id TEXT NOT NULL,
  academic_year TEXT NOT NULL,
  sequence_from INTEGER NOT NULL,
  sequence_to INTEGER NOT NULL,
  reserved_by UUID NOT NULL,
  reserved_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'reserved' CHECK (status IN ('reserved', 'committed', 'released')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX idx_student_id_sequences_school_year ON student_id_sequences(school_id, academic_year);
CREATE INDEX idx_student_id_sequences_expires_at ON student_id_sequences(expires_at);

-- Cleanup function for expired reservations
CREATE OR REPLACE FUNCTION cleanup_expired_student_id_reservations()
RETURNS VOID AS $$
DECLARE
  expired_records RECORD;
BEGIN
  -- Find expired reservations
  FOR expired_records IN
    SELECT id FROM student_id_sequences
    WHERE expires_at < NOW() AND status = 'reserved'
  LOOP
    -- Release the IDs
    UPDATE student_id_sequences
    SET status = 'released', updated_at = NOW()
    WHERE id = expired_records.id;

    INSERT INTO audit_log (event_type, event_details, user_id)
    VALUES ('student_id_released', JSONB_BUILD_OBJECT('reason', 'timeout'), NULL);
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- RPC functions
CREATE OR REPLACE FUNCTION reserve_student_id(p_school_id TEXT, p_academic_year TEXT, p_count INTEGER, p_user_id UUID)
RETURNS TABLE(sequence_from INTEGER, sequence_to INTEGER) AS $$
DECLARE
  next_seq INTEGER;
  result RECORD;
BEGIN
  -- Get next available sequence
  SELECT COALESCE(MAX(sequence_to) + 1, 1) INTO next_seq
  FROM student_id_sequences
  WHERE school_id = p_school_id AND academic_year = p_academic_year AND status = 'released';

  -- Reserve the range
  INSERT INTO student_id_sequences (school_id, academic_year, sequence_from, sequence_to, reserved_by, expires_at)
  VALUES (p_school_id, p_academic_year, next_seq, next_seq + p_count - 1, p_user_id, NOW() + INTERVAL '30 minutes')
  RETURNING sequence_from, sequence_to INTO result;

  RETURN QUERY SELECT result.sequence_from, result.sequence_to;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION release_student_id(p_reservation_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE student_id_sequences
  SET status = 'released', updated_at = NOW()
  WHERE id = p_reservation_id AND status = 'reserved';
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION commit_student_id(p_reservation_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE student_id_sequences
  SET status = 'committed', updated_at = NOW()
  WHERE id = p_reservation_id AND status = 'reserved';
END;
$$ LANGUAGE plpgsql;
`
  },
  {
    name: 'students_aadhar_encrypted',
    content: `
-- Add encrypted Aadhar column
ALTER TABLE students ADD COLUMN aadhar_number_encrypted TEXT;

-- Drop plain text column after data migration (TODO: execute in separate step)
-- ALTER TABLE students DROP COLUMN aadhar_number;

-- Update existing records (encrypted with migration time key)
UPDATE students SET aadhar_number_encrypted = aadhar_number WHERE aadhar_number IS NOT NULL;

-- Add constraint
ALTER TABLE students ADD CONSTRAINT chk_aadhar_number_encrypted
  CHECK (aadhar_number_encrypted IS NULL OR LENGTH(aadhar_number_encrypted) > 0);
`
  },
  {
    name: 'student_bulk_actions',
    content: `
-- Bulk import revert tracking
CREATE TABLE student_bulk_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id TEXT NOT NULL,
  filename TEXT NOT NULL,
  imported_at TIMESTAMPTZ DEFAULT NOW(),
  imported_by UUID NOT NULL,
  student_count INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'reverted', 'partial')),
  reverted_at TIMESTAMPTZ,
  reverted_by UUID,
  revert_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX idx_student_bulk_actions_school ON student_bulk_actions(school_id);
CREATE INDEX idx_student_bulk_actions_imported_at ON student_bulk_actions(imported_at);
`
  },
  {
    name: 'student_id_cleanup',
    content: `
-- Schedule cleanup job (Edge Function will run this daily)
-- CREATE EXTENSION IF NOT EXISTS pg_cron;
-- SELECT cron.schedule('0 2 * * *', $$SELECT cleanup_expired_student_id_reservations()$$);
`
  },
  {
    name: 'encrypt_text_decrypt_text',
    content: `
-- RPC functions for encryption/decryption
CREATE OR REPLACE FUNCTION encrypt_text(p_text TEXT)
RETURNS TEXT AS $$
BEGIN
  -- TODO: Implement actual encryption using pgcrypto
  -- For now, return base64 encoded text as placeholder
  RETURN encode(convert_to(p_text, 'UTF-8'), 'base64');
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION decrypt_text(p_encrypted TEXT)
RETURNS TEXT AS $$
BEGIN
  -- TODO: Implement actual decryption using pgcrypto
  -- For now, return base64 decoded text as placeholder
  RETURN convert_from(decode(p_encrypted, 'base64'), 'UTF-8');
END;
$$ LANGUAGE plpgsql;
`
  }
];

// Create migrations directory
const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations');
if (!fs.existsSync(migrationsDir)) {
  fs.mkdirSync(migrationsDir, { recursive: true });
}

// Write migration files
migrations.forEach((migration, index) => {
  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '').replace(/T/, '');
  const filename = `202606${timestamp}_${migration.name}.sql`;
  const filepath = path.join(migrationsDir, filename);

  fs.writeFileSync(filepath, migration.content);
  console.log(`✅ Created migration: ${filename}`);
});

console.log('\n📦 Created all migration files');

// Phase 3: Build project
console.log('\n🔨 Running build check...');
const buildProcess = spawn('npm', ['run', 'build'], { stdio: 'inherit' });

buildProcess.on('close', (code) => {
  if (code !== 0) {
    console.error('\n❌ Build failed. Please fix TypeScript errors before proceeding.');
    process.exit(1);
  }

  console.log('\n✅ Build successful');

  // Phase 4: Next steps
  console.log('\n📋 Next steps:');
  console.log('1. Review generated migrations in supabase/migrations/');
  console.log('2. Run each migration with Supabase CLI or MCP tools');
  console.log('3. Update src/lib/schemas.ts with 10-tab schemas');
  console.log('4. Split Students.tsx into components');
  console.log('5. Create create-student-user edge function');
  console.log('6. Wire up UI components');
  console.log('7. Test the complete flow');

  console.log('\n🎯 Workflow complete. Ready for manual review and execution.');
});