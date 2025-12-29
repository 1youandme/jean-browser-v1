-- JeanTrail Monetization & Entitlements Infrastructure
-- Connects to the Points System and Permission System

-- 1. Subscription Tiers
-- Defines the available plans and their limits
CREATE TABLE IF NOT EXISTS jean_subscription_tiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL UNIQUE, -- 'Core', 'Pro', 'Enterprise'
    slug VARCHAR(50) NOT NULL UNIQUE, -- 'core', 'pro', 'ent'
    description TEXT,
    price_monthly_cents INTEGER NOT NULL DEFAULT 0,
    price_yearly_cents INTEGER NOT NULL DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'USD',
    
    -- JSON blob defining limits (e.g. {"memory_mb": 5000, "container_limit": 5})
    entitlements JSONB NOT NULL DEFAULT '{}',
    
    is_active BOOLEAN DEFAULT true,
    is_public BOOLEAN DEFAULT true, -- False for legacy/custom plans
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. User Subscriptions
-- Tracks the active plan for a user
CREATE TABLE IF NOT EXISTS jean_user_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tier_id UUID NOT NULL REFERENCES jean_subscription_tiers(id),
    
    status VARCHAR(20) NOT NULL CHECK (status IN ('active', 'cancelled', 'expired', 'past_due')),
    
    -- Dates
    current_period_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    current_period_end TIMESTAMPTZ NOT NULL,
    cancelled_at TIMESTAMPTZ,
    
    -- Payment Provider Info (Stored safely, minimal details)
    provider VARCHAR(50), -- 'stripe', 'lemonsqueezy'
    provider_subscription_id VARCHAR(255),
    
    -- Governance
    auto_renew BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for quick entitlement checks
CREATE INDEX IF NOT EXISTS idx_jean_subs_user ON jean_user_subscriptions(user_id, status);

-- 3. Entitlement Overrides (Feature Unlocks)
-- Allows specific features to be unlocked via Points or One-time purchases
-- independent of the base subscription tier.
CREATE TABLE IF NOT EXISTS jean_entitlement_overrides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- What is being unlocked?
    feature_key VARCHAR(100) NOT NULL, -- e.g. 'dark_mode', 'extra_memory_1gb'
    
    -- Source of the unlock
    source_type VARCHAR(50) NOT NULL CHECK (source_type IN ('POINTS_REDEMPTION', 'ONE_TIME_PURCHASE', 'ADMIN_GRANT', 'LEGACY')),
    source_id UUID, -- Link to jean_user_redemptions.id if applicable
    
    -- Validity
    value_modifier JSONB, -- e.g. {"add_memory_mb": 1000}
    expires_at TIMESTAMPTZ, -- NULL = Permanent
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_jean_overrides_user ON jean_entitlement_overrides(user_id, feature_key);

-- 4. Seed Default Tiers
INSERT INTO jean_subscription_tiers (name, slug, description, price_monthly_cents, entitlements) VALUES
('Core', 'core', 'The standard sovereign browser experience.', 0, 
 '{"memory_mb": 100, "container_limit": 2, "audit_retention_days": 7, "agent_limit": 1}'),
 
('Pro', 'pro', 'For power users and developers.', 2000, 
 '{"memory_mb": 5000, "container_limit": -1, "audit_retention_days": 365, "agent_limit": 10}'),
 
('Enterprise', 'enterprise', 'Governance and compliance for teams.', 5000, 
 '{"memory_mb": -1, "container_limit": -1, "audit_retention_days": -1, "agent_limit": -1, "policy_enforcement": true}');

-- Note: -1 denotes "Unlimited" in the logic layer.

-- 5. Helper View for Current Entitlements
-- This view combines the base tier limits + any overrides to give the final
-- effective permissions for a user.
-- (Simplified concept - actual merging logic usually happens in code, but this helps visualization)
/*
CREATE VIEW view_user_effective_entitlements AS
SELECT 
    u.id as user_id,
    t.slug as tier_slug,
    t.entitlements as base_entitlements,
    (SELECT jsonb_agg(value_modifier) FROM jean_entitlement_overrides WHERE user_id = u.id AND (expires_at IS NULL OR expires_at > NOW())) as overrides
FROM users u
LEFT JOIN jean_user_subscriptions s ON s.user_id = u.id AND s.status = 'active'
LEFT JOIN jean_subscription_tiers t ON s.tier_id = t.id;
*/
