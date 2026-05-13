"""
Run Instructions:
1. Make sure you have python installed.
2. Install the required dependencies (consider using a virtual environment):
   pip install flask flask-cors
3. Run the application:
   python app.py
   (Or run using: flask run)
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
import sqlite3
import os
import jwt
import datetime
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from dotenv import load_dotenv

load_dotenv()

from functools import wraps

GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID", "")
JWT_SECRET = os.environ.get("JWT_SECRET", "super-secret-key")
ADMIN_EMAIL_LIST = [e.strip() for e in os.environ.get("ADMIN_EMAIL", "").split(",") if e.strip()]
CORS_ORIGINS = [o.strip() for o in os.environ.get("CORS_ORIGINS", "http://localhost:5173").split(",") if o.strip()]
DEMO_MODE_ENABLED = os.environ.get("DEMO_MODE_ENABLED", "true").lower() == "true"
DEMO_ADMIN_CODE = os.environ.get("DEMO_ADMIN_CODE", "ADMIN_DEMO_2026")

app = Flask(__name__)
# Enable CORS so the React frontend can access this API
CORS(app, resources={r"/api/*": {"origins": CORS_ORIGINS}})

def get_db_connection():
    """Helper function to get a database connection."""
    # Use absolute path for PythonAnywhere
    db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'products.db')
    conn = sqlite3.connect(db_path)
    # This allows us to access columns by name (like a dictionary)
    conn.row_factory = sqlite3.Row
    return conn

def require_role(*allowed_roles):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            auth_header = request.headers.get('Authorization')
            if not auth_header or not auth_header.startswith('Bearer '):
                return jsonify({"error": "Missing or invalid token"}), 401
            
            token = auth_header.split(' ')[1]
            try:
                payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
                user_role = payload.get('role')
                if user_role not in allowed_roles:
                    return jsonify({"error": "Forbidden: wrong role"}), 403
            except jwt.ExpiredSignatureError:
                return jsonify({"error": "Token expired"}), 401
            except jwt.InvalidTokenError:
                return jsonify({"error": "Invalid token"}), 401
                
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def get_current_user_id():
    """Extract user_id from the JWT in the Authorization header.
    Safe to call inside any @require_role-decorated endpoint,
    since the decorator already validated the token."""
    auth_header = request.headers.get('Authorization')
    token = auth_header.split(' ')[1]
    payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
    return payload.get('user_id')

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint to verify the API is running."""
    return jsonify({"status": "ok"})

@app.route('/api/products', methods=['GET'])
def get_products():
    """Returns a list of products, optionally filtered by category and/or search query.
    
    Query parameters:
      - category: filter by exact category name
      - search: search against product name, category, and description (SQL LIKE)
    """
    # 1. Open a connection to the database
    conn = get_db_connection()
    
    # Check for query parameters
    category = request.args.get('category')
    search = request.args.get('search', '').strip()
    page = request.args.get('page', 1, type=int)
    limit = request.args.get('limit', 15, type=int)
    offset = (page - 1) * limit
    
    # 2. Build the query dynamically based on provided filters
    query = 'SELECT * FROM products'
    conditions = []
    params = []
    
    if category:
        conditions.append('category = ?')
        params.append(category)
    
    if search:
        # Search against name, category, and description using LIKE
        conditions.append(
            '(name LIKE ? OR category LIKE ? OR description LIKE ?)'
        )
        like_pattern = f'%{search}%'
        params.extend([like_pattern, like_pattern, like_pattern])
    
    if conditions:
        query += ' WHERE ' + ' AND '.join(conditions)
        
    query += ' LIMIT ? OFFSET ?'
    params.extend([limit, offset])
    
    products = conn.execute(query, tuple(params)).fetchall()
    
    # 3. Close the connection
    conn.close()
    
    # 4. Convert the sqlite3.Row objects to standard Python dictionaries
    products_list = [dict(row) for row in products]
    
    # 5. Return as JSON
    return jsonify(products_list)

