@echo off
cd /d "C:\Users\56940\Desktop\rei-docente"
del /f /q ".git\HEAD.lock" 2>nul
del /f /q ".git\index.lock" 2>nul
git add -A
git commit -m "fix: datos estáticos con prioridad sobre Supabase + nombres correctos 1B-4B y 1M-2M"
git push
echo.
echo LISTO. Presiona cualquier tecla para cerrar.
pause >nul
