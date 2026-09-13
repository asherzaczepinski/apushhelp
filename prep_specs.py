#!/usr/bin/env python3
"""Prepare per-chapter authoring packets for the Winona comic (chapters 2-28).
Writes output/comic_specs/GUIDE.txt (shared rules + gold example) and
output/comic_specs/ch<N>_source.txt (this chapter's textbook content + Winona
bible entry). Subagents read these and author ch<N>.json."""
import json
from pathlib import Path

BASE = Path(__file__).parent
OUT = BASE / "output" / "comic_specs"
OUT.mkdir(parents=True, exist_ok=True)

src = (BASE / "studier" / "data.js").read_text()
src = src[src.index("{"):src.rindex("}") + 1]
CH = json.loads(src)["chapters"]

# Winona's evolving lineage, per chapter: (era/appearance, personal thread, war beat)
BIBLE = {
 2:("A Powhatan woman of the 1610s-1650s Chesapeake; eastern-woodland fringed deerskin dress, a bow.",
    "Winona's people trade with, then are shoved aside by, Jamestown's tobacco planters and their indentured servants.",
    "She joins Opechancanough's resistance — the 1622 uprising — against English land-hunger."),
 3:("1670s eastern woodlands; deerskin with a few traded metal tools, a bow and a hatchet.",
    "As Anglo-America hardens and slavery spreads, Native land keeps shrinking.",
    "She fights in King Philip's (Metacom's) War, 1675-76, the last great New England resistance."),
 4:("1750s frontier; buckskin mixed with a traded wool blanket, now a musket beside her bow.",
    "Rival empires collide on Native ground.",
    "She fights alongside the French in the Seven Years' / French and Indian War against the British."),
 5:("1770s frontier woman.",
    "Colonists shout 'liberty' while eyeing Native land.",
    "Like most nations she sides with the British Crown, fighting American militias on the frontier."),
 6:("Late 1770s-1780s.",
    "The Revolution's promise of freedom pointedly leaves out Natives, the enslaved, and women.",
    "No battle — her fight is for a place in the new nation's idea of liberty."),
 7:("1780s-90s Ohio country.",
    "The new Constitution and the Northwest Ordinance take aim at Native land.",
    "She fights with the Northwest Confederacy under Little Turtle, routing St. Clair's army in 1791."),
 8:("Early 1800s.",
    "The young republic pushes relentlessly west.",
    "She joins Tecumseh's confederacy — Tippecanoe and the War of 1812 — the last pan-Native stand in the East."),
 9:("1820s-30s; a mix of trade cloth and calico, displaced westward.",
    "Canals, railroads, and factories remake the country while her people are pushed to its edges.",
    "No battle — survival amid the Market Revolution."),
 10:("1830s.",
    "Jacksonian 'democracy' for white men means removal for Natives.",
    "She resists — the Cherokee's court fight and the Seminole Wars — before the Trail of Tears drives her west."),
 11:("1840s-50s, resettled in Indian Territory.",
    "The cotton South's slavery defines the era; Winona rebuilds in exile and sees slavery's reach even in the Territory.",
    "No battle — a parallel witness to the enslaved."),
 12:("1840s.",
    "Reformers try to remake America — abolition, temperance, women's rights.",
    "No battle — she watches Seneca Falls and abolition and hopes reform's circle might widen to her people."),
 13:("1850s Plains; now a mounted Plains woman in a hide dress, a bow and a rifle on horseback.",
    "Manifest Destiny and the Mexican War push settlers across the Plains.",
    "She skirmishes to defend Plains hunting grounds as wagon trains and the slavery crisis roll west."),
 14:("1860s Plains.",
    "The Civil War tears the nation in two.",
    "She survives the Sand Creek Massacre of 1864 as the army turns on the Cheyenne even amid the war."),
 15:("1860s-70s Plains.",
    "Reconstruction remakes citizenship for freedpeople while the army marches west.",
    "She fights the opening Plains Wars as railroads and soldiers pour in after Appomattox."),
 16:("1870s-80s Plains.",
    "The Gilded Age's railroads and industry devour the West.",
    "The peak and the heartbreak: victory at Little Bighorn (1876), then the Wounded Knee massacre (1890) and the Dawes Act carving up the reservations."),
 17:("1890s; forced into reservation-era Euro-American dress, her hair cut at a boarding school.",
    "The frontier is declared closed and empire turns overseas.",
    "Her son enlists in the 1898 Spanish-American War even as her own people are confined and assimilated."),
 18:("1900s-1910s dress.",
    "Progressives reform the cities while boarding schools try to erase Native culture.",
    "No battle — she fights assimilation, joining the first pan-Indian reform voices."),
 19:("1917-18; her son in a WWI doughboy uniform, Winona in 1910s dress.",
    "The nation marches off 'to make the world safe for democracy.'",
    "Her son fights in France in WWI — Natives serve though most aren't yet even citizens."),
 20:("1920s dress.",
    "Consumer culture, Prohibition, and nativism define the Twenties.",
    "No battle — the 1924 Indian Citizenship Act finally makes Winona a citizen of the country built on her homeland."),
 21:("1930s Depression-era dress.",
    "The Depression and the New Deal remake the government's role.",
    "No battle — the 1934 Indian Reorganization Act ('Indian New Deal') restores some tribal self-rule and land."),
 22:("1941-45; her son in a US Marine uniform, Winona in 1940s dress.",
    "The nation fights fascism for the Four Freedoms.",
    "Her son is a Navajo Code Talker and helps raise the flag at Iwo Jima — the proudest fight of the whole arc."),
 23:("1950s.",
    "The Cold War abroad; McCarthyism and Termination policy at home.",
    "Her son fights in Korea while she battles the Termination policy that tries to dissolve the tribes."),
 24:("1950s, now relocated to a city (Los Angeles).",
    "Suburban affluence and the federal Relocation program pull Natives off reservations into cities.",
    "No battle — the urban-Indian struggle to hold on to identity in a booming, conformist America."),
 25:("1960s.",
    "Civil rights, Vietnam, and the counterculture upend the nation.",
    "She joins the new Red Power movement — the 1969 occupation of Alcatraz — demanding Native rights."),
 26:("1970s.",
    "A conservative turn — but also a new era of self-determination for tribes.",
    "She stands at the 1973 occupation of Wounded Knee with AIM; Nixon-era self-determination and the first tribal-gaming rulings open a new path."),
 27:("1990s.",
    "Globalization, the tech boom, and the culture wars of the Clinton years.",
    "No battle — after the 1988 Indian Gaming Regulatory Act she helps build the tribal casino that funds schools, clinics, and sovereignty."),
 28:("Present day, in a tribal-casino cashier's vest at her register.",
    "A new century of terrorism, war, and financial crisis.",
    "No battle — the arc closes: from sharing the land, to fighting for it, to fighting for the flag, to sovereignty — now she rings up a customer at the tribal casino. Still here."),
}

