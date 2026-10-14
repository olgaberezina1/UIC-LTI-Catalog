import os
import tempfile
import unittest

import stamp_assets as sa


INDEX_TEMPLATE = """<!doctype html>
<html>
<head>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Source+Sans+3" rel="stylesheet">
<link rel="stylesheet" href="{styles}">
</head>
<body>
<main></main>
<script src="{app}"></script>
</body>
</html>
"""


class AssetVersionTest(unittest.TestCase):
    def write(self, body):
        handle = tempfile.NamedTemporaryFile("w", delete=False, encoding="utf-8")
        handle.write(body)
        handle.close()
        self.addCleanup(os.unlink, handle.name)
        return handle.name

    def test_is_stable_for_identical_content(self):
        first = self.write("body { color: red; }")
        second = self.write("body { color: red; }")
        self.assertEqual(sa.asset_version(first), sa.asset_version(second))

    def test_changes_when_content_changes(self):
        before = sa.asset_version(self.write("body { color: red; }"))
        after = sa.asset_version(self.write("body { color: blue; }"))
        self.assertNotEqual(before, after)

    def test_is_short_enough_for_a_url(self):
        self.assertEqual(len(sa.asset_version(self.write("x"))), sa.VERSION_LENGTH)

    def test_raises_when_the_asset_is_missing(self):
        with self.assertRaises(sa.StampError) as ctx:
            sa.asset_version("/nonexistent/styles.css")
        self.assertIn("not found", str(ctx.exception))


class StampTest(unittest.TestCase):
    VERSIONS = {"styles.css": "aaaaaaaaaa", "app.js": "bbbbbbbbbb"}

    def test_adds_a_version_to_unstamped_references(self):
        html, changes = sa.stamp(
            INDEX_TEMPLATE.format(styles="styles.css", app="app.js"), self.VERSIONS)
        self.assertIn('href="styles.css?v=aaaaaaaaaa"', html)
        self.assertIn('src="app.js?v=bbbbbbbbbb"', html)
        self.assertEqual(len(changes), 2)
        self.assertTrue(any("(unstamped)" in c for c in changes))

    def test_replaces_an_existing_version(self):
        html, changes = sa.stamp(
            INDEX_TEMPLATE.format(styles="styles.css?v=old1", app="app.js?v=old2"),
            self.VERSIONS)
        self.assertIn('href="styles.css?v=aaaaaaaaaa"', html)
        self.assertIn('src="app.js?v=bbbbbbbbbb"', html)
        self.assertNotIn("old1", html)
        self.assertNotIn("old2", html)
        self.assertTrue(any("old1 -> aaaaaaaaaa" in c for c in changes))

    def test_reports_no_changes_when_already_current(self):
        current = INDEX_TEMPLATE.format(
            styles="styles.css?v=aaaaaaaaaa", app="app.js?v=bbbbbbbbbb")
        html, changes = sa.stamp(current, self.VERSIONS)
        self.assertEqual(changes, [])
        self.assertEqual(html, current)

    def test_is_idempotent(self):
        once, _ = sa.stamp(
            INDEX_TEMPLATE.format(styles="styles.css", app="app.js"), self.VERSIONS)
        twice, changes = sa.stamp(once, self.VERSIONS)
        self.assertEqual(once, twice)
        self.assertEqual(changes, [])

    def test_leaves_other_links_alone(self):
        html, _ = sa.stamp(
            INDEX_TEMPLATE.format(styles="styles.css", app="app.js"), self.VERSIONS)
        # The Google Fonts stylesheet and preconnect must not be touched.
        self.assertIn('href="https://fonts.googleapis.com/css2?family=Source+Sans+3"', html)
        self.assertIn('href="https://fonts.googleapis.com"', html)

    def test_raises_when_a_reference_is_missing(self):
        # app.js inlined or renamed: stamping silently doing nothing would be worse.
        html = INDEX_TEMPLATE.format(styles="styles.css", app="app.js").replace(
            '<script src="app.js"></script>', "<script>/* inlined */</script>")
        with self.assertRaises(sa.StampError) as ctx:
            sa.stamp(html, self.VERSIONS)
        self.assertIn("app.js", str(ctx.exception))


class ReadIndexTest(unittest.TestCase):
    def test_raises_when_index_is_missing(self):
        with self.assertRaises(sa.StampError) as ctx:
            sa.read_index("/nonexistent/index.html")
        self.assertIn("not found", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
