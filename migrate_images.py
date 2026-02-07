
import sqlite3
import os

DB_PATH = "tienda.db"

def migrate():
    if not os.path.exists(DB_PATH):
        print("Database not found, skipping migration (will be created fresh).")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        print("Attempting to add 'images' column to 'products' table...")
        cursor.execute("ALTER TABLE products ADD COLUMN images TEXT")
        conn.commit()
        print("✅ Migration successful: 'images' column added.")
    except sqlite3.OperationalError as e:
        if "duplicate column" in str(e).lower():
            print("ℹ️ Column 'images' already exists.")
        else:
            print(f"❌ Error during migration: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()
