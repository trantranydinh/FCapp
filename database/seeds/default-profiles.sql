-- Seed Data: Default User and Profiles

-- Create default admin user
INSERT INTO public.users (id, email, name, role, active)
VALUES
    ('00000000-0000-0000-0000-000000000001', 'admin@fcapp.com', 'Admin User', 'admin', TRUE),
    ('00000000-0000-0000-0000-000000000002', 'demo@fcapp.com', 'Demo User', 'user', TRUE)
ON CONFLICT (email) DO NOTHING;

-- Create default profiles
INSERT INTO public.profiles (id, name, user_id, keywords, entities, region, mode, active)
VALUES
    (
        '00000000-0000-0000-0000-000000000101',
        'RCN WW320 Global Forecast',
        '00000000-0000-0000-0000-000000000001',
        ARRAY['cashew', 'RCN', 'price', 'market', 'WW320'],
        '[{"type": "RCN", "value": "WW320"}]'::JSONB,
        'Global',
        'quality',
        TRUE
    ),
    (
        '00000000-0000-0000-0000-000000000102',
        'RCN Vietnam Focus',
        '00000000-0000-0000-0000-000000000001',
        ARRAY['cashew', 'RCN', 'Vietnam', 'supply', 'export'],
        '[{"type": "RCN", "value": "W320"}, {"type": "market", "value": "Vietnam"}]'::JSONB,
        'Vietnam',
        'quantity',
        TRUE
    ),
    (
        '00000000-0000-0000-0000-000000000103',
        'Demo Profile',
        '00000000-0000-0000-0000-000000000002',
        ARRAY['cashew', 'market', 'trends'],
        '[{"type": "commodity", "value": "cashew"}]'::JSONB,
        'Global',
        'quality',
        TRUE
    )
ON CONFLICT (id) DO NOTHING;

-- Initialize freshness tracking for default profiles
INSERT INTO gold.data_freshness (profile_id, data_type, last_updated, sla_threshold_hours, is_fresh, next_refresh_due)
SELECT
    p.id,
    dt.data_type,
    NOW() - (dt.hours_ago * INTERVAL '1 hour'),
    dt.sla_hours,
    FALSE,
    NOW()
FROM
    public.profiles p
    CROSS JOIN (
        VALUES
            ('price_forecast', 24, 25),
            ('market_scan', 12, 13),
            ('news_ranking', 4, 5),
            ('ensemble', 6, 7)
    ) AS dt(data_type, sla_hours, hours_ago)
WHERE p.id IN (
    '00000000-0000-0000-0000-000000000101',
    '00000000-0000-0000-0000-000000000102',
    '00000000-0000-0000-0000-000000000103'
)
ON CONFLICT (profile_id, data_type) DO NOTHING;

COMMENT ON TABLE public.users IS 'Default users: admin@fcapp.com (admin), demo@fcapp.com (user)';
COMMENT ON TABLE public.profiles IS 'Three default profiles for testing and demonstration';
