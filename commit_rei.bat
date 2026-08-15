@echo off
cd /d "C:\Users\56940\Desktop\rei-docente"
del /f /q ".git\HEAD.lock" 2>nul
del /f /q ".git\index.lock" 2>nul
git add -A
git commit -m "fix: OA 22 contaminado 3B + OA 16 faltante 3B + OAs faltantes 1B-4B"
git pull --rebase
git push
echo.
echo LISTO. Presiona cualquier tecla para cerrar.
pause >nul
