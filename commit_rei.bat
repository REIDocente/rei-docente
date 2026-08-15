@echo off
cd /d "C:\Users\56940\Desktop\rei-docente"
del /f /q ".git\HEAD.lock" 2>nul
del /f /q ".git\index.lock" 2>nul
git add -A
git commit -m "feat: integrar temas MINEDUC en mediano plazo + corregir nombres 5B-6B en frontend"
git push
echo.
echo LISTO. Presiona cualquier tecla para cerrar.
pause >nul
