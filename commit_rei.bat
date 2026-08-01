@echo off
cd /d "C:\Users\56940\Desktop\rei-docente"
del /f /q ".git\HEAD.lock" 2>nul
del /f /q ".git\index.lock" 2>nul
git add -A
git commit -m "fix: agregar 1B-4B en selector Planificador + programas.ts v2 temas por eje"
git push
echo.
echo LISTO. Presiona cualquier tecla para cerrar.
pause >nul
