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

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint to verify the API is running."""
    return jsonify({"status": "ok"})

@app.route('/api/products', methods=['GET'])
def get_products():
    """Returns a list of products, optionally filtered by category."""
    # 1. Open a connection to the database
    conn = get_db_connection()
    
    # Check if a 'category' parameter was passed in the URL (e.g., ?category=Electronics)
    category = request.args.get('category')
    
    # 2. Execute a query based on whether a category was provided
    if category:
        # Use '?' parameterization to safely filter by category
        products = conn.execute('SELECT * FROM products WHERE category = ?', (category,)).fetchall()
    else:
        # No category provided, fetch all products
        products = conn.execute('SELECT * FROM products').fetchall()
    
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

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)
