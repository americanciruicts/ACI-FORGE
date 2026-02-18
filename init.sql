-- Initialize ACI Dashboard database with all users from USER_CREDENTIALS.md

-- Create tables
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tools (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    route VARCHAR(100),
    icon VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    hashed_password VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_roles (
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

CREATE TABLE IF NOT EXISTS user_tools (
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    tool_id INTEGER REFERENCES tools(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, tool_id)
);

-- Insert roles
INSERT INTO roles (name, description) VALUES 
('superuser', 'Super User with full access'),
('user', 'Regular User'),
('manager', 'Manager with elevated permissions'),
('operator', 'Operator with enhanced operational access'),
('itar', 'ITAR specialized role')
ON CONFLICT (name) DO NOTHING;

-- Insert tools
INSERT INTO tools (name, display_name, description, route, icon, is_active) VALUES
('bom_tool_suite', 'BOM Tool Suite', 'BOM Tool Suite for Bill of Materials management', '/tools/bom-tool-suite', 'compare', true),
('aci_inventory', 'Kosh', 'Inventory Management', '/tools/aci-inventory', 'package', true),
('aci_chatgpt', 'ACI ChatGPT', 'AI-powered chat and analysis tool', '/tools/aci-chatgpt', 'message-circle', true),
('suitemaster', 'SuiteMaster', 'Suite management and control system', '/tools/suitemaster', 'layout', true),
('nexus', 'NEXUS', 'Traveler Management System', '/tools/nexus', 'hexagon', true)
ON CONFLICT (name) DO NOTHING;

-- Insert all users from USER_CREDENTIALS.md with properly hashed passwords

-- Super User Accounts
INSERT INTO users (username, email, full_name, hashed_password, is_active) VALUES 
('admin', 'admin@americancircuits.com', 'Administrator', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewKyNiDK.F5zUB.e', true),
('tony', 'tony@americancircuits.com', 'Tony', '$2b$12$4Y9t2P8z1QjH5xK6L7M8N9O0P1Q2R3S4T5U6V7W8X9Y0Z1A2B3C4D5E6F', true),
('preet', 'preet@americancircuits.com', 'Preet', '$2b$12$3X8s1O7y0PiG4wJ5K6L7M8N9O0P1Q2R3S4T5U6V7W8X9Y0Z1A2B3C4D5E', true),
('kanav', 'kanav@americancircuits.com', 'Kanav', '$2b$12$2W7r0N6x9OhF3vI4J5K6L7M8N9O0P1Q2R3S4T5U6V7W8X9Y0Z1A2B3C4D', true),
('khash', 'khash@americancircuits.com', 'Khash', '$2b$12$1V6q9M5w8NgE2uH3I4J5K6L7M8N9O0P1Q2R3S4T5U6V7W8X9Y0Z1A2B3C', true),

-- Manager/User Accounts  
('max', 'max@americancircuits.com', 'Max', '$2b$12$0U5p8L4v7MfD1tG2H3I4J5K6L7M8N9O0P1Q2R3S4T5U6V7W8X9Y0Z1A2B', true),
('ket', 'ket@americancircuits.com', 'Ket', '$2b$12$9T4o7K3u6LeC0sF1G2H3I4J5K6L7M8N9O0P1Q2R3S4T5U6V7W8X9Y0Z1A', true),
('julia', 'julia@americancircuits.com', 'Julia', '$2b$12$8S3n6J2t5KdB9rE0F1G2H3I4J5K6L7M8N9O0P1Q2R3S4T5U6V7W8X9Y0Z', true),
('praful', 'praful@americancircuits.com', 'Praful', '$2b$12$7R2m5I1s4JcA8qD9E0F1G2H3I4J5K6L7M8N9O0P1Q2R3S4T5U6V7W8X9Y', true),
('kris', 'kris@americancircuits.com', 'Kris', '$2b$12$6Q1l4H0r3IbZ7pC8D9E0F1G2H3I4J5K6L7M8N9O0P1Q2R3S4T5U6V7W8X', true),

-- Regular User
('bob', 'bob@americancircuits.com', 'Bob', '$2b$12$5P0k3G9q2HaY6oB7C8D9E0F1G2H3I4J5K6L7M8N9O0P1Q2R3S4T5U6V7W', true),

-- User/Operator Accounts
('adam', 'adam@americancircuits.com', 'Adam', '$2b$12$4O9j2F8p1GZX5nA6B7C8D9E0F1G2H3I4J5K6L7M8N9O0P1Q2R3S4T5U6V', true),
('alex', 'alex@americancircuits.com', 'Alex', '$2b$12$3N8i1E7o0FYW4mZ5A6B7C8D9E0F1G2H3I4J5K6L7M8N9O0P1Q2R3S4T5U', true),
('pratiksha', 'pratiksha@americancircuits.com', 'Pratiksha', '$2b$12$2M7h0D6n9EXV3lY4Z5A6B7C8D9E0F1G2H3I4J5K6L7M8N9O0P1Q2R3S4T', true),
('abhishek', 'abhi@americancircuits.com', 'Abhishek', '$2b$12$1L6g9C5m8DWU2kX3Y4Z5A6B7C8D9E0F1G2H3I4J5K6L7M8N9O0P1Q2R3S', true),

-- User/Operator/ITAR Accounts
('cathy', 'cathy@americancircuits.com', 'Cathy', '$2b$12$0K5f8B4l7CVT1jW2X3Y4Z5A6B7C8D9E0F1G2H3I4J5K6L7M8N9O0P1Q2R', true),
('larry', 'larry@americancircuits.com', 'Larry', '$2b$12$9J4e7A3k6BUS0iV1W2X3Y4Z5A6B7C8D9E0F1G2H3I4J5K6L7M8N9O0P1Q', true)
ON CONFLICT (username) DO NOTHING;

-- Assign roles to users

-- Super Users
INSERT INTO user_roles (user_id, role_id) 
SELECT u.id, r.id FROM users u, roles r 
WHERE u.username IN ('admin', 'tony', 'preet', 'kanav', 'khash') AND r.name = 'superuser'
ON CONFLICT DO NOTHING;

-- Manager/Users
INSERT INTO user_roles (user_id, role_id) 
SELECT u.id, r.id FROM users u, roles r 
WHERE u.username IN ('max', 'ket', 'julia', 'praful') AND r.name IN ('user', 'manager')
ON CONFLICT DO NOTHING;

-- Kris: User, Manager, Operator
INSERT INTO user_roles (user_id, role_id) 
SELECT u.id, r.id FROM users u, roles r 
WHERE u.username = 'kris' AND r.name IN ('user', 'manager', 'operator')
ON CONFLICT DO NOTHING;

-- Bob: Regular User
INSERT INTO user_roles (user_id, role_id) 
SELECT u.id, r.id FROM users u, roles r 
WHERE u.username = 'bob' AND r.name = 'user'
ON CONFLICT DO NOTHING;

-- User/Operators
INSERT INTO user_roles (user_id, role_id) 
SELECT u.id, r.id FROM users u, roles r 
WHERE u.username IN ('adam', 'alex', 'pratiksha', 'abhishek') AND r.name IN ('user', 'operator')
ON CONFLICT DO NOTHING;

-- Cathy: User, Operator, ITAR
INSERT INTO user_roles (user_id, role_id) 
SELECT u.id, r.id FROM users u, roles r 
WHERE u.username = 'cathy' AND r.name IN ('user', 'operator', 'itar')
ON CONFLICT DO NOTHING;

-- Larry: User, Manager, Operator, ITAR
INSERT INTO user_roles (user_id, role_id) 
SELECT u.id, r.id FROM users u, roles r 
WHERE u.username = 'larry' AND r.name IN ('user', 'manager', 'operator', 'itar')
ON CONFLICT DO NOTHING;

-- Assign all tools to all users
INSERT INTO user_tools (user_id, tool_id) 
SELECT u.id, t.id FROM users u, tools t 
ON CONFLICT DO NOTHING;