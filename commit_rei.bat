@echo off
cd /d "C:\Users\56940\Desktop\rei-docente"
del /f /q ".git\HEAD.lock" 2>nul
del /f /q ".git\index.lock" 2>nul
git add -A
git commit -m "fix: 7 unidades correctas para 7B y 8B en API y selector fallback"
git push
echo.
echo LISTO. Presiona cualquier tecla para cerrar.
pause >nul
