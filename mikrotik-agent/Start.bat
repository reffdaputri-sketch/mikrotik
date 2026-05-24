@echo off
title Node JS Project - npm start

cd /d "%~dp0"

echo Menjalankan npm start...
echo Folder project: %cd%
echo.

npm start

echo.
echo Project berhenti atau error.
pause