@app.route('/api/products/<int:product_id>', methods=['GET'])
def get_product_by_id(product_id):
    """Returns a single product by its ID or a 404 error if not found."""
    # 1. Open a connection to the database
    conn = get_db_connection()
    
    # 2. Execute a query to find the specific product
    # The '?' is a placeholder that safely inserts product_id (prevents SQL injection)
    product = conn.execute('SELECT * FROM products WHERE id = ?', (product_id,)).fetchone()
    
    # 3. Close the connection
    conn.close()
    
    # 4. Check if we found the product
    if product is None:
        # Product wasn't found, return a 404 error
        return jsonify({"error": "Product not found"}), 404
        
    # 5. Return the product as a JSON dictionary
    return jsonify(dict(product))

@app.route('/api/products/<int:product_id>/stock', methods=['PUT'])
@require_role('admin')
def update_stock(product_id):
    data = request.json
    new_stock = data.get('stock')
    if new_stock is None or not isinstance(new_stock, int) or new_stock < 0:
        return jsonify({"error": "Invalid stock value"}), 400
        
    conn = get_db_connection()
    conn.execute('UPDATE products SET stock = ? WHERE id = ?', (new_stock, product_id))
    conn.commit()
    conn.close()
    return jsonify({"success": True, "message": "Stock updated"})