GUIDE = r"""WINONA COMIC — AUTHORING GUIDE (read fully, then author ONE chapter)

You are writing the script for ONE chapter of an illustrated APUSH study comic that
runs through the whole U.S. history textbook "Give Me Liberty!" (Foner). Every
chapter is 6 stacked COMIC STRIPS. Each strip is ONE wide image containing 2-3
panels of DIFFERENT sizes that read left-to-right. Under each strip sits a study
caption with the real history. We follow ONE recurring heroine, WINONA.

WHO WINONA IS (keep consistent): a Native American woman — warm brown eyes, high
cheekbones, dark hair, calm, brave, dignified, never a caricature. She is the SAME
lineage/face across the entire series (carried mother -> daughter -> granddaughter),
so she always reads as recognizably "the Winona of Chapter 1," BUT her clothing,
hairstyle, and gear match THIS chapter's era (see "WINONA THIS CHAPTER" in the
source file). She is a fighter: across the series she defends her land, then later
her descendants fight in America's wars, ending in the modern day.

ART STYLE (put this feel in every scene): a real comic-book strip, ONE horizontal
image split into 2-3 panels of DIFFERENT sizes by clean thin cream gutters; warm
vintage American-history graphic-novel art, thick clean ink outlines, a limited
palette of parchment cream, navy blue, muted brick red and brass gold, dramatic
cinematic lighting, expressive faces. Characters may speak in classic white speech
bubbles, but keep bubble text VERY short (1-3 words) and correctly spelled. Do NOT
ask for narration caption boxes or any other text inside the art. For an abstract
idea (an economic shift, a law, a court ruling) use a clean labeled-icon DIAGRAM
panel with drawn symbols and NO words.

YOUR JOB: distribute this chapter's most important, testable content across the 6
strips, weaving Winona's personal thread and her war/fight beat through it. Ground
the captions in the chapter's real names, dates, and key terms from the source file
— this is a study tool, so accuracy matters. Strip 1 opens on Winona in this era;
the last strip closes reflectively and nudges her larger arc forward.

OUTPUT: write ONLY a JSON file (no prose) to output/comic_specs/ch<N>.json with EXACTLY:
{
  "chapter": <N>,
  "strips": [
    {
      "aspect": "16:9" or "3:2",
      "has_winona": true or false,   // true if Winona herself appears in the strip
      "scene": "<the full image prompt: describe each differently-sized panel, what's
                 in it, and any 1-3 word speech bubbles. ~50-90 words.>",
      "cap": "<2-4 sentence study caption with real names/dates/terms. ~45-75 words.>"
    }
    ... EXACTLY 6 strip objects ...
  ]
}
Pick "3:2" for big dramatic/climax strips, "16:9" for normal ones. Aim for ~4 of 6
strips to include Winona (has_winona:true).

GOLD EXAMPLE — Chapter 1's six strips (match this quality and shape):

STRIP 1 (16:9, Winona): scene = "THREE panels of different sizes. LARGE LEFT PANEL:
Winona stands on a green rise at dawn over a thriving Native world of farming
villages, earthen mounds and adobe towns. TOP-RIGHT SMALL PANEL: Winona and other
women harvest a shared cornfield; her bubble: 'We share it all.' BOTTOM-RIGHT SMALL
PANEL: a montage of nations — an Aztec pyramid, a Cahokia mound, cliff Pueblo homes,
an Iroquois longhouse."  cap = "Long before 1492 the Americas held tens of millions
of people in a huge variety of societies. Winona's people farmed together and held
land in common — status came from generosity, not property — and many nations traced
family through the mother's line. From the Aztec and Inca empires to Cahokia, the
Pueblo towns, and the Iroquois confederacy, there was no single 'Indian' world."

STRIP 4 (16:9, Winona): scene = "THREE panels of different sizes, somber, non-graphic.
TALL LEFT PANEL: Winona kneels in her emptied village at dusk as disease empties the
land. TOP-RIGHT PANEL: a steel-armored conquistador on horseback before a toppled
stone city. BOTTOM-RIGHT PANEL: Winona stands defiant, bow drawn; her bubble: 'No
more.'"  cap = "The Columbian Exchange also carried European diseases that killed the
vast majority of Native people — the worst demographic collapse in history. With
disease, steel, and Native allies, conquistadors like Cortes and Pizarro toppled the
Aztec and Inca empires. Winona's people did not surrender quietly."

Now author THIS chapter from its source file. Output only the JSON file.
"""

