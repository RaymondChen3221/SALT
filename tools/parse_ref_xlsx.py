from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
import zipfile
from datetime import datetime
from pathlib import Path
from typing import Any
from xml.etree import ElementTree as ET


MAIN_NS = "http://schemas.openxmlformats.org/spreadsheetml/2006/main"
REL_NS = "http://schemas.openxmlformats.org/package/2006/relationships"
OD_REL_NS = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
NS = {"main": MAIN_NS, "rel": REL_NS}
SALT_RE = re.compile(r"^S[+-]A[+-]L[+-]T[+-]$")

FALLBACK_TYPES = {
    "S+A+L+T+": "誓约同行型",
    "S+A+L+T-": "宿命执念型",
    "S+A+L-T+": "热烈护主型",
    "S+A+L-T-": "占有冲锋型",
    "S+A-L+T+": "沉默守候型",
    "S+A-L+T-": "破碎宿命型",
    "S+A-L-T+": "别扭撒娇型",
    "S+A-L-T-": "逃跑猫猫型",
    "S-A+L+T+": "稳定同行型",
    "S-A+L+T-": "孤独执行者型",
    "S-A+L-T+": "轻松搭子型",
    "S-A+L-T-": "随缘行动型",
    "S-A-L+T+": "旧人同路型",
    "S-A-L+T-": "远方投射型",
    "S-A-L-T+": "舒服同好型",
    "S-A-L-T-": "断线自由型",
}

TITLE_HEADERS = ("类型名", "类型名称", "结果名", "名称", "title", "type_name")
DESCRIPTION_HEADERS = ("类型描述", "描述", "说明", "description")
ROLE_HEADERS = ("角色候选/你可修改", "角色候选", "角色", "对应角色", "roles")
CHARACTER_NAME_HEADERS = ("character_name", "角色名称", "角色名", "人物名称", "人物名")
CHARACTER_SOURCE_HEADERS = ("character_source", "角色来源", "作品来源", "出处", "source")
CHARACTER_NOTE_HEADERS = ("character_note", "角色说明", "角色备注", "人物说明")
ART_KEY_HEADERS = ("art_key", "美术key", "美术键", "图片key", "illustration_key")
WHY_HEADERS = ("她可能喜欢的原因", "喜欢原因", "原因", "why")
ACCURACY_HEADERS = ("你觉得准吗", "准吗", "accuracy")
NOTES_HEADERS = ("备注", "notes", "note")


def main() -> int:
    parser = argparse.ArgumentParser(description="Parse SALT result type mappings from REF.xlsx.")
    parser.add_argument("--input", default="REF.xlsx", help="Path to REF.xlsx")
    parser.add_argument("--json-output", default="data/result_types.json", help="Path for parsed JSON")
    parser.add_argument("--js-output", default="data/result_types.js", help="Path for local browser bridge JS")
    parser.add_argument("--report-output", default="outputs/ref_parse_report.md", help="Path for parse report")
    args = parser.parse_args()

    root = Path(__file__).resolve().parents[1]
    input_path = resolve_path(root, args.input)
    json_output = resolve_path(root, args.json_output)
    js_output = resolve_path(root, args.js_output)
    report_output = resolve_path(root, args.report_output)

    result, report = parse_workbook(input_path)
    write_json(json_output, result)
    write_js_bridge(js_output, result)
    report_output.parent.mkdir(parents=True, exist_ok=True)
    report_output.write_text(report, encoding="utf-8")
    print(f"Wrote {json_output}")
    print(f"Wrote {js_output}")
    print(f"Wrote {report_output}")
    return 0


def resolve_path(root: Path, value: str) -> Path:
    path = Path(value)
    if path.is_absolute():
        return path
    return root / path


