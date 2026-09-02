### Task 6: Generate and land `tools.json`

**Files:**
- Create: `tools.json` (generated — do not write by hand)

**Interfaces:**
- Consumes: the CLI from Task 5
- Produces: `tools.json` at the repo root, the file `app.js` fetches in Task 7

`app.js` still uses its own array at this point, so landing `tools.json` cannot affect the live site — it is a new file nobody reads yet.

**This task pushes**, because the script commits and pushes on its own. Its `git push origin main` sends up the Task 1–5 script commits along with `tools.json`; that is fine, since nothing on the live site references either yet.

- [ ] **Step 1: Generate, commit and push**

Run: `python3 scripts/sync_catalog.py`
Expected: the same 58-tool summary as the dry run, then `committed and pushed 58 change(s)`

- [ ] **Step 2: Verify the generated file**

Run:

```bash
python3 -c "
import json
tools = json.load(open('tools.json'))
print('tools:', len(tools))
print('with video:', sum(1 for t in tools if 'video' in t))
print('without category:', [t['name'] for t in tools if not t['category']])
print('with tags:', [t['name'] for t in tools if 'tags' in t])
print('first three:', [t['name'] for t in tools[:3]])
print('ClassRanked:', [t for t in tools if t['name'] == 'ClassRanked'][0])
"
```

Expected:

```
tools: 58
with video: 10
without category: []
with tags: []
first three: ['Acadly', 'ACS Lab Safety UIC', 'Aleks']
ClassRanked: {... 'bb': 'yes', 'cv': 'yes' ...}
```

- [ ] **Step 3: Confirm the commit is clean**

Run: `git show --stat HEAD`
Expected: exactly one file changed, `tools.json`. If anything else was staged, the `git add` path guard failed — stop and fix Task 5.

---

