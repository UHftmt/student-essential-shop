import sqlite3

import os

def init_db():
    # Connect to the SQLite database (this creates it if it doesn't exist)
    db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'products.db')
    conn = sqlite3.connect(db_path)
    
    # Create a cursor object to execute SQL commands
    cursor = conn.cursor()
    
    # Create the products table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            price REAL NOT NULL,
            image TEXT,
            category TEXT,
            stock INTEGER NOT NULL DEFAULT 0,
            description TEXT,
            featured INTEGER NOT NULL DEFAULT 0,
            onSale INTEGER NOT NULL DEFAULT 0
        )
    ''')
    
    # Create the users table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            google_sub TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'customer'
        )
    ''')
    
    # Commit the changes and close the connection
    conn.commit()
    conn.close()
    
    print("Database and 'products' table initialized successfully.")

if __name__ == '__main__':
    init_db()
