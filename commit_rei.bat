@echo off
cd /d "C:\Users\56940\Desktop\rei-docente"
del /f /q ".git\HEAD.lock" 2>nul
del /f /q ".git\index.lock" 2>nul
git add -A
git commit -m "fix: filtrar basura PDF en indicadores + temas MINEDUC integrados en mediano plazo"
git push
echo.
echo LISTO. Presiona cualquier tecla para cerrar.
pause >nul
