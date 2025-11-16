-- Add setup_status column
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS setup_status varchar(50) CHECK (setup_status IN ('pending_setup', 'pending_username', 'pending_pin', 'active', 'inactive', 'suspended')) 
DEFAULT 'pending_setup' NOT NULL;

-- Make username nullable during initial setup
ALTER TABLE public.profiles 
ALTER COLUMN username DROP NOT NULL;

-- Make sure wallet_address exists
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS wallet_address text;

-- Add index for wallet lookups
CREATE INDEX IF NOT EXISTS profiles_wallet_address_idx 
ON public.profiles(wallet_address);

-- Update policies to allow initial creation with just wallet
ALTER TABLE public.profiles DROP POLICY IF EXISTS "Profiles are insertable by anyone with wallet";
CREATE POLICY "Profiles are insertable by anyone with wallet"
ON public.profiles FOR INSERT
WITH CHECK (true);

-- Update existing policies
DROP POLICY IF EXISTS "Profiles are viewable by owners" ON public.profiles;
CREATE POLICY "Profiles are viewable by owners"
ON public.profiles FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Profiles are updatable by owners" ON public.profiles;
CREATE POLICY "Profiles are updatable by owners"
ON public.profiles FOR UPDATE
USING (auth.uid()::text = id);