def parse_workbook(path: Path) -> tuple[dict[str, Any], str]:
    generated_at = datetime.now().isoformat(timespec="seconds")
    source_hash = sha256_file(path) if path.exists() else ""
    parser_name = ""
    parser_messages: list[str] = []
    sheets: list[dict[str, Any]] = []

    if not path.exists():
        parser_messages.append(f"Input file not found: {path}")
        rows: list[dict[str, Any]] = []
        parser_name = "fallback"
    else:
        try:
            sheets = read_with_openpyxl(path)
            parser_name = "openpyxl"
        except ModuleNotFoundError:
            parser_messages.append("openpyxl is unavailable; used the standard-library XLSX reader.")
            try:
                sheets = read_xlsx_stdlib(path)
                parser_name = "stdlib-xlsx"
            except Exception as error:
                parser_messages.append(f"standard-library XLSX reader failed: {error}; using fallback defaults.")
                sheets = []
                parser_name = "fallback"
        except Exception as error:
            parser_messages.append(f"openpyxl failed: {error}; used the standard-library XLSX reader.")
            try:
                sheets = read_xlsx_stdlib(path)
                parser_name = "stdlib-xlsx"
            except Exception as stdlib_error:
                parser_messages.append(f"standard-library XLSX reader failed: {stdlib_error}; using fallback defaults.")
                sheets = []
                parser_name = "fallback"

        rows = extract_type_rows(sheets, parser_messages)

    types, missing_codes = build_types(rows)
    result = {
        "version": "v3",
        "generated_at": generated_at,
        "source": {
            "file": path.name,
            "sha256": source_hash,
            "parser": parser_name,
            "messages": parser_messages,
        },
        "columns_used": summarize_columns(rows),
        "types": types,
        "rows": rows,
        "missing_codes_filled_from_defaults": missing_codes,
    }
    report = build_report(path, source_hash, parser_name, parser_messages, sheets, rows, missing_codes, generated_at)
    return result, report


def read_with_openpyxl(path: Path) -> list[dict[str, Any]]:
    import openpyxl  # type: ignore

    workbook = openpyxl.load_workbook(path, data_only=True, read_only=True)
    sheets = []
    for worksheet in workbook.worksheets:
        rows = []
        for row in worksheet.iter_rows(values_only=True):
            values = [normalize_cell(value) for value in row]
            while values and values[-1] == "":
                values.pop()
            if values:
                rows.append(values)
        sheets.append({"name": worksheet.title, "rows": rows})
    return sheets


def read_xlsx_stdlib(path: Path) -> list[dict[str, Any]]:
    with zipfile.ZipFile(path) as archive:
        names = set(archive.namelist())
        shared_strings = read_shared_strings(archive, names)
        sheet_paths = read_sheet_paths(archive)
        sheets = []
        for sheet_name, sheet_path in sheet_paths:
            root = ET.fromstring(archive.read(sheet_path))
            rows = []
            for row_node in root.findall("main:sheetData/main:row", NS):
                values = read_row(row_node, shared_strings)
                while values and values[-1] == "":
                    values.pop()
                if values:
                    rows.append(values)
            sheets.append({"name": sheet_name, "rows": rows})
        return sheets


def read_shared_strings(archive: zipfile.ZipFile, names: set[str]) -> list[str]:
    if "xl/sharedStrings.xml" not in names:
        return []
    root = ET.fromstring(archive.read("xl/sharedStrings.xml"))
    return [rich_text(si) for si in root.findall("main:si", NS)]


def read_sheet_paths(archive: zipfile.ZipFile) -> list[tuple[str, str]]:
    workbook = ET.fromstring(archive.read("xl/workbook.xml"))
    rels = ET.fromstring(archive.read("xl/_rels/workbook.xml.rels"))
    rel_map = {rel.attrib["Id"]: rel.attrib["Target"] for rel in rels}
    paths = []
    for sheet in workbook.findall("main:sheets/main:sheet", NS):
        name = sheet.attrib.get("name", "Sheet")
        rel_id = sheet.attrib.get(f"{{{OD_REL_NS}}}id", "")
        target = rel_map.get(rel_id, "")
        if target.startswith("/"):
            path = target.lstrip("/")
        elif target.startswith("xl/"):
            path = target
        else:
            path = f"xl/{target}"
        paths.append((name, path))
    return paths