(OUT / "GUIDE.txt").write_text(GUIDE)

def fmt_chapter(n):
    c = CH[str(n)]
    era, thread, war = BIBLE[n]
    L = []
    L.append(f"CHAPTER {n}: {c.get('title','')}  ({c.get('years','')})")
    L.append("")
    L.append("WINONA THIS CHAPTER:")
    L.append(f"  Appearance/era: {era}")
    L.append(f"  Her thread: {thread}")
    L.append(f"  War/fight beat: {war}")
    L.append("")
    L.append("TEXTBOOK SUMMARY (ground your captions in this):")
    for p in c.get("summary", []):
        L.append("  - " + p)
    L.append("")
    L.append("KEY TERMS: " + ", ".join(
        (t.get("term") if isinstance(t, dict) else str(t)) for t in c.get("key_terms", [])))
    L.append("")
    L.append("TIMELINE:")
    for t in c.get("timeline", []):
        L.append(f"  {t.get('year','')}: {t.get('event','')}")
    L.append("")
    L.append("BIG IDEAS: " + " | ".join(
        (b.get("idea") if isinstance(b, dict) else str(b)) for b in c.get("big_ideas", [])))
    return "\n".join(L)

for n in range(2, 29):
    (OUT / f"ch{n}_source.txt").write_text(fmt_chapter(n))

print(f"Wrote GUIDE.txt + {len(range(2,29))} chapter source files to {OUT}")
