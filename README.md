# Excel Dashboard Website

A production-ready static dashboard that reads `data.json` generated from `data.xlsx`. Replace the workbook, double-click `update_website.bat`, and the website refreshes from the latest Excel data.

## Requirements

- Python 3.10 or newer
- Git installed and connected to your GitHub repository
- Python packages:

```bash
pip install pandas openpyxl
```

## Folder Structure

```text
excel-dashboard/
  index.html
  style.css
  app.js
  data.xlsx
  data.json
  excel_to_json.py
  update_website.bat
  README.md
  assets/
  fonts/
    KrutiDev010.ttf
```

## Daily Use

1. Replace `data.xlsx` with your updated Excel workbook.
2. Double-click `update_website.bat`.
3. The script generates `data.json`, commits the update, and pushes it to GitHub.
4. Refresh the website after GitHub Pages finishes deploying.

## GitHub-Only Update

This project includes a GitHub Action at `.github/workflows/update-data-json.yml`.

If the project is already on GitHub, you can update the site without running Python manually:

1. Make sure `.github/workflows/update-data-json.yml` is at the top level of the repository, not hidden inside another folder.
2. Open the repository on GitHub.
3. Replace the existing `data.xlsx` file with your new Excel file.
4. Keep the filename exactly `data.xlsx`.
5. Commit the change.
6. GitHub Actions will run automatically and regenerate `data.json`.
7. After the action finishes and GitHub Pages redeploys, refresh the website.

Only `data.xlsx` needs to be replaced by you. The workflow updates `data.json` automatically.

## Running Locally

Modern browsers may block `data.json` when opening `index.html` directly from disk. For the most reliable local preview, run:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.

## Excel Support

The converter reads every worksheet in `data.xlsx` and supports dynamic columns, dynamic rows, empty cells, dates, numbers, Unicode, Hindi text, and English text. Dates are exported in ISO format so sorting and filtering remain reliable.

## Dashboard Features

- Worksheet switcher
- Global search
- Per-column filters
- Column sorting
- Pagination with 10, 25, 50, and 100 rows
- Total rows, total columns, filtered rows, current worksheet, and last updated cards
- CSV export
- Excel-compatible `.xls` export
- Print view
- Light and dark themes saved in browser storage
- Excel Default and Kruti Dev 010 font modes saved in browser storage

## Kruti Dev Font

The stylesheet loads `fonts/KrutiDev010.ttf` through `@font-face`. Add your licensed copy of `KrutiDev010.ttf` to the `fonts` folder if the bundled file is missing or if you need the exact legacy Hindi glyph mapping used by your workbook.

## GitHub Deployment

1. Create a GitHub repository.
2. Copy this folder into the repository.
3. Commit and push the files.
4. In GitHub, open **Settings > Pages**.
5. Choose the branch and root folder that contain `index.html`.
6. Save and wait for the Pages URL to become active.

## Troubleshooting

- **Dashboard says data cannot load:** Run `python excel_to_json.py` or double-click `update_website.bat`.
- **Python cannot import pandas/openpyxl:** Run `pip install pandas openpyxl`.
- **Git push fails:** Confirm the repository has a remote and you are signed in.
- **GitHub upload changed Excel but site did not update:** Open the repository's **Actions** tab and confirm the **Update dashboard data** workflow finished successfully.
- **Hindi legacy text looks wrong:** Choose `Kruti Dev 010` in the font selector and confirm the real `KrutiDev010.ttf` file is in `fonts`.
- **New worksheet is not shown:** Replace `data.xlsx`, run the update script, and refresh the website.
