@echo off
cd /d "C:\Users\56940\Desktop\rei-docente"
del /f /q ".git\HEAD.lock" 2>nul
del /f /q ".git\index.lock" 2>nul
git add -A
git commit -m "fix: agregar OAs faltantes 1B-4B (OA 15,16,17,21 y equiv.) a staticCurriculum"
git pull --rebase
git push
echo.
echo LISTO. Presiona cualquier tecla para cerrar.
pause >nul
