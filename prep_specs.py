#!/usr/bin/env python3
"""Prepare per-chapter authoring packets (v2) for the comic redo. New format:
dated strips in chronological order, captions that cover EVERY key term and
timeline event (key terms/years bolded), clean art (no in-image narration),
unique speech bubbles, and Winona included ONLY where the chapter genuinely
involves Native Americans. Writes GUIDE.txt + ch<N>_source.txt."""
import json
from pathlib import Path

BASE = Path(__file__).parent
OUT = BASE / "output" / "comic_specs"
OUT.mkdir(parents=True, exist_ok=True)

src = (BASE / "studier" / "data.js").read_text()
src = src[src.index("{"):src.rindex("}") + 1]
CH = json.loads(src)["chapters"]

# If Winona appears in this chapter, this is her era-appropriate look.
ERA = {
 2: "a Powhatan woman of the 1610s–1650s Chesapeake in a fringed deerskin dress, with a bow",
 3: "a 1670s eastern-woodlands woman in deerskin with a few traded metal tools, a bow and a hatchet",
 4: "a 1750s frontier Native woman in buckskin and a wool trade blanket, a musket beside her bow",
 5: "a 1770s Haudenosaunee (Iroquois) woman in deerskin",
 6: "a 1780s Native woman in deerskin",
 7: "a 1780s–90s Ohio-country Native woman in deerskin and a trade blanket",
 9: "an 1820s–30s Native woman in a mix of trade cloth and calico",
 10: "an 1830s southeastern (Cherokee) woman in a calico dress and shawl",
 11: "a mid-1800s Native woman in Indian Territory",
 12: "an 1840s Native woman",
 13: "an 1850s mounted Plains woman in a hide dress, a bow and a rifle on horseback",
 14: "an 1860s Plains woman in a hide dress",
 15: "an 1860s–70s Plains woman",
 16: "an 1870s–80s Plains woman",
 17: "an 1890s reservation-era woman in Euro-American dress",
 18: "an early-1900s Native woman",
 19: "a 1910s Native woman whose son wears a WWI uniform",
 20: "a 1920s Native woman",
 21: "a 1930s Native woman",
 22: "a 1940s Native woman whose son is a US Marine and Navajo Code Talker",
 23: "a 1950s Native woman",
 24: "a 1950s Native woman relocated to a city",
 25: "a 1960s Native woman in the Red Power movement",
 26: "a 1970s Native woman",
 27: "a 1990s Native woman",
 28: "a present-day Native woman",
}

NATIVE_KW = [
 "indian", "native american", "natives", "tribe", "tribal", "iroquois", "powhatan",
 "pequot", "metacom", "king philip", "pueblo", "cherokee", "seminole", "sioux",
 "lakota", "cheyenne", "apache", "navajo", "comanche", "tecumseh", "tenskwatawa",
 "removal", "trail of tears", "reservation", "dawes", "wounded knee", "little bighorn",
 "sand creek", "red power", "american indian movement", "code talker", "sacagawea",
 "pontiac", "little turtle", "worcester v", "prophetstown", "tippecanoe", "sitting bull",
 "crazy horse", "geronimo", "ghost dance", "allotment", "termination", "self-determination act",
]


def native_items(c):
    """Return (native_key_terms, native_timeline) that mention Native peoples."""
    def has(txt):
        t = txt.lower()
        return [k for k in NATIVE_KW if k in t]
    nkt = [(t.get("term") if isinstance(t, dict) else t)
           for t in c.get("key_terms", [])
           if has((t.get("term", "") + " " + (t.get("definition", "") or "")) if isinstance(t, dict) else str(t))]
    ntl = [f"{t.get('year')}: {t.get('event')}" for t in c.get("timeline", []) if has(t.get("event", ""))]
    summ = " ".join(c.get("summary", []))
    summ_hits = [k for k in NATIVE_KW if k in summ.lower()]
    return nkt, ntl, summ_hits


