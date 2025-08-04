# Database Migrations

This folder contains database migration files for the Nosse Fits application.

## Migration Files

### 001_initial_setup.sql
- **Description**: Initial database setup with authentication-based RLS
- **Date**: 2025-01-04
- **Purpose**: Creates the initial `clothing_items` table, storage bucket, and RLS policies for authenticated users

### 002_convert_to_personal_use.sql
- **Description**: Convert from auth-based RLS to personal use without authentication
- **Date**: 2025-01-04
- **Purpose**: Removes authentication requirements and RLS policies for personal use

### 003_super_permissive_personal_use.sql
- **Description**: Make everything super permissive for personal use - no restrictions
- **Date**: 2025-01-04
- **Purpose**: Completely removes all RLS restrictions, fixes user_id constraints, grants full permissions

### 004_fix_user_id_column_type.sql ⚠️ **CRITICAL FIX**
- **Description**: Fix user_id column type from UUID to TEXT for personal use
- **Date**: 2025-01-04
- **Purpose**: Solves "invalid input syntax for type uuid: 'personal-user'" error by converting column type

## How to Apply Migrations

### For New Projects
Run migrations in order starting from `001_initial_setup.sql`.

### For Existing Projects with Authentication
If you already have the initial setup and want to convert to personal use:
1. **Run `004_fix_user_id_column_type.sql`** in your Supabase SQL Editor (this is the complete fix that includes everything from 002 and 003)

### Steps to Apply in Supabase
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the migration content
4. Click "Run" to execute

## Migration Naming Convention

Migrations follow the pattern: `{number}_{description}.sql`
- Numbers are zero-padded (001, 002, etc.)
- Descriptions use snake_case
- Each migration includes header comments with description and date

## Current Schema

After applying migration 002, the schema includes:
- `clothing_items` table with no RLS restrictions
- `user_id` as TEXT field defaulting to 'personal-user'
- `clothing-images` storage bucket with public access
- No authentication requirements