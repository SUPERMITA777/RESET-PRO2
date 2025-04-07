@echo off
echo Actualizando repositorio Git...

:: Verificar si hay cambios sin commit
git status

:: Agregar todos los archivos modificados
git add .

:: Solicitar mensaje de commit
set /p commit_message="Ingrese el mensaje del commit: "

:: Hacer commit con el mensaje proporcionado
git commit -m "%commit_message%"

:: Hacer push al repositorio remoto
git push

echo.
echo ¡Actualización completada!
pause 