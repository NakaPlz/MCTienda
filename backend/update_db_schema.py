import sqlite3
import os

DB_PATH = "tienda.db"

def migrate_db():
    if not os.path.exists(DB_PATH):
        print("Database not found. Skipping migration (will be created by app).")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    try:
        # 1. Add price_override to products
        try:
            cursor.execute("ALTER TABLE products ADD COLUMN price_override REAL")
            print("Added price_override column.")
        except sqlite3.OperationalError as e:
            if "duplicate column name" in str(e):
                print("Column price_override already exists.")
            else:
                print(f"Error adding price_override: {e}")

        # 2. Add discount_percentage to products
        try:
            cursor.execute("ALTER TABLE products ADD COLUMN discount_percentage INTEGER DEFAULT 0")
            print("Added discount_percentage column.")
        except sqlite3.OperationalError as e:
            if "duplicate column name" in str(e):
                print("Column discount_percentage already exists.")
            else:
                print(f"Error adding discount_percentage: {e}")

        # 3. Create product_images table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS product_images (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            product_id VARCHAR,
            url VARCHAR,
            display_order INTEGER DEFAULT 0,
            color_variant VARCHAR,
            FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE
        )
        """)
        
        # Add index for product_id
        cursor.execute("CREATE INDEX IF NOT EXISTS ix_product_images_product_id ON product_images (product_id)")
        print("Created/Verified product_images table.")

        conn.commit()
        print("Migration completed successfully.")

    except Exception as e:
        print(f"Migration failed: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    migrate_db()
