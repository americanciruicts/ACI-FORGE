#!/usr/bin/env python3
import bcrypt

# New user passwords
passwords = {
    'receiving': 'keKv!2WXvbzX',  # Theresa
    'shipping': 'Bharat8sp'       # Bharat
}

print("-- Password hashes for new users")
for username, password in passwords.items():
    # Generate salt and hash password
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    print(f"'{username}': '{hashed.decode('utf-8')}',")