@echo off
cd /d "C:\Users\56940\Desktop\rei-docente"
del /f /q ".git\HEAD.lock" 2>nul
del /f /q ".git\index.lock" 2>nul
git add -A
git commit -m "fix: JSONs limpios + indicadores todos OAs desde staticCurriculum y raw filtrado"
git pull --rebase
git push
echo.
echo LISTO. Presiona cualquier tecla para cerrar.
pause >nul
