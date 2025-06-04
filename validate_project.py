#!/usr/bin/env python3
"""
Project validation script for Nightscout API Backend
Checks if all required files are present and validates basic structure
"""

import os
import json
import sys

def check_file_exists(filepath, description):
    """Check if a file exists and print status"""
    if os.path.exists(filepath):
        print(f"✅ {description}: {filepath}")
        return True
    else:
        print(f"❌ {description}: {filepath} - MISSING")
        return False

def validate_json_file(filepath):
    """Validate JSON file syntax"""
    try:
        with open(filepath, 'r') as f:
            json.load(f)
        return True
    except json.JSONDecodeError as e:
        print(f"❌ JSON syntax error in {filepath}: {e}")
        return False
    except FileNotFoundError:
        return False

def main():
    print("🩸 Nightscout API Backend - Project Validation")
    print("=" * 50)
    
    # Check root files
    root_files = [
        ("package.json", "Package configuration"),
        ("README.md", "Documentation"),
        ("Dockerfile", "Docker configuration"),
        ("docker-compose.yml", "Docker Compose configuration"),
        (".env.example", "Environment variables template"),
        (".gitignore", "Git ignore rules"),
        ("init.sql", "Database initialization")
    ]
    
    # Check source files
    src_files = [
        ("src/app.js", "Main Express application"),
        ("src/server.js", "Server startup"),
        ("src/config/database.js", "Database configuration"),
        ("src/models/User.js", "User model"),
        ("src/models/Entry.js", "Entry model"),
        ("src/models/Treatment.js", "Treatment model"),
        ("src/middleware/auth.js", "Authentication middleware"),
        ("src/controllers/auth.js", "Authentication controller"),
        ("src/controllers/entries.js", "Entries controller"),
        ("src/controllers/treatments.js", "Treatments controller"),
        ("src/controllers/status.js", "Status controller"),
        ("src/routes/api.js", "API routes"),
        ("src/routes/auth.js", "Authentication routes"),
        ("src/utils/query.js", "Query utilities")
    ]
    
    # Check public files
    public_files = [
        ("public/index.html", "Dashboard HTML"),
        ("public/css/style.css", "Dashboard CSS"),
        ("public/js/dashboard.js", "Dashboard JavaScript")
    ]
    
    all_files = root_files + src_files + public_files
    
    print("\n📁 Checking project structure...")
    missing_files = 0
    
    for filepath, description in all_files:
        if not check_file_exists(filepath, description):
            missing_files += 1
    
    print(f"\n📊 Validation Summary:")
    print(f"Total files checked: {len(all_files)}")
    print(f"Missing files: {missing_files}")
    print(f"Present files: {len(all_files) - missing_files}")
    
    # Validate JSON files
    print(f"\n🔍 Validating JSON files...")
    json_files = ["package.json"]
    json_valid = True
    
    for json_file in json_files:
        if os.path.exists(json_file):
            if validate_json_file(json_file):
                print(f"✅ {json_file} - Valid JSON")
            else:
                json_valid = False
        
    # Check package.json dependencies
    if os.path.exists("package.json"):
        print(f"\n📦 Checking package.json dependencies...")
        with open("package.json", 'r') as f:
            package_data = json.load(f)
            
        required_deps = [
            "express", "cors", "helmet", "morgan", "dotenv",
            "bcryptjs", "jsonwebtoken", "pg", "sequelize",
            "joi", "express-rate-limit", "compression"
        ]
        
        dependencies = package_data.get("dependencies", {})
        missing_deps = []
        
        for dep in required_deps:
            if dep in dependencies:
                print(f"✅ {dep}: {dependencies[dep]}")
            else:
                print(f"❌ {dep}: MISSING")
                missing_deps.append(dep)
        
        if missing_deps:
            print(f"\n⚠️  Missing dependencies: {', '.join(missing_deps)}")
    
    # Print API endpoints summary
    print(f"\n🔌 API Endpoints Summary:")
    print("Authentication:")
    print("  POST /auth/register - Register new user")
    print("  POST /auth/login - User login")
    print("  GET /auth/me - Get user profile")
    print("  POST /auth/regenerate-secret - Regenerate API secret")
    
    print("\nNightscout-Compatible API:")
    print("  GET /api/v1/entries[.json] - Get CGM entries")
    print("  POST /api/v1/entries[.json] - Upload CGM entries")
    print("  GET /api/v1/treatments[.json] - Get treatments")
    print("  POST /api/v1/treatments[.json] - Upload treatments")
    print("  GET /api/v1/status[.json] - Get server status")
    print("  GET /api/v1/profile[.json] - Get treatment profile")
    
    print("\nUtility:")
    print("  GET / - User dashboard")
    print("  GET /api-docs - API documentation")
    
    # Final status
    if missing_files == 0 and json_valid:
        print(f"\n🎉 Project validation PASSED!")
        print("✅ All required files are present")
        print("✅ JSON files are valid")
        print("\n🚀 Next steps:")
        print("1. Install Node.js and npm")
        print("2. Run 'npm install' to install dependencies")
        print("3. Set up PostgreSQL database")
        print("4. Copy .env.example to .env and configure")
        print("5. Run 'npm run dev' to start development server")
        print("6. Or use 'docker-compose up' for containerized setup")
        return 0
    else:
        print(f"\n❌ Project validation FAILED!")
        if missing_files > 0:
            print(f"❌ {missing_files} files are missing")
        if not json_valid:
            print("❌ JSON validation errors found")
        return 1

if __name__ == "__main__":
    sys.exit(main())