def read_row(row_node: ET.Element, shared_strings: list[str]) -> list[str]:
    values: list[str] = []
    for cell in row_node.findall("main:c", NS):
        ref = cell.attrib.get("r", "")
        col_index = column_index(ref) if ref else len(values)
        while len(values) <= col_index:
            values.append("")
        values[col_index] = read_cell(cell, shared_strings)
    return values


def read_cell(cell: ET.Element, shared_strings: list[str]) -> str:
    cell_type = cell.attrib.get("t", "")
    value_node = cell.find("main:v", NS)
    inline_node = cell.find("main:is", NS)

    if cell_type == "s" and value_node is not None and value_node.text is not None:
        index = int(value_node.text)
        return shared_strings[index] if 0 <= index < len(shared_strings) else ""
    if cell_type == "inlineStr" and inline_node is not None:
        return rich_text(inline_node)
    if value_node is not None:
        return normalize_cell(value_node.text)
    return ""


def rich_text(node: ET.Element) -> str:
    return "".join(text.text or "" for text in node.findall(".//main:t", NS))


def column_index(ref: str) -> int:
    letters = "".join(ch for ch in ref if ch.isalpha())
    total = 0
    for char in letters:
        total = total * 26 + (ord(char.upper()) - ord("A") + 1)
    return max(total - 1, 0)


def extract_type_rows(sheets: list[dict[str, Any]], messages: list[str]) -> list[dict[str, Any]]:
    extracted: list[dict[str, Any]] = []
    for sheet in sheets:
        rows = sheet.get("rows", [])
        header_index = find_header_index(rows)
        sheet["header_index"] = header_index
        if header_index is None:
            messages.append(f"No clear header row found in sheet {sheet.get('name')}; scanned rows for SALT codes.")
            extracted.extend(extract_without_header(sheet))
            continue

        headers = make_headers(rows[header_index])
        sheet["headers"] = headers
        columns = detect_columns(headers)
        sheet["columns_used"] = columns
        for row_number, row in enumerate(rows[header_index + 1 :], start=header_index + 2):
            if not any(normalize_cell(cell) for cell in row):
                continue
            raw = map_row(headers, row)
            code = normalize_code(raw.get(columns.get("code", ""), ""))
            if not SALT_RE.fullmatch(code):
                code = find_code(row)
            if not code:
                continue
            extracted.append(build_row(sheet.get("name", ""), row_number, code, raw, columns))
    return extracted


def find_header_index(rows: list[list[str]]) -> int | None:
    for index, row in enumerate(rows):
        normalized = [normalize_cell(cell).lower() for cell in row]
        if "salt" in normalized:
            return index
        if any("类型" in cell for cell in row) and any(find_code([cell]) for cell in row):
            return index
    return None


def make_headers(row: list[str]) -> list[str]:
    headers = []
    for index, value in enumerate(row):
        header = normalize_cell(value)
        headers.append(header or f"Column {index + 1}")
    return headers


def detect_columns(headers: list[str]) -> dict[str, str]:
    return {
        "code": find_header(headers, ("SALT", "salt", "类型代码", "code")),
        "title": find_header(headers, TITLE_HEADERS),
        "description": find_header(headers, DESCRIPTION_HEADERS),
        "roles": find_header(headers, ROLE_HEADERS),
        "character_name": find_header(headers, CHARACTER_NAME_HEADERS),
        "character_source": find_header(headers, CHARACTER_SOURCE_HEADERS),
        "character_note": find_header(headers, CHARACTER_NOTE_HEADERS),
        "art_key": find_header(headers, ART_KEY_HEADERS),
        "why": find_header(headers, WHY_HEADERS),
        "accuracy": find_header(headers, ACCURACY_HEADERS),
        "notes": find_header(headers, NOTES_HEADERS),
    }


def find_header(headers: list[str], candidates: tuple[str, ...]) -> str:
    lowered = {header.lower(): header for header in headers}
    for candidate in candidates:
        if candidate.lower() in lowered:
            return lowered[candidate.lower()]
    for header in headers:
        for candidate in candidates:
            if candidate.lower() in header.lower():
                return header
    return ""


