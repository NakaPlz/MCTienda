
import sys
import os

# Change CWD to backend directory (simulate docker/uvicorn execution context)
backend_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'backend')
os.chdir(backend_dir)
sys.path.append(backend_dir)

print(f"CWD: {os.getcwd()}")
print(f"Path: {sys.path}")

try:
    print("Attempting to import main.app...")
    import models # Test relative import resolution
    import main   # Test main app import
    print("✅ SUCCESS: backend.main imported successfully.")
except Exception as e:
    print(f"❌ FAILURE: Could not import backend.main. Error: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
