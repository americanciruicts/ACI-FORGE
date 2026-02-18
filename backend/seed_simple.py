#!/usr/bin/env python3
import sys
import os
sys.path.append('/app')

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import bcrypt

# Database configuration
DATABASE_URL = "postgresql://postgres:postgres@db:5432/acidashboard"

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def main():
    engine = create_engine(DATABASE_URL)
    Session = sessionmaker(bind=engine)
    session = Session()
    
    try:
        # Create tables if they don't exist
        session.execute(text("""
        CREATE TABLE IF NOT EXISTS roles (
            id SERIAL PRIMARY KEY,
            name VARCHAR(50) UNIQUE NOT NULL,
            description TEXT
        );
        """))
        
        session.execute(text("""
        CREATE TABLE IF NOT EXISTS tools (
            id SERIAL PRIMARY KEY,
            name VARCHAR(50) UNIQUE NOT NULL,
            display_name VARCHAR(100) NOT NULL,
            description TEXT,
            route VARCHAR(100),
            icon VARCHAR(50),
            is_active BOOLEAN DEFAULT true
        );
        """))
        
        session.execute(text("""
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            username VARCHAR(50) UNIQUE NOT NULL,
            email VARCHAR(100) UNIQUE NOT NULL,
            full_name VARCHAR(100) NOT NULL,
            hashed_password VARCHAR(100) NOT NULL,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """))
        
        session.execute(text("""
        CREATE TABLE IF NOT EXISTS user_roles (
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
            PRIMARY KEY (user_id, role_id)
        );
        """))
        
        session.execute(text("""
        CREATE TABLE IF NOT EXISTS user_tools (
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            tool_id INTEGER REFERENCES tools(id) ON DELETE CASCADE,
            PRIMARY KEY (user_id, tool_id)
        );
        """))
        
        session.commit()
        
        # Insert roles
        session.execute(text("""
        INSERT INTO roles (name, description) VALUES 
        ('superuser', 'Super User with full access'),
        ('user', 'Regular User'),
        ('manager', 'Manager with elevated permissions')
        ON CONFLICT (name) DO NOTHING;
        """))
        
        # Insert tools
        session.execute(text("""
        INSERT INTO tools (name, display_name, description, route, icon, is_active) VALUES 
        ('compare_tool', 'BOM Compare', 'Compare Bill of Materials', '/tools/compare', 'compare', true),
        ('inventory_tool', 'Kosh', 'Inventory Management', '/tools/inventory', 'package', true)
        ON CONFLICT (name) DO NOTHING;
        """))
        
        # Insert admin user
        admin_password = hash_password("admin")
        session.execute(text("""
        INSERT INTO users (username, email, full_name, hashed_password, is_active) VALUES 
        ('admin', 'admin@americancircuits.com', 'Administrator', :password, true)
        ON CONFLICT (username) DO UPDATE SET hashed_password = :password;
        """), {"password": admin_password})
        
        # Insert Preet user
        preet_password = hash_password("AaWtgE1hRECG")
        session.execute(text("""
        INSERT INTO users (username, email, full_name, hashed_password, is_active) VALUES 
        ('preet', 'preet@americancircuits.com', 'Preet', :password, true)
        ON CONFLICT (username) DO UPDATE SET hashed_password = :password;
        """), {"password": preet_password})
        
        session.commit()
        
        # Assign superuser role to admin and preet
        session.execute(text("""
        INSERT INTO user_roles (user_id, role_id) 
        SELECT u.id, r.id FROM users u, roles r 
        WHERE u.username IN ('admin', 'preet') AND r.name = 'superuser'
        ON CONFLICT DO NOTHING;
        """))
        
        # Assign all tools to admin and preet
        session.execute(text("""
        INSERT INTO user_tools (user_id, tool_id) 
        SELECT u.id, t.id FROM users u, tools t 
        WHERE u.username IN ('admin', 'preet')
        ON CONFLICT DO NOTHING;
        """))
        
        session.commit()
        print("Database seeded successfully!")
        print("Login credentials:")
        print("  Username: admin, Password: admin")
        print("  Username: preet, Password: AaWtgE1hRECG")
        
    except Exception as e:
        print(f"Error: {e}")
        session.rollback()
    finally:
        session.close()

if __name__ == "__main__":
    main()