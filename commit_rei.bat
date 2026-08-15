@echo off
cd /d "C:\Users\56940\Desktop\rei-docente"
del /f /q ".git\HEAD.lock" 2>nul
del /f /q ".git\index.lock" 2>nul
git add -A
git commit -m "fix: ShadingType.CLEAR para colores reales en tablas + celeste + 5 evaluaciones"
git pull --rebase
git push
echo.
echo LISTO. Presiona cualquier tecla para cerrar.
pause >nul
