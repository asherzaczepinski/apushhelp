#!/usr/bin/env python3
"""Regenerate Chapter 1's comic panels as a cohesive comedic strip following
one recurring character (Milo the time-traveler). Overwrites comic0..9.jpg."""
from pathlib import Path
import gen_images as G

CHAR = ("Recurring main character, IDENTICAL in every panel: Milo — a short, "
        "chubby cartoon boy time-traveler with messy orange hair, big round "
        "glasses, a bright red hoodie, blue jeans, and a bulging green backpack; "
        "wide-eyed and easily flustered. Keep his look exactly consistent. ")

STYLE = ("Flat vector cartoon comic-book panel in a warm vintage American-history "
         "storybook style: thick clean outlines, limited palette of parchment "
         "cream, navy blue, muted brick red and brass gold, bold and expressive "
         "staging. Absolutely NO text, letters, numbers, words, or speech bubbles "
         "anywhere in the image. ")

# one per Chapter-1 summary sentence. Light comedy for the wondrous bits;
# sober and respectful (no comedy, non-graphic) for slavery, disease, conquest.
PANELS = [
    "Milo, tiny and jaw-droppingly amazed, stands at the foot of a huge bustling Indigenous city of stone pyramids and grassy earthen mounds, accidentally dropping his snacks in awe. Warm and funny.",
    "Milo sheepishly tries to plant a little flag in the ground while friendly Native farmers gently wave their hands to show that the land is shared by everyone; Milo looks embarrassed. Gentle comedy.",
    "Milo in a stiff, ornate European throne room, over-bowing so hard he gets tangled up, while a stern crowned king and a bishop look down disapprovingly. Awkward comedy.",
    "Milo squished in a crowded European spice market, clutching a single tiny coin and gawking with sticker-shock at a tcaravan of pricey spices and silk; a merchant points to a map of Asia. Funny.",
    "Milo stands quietly on the deck of a small Portuguese caravel, one hand on the rail, looking out at a distant African coastline with a subdued, uneasy expression. Somber and respectful; no comedy, no violence, non-graphic.",
    "Milo, seasick and green in the face, clings to the mast of a wooden ship as a lookout points excitedly at a sliver of land on the horizon. Warm seasick comedy.",
    "Milo watches soberly as crops, a horse, and sailing ships pass between two distant shores across a wide ocean; a heavy, respectful, quiet mood. No comedy, symbolic and non-graphic.",
    "Milo, small and overwhelmed, stands in a grand Spanish colonial stone plaza with a cathedral, while a passionate friar in robes gestures as if giving a speech. Respectful, mild.",
    "Milo comically ducks behind an adobe wall, peeking out wide-eyed, as spirited Pueblo townspeople reclaim their sunlit adobe village; a hopeful, lively mood. Light and non-graphic.",
    "Milo, bundled up and nearly buried under a giant pile of fluffy beaver-fur pelts, trades cheerfully with a French trapper and a Native partner beside a snowy river and a little wooden fort. Cozy comedy.",
]


def main():
    if not G.KEY:
        raise SystemExit("No API key (.openai_key).")
    out = Path("studier/images/ch01")
    out.mkdir(parents=True, exist_ok=True)
    for i, desc in enumerate(PANELS):
        prompt = STYLE + CHAR + "Scene: " + desc
        png = G.api_image(prompt)
        if png:
            G.save_jpg(png, out / f"comic{i}.jpg")
            print(f"  comic{i} ok")
        else:
            print(f"  comic{i} FAILED")
    print("Done — Chapter 1 comedic strip regenerated.")


if __name__ == "__main__":
    main()
