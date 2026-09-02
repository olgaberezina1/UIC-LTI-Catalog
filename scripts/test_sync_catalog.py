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


def full_row(**overrides):
    base = {
        sc.COL_NAME: "Panopto",
        sc.COL_DESC: "A comprehensive video platform for education.",
        sc.COL_CATEGORY: "Media & Content Creation",
        sc.COL_BB: "Yes",
        sc.COL_CV: "Yes",
        sc.COL_T2: "Yes",
        sc.COL_VIDEO: None,
        sc.VIDEO_URL_KEY: "",
    }
    base.update(overrides)
    return base


class RowToToolTest(unittest.TestCase):
    def test_maps_the_plain_fields(self):
        self.assertEqual(
            sc.row_to_tool(full_row()),
            {
                "name": "Panopto",
                "desc": "A comprehensive video platform for education.",
                "category": "Media & Content Creation",
                "bb": "yes",
                "cv": "yes",
                "t2": "yes",
            },
        )

    def test_omits_video_keys_when_there_is_no_hyperlink(self):
        tool = sc.row_to_tool(full_row(**{sc.COL_VIDEO: "Watch this"}))
        self.assertNotIn("video", tool)
        self.assertNotIn("videoTitle", tool)

    def test_adds_video_and_title_when_hyperlinked(self):
        tool = sc.row_to_tool(
            full_row(
                **{
                    sc.COL_VIDEO: "How to Embed Panopto Videos",
                    sc.VIDEO_URL_KEY: "https://uic.hosted.panopto.com/Panopto/Pages/Viewer.aspx?id=4006194c",
                }
            )
        )
        self.assertEqual(
            tool["video"],
            "https://uic.hosted.panopto.com/Panopto/Pages/Viewer.aspx?id=4006194c",
        )
        self.assertEqual(tool["videoTitle"], "How to Embed Panopto Videos")

    def test_strips_whitespace_and_tolerates_empty_cells(self):
        tool = sc.row_to_tool(
            full_row(**{sc.COL_NAME: "  Ally  ", sc.COL_DESC: None, sc.COL_T2: ""})
        )
        self.assertEqual(tool["name"], "Ally")
        self.assertEqual(tool["desc"], "")
        self.assertEqual(tool["t2"], "—")

    def test_propagates_a_bad_status_with_the_tool_name(self):
        with self.assertRaises(sc.SyncError) as ctx:
            sc.row_to_tool(full_row(**{sc.COL_NAME: "Labflow", sc.COL_CV: "Sort of"}))
        self.assertIn("Labflow", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
