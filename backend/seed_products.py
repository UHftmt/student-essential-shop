import sqlite3

PRODUCTS = [
    {
        "name": "MacBook Air M2",
        "price": 999.00,
        "image": "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&q=80&w=800",
        "category": "Electronics",
        "stock": 15,
        "description": "Supercharged by M2, the redesigned MacBook Air is more portable than ever and weighs just 2.7 pounds.",
        "featured": 1,
        "onSale": 0
    },
    {
        "name": "AirPods Pro (2nd Gen)",
        "price": 249.00,
        "image": "https://images.unsplash.com/photo-1606220838315-056192d5e927?auto=format&fit=crop&q=80&w=800",
        "category": "Electronics",
        "stock": 42,
        "description": "Rich, high-quality audio and voice. Industry-leading Active Noise Cancellation.",
        "featured": 1,
        "onSale": 1
    },
    {
        "name": "iPad Air",
        "price": 599.00,
        "image": "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&q=80&w=800",
        "category": "Electronics",
        "stock": 20,
        "description": "Light. Bright. Full of might. The iPad Air features a stunning 10.9-inch Liquid Retina display.",
        "featured": 0,
        "onSale": 0
    },
    {
        "name": "Moleskine Classic Notebook",
        "price": 22.50,
        "image": "https://images.unsplash.com/photo-1531346878377-a541e4b11340?auto=format&fit=crop&q=80&w=800",
        "category": "Stationery",
        "stock": 100,
        "description": "The reliable travel companion, perfect for calculations, thoughts and passing notes.",
        "featured": 0,
        "onSale": 0
    },
    {
        "name": "Muji Gel Ink Pen Set",
        "price": 14.99,
        "image": "https://images.unsplash.com/photo-1585336261022-680e295ce3fe?auto=format&fit=crop&q=80&w=800",
        "category": "Stationery",
        "stock": 85,
        "description": "Smooth writing experience with a comfortable grip. Set of 10 assorted colors.",
        "featured": 0,
        "onSale": 0
    },
    {
        "name": "The North Face Borealis Backpack",
        "price": 99.00,
        "image": "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=800",
        "category": "Accessories",
        "stock": 30,
        "description": "Classic 28-liter backpack with dedicated, highly protective laptop compartment.",
        "featured": 1,
        "onSale": 0
    },
    {
        "name": "Hydro Flask Water Bottle",
        "price": 39.95,
        "image": "https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&q=80&w=800",
        "category": "Accessories",
        "stock": 60,
        "description": "Keep your drinks ice cold for 24 hours or piping hot for 12. 32 oz wide mouth.",
        "featured": 0,
        "onSale": 1
    },
    {
        "name": "LED Desk Lamp with USB Port",
        "price": 29.99,
        "image": "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&q=80&w=800",
        "category": "Dorm Essentials",
        "stock": 45,
        "description": "Dimmable eye-caring table lamp with USB charging port. 3 lighting modes.",
        "featured": 0,
        "onSale": 0
    },
    {
        "name": "Keurig K-Mini Coffee Maker",
        "price": 89.99,
        "image": "https://images.unsplash.com/photo-1517686469429-8bdb88b9f907?auto=format&fit=crop&q=80&w=800",
        "category": "Dorm Essentials",
        "stock": 25,
        "description": "Single serve coffee maker. Fits anywhere, perfect for small dorm rooms.",
        "featured": 1,
        "onSale": 1
    },
    {
        "name": "Texas Instruments TI-84 Plus CE",
        "price": 129.99,
        "image": "https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?auto=format&fit=crop&q=80&w=800",
        "category": "Electronics",
        "stock": 50,
        "description": "Color graphing calculator. A must-have for math and science classes.",
        "featured": 0,
        "onSale": 0
    }
]

import os

def seed_db():
    conn = None
    try:
        db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'products.db')
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # SQL insert statement
        insert_query = '''
            INSERT INTO products (name, price, image, category, stock, description, featured, onSale)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        '''
        
        # Prepare data for insertion
        data_to_insert = [
            (
                p['name'], 
                p['price'], 
                p.get('image', ''), 
                p.get('category', ''), 
                p.get('stock', 0), 
                p.get('description', ''), 
                p.get('featured', 0), 
                p.get('onSale', 0)
            ) 
            for p in PRODUCTS
        ]
        
        # Execute the multiple insert
        cursor.executemany(insert_query, data_to_insert)
        conn.commit()
        
        print(f"Successfully inserted {cursor.rowcount} products into the database.")
        
    except sqlite3.Error as e:
        print(f"Database error occurred: {e}")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
    finally:
        if conn:
            conn.close()

if __name__ == '__main__':
    seed_db()
