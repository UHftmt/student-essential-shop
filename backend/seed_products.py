import sqlite3
import os

PRODUCTS = [
    # ── Electronics (12 items) ──
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
        "name": "Texas Instruments TI-84 Plus CE",
        "price": 129.99,
        "image": "https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?auto=format&fit=crop&q=80&w=800",
        "category": "Electronics",
        "stock": 50,
        "description": "Color graphing calculator. A must-have for math and science classes.",
        "featured": 0,
        "onSale": 0
    },
    {
        "name": "Logitech MX Master 3S Mouse",
        "price": 99.99,
        "image": "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&q=80&w=800",
        "category": "Electronics",
        "stock": 35,
        "description": "Ergonomic wireless mouse with 8K DPI tracking and quiet clicks. Perfect for long study sessions.",
        "featured": 0,
        "onSale": 1
    },
    {
        "name": "Samsung T7 Portable SSD 1TB",
        "price": 109.99,
        "image": "https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?auto=format&fit=crop&q=80&w=800",
        "category": "Electronics",
        "stock": 28,
        "description": "Ultra-fast external storage with speeds up to 1,050 MB/s. Compact and shock-resistant.",
        "featured": 0,
        "onSale": 0
    },
    {
        "name": "Sony WH-1000XM5 Headphones",
        "price": 349.99,
        "image": "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?auto=format&fit=crop&q=80&w=800",
        "category": "Electronics",
        "stock": 18,
        "description": "Industry-leading noise cancellation with exceptional sound quality and 30-hour battery life.",
        "featured": 1,
        "onSale": 0
    },
    {
        "name": "Anker 65W USB-C Charger",
        "price": 35.99,
        "image": "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&q=80&w=800",
        "category": "Electronics",
        "stock": 75,
        "description": "Compact GaN charger with 3 ports. Charge your laptop, phone, and tablet simultaneously.",
        "featured": 0,
        "onSale": 1
    },
    {
        "name": "Logitech C920 HD Webcam",
        "price": 69.99,
        "image": "https://images.unsplash.com/photo-1587826080692-f439cd0b70da?auto=format&fit=crop&q=80&w=800",
        "category": "Electronics",
        "stock": 40,
        "description": "Full HD 1080p webcam with stereo audio. Great for online classes and video calls.",
        "featured": 0,
        "onSale": 0
    },
    {
        "name": "Apple Watch SE",
        "price": 249.00,
        "image": "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?auto=format&fit=crop&q=80&w=800",
        "category": "Electronics",
        "stock": 22,
        "description": "Track your fitness, stay connected, and manage your schedule right from your wrist.",
        "featured": 0,
        "onSale": 1
    },
    {
        "name": "Kindle Paperwhite",
        "price": 139.99,
        "image": "https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&q=80&w=800",
        "category": "Electronics",
        "stock": 30,
        "description": "6.8-inch display with adjustable warm light. Waterproof with 10 weeks of battery life.",
        "featured": 0,
        "onSale": 0
    },
    {
        "name": "USB-C Hub 7-in-1",
        "price": 39.99,
        "image": "https://images.unsplash.com/photo-1625842268584-8f3296236761?auto=format&fit=crop&q=80&w=800",
        "category": "Electronics",
        "stock": 55,
        "description": "HDMI 4K, USB 3.0, SD card reader, and PD charging. Essential for modern laptops.",
        "featured": 0,
        "onSale": 0
    },

    # ── Stationery (12 items) ──
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
        "name": "Five Star 5-Subject Notebook",
        "price": 12.99,
        "image": "https://images.unsplash.com/photo-1572726729207-a78d6feb18d7?auto=format&fit=crop&q=80&w=800",
        "category": "Stationery",
        "stock": 90,
        "description": "College-ruled, 200 sheets. Durable poly cover and dividers for organized note-taking.",
        "featured": 0,
        "onSale": 0
    },
    {
        "name": "Zebra Mildliner Highlighter Set",
        "price": 19.99,
        "image": "https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&q=80&w=800",
        "category": "Stationery",
        "stock": 65,
        "description": "Dual-tip highlighters in 15 mild, eye-friendly colors. Perfect for aesthetic note-taking.",
        "featured": 1,
        "onSale": 0
    },
    {
        "name": "Post-it Super Sticky Notes",
        "price": 8.49,
        "image": "https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&q=80&w=800",
        "category": "Stationery",
        "stock": 120,
        "description": "15 pads, 3x3 inches, assorted bright colors. 2X the sticking power of ordinary notes.",
        "featured": 0,
        "onSale": 1
    },
    {
        "name": "Staedtler Mechanical Pencil Set",
        "price": 11.49,
        "image": "https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&q=80&w=800",
        "category": "Stationery",
        "stock": 70,
        "description": "0.5mm and 0.7mm pencils with erasers. Lightweight metal body for precise writing.",
        "featured": 0,
        "onSale": 0
    },
    {
        "name": "3-Ring Binder Combo Pack",
        "price": 16.99,
        "image": "https://images.unsplash.com/photo-1586075010923-2dd4570fb338?auto=format&fit=crop&q=80&w=800",
        "category": "Stationery",
        "stock": 55,
        "description": "Pack of 4 binders in assorted colors with 100 sheet protectors. 1.5-inch rings.",
        "featured": 0,
        "onSale": 0
    },
    {
        "name": "Tombow Dual Brush Pen Set",
        "price": 29.99,
        "image": "https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&q=80&w=800",
        "category": "Stationery",
        "stock": 40,
        "description": "10 flexible brush tip pens. Blendable, water-based ink for lettering and art projects.",
        "featured": 0,
        "onSale": 1
    },
    {
        "name": "Leuchtturm1917 Dotted Journal",
        "price": 24.99,
        "image": "https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&q=80&w=800",
        "category": "Stationery",
        "stock": 45,
        "description": "249 numbered pages with dot grid. Includes table of contents and index. Ideal for bullet journaling.",
        "featured": 0,
        "onSale": 0
    },
    {
        "name": "Pilot FriXion Erasable Pens",
        "price": 13.49,
        "image": "https://images.unsplash.com/photo-1585336261022-680e295ce3fe?auto=format&fit=crop&q=80&w=800",
        "category": "Stationery",
        "stock": 80,
        "description": "Pack of 6 erasable gel pens. Write, erase, and re-write without damage to the page.",
        "featured": 0,
        "onSale": 0
    },
    {
        "name": "Whiteboard Markers 12-Pack",
        "price": 9.99,
        "image": "https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&q=80&w=800",
        "category": "Stationery",
        "stock": 95,
        "description": "Low-odor dry erase markers in 12 vivid colors. Fine tip for detailed diagrams.",
        "featured": 0,
        "onSale": 0
    },

    # ── Accessories (13 items) ──
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
        "name": "Herschel Pop Quiz Lunch Bag",
        "price": 34.99,
        "image": "https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?auto=format&fit=crop&q=80&w=800",
        "category": "Accessories",
        "stock": 40,
        "description": "Insulated lunch bag with internal mesh storage sleeve. Durable and stylish design.",
        "featured": 0,
        "onSale": 0
    },
    {
        "name": "Fjällräven Kånken Totepack",
        "price": 110.00,
        "image": "https://images.unsplash.com/photo-1581605405669-fcdf81165b82?auto=format&fit=crop&q=80&w=800",
        "category": "Accessories",
        "stock": 20,
        "description": "Versatile totepack that converts from backpack to tote. Made from durable Vinylon F.",
        "featured": 0,
        "onSale": 0
    },
    {
        "name": "Tile Mate Bluetooth Tracker",
        "price": 24.99,
        "image": "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?auto=format&fit=crop&q=80&w=800",
        "category": "Accessories",
        "stock": 70,
        "description": "Never lose your keys or bag again. 250 ft Bluetooth range and loud built-in speaker.",
        "featured": 0,
        "onSale": 1
    },
    {
        "name": "Laptop Sleeve 14-inch",
        "price": 27.99,
        "image": "https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&q=80&w=800",
        "category": "Accessories",
        "stock": 50,
        "description": "Slim, water-resistant neoprene sleeve with accessory pocket. Fits 13-14 inch laptops.",
        "featured": 0,
        "onSale": 0
    },
    {
        "name": "Blue Light Blocking Glasses",
        "price": 19.99,
        "image": "https://images.unsplash.com/photo-1574258495973-f010dfbb5371?auto=format&fit=crop&q=80&w=800",
        "category": "Accessories",
        "stock": 65,
        "description": "Reduce eye strain during long study sessions. Lightweight frame with clear lenses.",
        "featured": 0,
        "onSale": 0
    },
    {
        "name": "Portable Phone Stand",
        "price": 12.99,
        "image": "https://images.unsplash.com/photo-1586953208448-b95a79798f07?auto=format&fit=crop&q=80&w=800",
        "category": "Accessories",
        "stock": 80,
        "description": "Adjustable aluminum phone and tablet stand. Foldable design fits in your pocket.",
        "featured": 0,
        "onSale": 0
    },
    {
        "name": "Contigo Autoseal Travel Mug",
        "price": 22.99,
        "image": "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&q=80&w=800",
        "category": "Accessories",
        "stock": 45,
        "description": "Spill-proof 16 oz travel mug. Keeps coffee hot for 5 hours. Dishwasher safe.",
        "featured": 0,
        "onSale": 0
    },
    {
        "name": "Canvas Pencil Case",
        "price": 9.99,
        "image": "https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&q=80&w=800",
        "category": "Accessories",
        "stock": 100,
        "description": "Large capacity canvas pouch with dual zippers. Holds 50+ pens and pencils.",
        "featured": 0,
        "onSale": 0
    },
    {
        "name": "Umbrella Compact Windproof",
        "price": 18.99,
        "image": "https://images.unsplash.com/photo-1534309466160-70b22cc6254d?auto=format&fit=crop&q=80&w=800",
        "category": "Accessories",
        "stock": 55,
        "description": "Automatic open/close, reinforced fiberglass ribs. Fits easily in your backpack.",
        "featured": 0,
        "onSale": 1
    },
    {
        "name": "Lanyard with ID Holder",
        "price": 6.99,
        "image": "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?auto=format&fit=crop&q=80&w=800",
        "category": "Accessories",
        "stock": 150,
        "description": "Durable nylon lanyard with detachable badge holder. Perfect for student ID and keys.",
        "featured": 0,
        "onSale": 0
    },
    {
        "name": "Laptop Backpack 17-inch",
        "price": 59.99,
        "image": "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=800",
        "category": "Accessories",
        "stock": 25,
        "description": "Water-resistant backpack with USB charging port and anti-theft pocket. Fits 17-inch laptops.",
        "featured": 0,
        "onSale": 0
    },

    # ── Dorm Essentials (13 items) ──
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
        "name": "Twin XL Sheet Set",
        "price": 34.99,
        "image": "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&q=80&w=800",
        "category": "Dorm Essentials",
        "stock": 50,
        "description": "Ultra-soft microfiber sheets, 4-piece set. Deep pockets fit dorm mattresses perfectly.",
        "featured": 0,
        "onSale": 0
    },
    {
        "name": "Surge Protector Power Strip",
        "price": 24.99,
        "image": "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?auto=format&fit=crop&q=80&w=800",
        "category": "Dorm Essentials",
        "stock": 60,
        "description": "12 outlets, 4 USB ports, 6 ft cord. 4320 joules surge protection for all your devices.",
        "featured": 0,
        "onSale": 1
    },
    {
        "name": "Mini Fridge 3.2 Cu Ft",
        "price": 149.99,
        "image": "https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?auto=format&fit=crop&q=80&w=800",
        "category": "Dorm Essentials",
        "stock": 12,
        "description": "Compact refrigerator with separate freezer compartment. Adjustable thermostat and glass shelves.",
        "featured": 1,
        "onSale": 0
    },
    {
        "name": "Command Strip Hooks Variety Pack",
        "price": 14.99,
        "image": "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?auto=format&fit=crop&q=80&w=800",
        "category": "Dorm Essentials",
        "stock": 90,
        "description": "Damage-free hanging. 16 hooks in assorted sizes. Holds up to 5 lbs each.",
        "featured": 0,
        "onSale": 0
    },
    {
        "name": "Brita Water Filter Pitcher",
        "price": 27.99,
        "image": "https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&q=80&w=800",
        "category": "Dorm Essentials",
        "stock": 35,
        "description": "10-cup capacity with electronic filter indicator. BPA-free and fits in most fridges.",
        "featured": 0,
        "onSale": 0
    },
    {
        "name": "White Noise Machine",
        "price": 19.99,
        "image": "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?auto=format&fit=crop&q=80&w=800",
        "category": "Dorm Essentials",
        "stock": 40,
        "description": "20 soothing sounds including fan, rain, and ocean. Timer and memory function. USB powered.",
        "featured": 0,
        "onSale": 0
    },
    {
        "name": "Over-Door Organizer",
        "price": 16.99,
        "image": "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?auto=format&fit=crop&q=80&w=800",
        "category": "Dorm Essentials",
        "stock": 50,
        "description": "Mesh over-door storage with 5 large pockets. Organize toiletries, snacks, and supplies.",
        "featured": 0,
        "onSale": 0
    },
    {
        "name": "Microwave 0.7 Cu Ft",
        "price": 69.99,
        "image": "https://images.unsplash.com/photo-1585659722983-3a675dabf23d?auto=format&fit=crop&q=80&w=800",
        "category": "Dorm Essentials",
        "stock": 18,
        "description": "700W compact microwave with 10 power levels. One-touch cooking presets.",
        "featured": 0,
        "onSale": 1
    },
    {
        "name": "Shower Caddy Tote",
        "price": 11.99,
        "image": "https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?auto=format&fit=crop&q=80&w=800",
        "category": "Dorm Essentials",
        "stock": 75,
        "description": "Portable mesh shower caddy with 8 pockets. Quick-drying and rust-proof handle.",
        "featured": 0,
        "onSale": 0
    },
    {
        "name": "Clip-On Fan USB",
        "price": 15.99,
        "image": "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?auto=format&fit=crop&q=80&w=800",
        "category": "Dorm Essentials",
        "stock": 55,
        "description": "3-speed USB-powered clip fan with 360° rotation. Quiet motor for desk or bed use.",
        "featured": 0,
        "onSale": 0
    },
    {
        "name": "Fairy String Lights 33ft",
        "price": 10.99,
        "image": "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&q=80&w=800",
        "category": "Dorm Essentials",
        "stock": 85,
        "description": "100 warm white LED lights with 8 modes. USB powered with remote control. Waterproof.",
        "featured": 0,
        "onSale": 1
    },
    {
        "name": "Desktop Whiteboard 12x16",
        "price": 18.99,
        "image": "https://images.unsplash.com/photo-1532619675605-1ede6c2ed2b0?auto=format&fit=crop&q=80&w=800",
        "category": "Dorm Essentials",
        "stock": 40,
        "description": "Double-sided magnetic whiteboard with stand. Includes 4 markers and eraser. Great for to-do lists.",
        "featured": 0,
        "onSale": 0
    },
]


def seed_db():
    conn = None
    try:
        db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'products.db')
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        # Clear existing products so we can re-seed cleanly
        cursor.execute('DELETE FROM products')

        # Reset the auto-increment counter
        cursor.execute("DELETE FROM sqlite_sequence WHERE name='products'")

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
