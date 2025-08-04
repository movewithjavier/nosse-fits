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

## How to Apply Migrations

### For New Projects
Run migrations in order starting from `001_initial_setup.sql`.

### For Existing Projects with Authentication
If you already have the initial setup and want to convert to personal use:
1. Run `002_convert_to_personal_use.sql` in your Supabase SQL Editor

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