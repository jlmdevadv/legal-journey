-- Migration: Promote User to Admin
-- This migration provides a function to promote any user to admin role
-- Usage: SELECT promote_user_to_admin('user@example.com');

CREATE OR REPLACE FUNCTION promote_user_to_admin(user_email TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_user_id UUID;
  role_exists BOOLEAN;
BEGIN
  -- Find user by email
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = user_email;
  
  -- Check if user exists
  IF target_user_id IS NULL THEN
    RETURN 'Error: User not found with email ' || user_email;
  END IF;
  
  -- Check if user already has admin role
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = target_user_id AND role = 'admin'
  ) INTO role_exists;
  
  IF role_exists THEN
    RETURN 'User ' || user_email || ' is already an admin';
  END IF;
  
  -- Add admin role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (target_user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN 'User ' || user_email || ' promoted to admin successfully';
END;
$$;

-- Example usage (commented out - uncomment and replace with actual email):
-- SELECT promote_user_to_admin('your-email@example.com');