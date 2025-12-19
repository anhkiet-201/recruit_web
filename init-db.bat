@echo off
echo Waiting for connection to PostgreSQL...
timeout /t 5 /nobreak
set "DATABASE_URL=postgresql://user:password@localhost:5432/ttn_db"
echo Pushing Prisma schema to database...
call npx prisma db push
echo Database initialization complete.
pause
