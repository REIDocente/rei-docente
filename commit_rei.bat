@echo off
cd /d "C:\Users\56940\Desktop\rei-docente"
del /f /q ".git\HEAD.lock" 2>nul
del /f /q ".git\index.lock" 2>nul
git add -A
git commit -m "feat: agregar OAs 1B-4B a staticCurriculum + fix filtros indicadores mediano plazo"
git pull --rebase
git push
echo.
echo LISTO. Presiona cualquier tecla para cerrar.
pause >nul
