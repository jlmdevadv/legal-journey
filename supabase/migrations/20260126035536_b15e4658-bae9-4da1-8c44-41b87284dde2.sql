-- ============================================================
-- FASE 1.0.1 - MIGRATION 1: Expandir Enum app_role
-- ============================================================
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'master';