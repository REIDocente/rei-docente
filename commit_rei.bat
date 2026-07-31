@echo off
cd /d "C:\Users\56940\Desktop\rei-docente"
del /f /q ".git\HEAD.lock" 2>nul
git add -A
git commit -m "feat: Planificacion usa selectores curriculares MINEDUC 1B-2M"
git push
echo.
echo LISTO. Presiona cualquier tecla para cerrar.
pause >nul
