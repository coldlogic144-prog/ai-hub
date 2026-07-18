@echo off
python excel_to_json.py
git add books.json
git commit -m "Update books"
git push
pause
