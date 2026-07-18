@echo off
setlocal EnableExtensions
cd /d "%~dp0"

call :info "Converting data.xlsx to data.json..."
python excel_to_json.py
if errorlevel 1 goto fail

call :info "Checking Git repository..."
git rev-parse --is-inside-work-tree >nul 2>&1
if errorlevel 1 (
  call :warn "This folder is not inside a Git repository. Conversion finished, but Git steps were skipped."
  goto done
)

call :info "Adding changed files..."
git add .
if errorlevel 1 goto fail

git diff --cached --quiet
if not errorlevel 1 (
  call :warn "No file changes to commit."
  goto push
)

call :info "Creating update commit..."
git commit -m "Update"
if errorlevel 1 goto fail

:push
call :info "Pushing to remote..."
git push
if errorlevel 1 goto fail

:done
call :success "Website update completed."
pause
exit /b 0

:fail
call :error "Update failed. Read the message above, fix the issue, and run this file again."
pause
exit /b 1

:info
powershell -NoProfile -Command "Write-Host %~1 -ForegroundColor Cyan"
exit /b 0

:success
powershell -NoProfile -Command "Write-Host %~1 -ForegroundColor Green"
exit /b 0

:warn
powershell -NoProfile -Command "Write-Host %~1 -ForegroundColor Yellow"
exit /b 0

:error
powershell -NoProfile -Command "Write-Host %~1 -ForegroundColor Red"
exit /b 0
