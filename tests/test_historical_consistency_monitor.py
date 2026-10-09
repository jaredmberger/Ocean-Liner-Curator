"""Regression tests for the read-only historical consistency monitor."""
import importlib.util
from pathlib import Path
import tempfile
import unittest

SCRIPT = Path(__file__).resolve().parents[1] / "scripts" / "historical-consistency-monitor.py"
spec = importlib.util.spec_from_file_location("historical_consistency", SCRIPT)
audit = importlib.util.module_from_spec(spec)
spec.loader.exec_module(audit)

def guide(**fields):
    rows = "".join(
        '<div class="fact-row" role="row">'
        f'<div class="fact-label" role="cell">{label}</div>'
        f'<div class="fact-value" role="cell">{value}</div>'
        '</div>' for label, value in fields.items()
    )
    return "<html><body><div class='facts'>" + rows + "</div></body></html>"

class HistoricalConsistencyTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        (self.root / "ships").mkdir()
        (self.root / "sitemaps").mkdir()

    def setup_archive(self, guides, missing=()):
        urls = "".join(f"<url><loc>https://oceanliners.net/ships/{s}</loc></url>"
                       for s in (*guides.keys(), *missing))
        (self.root / "sitemaps" / "sitemap-ships.xml").write_text(
            "<urlset>" + urls + "</urlset>", encoding="utf-8")
        for slug, content in guides.items():
            (self.root / "ships" / (slug + ".html")).write_text(content, encoding="utf-8")

    def scan(self):
        return audit.scan(self.root)

    def test_key_facts_parser_and_dates(self):
        data = audit.facts(guide(Launched="13 April 1913",
                                 **{"Maiden voyage": "14 May 1914"}))
        self.assertEqual(data["launched"], "13 April 1913")
        self.assertEqual(str(audit.dates(data["launched"])[0]), "1913-04-13")

    def test_launch_after_maiden_is_flagged(self):
        self.setup_archive({"ss-test": guide(Launched="13 April 1924",
                                           **{"Maiden voyage": "1 March 1924"})})
        total, resolved, findings, parsed, dated = self.scan()
        self.assertEqual((total, resolved, parsed, dated), (1, 1, 1, 2))
        self.assertIn("maiden voyage predates launch", [f[1] for f in findings])

    def test_completion_after_maiden_is_flagged(self):
        self.setup_archive({"ss-test": guide(Completed="1 June 1924",
                                           **{"Maiden voyage": "22 April 1924"})})
        self.assertIn("maiden voyage predates completion", [f[1] for f in self.scan()[2]])

    def test_qualified_completion_skipped(self):
        self.setup_archive({"ss-test": guide(Completed="By 1 June 1924 (date varies)",
                                           **{"Maiden voyage": "22 April 1924"})})
        self.assertFalse([f for f in self.scan()[2] if f[0] == "review"])

    def test_same_hull_launch_disagreement_flagged(self):
        self.setup_archive({"ss-imperator": guide(Launched="23 May 1912"),
                            "rms-berengaria": guide(**{"Launched (as Imperator)": "24 May 1912"})})
        issues = [f[1] for f in self.scan()[2]]
        self.assertIn("same-hull launch disagreement", issues)

    def test_phase_specific_maiden_dates_not_compared(self):
        self.setup_archive({"ss-imperator": guide(Launched="23 May 1912", **{"Maiden voyage": "11 June 1913"}),
                            "rms-berengaria": guide(**{"Launched (as Imperator)": "23 May 1912",
                                                     "Maiden voyage as Berengaria": "1 March 1921"})})
        self.assertFalse([f for f in self.scan()[2] if f[0] == "review"])

    def test_distinct_ships_with_same_name_not_equated(self):
        self.setup_archive({"rms-orontes": guide(Launched="10 May 1902"),
                            "ss-orontes": guide(Launched="26 February 1929")})
        self.assertFalse([f for f in self.scan()[2] if f[0] == "review"])

    def test_missing_file_reported(self):
        self.setup_archive({"ss-test": guide(Launched="1 May 1912")}, missing=("ss-missing",))
        self.assertIn("sitemap ship file not found", [f[1] for f in self.scan()[2]])

    def test_empty_parsed_facts_fails_loudly(self):
        self.setup_archive({"ss-test": "<html><p>No Key Facts</p></html>"})
        with self.assertRaisesRegex(ValueError, "No ship Key Facts"):
            self.scan()

if __name__ == "__main__":
    unittest.main()
