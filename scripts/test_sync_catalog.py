import unittest

import sync_catalog as sc


class MapStatusTest(unittest.TestCase):
    def test_maps_every_value_the_sheet_currently_uses(self):
        cases = {
            "Yes": "yes",
            "No": "no",
            "NA": "na",
            "Standalone": "standalone",
            "Retired": "retired",
            "Waiting for vendor response": "pending",
            "In Progress": "progress",
            "Available Per Request": "request",
            "Not licensed, unavailable.": "unlicensed",
            "": "—",
            "Status": "—",
        }
        for raw, code in cases.items():
            self.assertEqual(sc.map_status(raw, "Some Tool", "Available in Canvas"), code)

    def test_treats_none_as_em_dash(self):
        self.assertEqual(sc.map_status(None, "Some Tool", "Title II Compliant"), "—")

    def test_strips_surrounding_whitespace(self):
        self.assertEqual(sc.map_status("  Yes  ", "Some Tool", "Available in Canvas"), "yes")

    def test_raises_on_unknown_value_naming_tool_and_column(self):
        with self.assertRaises(sc.SyncError) as ctx:
            sc.map_status("Maybe?", "Packback", "Available in Canvas")
        message = str(ctx.exception)
        self.assertIn("Packback", message)
        self.assertIn("Available in Canvas", message)
        self.assertIn("Maybe?", message)


def row(name="Acadly", bb="Yes", cv="Yes"):
    return {sc.COL_NAME: name, sc.COL_BB: bb, sc.COL_CV: cv}


class ShouldKeepTest(unittest.TestCase):
    def test_keeps_a_live_row(self):
        self.assertTrue(sc.should_keep(row()))

    def test_keeps_a_row_live_in_only_one_lms(self):
        self.assertTrue(sc.should_keep(row(bb="Excluded", cv="Yes")))
        self.assertTrue(sc.should_keep(row(bb="Yes", cv="Retired")))

    def test_drops_rows_dead_in_both(self):
        self.assertFalse(sc.should_keep(row(bb="Excluded", cv="Excluded")))
        self.assertFalse(sc.should_keep(row(bb="Retired", cv="Retired")))
        self.assertFalse(sc.should_keep(row(bb="", cv="")))
        self.assertFalse(sc.should_keep(row(bb="Excluded", cv="Retired")))

    def test_drops_rows_without_a_name(self):
        self.assertFalse(sc.should_keep(row(name="")))
        self.assertFalse(sc.should_keep(row(name="   ")))
        self.assertFalse(sc.should_keep(row(name=None)))


if __name__ == "__main__":
    unittest.main()