def map_row(headers: list[str], row: list[str]) -> dict[str, str]:
    output = {}
    for index, header in enumerate(headers):
        output[header] = normalize_cell(row[index]) if index < len(row) else ""
    return output


def extract_without_header(sheet: dict[str, Any]) -> list[dict[str, Any]]:
    extracted = []
    for row_number, row in enumerate(sheet.get("rows", []), start=1):
        code = find_code(row)
        if not code:
            continue
        raw = {f"Column {index + 1}": normalize_cell(value) for index, value in enumerate(row)}
        columns = {
            "code": "",
            "title": "Column 2",
            "description": "Column 3",
            "roles": "Column 4",
            "character_name": "",
            "character_source": "",
            "character_note": "",
            "art_key": "",
            "why": "Column 5",
            "accuracy": "Column 6",
            "notes": "Column 7",
        }
        extracted.append(build_row(sheet.get("name", ""), row_number, code, raw, columns))
    return extracted


def build_row(sheet_name: str, row_number: int, code: str, raw: dict[str, str], columns: dict[str, str]) -> dict[str, Any]:
    title = raw.get(columns.get("title", ""), "") or FALLBACK_TYPES.get(code, code)
    description = raw.get(columns.get("description", ""), "")
    roles_value = raw.get(columns.get("roles", ""), "")
    roles = split_roles(roles_value)
    character_name = raw.get(columns.get("character_name", ""), "") or (roles[0] if roles else "")
    character_note = raw.get(columns.get("character_note", ""), "")
    return {
        "code": code,
        "title": title,
        "description": description,
        "roles": roles,
        "role_candidates": roles,
        "role_text": roles_value,
        "character_name": character_name,
        "character_source": raw.get(columns.get("character_source", ""), ""),
        "character_note": character_note,
        "art_key": raw.get(columns.get("art_key", ""), "") or code,
        "why": raw.get(columns.get("why", ""), ""),
        "accuracy": raw.get(columns.get("accuracy", ""), ""),
        "notes": raw.get(columns.get("notes", ""), ""),
        "sheet": sheet_name,
        "row_number": row_number,
        "columns_used": columns,
        "raw": raw,
    }


def build_types(rows: list[dict[str, Any]]) -> tuple[dict[str, Any], list[str]]:
    types: dict[str, Any] = {}
    for row in rows:
        code = row.get("code", "")
        if not SALT_RE.fullmatch(code):
            continue
        candidate = {
            "code": code,
            "title": row.get("title", "") or FALLBACK_TYPES.get(code, code),
            "description": row.get("description", ""),
            "roles": row.get("roles", []),
            "role_candidates": row.get("role_candidates", row.get("roles", [])),
            "role_text": row.get("role_text", ""),
            "character_name": row.get("character_name", "") or (row.get("roles", [])[:1] or [""])[0],
            "character_source": row.get("character_source", ""),
            "character_note": row.get("character_note", "") or row.get("why", ""),
            "art_key": row.get("art_key", "") or code,
            "why": row.get("why", ""),
            "accuracy": row.get("accuracy", ""),
            "notes": row.get("notes", ""),
            "source_sheet": row.get("sheet", ""),
            "source_row": row.get("row_number", 0),
            "raw": row.get("raw", {}),
        }
        if code in types:
            types[code].setdefault("duplicate_rows", []).append(candidate)
            continue
        types[code] = candidate

    missing = []
    for code, title in FALLBACK_TYPES.items():
        if code in types:
            continue
        missing.append(code)
        types[code] = {
            "code": code,
            "title": title,
            "description": "这个类型使用内置兜底名称，REF.xlsx 未提供可解析描述。",
            "roles": [],
            "role_candidates": [],
            "role_text": "",
            "character_name": "",
            "character_source": "",
            "character_note": "",
            "art_key": code,
            "why": "",
            "accuracy": "",
            "notes": "fallback",
            "source_sheet": "",
            "source_row": 0,
            "raw": {},
        }
    return types, missing


def summarize_columns(rows: list[dict[str, Any]]) -> dict[str, str]:
    for row in rows:
        columns = row.get("columns_used")
        if columns:
            return columns
    return {}


