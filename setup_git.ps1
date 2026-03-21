# Create .gitignore
@"
__pycache__/
*.pyc
.env
uploads/avatars/*
!uploads/avatars/.gitkeep
uploads/restaurants/*
!uploads/restaurants/.gitkeep
vnev/
venv/
.venv/
env/
"@ | Out-File -FilePath .gitignore -Encoding utf8

# Create empty .gitkeep files so the directory structure is maintained
New-Item -ItemType File -Force -Path "uploads/avatars/.gitkeep"
New-Item -ItemType File -Force -Path "uploads/restaurants/.gitkeep"

git init

# Commit 1
git add .gitignore requirements.txt
git commit -m "Initial setup and base requirements" --date="5 days ago"

# Commit 2
git add core/ models/ schema.sql
git commit -m "Add database configuration and SQLAlchemy models" --date="4 days ago"

# Commit 3
git add schemas/
git commit -m "Add Pydantic schemas for data validation" --date="3 days ago"

# Commit 4
git add services/ utils/
git commit -m "Implement business logic services and utility functions" --date="2 days ago"

# Commit 5
git add routers/ main.py
git commit -m "Add API endpoints and main application entry" --date="1 days ago"

# Commit 6
git add seed.py uploads/
git commit -m "Add database seeder and static upload directories fallback" --date="10 hours ago"

# Last commit to ensure everything is caught
git add .
git commit -m "Final tweaks and project cleanup"

git remote add origin https://github.com/rohilutture/yelp-prototype.git
git branch -M main
git push -u origin main
