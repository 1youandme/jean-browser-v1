-- JeanTrail Points System Migration
-- Governance-first, non-monetary, anti-manipulation design

-- 1. Points Ledger
-- The immutable record of all point transactions
CREATE TABLE IF NOT EXISTS jean_points_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('EARN', 'SPEND', 'EXPIRE', 'REVOKE')),
    amount INTEGER NOT NULL, -- Positive for EARN, Negative for SPEND/EXPIRE
    source_category VARCHAR(50) NOT NULL CHECK (source_category IN ('EDUCATION', 'ONBOARDING', 'VOLUNTARY_MARKETING', 'REDEMPTION', 'SYSTEM')),
    description TEXT NOT NULL, -- Human readable reason
    metadata JSONB DEFAULT '{}', -- Technical details (e.g. task_id)
    balance_snapshot INTEGER NOT NULL, -- Running balance after transaction
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expiry_at TIMESTAMPTZ, -- When these specific points expire (only for EARN)
    
    -- Integrity check
    CONSTRAINT check_amount_logic CHECK (
        (transaction_type = 'EARN' AND amount > 0) OR
        (transaction_type IN ('SPEND', 'EXPIRE', 'REVOKE') AND amount < 0)
    )
);

-- Index for quick balance calculation and history
CREATE INDEX IF NOT EXISTS idx_jean_points_user ON jean_points_ledger(user_id);
CREATE INDEX IF NOT EXISTS idx_jean_points_created ON jean_points_ledger(created_at);

-- 2. Store Catalog
-- Defines redeemable items
CREATE TABLE IF NOT EXISTS jean_store_catalog (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    cost_points INTEGER NOT NULL CHECK (cost_points > 0),
    item_type VARCHAR(50) NOT NULL CHECK (item_type IN ('DISCOUNT', 'FEATURE_UNLOCK', 'VOUCHER', 'COSMETIC')),
    config JSONB NOT NULL DEFAULT '{}', -- Logic payload (e.g. discount code, feature flag id)
    stock_limit INTEGER, -- NULL = infinite
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. User Redemptions
-- Tracks what users have bought
CREATE TABLE IF NOT EXISTS jean_user_redemptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES jean_store_catalog(id),
    points_spent INTEGER NOT NULL,
    redeemed_at TIMESTAMPTZ DEFAULT NOW(),
    redemption_data JSONB, -- The generated code or unlock token
    status VARCHAR(50) DEFAULT 'active' -- active, used, revoked
);

-- Index for showing user inventory
CREATE INDEX IF NOT EXISTS idx_jean_redemptions_user ON jean_user_redemptions(user_id);

-- 4. Initial Seed Data (Examples)
INSERT INTO jean_store_catalog (title, description, cost_points, item_type, config) VALUES
('Beta Tester Badge', 'Unlock the exclusive Beta Tester profile badge.', 500, 'COSMETIC', '{"badge_id": "beta_v1"}'),
('Dark Mode Theme', 'Unlock the Cyberpunk Dark Mode for the dashboard.', 1000, 'FEATURE_UNLOCK', '{"theme_id": "cyberpunk_dark"}'),
('10% Subscription Discount', 'One-time 10% discount on Jean Pro subscription.', 5000, 'DISCOUNT', '{"discount_percent": 10, "prefix": "JEAN10"}');

-- 5. Trigger to update updated_at (if function exists from previous migrations)
-- DO $$
-- BEGIN
--     IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
--         CREATE TRIGGER update_jean_store_catalog_updated_at BEFORE UPDATE ON jean_store_catalog FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
--     END IF;
-- END
-- $$;
