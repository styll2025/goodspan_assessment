"""Rebuild the practice data the engine uses (core/data.json, key "lib") from the library workbook.
The workbook is the single source of truth for practices. Run after editing source/Practice_library_and_mapping.xlsx:
    pip install openpyxl
    python scripts/library_to_json.py
Also writes data/library.json with every column, for reading or importing elsewhere."""
import json, os
from openpyxl import load_workbook
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
XLSX = os.path.join(ROOT, 'source', 'Practice_library_and_mapping.xlsx')
ws = load_workbook(XLSX)['Practices']
H = [c.value for c in ws[1]]; ix = {h: i for i, h in enumerate(H) if h}
lib, full = [], []
for r in ws.iter_rows(min_row=2, values_only=True):
    if not r[0]: continue
    g = lambda k: r[ix[k]]
    ex = g('Exclude if')
    xs = [] if (not ex or str(ex).strip() in ('None', '')) else [s.strip() for s in str(ex).replace('\n', ';').split(';') if s.strip()]
    eq = g('Equipment needed')
    lib.append({'p': g('Pillar'), 'c': g('Category'), 'l': g('Level'), 'f': g('Practice family'), 'w': g('Practice (what)'), 'd': g('Frequency and time'),
                't': g('Details'), 'ev': g('Evidence level'), 'why': g('Why this matters'), 'tg': float(g('Target time per week (min)') or 0),
                'ex': float(g('Extra Good Span time (min/week)') or 0), 'x': xs, 'eq': bool(eq) and str(eq).strip() not in ('None', 'No', ''),
                'ref': ' | '.join(s.strip() for s in str(g('References') or '').split('\n') if s.strip())})
    full.append({h: (r[i] if not (isinstance(r[i], str) and r[i].startswith('=')) else None) for h, i in ix.items() if h != 'Plan text (generated)'})
p = os.path.join(ROOT, 'core', 'data.json'); d = json.load(open(p))
d['lib'] = lib; json.dump(d, open(p, 'w'), ensure_ascii=False)
os.makedirs(os.path.join(ROOT, 'data'), exist_ok=True)
json.dump(full, open(os.path.join(ROOT, 'data', 'library.json'), 'w'), ensure_ascii=False, indent=1)
print(len(lib), 'practices written to core/data.json and data/library.json')