@app.route('/api/products', methods=['POST'])
@require_role('admin')
def create_product():
    data = request.json
    required_fields = ['name', 'price']
    if not all(field in data for field in required_fields):
        return jsonify({"error": "Missing required fields"}), 400
        
    conn = get_db_connection()
    cursor = conn.execute('''
        INSERT INTO products (name, price, image, category, stock, description, featured, onSale)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        data.get('name'),
        data.get('price'),
        data.get('image', ''),
        data.get('category', ''),
        data.get('stock', 0),
        data.get('description', ''),
        int(bool(data.get('featured'))),
        int(bool(data.get('onSale')))
    ))
    new_id = cursor.lastrowid
    conn.commit()
    conn.close()
    
    return jsonify({"success": True, "id": new_id, "message": "Product created"}), 201

@app.route('/api/products/<int:product_id>', methods=['PUT'])
@require_role('admin')
def update_product(product_id):
    data = request.json
    conn = get_db_connection()
    
    # Verify product exists
    product = conn.execute('SELECT * FROM products WHERE id = ?', (product_id,)).fetchone()
    if not product:
        conn.close()
        return jsonify({"error": "Product not found"}), 404

    # Build update query dynamically
    update_fields = []
    params = []
    
    fields = ['name', 'price', 'image', 'category', 'stock', 'description', 'featured', 'onSale']
    for field in fields:
        if field in data:
            update_fields.append(f"{field} = ?")
            val = data[field]
            if field in ['featured', 'onSale']:
                val = int(bool(val))
            params.append(val)
            
    if not update_fields:
        conn.close()
        return jsonify({"error": "No valid fields to update"}), 400
        
    params.append(product_id)
    query = f"UPDATE products SET {', '.join(update_fields)} WHERE id = ?"
    
    conn.execute(query, tuple(params))
    conn.commit()
    conn.close()
    
    return jsonify({"success": True, "message": "Product updated"})

@app.route('/api/products/<int:product_id>', methods=['DELETE'])
@require_role('admin')
def delete_product(product_id):
    conn = get_db_connection()
    cursor = conn.execute('DELETE FROM products WHERE id = ?', (product_id,))
    if cursor.rowcount == 0:
        conn.close()
        return jsonify({"error": "Product not found"}), 404
        
    conn.commit()
    conn.close()
    return jsonify({"success": True, "message": "Product deleted"})

@app.route('/api/cart', methods=['GET'])
@require_role('customer', 'admin')
def get_cart():
    """Returns the authenticated user's saved cart items, joined with product info."""
    user_id = get_current_user_id()

    conn = get_db_connection()
    rows = conn.execute('''
        SELECT ci.product_id AS productId,
               ci.quantity,
               p.name,
               p.price,
               p.image,
               p.stock
        FROM cart_items ci
        JOIN products p ON ci.product_id = p.id
        WHERE ci.user_id = ?
    ''', (user_id,)).fetchall()
    conn.close()

    return jsonify([dict(r) for r in rows])

@app.route('/api/cart', methods=['PUT'])
@require_role('customer', 'admin')
def update_cart():
    """Replaces the user's entire cart with the provided items list."""
    user_id = get_current_user_id()

    items = request.json.get('items', [])

    conn = get_db_connection()
    try:
        conn.execute('BEGIN TRANSACTION')
        # Clear existing cart
        conn.execute('DELETE FROM cart_items WHERE user_id = ?', (user_id,))

        # Insert new items
        for item in items:
            product_id = item.get('productId')
            quantity = item.get('quantity', 1)
            if product_id and quantity > 0:
                conn.execute(
                    'INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)',
                    (user_id, product_id, quantity)
                )
        conn.commit()
        return jsonify({"success": True, "message": "Cart updated"})
    except Exception:
        conn.rollback()
        return jsonify({"error": "Failed to update cart"}), 500
    finally:
        conn.close()

@app.route('/api/discounts', methods=['GET'])
@require_role('admin', 'cashier')
def get_discounts():
    conn = get_db_connection()
    state = request.args.get('state')
    if state is not None:
        discounts = conn.execute('SELECT * FROM discounts WHERE state = ?', (int(state),)).fetchall()
    else:
        discounts = conn.execute('SELECT * FROM discounts').fetchall()
    conn.close()
    return jsonify([dict(d) for d in discounts])

@app.route('/api/discounts', methods=['POST'])
@require_role('admin')
def create_discount():
    data = request.json
    required_fields = ['name', 'percentage']
    if not all(field in data for field in required_fields):
        return jsonify({"error": "Missing required fields"}), 400
        
    conn = get_db_connection()
    cursor = conn.execute('''
        INSERT INTO discounts (name, percentage, stackability, state)
        VALUES (?, ?, ?, ?)
    ''', (
        data.get('name'),
        float(data.get('percentage')),
        int(data.get('stackability', 0)),
        int(data.get('state', 0))
    ))
    new_id = cursor.lastrowid
    conn.commit()
    conn.close()
    
    return jsonify({"success": True, "id": new_id, "message": "Discount created"}), 201

@app.route('/api/discounts/<int:discount_id>', methods=['PUT'])
@require_role('admin')
def update_discount(discount_id):
    data = request.json
    conn = get_db_connection()
    
    discount = conn.execute('SELECT * FROM discounts WHERE id = ?', (discount_id,)).fetchone()
    if not discount:
        conn.close()
        return jsonify({"error": "Discount not found"}), 404

    update_fields = []
    params = []
    
    fields = ['name', 'percentage', 'stackability', 'state']
    for field in fields:
        if field in data:
            update_fields.append(f"{field} = ?")
            val = data[field]
            if field in ['stackability', 'state']:
                val = int(val)
            elif field == 'percentage':
                val = float(val)
            params.append(val)
            
    if not update_fields:
        conn.close()
        return jsonify({"error": "No valid fields to update"}), 400
        
    params.append(discount_id)
    query = f"UPDATE discounts SET {', '.join(update_fields)} WHERE id = ?"
    
    conn.execute(query, tuple(params))
    conn.commit()
    conn.close()
    
    return jsonify({"success": True, "message": "Discount updated"})

@app.route('/api/discounts/<int:discount_id>', methods=['DELETE'])
@require_role('admin')
def delete_discount(discount_id):
    conn = get_db_connection()
    cursor = conn.execute('DELETE FROM discounts WHERE id = ?', (discount_id,))
    if cursor.rowcount == 0:
        conn.close()
        return jsonify({"error": "Discount not found"}), 404
        
    conn.commit()
    conn.close()
    return jsonify({"success": True, "message": "Discount deleted"})

@app.route('/api/pos/sale', methods=['POST'])
@require_role('admin', 'cashier')
def pos_sale():
    data = request.json
    items = data.get('items', [])
    if not items:
        return jsonify({"error": "No items provided"}), 400
        
    conn = get_db_connection()
    try:
        # Start a transaction
        conn.execute('BEGIN TRANSACTION')
        for item in items:
            product_id = item.get('id') or item.get('productId')
            quantity = item.get('quantity')
            
            if not product_id or not quantity or quantity <= 0:
                raise ValueError("Invalid item format")
                
            # Check stock
            product = conn.execute('SELECT stock FROM products WHERE id = ?', (product_id,)).fetchone()
            if not product:
                raise ValueError(f"Product {product_id} not found")
                
            if product['stock'] < quantity:
                raise ValueError(f"Insufficient stock for product {product_id}")
                
            # Deduct stock
            conn.execute('UPDATE products SET stock = stock - ? WHERE id = ?', (quantity, product_id))
            
        conn.commit()
        return jsonify({"success": True, "message": "Sale completed successfully"})
    except ValueError as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        conn.rollback()
        return jsonify({"error": "Internal server error"}), 500
    finally:
        conn.close()

@app.route('/api/orders', methods=['POST'])
@require_role('customer', 'admin')
def create_order():
    user_id = get_current_user_id()
    
    data = request.json
    items = data.get('items', [])
    if not items:
        return jsonify({"error": "No items provided"}), 400
        
    conn = get_db_connection()
    try:
        conn.execute('BEGIN TRANSACTION')
        total_price = 0
        
        # Calculate total and deduct stock
        for item in items:
            product_id = item.get('id') or item.get('productId')
            quantity = item.get('quantity')
            
            if not product_id or not quantity or quantity <= 0:
                raise ValueError("Invalid item format")
                
            product = conn.execute('SELECT stock, price FROM products WHERE id = ?', (product_id,)).fetchone()
            if not product:
                raise ValueError(f"Product {product_id} not found")
            if product['stock'] < quantity:
                raise ValueError(f"Insufficient stock for product {product_id}")
                
            total_price += product['price'] * quantity
            conn.execute('UPDATE products SET stock = stock - ? WHERE id = ?', (quantity, product_id))
            
        # Create order
        cursor = conn.execute('INSERT INTO orders (user_id, total_price) VALUES (?, ?)', (user_id, total_price))
        order_id = cursor.lastrowid
        
        # Create order items
        for item in items:
            product_id = item.get('id') or item.get('productId')
            quantity = item.get('quantity')
            price = conn.execute('SELECT price FROM products WHERE id = ?', (product_id,)).fetchone()['price']
            conn.execute('INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)', 
                         (order_id, product_id, quantity, price))

        # Clear the user's saved cart after successful order
        conn.execute('DELETE FROM cart_items WHERE user_id = ?', (user_id,))

        conn.commit()
        return jsonify({"success": True, "order_id": order_id, "message": "Order completed successfully"})
    except ValueError as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        conn.rollback()
        return jsonify({"error": "Internal server error"}), 500
    finally:
        conn.close()

@app.route('/api/orders', methods=['GET'])
@require_role('customer', 'admin')
def get_orders():
    user_id = get_current_user_id()
    
    conn = get_db_connection()
    orders = conn.execute('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC', (user_id,)).fetchall()
    
    orders_list = []
    for order in orders:
        order_dict = dict(order)
        items = conn.execute('''
            SELECT oi.*, p.name, p.image 
            FROM order_items oi 
            JOIN products p ON oi.product_id = p.id 
            WHERE oi.order_id = ?
        ''', (order['id'],)).fetchall()
        order_dict['items'] = [dict(item) for item in items]
        orders_list.append(order_dict)
        
    conn.close()
    return jsonify(orders_list)

@app.route('/api/admin/customers', methods=['GET'])
@require_role('admin')
def get_customers():
    conn = get_db_connection()
    customers = conn.execute('SELECT id, name, email, role FROM users WHERE role = "customer"').fetchall()
    conn.close()
    return jsonify([dict(c) for c in customers])

@app.route('/api/admin/orders/<int:user_id>', methods=['GET'])
@require_role('admin')
def get_admin_user_orders(user_id):
    conn = get_db_connection()
    orders = conn.execute('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC', (user_id,)).fetchall()
    
    orders_list = []
    for order in orders:
        order_dict = dict(order)
        items = conn.execute('''
            SELECT oi.*, p.name, p.image 
            FROM order_items oi 
            JOIN products p ON oi.product_id = p.id 
            WHERE oi.order_id = ?
        ''', (order['id'],)).fetchall()
        order_dict['items'] = [dict(item) for item in items]
        orders_list.append(order_dict)
        
    conn.close()
    return jsonify(orders_list)

@app.route('/api/auth/google_login', methods=['POST'])
def google_login():
    data = request.json
    token = data.get('credential')
    if not token:
        return jsonify({"error": "Missing credential"}), 400
        
    try:
        # Verify the token
        idinfo = id_token.verify_oauth2_token(token, google_requests.Request(), GOOGLE_CLIENT_ID)
        
        google_sub = idinfo['sub']
        email = idinfo.get('email', '')
        name = idinfo.get('name', '')
        
        # Determine role
        role = 'admin' if email in ADMIN_EMAIL_LIST else 'customer'
        
        conn = get_db_connection()
        
        # Find or create user
        user = conn.execute('SELECT * FROM users WHERE google_sub = ?', (google_sub,)).fetchone()
        
        if user:
            # Update role and name/email if they changed
            conn.execute('UPDATE users SET role = ?, name = ?, email = ? WHERE google_sub = ?', 
                         (role, name, email, google_sub))
            user_id = user['id']
        else:
            # Create user
            cursor = conn.execute('INSERT INTO users (google_sub, name, email, role) VALUES (?, ?, ?, ?)',
                                  (google_sub, name, email, role))
            user_id = cursor.lastrowid
            
        conn.commit()
        conn.close()
        
        # Issue JWT
        jwt_payload = {
            'user_id': user_id,
            'role': role,
            'exp': datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=7)
        }
        encoded_jwt = jwt.encode(jwt_payload, JWT_SECRET, algorithm="HS256")
        
        return jsonify({
            "user": {
                "id": user_id,
                "name": name,
                "email": email,
                "role": role
            },
            "token": encoded_jwt
        })
        
    except ValueError:
        # Invalid token
        return jsonify({"error": "Invalid token"}), 401
    except Exception as e:
        print(f"Login error: {e}")
        return jsonify({"error": "Internal server error"}), 500

@app.route('/api/auth/demo_login', methods=['POST'])
def demo_login():
    """Demo login endpoint that bypasses Google OAuth for testing.
    Accepts a demo_code and a role, and returns a JWT for a demo user."""
    if not DEMO_MODE_ENABLED:
        return jsonify({"error": "Demo login is disabled"}), 403

    data = request.json
    code = data.get('demo_code', '')
    requested_role = data.get('role', 'admin')

    if code != DEMO_ADMIN_CODE:
        return jsonify({"error": "Invalid demo code"}), 401

    # Only allow specific demo roles
    allowed_demo_roles = ['admin', 'cashier', 'customer']
    if requested_role not in allowed_demo_roles:
        return jsonify({"error": "Invalid role"}), 400

    # Build demo user identity based on role
    demo_sub = f'demo-{requested_role}'
    demo_name = f'Demo {requested_role.capitalize()}'
    demo_email = f'demo-{requested_role}@test.com'

    conn = get_db_connection()
    user = conn.execute('SELECT * FROM users WHERE google_sub = ?', (demo_sub,)).fetchone()

    if user:
        conn.execute('UPDATE users SET role = ?, name = ?, email = ? WHERE google_sub = ?',
                     (requested_role, demo_name, demo_email, demo_sub))
        user_id = user['id']
    else:
        cursor = conn.execute('INSERT INTO users (google_sub, name, email, role) VALUES (?, ?, ?, ?)',
                              (demo_sub, demo_name, demo_email, requested_role))
        user_id = cursor.lastrowid

    conn.commit()
    conn.close()

    jwt_payload = {
        'user_id': user_id,
        'role': requested_role,
        'exp': datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=7)
    }
    encoded_jwt = jwt.encode(jwt_payload, JWT_SECRET, algorithm="HS256")

    return jsonify({
        "user": {
            "id": user_id,
            "name": demo_name,
            "email": demo_email,
            "role": requested_role
        },
        "token": encoded_jwt
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)
