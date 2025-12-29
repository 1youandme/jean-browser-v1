-- Seed data for JeanTrail database
-- This file contains sample data for testing and development

-- Insert sample users
INSERT INTO users (username, email, password_hash, first_name, last_name) VALUES
('admin', 'admin@jeantrail.ai', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBdXwtGtrmu.I.', 'Admin', 'User'),
('john_doe', 'john@example.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBdXwtGtrmu.I.', 'John', 'Doe'),
('jane_smith', 'jane@example.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBdXwtGtrmu.I.', 'Jane', 'Smith');

-- Insert user preferences
INSERT INTO user_preferences (user_id, theme, language, timezone) VALUES
((SELECT id FROM users WHERE username = 'admin'), 'dark', 'en', 'UTC'),
((SELECT id FROM users WHERE username = 'john_doe'), 'light', 'en', 'America/New_York'),
((SELECT id FROM users WHERE username = 'jane_smith'), 'light', 'en', 'Europe/London');

-- Insert sample workspaces
INSERT INTO workspaces (user_id, name, layout_config, is_default) VALUES
((SELECT id FROM users WHERE username = 'admin'), 'Default Workspace', '{"panes": [{"zone": "web", "url": "https://github.com"}]}', true),
((SELECT id FROM users WHERE username = 'john_doe'), 'Development Workspace', '{"panes": [{"zone": "local", "type": "ide"}, {"zone": "proxy", "url": "http://localhost:3000"}]}', true),
((SELECT id FROM users WHERE username = 'jane_smith'), 'Research Workspace', '{"panes": [{"zone": "web", "url": "https://scholar.google.com"}, {"zone": "mobile", "app": "notion"}]}', true);

-- Insert sample AI models
INSERT INTO ai_models (name, display_name, model_type, backend_type, endpoint_url, model_config, parameters, capabilities, status, is_default) VALUES
('qwen-2.5-72b', 'Qwen 2.5 72B', 'llm', 'local', 'http://localhost:11434/api/generate', '{"provider": "ollama"}', '{"temperature": 0.7, "max_tokens": 2000}', ARRAY['text-generation', 'chat'], 'online', true),
('gpt-4', 'GPT-4', 'llm', 'remote', 'https://api.openai.com/v1/chat/completions', '{"provider": "openai"}', '{"temperature": 0.7, "max_tokens": 4000}', ARRAY['text-generation', 'chat', 'code'], 'online', false),
('stable-diffusion', 'Stable Diffusion', 'image', 'local', 'http://localhost:7860/sdapi/v1/txt2img', '{"provider": "automatic1111"}', '{"steps": 20, "cfg_scale": 7}', ARRAY['text-to-image', 'image-generation'], 'online', false);

-- Insert sample backlog items
INSERT INTO backlog_items (user_id, title, summary, category, priority, status, tags, estimated_hours) VALUES
((SELECT id FROM users WHERE username = 'admin'), 'Implement user authentication', 'Add JWT-based authentication for secure user sessions', 'backend', 'high', 'in_progress', ARRAY['security', 'auth'], 16),
((SELECT id FROM users WHERE username = 'admin'), 'Design mobile app UI', 'Create responsive mobile interface designs', 'frontend', 'medium', 'planned', ARRAY['mobile', 'ui/ux'], 24),
((SELECT id FROM users WHERE username = 'john_doe'), 'Add dark mode support', 'Implement dark theme toggle across all components', 'frontend', 'low', 'idea', ARRAY['theme', 'ui'], 8),
((SELECT id FROM users WHERE username = 'jane_smith'), 'Performance optimization', 'Optimize database queries and add caching', 'backend', 'critical', 'planned', ARRAY['performance', 'database'], 32);

-- Insert sample loyalty ledger entries
INSERT INTO loyalty_ledger (user_id, transaction_type, source, points, direction, balance_after, description) VALUES
((SELECT id FROM users WHERE username = 'admin'), 'registration', 'engagement', 100, 'earn', 100, 'Welcome bonus for registration'),
((SELECT id FROM users WHERE username = 'john_doe'), 'registration', 'engagement', 100, 'earn', 100, 'Welcome bonus for registration'),
((SELECT id FROM users WHERE username = 'jane_smith'), 'registration', 'engagement', 100, 'earn', 100, 'Welcome bonus for registration'),
((SELECT id FROM users WHERE username = 'john_doe'), 'daily_login', 'engagement', 10, 'earn', 110, 'Daily login bonus'),
((SELECT id FROM users WHERE username = 'john_doe'), 'content_creation', 'content', 25, 'earn', 135, 'Created backlog item');

-- Insert sample rewards
INSERT INTO rewards (name, description, points_cost, reward_type, reward_value, is_active, quantity_available) VALUES
('Premium Theme Pack', 'Unlock 5 premium themes', 500, 'digital', '{"themes": ["dark-pro", "neon", "minimal", "retro", "cyberpunk"]}', true, NULL),
('API Access', '1 month premium API access', 1000, 'subscription', '{"duration_days": 30, "tier": "premium"}', true, 50),
('Custom Avatar', 'Personalized avatar design', 250, 'digital', '{"type": "custom_avatar"}', true, NULL),
('Early Access', 'Get early access to new features', 750, 'access', '{"duration_days": 90}', true, 100);

-- Insert sample plugins
INSERT INTO plugins (name, display_name, description, version, author, manifest, permissions, is_active, is_system) VALUES
('hello-ai', 'Hello AI Assistant', 'A simple AI assistant plugin', '1.0.0', 'JeanTrail Team', '{"permissions": ["jean.chat", "ui.panel"], "entry": "/index.html"}', ARRAY['jean.chat', 'ui.panel'], true, false),
('theme-switcher', 'Theme Switcher', 'Quick theme switching plugin', '1.2.0', 'JeanTrail Team', '{"permissions": ["ui.panel"], "entry": "/index.html"}', ARRAY['ui.panel'], false, false),
('system-monitor', 'System Monitor', 'Monitor system resources', '2.0.0', 'JeanTrail Team', '{"permissions": ["system.read"], "entry": "/index.html"}', ARRAY['system.read'], false, true);

-- Insert sample integrations
INSERT INTO integrations (name, integration_type, config, is_active) VALUES
('n8n-workflows', 'n8n', '{"webhook_url": "https://n8n.example.com/webhook/jeantrail", "api_key": "n8n_key_123"}', true),
('colab-video', 'colab', '{"notebook_url": "https://colab.research.google.com/drive/video_gen", "api_key": "colab_key_456"}', false),
('gradio-apps', 'gradio', '{"app_url": "https://gradio.app/jeantrail", "api_key": "gradio_key_789"}', false);

-- Insert sample privacy settings
INSERT INTO privacy_settings (user_id, setting_key, setting_value, category) VALUES
((SELECT id FROM users WHERE username = 'admin'), 'data_collection', '{"analytics": true, "crash_reports": true, "usage_statistics": false}', 'data_collection'),
((SELECT id FROM users WHERE username = 'admin'), 'sharing', '{"profile_visibility": "public", "activity_sharing": false, "third_party_sharing": false}', 'sharing'),
((SELECT id FROM users WHERE username = 'john_doe'), 'data_collection', '{"analytics": false, "crash_reports": true, "usage_statistics": false}', 'data_collection'),
((SELECT id FROM users WHERE username = 'john_doe'), 'sharing', '{"profile_visibility": "private", "activity_sharing": false, "third_party_sharing": false}', 'sharing');

-- Insert sample consent records
INSERT INTO consent_records (user_id, consent_type, version, granted, metadata) VALUES
((SELECT id FROM users WHERE username = 'admin'), 'data_processing', '1.0', true, '{"purpose": "service_functionality", "mandatory": true}'),
((SELECT id FROM users WHERE username = 'admin'), 'analytics', '1.0', true, '{"purpose": "improvement", "mandatory": false}'),
((SELECT id FROM users WHERE username = 'john_doe'), 'data_processing', '1.0', true, '{"purpose": "service_functionality", "mandatory": true}'),
((SELECT id FROM users WHERE username = 'john_doe'), 'analytics', '1.0', false, '{"purpose": "improvement", "mandatory": false}');

-- Insert sample video projects
INSERT INTO video_projects (user_id, title, description, storyboard, status, job_config, progress) VALUES
((SELECT id FROM users WHERE username = 'admin'), 'Sunset Beach Video', 'A beautiful sunset at the beach', '[{"id": "scene_1", "title": "Opening Scene", "description": "Wide shot of beach at sunset", "duration_seconds": 30, "prompt": "Beautiful sunset over calm ocean waves", "style": "photorealistic"}]', 'completed', '{"model": "stable-diffusion", "frames_per_second": 30}', 100),
((SELECT id FROM users WHERE username = 'jane_smith'), 'Product Showcase', 'Product demonstration video', '[{"id": "scene_1", "title": "Product Intro", "description": "Product introduction", "duration_seconds": 15, "prompt": "Modern product showcase", "style": "commercial"}]', 'processing', '{"model": "stable-diffusion", "frames_per_second": 24}', 45);

-- Insert sample delivery drivers
INSERT INTO delivery_drivers (user_id, name, phone, email, vehicle_type, vehicle_plate, license_number, is_active, rating, total_deliveries, status) VALUES
((SELECT id FROM users WHERE username = 'john_doe'), 'John Smith', '+1234567890', 'john.smith@example.com', 'motorcycle', 'ABC123', 'DL123456', true, 4.8, 156, 'available'),
((SELECT id FROM users WHERE username = 'jane_smith'), 'Maria Garcia', '+1234567891', 'maria.garcia@example.com', 'car', 'XYZ789', 'DL789012', true, 4.9, 234, 'busy');

-- Insert sample delivery vehicles
INSERT INTO delivery_vehicles (driver_id, make, model, year, color, license_plate, vehicle_type, capacity_kg, is_active) VALUES
((SELECT id FROM delivery_drivers WHERE name = 'John Smith'), 'Honda', 'CBR600', 2021, 'Red', 'ABC123', 'motorcycle', 10.0, true),
((SELECT id FROM delivery_drivers WHERE name = 'Maria Garcia'), 'Toyota', 'Camry', 2022, 'Blue', 'XYZ789', 'car', 200.0, true);

-- Insert sample local hub rooms
INSERT INTO local_hub_rooms (room_code, name, created_by, is_private, max_participants) VALUES
('ABCDEF', 'JeanTrail Developers', (SELECT id FROM users WHERE username = 'admin'), false, 10),
('GHIJKL', 'Private Chat', (SELECT id FROM users WHERE username = 'john_doe'), true, 5);

-- Insert sample local hub participants
INSERT INTO local_hub_participants (room_id, user_id, peer_id, role) VALUES
((SELECT id FROM local_hub_rooms WHERE room_code = 'ABCDEF'), (SELECT id FROM users WHERE username = 'admin'), 'peer_admin_123', 'host'),
((SELECT id FROM local_hub_rooms WHERE room_code = 'ABCDEF'), (SELECT id FROM users WHERE username = 'john_doe'), 'peer_john_456', 'participant'),
((SELECT id FROM local_hub_rooms WHERE room_code = 'GHIJKL'), (SELECT id FROM users WHERE username = 'john_doe'), 'peer_john_private_789', 'host');

-- Insert sample API discovery logs
INSERT INTO api_discovery_logs (domain, method, url, headers, response_status, processed) VALUES
('api.github.com', 'GET', 'https://api.github.com/user/repos', '{"Authorization": "Bearer token123", "User-Agent": "JeanTrail"}', 200, true),
('api.openai.com', 'POST', 'https://api.openai.com/v1/completions', '{"Authorization": "Bearer sk-...", "Content-Type": "application/json"}', 200, true),
('jsonplaceholder.typicode.com', 'GET', 'https://jsonplaceholder.typicode.com/posts/1', '{"Accept": "application/json"}', 200, false);

-- Insert sample audit logs
INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details, ip_address, user_agent, risk_score) VALUES
((SELECT id FROM users WHERE username = 'admin'), 'login', 'user', (SELECT id FROM users WHERE username = 'admin'), '{"method": "password", "success": true}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 5),
((SELECT id FROM users WHERE username = 'john_doe'), 'create_workspace', 'workspace', (SELECT id FROM workspaces WHERE name = 'Development Workspace'), '{"name": "Development Workspace"}', '192.168.1.100', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 10),
((SELECT id FROM users WHERE username = 'jane_smith'), 'failed_login', 'user', (SELECT id FROM users WHERE username = 'jane_smith'), '{"method": "password", "success": false, "reason": "invalid_password"}', '10.0.0.5', 'Mozilla/5.0 (X11; Linux x86_64)', 25);

COMMIT;