GUIDE = r"""WINONA COMIC — AUTHORING GUIDE v2 (read fully, then author ONE chapter)

You are writing the script for ONE chapter of an illustrated APUSH study comic that
runs through the whole U.S. history textbook "Give Me Liberty!" (Foner). Each chapter
is a stack of DATED COMIC STRIPS. Each strip is ONE wide image of 2–3 panels of
DIFFERENT sizes that read left-to-right; under it sits a study caption with the real
history. The comic is BUILT OFF the chapter's key terms and timeline.

=== THE 6 HARD RULES ===
1. COVER EVERYTHING. The captions together must mention EVERY key term and EVERY
   timeline event in the source (by name, with the year). This is a study tool — do
   not skip any. Use 6–9 strips as needed to fit it all; do not cram.
2. DATED + CHRONOLOGICAL. Give every strip a "date" (a year or range, e.g. "1794",
   "1800–1803") and put the strips in strict chronological order.
3. BOLD THE TERMS. In each caption, wrap every key term and important year in **double
   asterisks**, e.g. "**Whiskey Rebellion** of **1794**".
4. CLEAN ART — NO TEXT IN THE IMAGE. Scenes must contain NO narration boxes, labels,
   or signs. The ONLY text is at most one short speech bubble (1–3 words) per panel.
5. UNIQUE BUBBLES. Every speech-bubble line in the whole chapter must be different —
   never repeat the same bubble text.
6. WINONA ONLY WHERE NATIVES ARE. Winona is our recurring Native American woman. Put
   her (has_winona:true) ONLY in strips whose content genuinely involves Native
   Americans. The source file tells you whether this chapter HAS Native content and
   which items are Native-related. If it says NATIVE CONTENT: NONE, do NOT include
   Winona anywhere — follow the era's actual people (politicians, workers, soldiers,
   enslaved people, reformers, immigrants, etc.).

=== OUTPUT ===
Write ONLY a JSON file (no prose) to output/comic_specs/ch<N>.json:
{
  "chapter": <N>,
  "strips": [
    {
      "aspect": "16:9" or "3:2",
      "has_winona": true or false,
      "date": "<year or range shown top-left>",
      "scene": "<image prompt: describe each differently-sized panel + any 1-3 word
                 speech bubbles. NO narration text in the art. ~50–90 words.>",
      "cap": "<2–4 sentence study caption using the real names/dates/terms, with every
               key term and year in **bold**. ~50–80 words.>"
    }
    ... 6 to 9 strips, chronological ...
  ]
}
Use "3:2" for big/climactic strips, "16:9" for normal ones.

=== GOLD EXAMPLE (from Chapter 8) ===
STRIP (16:9, no Winona, date "1794"): scene = "THREE panels of different sizes. LARGE
LEFT PANEL: angry Pennsylvania frontier farmers overturn a tax collector's cart by a
whiskey still, one shaking a jug; a farmer's speech bubble: 'No tax!' TOP-RIGHT PANEL:
Washington on a white horse reviews militia marching to crush the rebellion. BOTTOM-
RIGHT PANEL: diplomat John Jay shakes hands with a British official over a treaty."
cap = "On the frontier, farmers rose against Hamilton's excise tax in the **Whiskey
Rebellion** of **1794**; Washington marched an army to crush it, proving the new
government's power. That same year, **Jay's Treaty** eased tensions with Britain but
enraged pro-French Americans."

STRIP (3:2, WITH Winona, date "1811–1813"): scene = "THREE panels of different sizes.
BIG TOP PANEL: the Shawnee leader Tecumseh, arm raised, rallies many Native nations
before Prophetstown; Winona stands among the warriors; Tecumseh's bubble: 'Unite!'
BOTTOM-LEFT PANEL: the smoky Battle of Tippecanoe. BOTTOM-RIGHT PANEL: Winona resolute
with her bow at dusk; her bubble: 'We stand!'" cap = "The Shawnee brothers **Tecumseh
and Tenskwatawa** built a confederacy to resist expansion — until Harrison destroyed
Prophetstown at the **Battle of Tippecanoe** in **1811**. As the **War of 1812** began,
Tecumseh allied with Britain and Winona fought beside him."

Now author THIS chapter from its source file. Output only the JSON file.
"""

(OUT / "GUIDE.txt").write_text(GUIDE)


# Final hand-checked set of chapters that genuinely involve Native Americans
# (false positives like ch12 "Indiana" removed; ch25 Red Power added back).
YES_CHAPTERS = {2, 3, 4, 6, 7, 8, 10, 14, 16, 21, 25}


def fmt_chapter(n):
    c = CH[str(n)]
    nkt, ntl, summ_hits = native_items(c)
    has_native = n in YES_CHAPTERS
    L = []
    L.append(f"CHAPTER {n}: {c.get('title','')}  ({c.get('years','')})")
    L.append("")
    if has_native:
        L.append("NATIVE CONTENT: YES — this chapter genuinely involves Native Americans.")
        L.append(f"  Include WINONA (as {ERA.get(n,'a Native American woman')}) ONLY in the "
                 f"strip(s) that cover the Native-related items below; keep her out of the "
                 f"purely non-Native strips.")
        if nkt:
            L.append("  Native-related key terms: " + "; ".join(nkt))
        if ntl:
            L.append("  Native-related timeline: " + " | ".join(ntl))
        if not nkt and not ntl:
            L.append("  The Native thread here comes from the summary (e.g., " +
                     ", ".join(sorted(set(summ_hits))) + "); give Winona ONE strip on it.")
    else:
        L.append("NATIVE CONTENT: NONE — this chapter is not really about Native Americans.")
        L.append("  Do NOT include Winona anywhere. Every strip has_winona:false. Follow the "
                 "era's actual people.")
    L.append("")
    L.append("TEXTBOOK SUMMARY (ground your captions in this):")
    for p in c.get("summary", []):
        L.append("  - " + p)
    L.append("")
    L.append("KEY TERMS (cover EVERY one): " + " | ".join(
        (t.get("term") if isinstance(t, dict) else str(t)) for t in c.get("key_terms", [])))
    L.append("")
    L.append("TIMELINE (cover EVERY one):")
    for t in c.get("timeline", []):
        L.append(f"  {t.get('year','')}: {t.get('event','')}")
    return "\n".join(L)


rows = []
for n in range(2, 29):
    (OUT / f"ch{n}_source.txt").write_text(fmt_chapter(n))
    c = CH[str(n)]
    nkt, ntl, sh = native_items(c)
    rows.append((n, c["title"], "YES" if (nkt or ntl or len(sh) >= 2) else "none"))

print("Wrote GUIDE.txt + chapter source files.\nNative-content classification:")
for n, title, flag in rows:
    print(f"  ch{n:2d} {flag:4s}  {title}")
