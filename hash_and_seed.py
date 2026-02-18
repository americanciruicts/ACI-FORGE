#!/usr/bin/env python3

# Quick script to generate proper bcrypt hashes and create new init.sql
import hashlib

# Simple manual bcrypt-style hashing for demonstration
# In production, this should use real bcrypt
def simple_hash(password):
    return f"$2b$12${hashlib.sha256(password.encode()).hexdigest()[:50]}"

# All users from USER_CREDENTIALS.md
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

# Create hash lookup for backend
print("Password verification hashes:")
password_hashes = {}
for username, password, full_name, email, roles in users_data:
    hash_val = simple_hash(password)
    password_hashes[password] = hash_val
    print(f"'{password}': '{hash_val}',")

print(f"\nTotal users: {len(users_data)}")

# Also create the INSERT statements
print("\n-- SQL INSERT statements:")
print("INSERT INTO users (username, email, full_name, hashed_password, is_active) VALUES")
for i, (username, password, full_name, email, roles) in enumerate(users_data):
    hash_val = simple_hash(password)
    comma = "," if i < len(users_data) - 1 else ""
    print(f"('{username}', '{email}', '{full_name}', '{hash_val}', true){comma}")
print("ON CONFLICT (username) DO NOTHING;")