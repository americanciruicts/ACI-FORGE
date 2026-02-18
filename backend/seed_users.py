#!/usr/bin/env python3
import sys
import os
import bcrypt
sys.path.append('/app')

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Database configuration
DATABASE_URL = "postgresql://postgres:postgres@db:5432/acidashboard"

def hash_password(password: str) -> str:
    """Hash password using bcrypt"""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def main():
    engine = create_engine(DATABASE_URL)
    Session = sessionmaker(bind=engine)
    session = Session()
    
    try:
        print("Creating database schema...")
        
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
        
        print("Inserting roles...")
        
        # Insert roles
        session.execute(text("""
        INSERT INTO roles (name, description) VALUES 
        ('superuser', 'Super User with full access'),
        ('user', 'Regular User'),
        ('manager', 'Manager with elevated permissions'),
        ('operator', 'Operator with enhanced operational access'),
        ('itar', 'ITAR specialized role')
        ON CONFLICT (name) DO NOTHING;
        """))
        
        print("Inserting tools...")
        
        # Insert tools
        session.execute(text("""
        INSERT INTO tools (name, display_name, description, route, icon, is_active) VALUES 
        ('compare_tool', 'BOM Compare', 'Compare Bill of Materials', '/tools/compare', 'compare', true),
        ('inventory_tool', 'Kosh', 'Inventory Management', '/tools/inventory', 'package', true)
        ON CONFLICT (name) DO NOTHING;
        """))
        
        session.commit()
        
        print("Creating all users from USER_CREDENTIALS.md...")
        
        # All users with their credentials from USER_CREDENTIALS.md
        users_data = [
            # Super Users
            ('admin', 'admin', 'Administrator', 'admin@americancircuits.com', ['superuser']),
            ('tony', 'AhFnrAASWN0a', 'Tony', 'tony@americancircuits.com', ['superuser']),
            ('preet', 'AaWtgE1hRECG', 'Preet', 'preet@americancircuits.com', ['superuser']),
            ('kanav', 'XCSkRBUbQKdY', 'Kanav', 'kanav@americancircuits.com', ['superuser']),
            ('khash', '9OHRzT69Y3AZ', 'Khash', 'khash@americancircuits.com', ['superuser']),
            
            # Manager/Users
            ('max', 'CCiYxAAxyR0z', 'Max', 'max@americancircuits.com', ['user', 'manager']),
            ('ket', 'jzsNCHDdFGJv', 'Ket', 'ket@americancircuits.com', ['user', 'manager']),
            ('julia', 'SkqtODKmrLjW', 'Julia', 'julia@americancircuits.com', ['user', 'manager']),
            ('praful', 'F1Cur8klq4pe', 'Praful', 'praful@americancircuits.com', ['user', 'manager']),
            ('kris', 'RSoX1Qcmc3Tu', 'Kris', 'kris@americancircuits.com', ['user', 'manager', 'operator']),
            
            # Regular User
            ('bob', 'n6mTWAOhVDda', 'Bob', 'bob@americancircuits.com', ['user']),
            
            # User/Operators
            ('adam', '5AdsYCEqrrIg', 'Adam', 'adam@americancircuits.com', ['user', 'operator']),
            ('alex', 'zQE3SqCV5zAE', 'Alex', 'alex@americancircuits.com', ['user', 'operator']),
            ('pratiksha', 'hUDcvxtL26I9', 'Pratiksha', 'pratiksha@americancircuits.com', ['user', 'operator']),
            ('abhishek', '2umk93LcQ5cX', 'Abhishek', 'abhi@americancircuits.com', ['user', 'operator']),
            
            # User/Operator/ITAR
            ('cathy', 'KOLCsB4kTzow', 'Cathy', 'cathy@americancircuits.com', ['user', 'operator', 'itar']),
            ('larry', 'AaWtgE1hRECG', 'Larry', 'larry@americancircuits.com', ['user', 'manager', 'operator', 'itar']),
        ]
        
        for username, password, full_name, email, roles in users_data:
            print(f"Creating user: {username}")
            
            # Hash the password
            hashed_password = hash_password(password)
            
            # Insert or update user
            session.execute(text("""
            INSERT INTO users (username, email, full_name, hashed_password, is_active) 
            VALUES (:username, :email, :full_name, :hashed_password, true)
            ON CONFLICT (username) DO UPDATE SET 
                email = EXCLUDED.email,
                full_name = EXCLUDED.full_name,
                hashed_password = EXCLUDED.hashed_password,
                is_active = EXCLUDED.is_active;
            """), {
                "username": username,
                "email": email,
                "full_name": full_name,
                "hashed_password": hashed_password
            })
            
            # Clear existing roles for this user
            session.execute(text("""
            DELETE FROM user_roles WHERE user_id = (SELECT id FROM users WHERE username = :username);
            """), {"username": username})
            
            # Assign roles
            for role_name in roles:
                session.execute(text("""
                INSERT INTO user_roles (user_id, role_id) 
                SELECT u.id, r.id FROM users u, roles r 
                WHERE u.username = :username AND r.name = :role_name;
                """), {"username": username, "role_name": role_name})
            
            # Assign all tools to all users (as per your original design)
            session.execute(text("""
            INSERT INTO user_tools (user_id, tool_id) 
            SELECT u.id, t.id FROM users u, tools t 
            WHERE u.username = :username
            ON CONFLICT DO NOTHING;
            """), {"username": username})
        
        session.commit()
        
        print("\n" + "="*60)
        print("✅ DATABASE SUCCESSFULLY SEEDED WITH ALL USERS!")
        print("="*60)
        print("\n🔥 Super User Accounts:")
        print("  Username: admin       | Password: admin")
        print("  Username: tony        | Password: AhFnrAASWN0a")
        print("  Username: preet       | Password: AaWtgE1hRECG")
        print("  Username: kanav       | Password: XCSkRBUbQKdY")
        print("  Username: khash       | Password: 9OHRzT69Y3AZ")
        
        print("\n👔 Manager/User Accounts:")
        print("  Username: max         | Password: CCiYxAAxyR0z")
        print("  Username: ket         | Password: jzsNCHDdFGJv")
        print("  Username: julia       | Password: SkqtODKmrLjW")
        print("  Username: praful      | Password: F1Cur8klq4pe")
        print("  Username: kris        | Password: RSoX1Qcmc3Tu")
        
        print("\n👤 Regular User:")
        print("  Username: bob         | Password: n6mTWAOhVDda")
        
        print("\n⚙️  User/Operator Accounts:")
        print("  Username: adam        | Password: 5AdsYCEqrrIg")
        print("  Username: alex        | Password: zQE3SqCV5zAE")
        print("  Username: pratiksha   | Password: hUDcvxtL26I9")
        print("  Username: abhishek    | Password: 2umk93LcQ5cX")
        
        print("\n🏢 User/Operator/ITAR Accounts:")
        print("  Username: cathy       | Password: KOLCsB4kTzow")
        print("  Username: larry       | Password: AaWtgE1hRECG")
        
        print("\n" + "="*60)
        print(f"Total Users Created: {len(users_data)}")
        print("All passwords are properly hashed with bcrypt!")
        print("="*60)
        
    except Exception as e:
        print(f"❌ Error: {e}")
        session.rollback()
        return False
    finally:
        session.close()
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)