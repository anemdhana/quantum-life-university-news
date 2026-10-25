# Magazine issue packs

Each month is a folder: `YYYY-MM/`. Naming rules: **[docs/MAGAZINE-SEED.md](../../docs/MAGAZINE-SEED.md)**.

```powershell
# New empty month
python scripts\seed_magazine_from_folder.py --month 2026-11 --init-from-template

# After editing photos + content.*.txt
python scripts\seed_magazine_from_folder.py --month 2026-11

# Only one (or more) sections — keeps the rest of the issue
python scripts\seed_magazine_from_folder.py --month 2026-11 --section themes
python scripts\seed_magazine_from_folder.py --month 2026-11 --section visits --section campus
```

`_template/` = blank structure. `2026-10/` = sample seeded issue.
