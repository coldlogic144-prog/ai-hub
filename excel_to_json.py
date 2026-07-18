from __future__ import annotations

import json
import math
import sys
from datetime import date, datetime, time
from pathlib import Path
from typing import Any

import pandas as pd


BASE_DIR = Path(__file__).resolve().parent
EXCEL_PATH = BASE_DIR / "data.xlsx"
JSON_PATH = BASE_DIR / "data.json"


def serialize_value(value: Any) -> Any:
    if value is None:
        return None
    if isinstance(value, float) and math.isnan(value):
        return None
    if pd.isna(value):
        return None
    if isinstance(value, (datetime, date, time)):
        return value.isoformat()
    if hasattr(value, "item"):
        return serialize_value(value.item())
    return value


def read_workbook() -> dict[str, Any]:
    if not EXCEL_PATH.exists():
        raise FileNotFoundError(f"Missing workbook: {EXCEL_PATH.name}")

    workbook = pd.read_excel(EXCEL_PATH, sheet_name=None, dtype=object, engine="openpyxl")
    worksheets: dict[str, Any] = {}

    for sheet_name, frame in workbook.items():
        frame = frame.where(pd.notna(frame), None)
        columns = [str(column) if column is not None else "" for column in frame.columns]
        rows = []

        for record in frame.to_dict(orient="records"):
            rows.append({str(key): serialize_value(value) for key, value in record.items()})

        worksheets[sheet_name] = {
            "columns": columns,
            "rows": rows,
            "row_count": len(rows),
            "column_count": len(columns),
        }

    return {
        "metadata": {
            "generated_at": datetime.now().astimezone().isoformat(timespec="seconds"),
            "worksheet_count": len(worksheets),
            "worksheet_names": list(worksheets.keys()),
            "source_file": EXCEL_PATH.name,
        },
        "worksheets": worksheets,
    }


def main() -> int:
    try:
        payload = read_workbook()
        JSON_PATH.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"Generated {JSON_PATH.name} from {EXCEL_PATH.name}")
        print(f"Worksheets: {payload['metadata']['worksheet_count']}")
        return 0
    except Exception as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