def find_code(row: list[str]) -> str:
    for value in row:
        code = normalize_code(value)
        if SALT_RE.fullmatch(code):
            return code
    return ""


def normalize_code(value: Any) -> str:
    return normalize_cell(value).replace(" ", "").replace("\u3000", "")


def normalize_cell(value: Any) -> str:
    if value is None:
        return ""
    text = str(value)
    if text.endswith(".0") and text[:-2].isdigit():
        text = text[:-2]
    return re.sub(r"\s+", " ", text).strip()


def split_roles(value: str) -> list[str]:
    if not value:
        return []
    parts = re.split(r"\s*(?:/|、|，|,|；|;)\s*", value)
    return [part.strip() for part in parts if part.strip()]


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as file:
        for chunk in iter(lambda: file.read(65536), b""):
            digest.update(chunk)
    return digest.hexdigest()


def write_json(path: Path, data: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def write_js_bridge(path: Path, data: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    payload = json.dumps(data, ensure_ascii=False, indent=2)
    path.write_text(f"window.SALT_RESULT_TYPES_DATA = {payload};\n", encoding="utf-8")


def build_report(
    path: Path,
    source_hash: str,
    parser_name: str,
    messages: list[str],
    sheets: list[dict[str, Any]],
    rows: list[dict[str, Any]],
    missing_codes: list[str],
    generated_at: str,
) -> str:
    lines = [
        "# REF.xlsx parse report",
        "",
        f"- Generated: {generated_at}",
        f"- Source: `{path}`",
        f"- SHA256: `{source_hash}`",
        f"- Parser: `{parser_name}`",
        f"- Parsed SALT rows: {len(rows)}",
        f"- Missing codes filled from defaults: {len(missing_codes)}",
        "",
        "## Parser notes",
        "",
    ]
    if messages:
        lines.extend(f"- {message}" for message in messages)
    else:
        lines.append("- No parser warnings.")

    lines.extend(["", "## Sheets inspected", ""])
    for sheet in sheets:
        headers = sheet.get("headers") or []
        header_label = "not found" if sheet.get("header_index") is None else str(sheet.get("header_index") + 1)
        lines.append(f"- `{sheet.get('name')}`: {len(sheet.get('rows', []))} non-empty rows; header row {header_label}")
        if headers:
            lines.append(f"  - Headers: {', '.join(f'`{header}`' for header in headers)}")
        columns = sheet.get("columns_used")
        if columns:
            used = ", ".join(f"{key}=`{value}`" for key, value in columns.items() if value)
            lines.append(f"  - Columns used: {used}")

    lines.extend(["", "## Parsed type rows", ""])
    if rows:
        for row in rows:
            role_text = row.get("role_text", "")
            suffix = f"; roles: {role_text}" if role_text else ""
            lines.append(f"- `{row.get('code')}` {row.get('title')} from `{row.get('sheet')}` row {row.get('row_number')}{suffix}")
    else:
        lines.append("- No rows parsed; all result types came from fallback defaults.")

    lines.extend(["", "## Ambiguity review", ""])
    lines.append("- The workbook may contain prose rows before the table; only the row with a `SALT` header was used as the main header.")
    lines.append("- The app uses `SALT` as the key, `类型名` as title, `类型描述` as description, and `角色候选/你可修改` as role candidates.")
    lines.append("- If present, `character_name`, `character_source`, `character_note`, and `art_key` style columns are mapped into v4 result type fields.")
    lines.append("- Other parsed columns are preserved in `raw`, `why`, `accuracy`, and `notes` fields in `data/result_types.json`.")
    lines.append("- Duplicate SALT rows after the canonical table are preserved in `duplicate_rows`; the first mapping-table row is used by the app.")
    if missing_codes:
        lines.append(f"- Missing codes filled from fallback names: {', '.join(f'`{code}`' for code in missing_codes)}")
    else:
        lines.append("- All 16 SALT codes were parsed from REF.xlsx.")
    lines.append("")
    return "\n".join(lines)


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f"parse_ref_xlsx.py failed: {exc}", file=sys.stderr)
        raise
