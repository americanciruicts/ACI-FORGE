#!/usr/bin/env python3
import bcrypt

# All passwords from USER_CREDENTIALS.md
passwords = {
    'admin': 'admin',
    'tony': 'AhFnrAASWN0a',
    'preet': 'AaWtgE1hRECG',
    'kanav': 'XCSkRBUbQKdY',
    'khash': '9OHRzT69Y3AZ',
    'max': 'CCiYxAAxyR0z',
    'ket': 'jzsNCHDdFGJv',
    'julia': 'SkqtODKmrLjW',
    'praful': 'F1Cur8klq4pe',
    'kris': 'RSoX1Qcmc3Tu',
    'bob': 'n6mTWAOhVDda',
    'adam': '5AdsYCEqrrIg',
    'alex': 'zQE3SqCV5zAE',
    'pratiksha': 'hUDcvxtL26I9',
    'abhishek': '2umk93LcQ5cX',
    'cathy': 'KOLCsB4kTzow',
    'larry': 'AaWtgE1hRECG'
}

print("-- Password hashes for init.sql")
for username, password in passwords.items():
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')
    print(f"'{username}': '{hashed}',")