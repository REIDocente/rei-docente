@echo off
cd /d "C:\Users\56940\Desktop\rei-docente"
del /f /q ".git\HEAD.lock" 2>nul
del /f /q ".git\index.lock" 2>nul
git add -A
git commit -m "fix: lecciones 7B y 8B con OAs reales MINEDUC (7 unidades), prioridad estática sobre Supabase"
git push
echo.
echo LISTO. Presiona cualquier tecla para cerrar.
pause >nul
