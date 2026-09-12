// Become History — playable figures. All text is original study-game
// writing grounded in real events.
window.FIGURES = {
  rolfe: {
    name: "John Rolfe",
    role: "Tobacco planter — Jamestown, Virginia",
    colony: "Virginia", good: "Tobacco", startYear: 1612, startCash: 20,
    blurb: "Turn a starving fort into a tobacco empire — and live with what that empire was built on.",
    chapters: [2, 3],
    drillTitle: "Militia drill",
    events: {
      3: {
        title: "A sweeter leaf",
        text: "Your smuggled Trinidad seed finally cures into something London will pay for.",
        choices: [
          { label: "Plant every acre with it", effect: { cash: 12, note: "Tobacco swallows the fields — even the streets get planted." } },
          { label: "Share seed with your neighbors", effect: { legacy: 2, cash: 4, note: "The whole colony turns to tobacco; your name travels with the seed." } }
        ]
      },
      6: {
        title: "A marriage at Jamestown",
        text: "1614. A marriage to Pocahontas would bind the peace with the Powhatan confederacy.",
        choices: [
          { label: "Marry — seal the peace", effect: { legacy: 2, cash: 8, note: "The Peace of Pocahontas opens the river trade for years." } },
          { label: "Keep to the fields", effect: { cash: 3, note: "The peace holds for now, but it is nobody's peace in particular." } }
        ]
      },
      9: {
        title: "Twenty and odd Africans",
        text: "1619. A Dutch ship anchors with captive Africans, offered for sale as laborers.",
        choices: [
          { label: "Buy their labor", effect: { cash: 15, legacy: -3, note: "The ledger grows. So does the thing Virginia will build itself on for 250 years." } },
          { label: "Refuse — hire freemen and servants", effect: { cash: -8, legacy: 3, note: "Costlier harvests, cleaner hands. History mostly chose otherwise." } }
        ]
      },
      11: {
        title: "The peace breaks",
        text: "1622. Opechancanough strikes the outlying settlements up and down the James.",
        choices: [
          { label: "Stand with the militia", skirmish: {
              prompt: "Defend the settlements",
              win: { legacy: 1, cash: 5, note: "The line holds at the palisade. The uneasy frontier holds with it." },
              lose: { cash: -15, note: "The outer farms burn. A third of the colony is lost that year." } } },
          { label: "Pull everyone inside the fort", effect: { cash: -10, legacy: 1, note: "You save the people and lose the crop." } }
        ]
      }
    },
    ending: "The real Rolfe's tobacco became Virginia's currency, its obsession, and the engine that demanded ever more land and, eventually, enslaved labor. He died around 1622, the year the peace he helped build collapsed."
  },

  winthrop: {
    name: "John Winthrop",
    role: "Governor — Massachusetts Bay",
    colony: "Massachusetts", good: "Cod & ships", startYear: 1630, startCash: 24,
    blurb: "Build a godly commonwealth that the world watches — without letting it tear itself apart.",
    chapters: [2, 3],
    drillTitle: "Train bands muster",
    events: {
      3: {
        title: "A city upon a hill",
        text: "Your sermon set the stakes: the eyes of all people are upon us. Now govern like it.",
        choices: [
          { label: "Strict godly order", effect: { cash: 6, note: "Fines and discipline keep the town booming and the meetinghouse full." } },
          { label: "Leave room for conscience", effect: { legacy: 2, cash: -3, note: "Softer rule, harder questions." } }
        ]
      },
      6: {
        title: "Roger Williams will not be quiet",
        text: "He preaches that the king's charter is worthless and the church should owe the state nothing.",
        choices: [
          { label: "Banish him", effect: { cash: 5, legacy: -2, note: "He walks south through the snow and founds Rhode Island on everything you rejected." } },
          { label: "Let him preach", effect: { legacy: 3, cash: -5, note: "Order frays; the idea of a free conscience takes root early." } }
        ]
      },
      9: {
        title: "The Pequot War",
        text: "1637. Connecticut and its native allies call on Boston to march against the Pequot.",
        choices: [
          { label: "March with them", skirmish: {
              prompt: "The Pequot campaign",
              win: { cash: 10, legacy: -3, note: "Victory comes as a massacre at Mystic. The account books grow; the conscience does not." },
              lose: { cash: -12, note: "The campaign bogs down in the swamps and the bill comes to Boston." } } },
          { label: "Hold Boston back", effect: { legacy: 1, cash: -5, note: "The war happens anyway; your merchants lose the contracts." } }
        ]
      },
      11: {
        title: "Ships for the world",
        text: "The cod runs are rich and the yards are ready to build.",
        choices: [
          { label: "Invest in the shipyards", effect: { cash: 15, note: "New England keels slide into the water; the carrying trade is yours." } },
          { label: "Endow the college", effect: { legacy: 3, cash: -10, note: "A little school at Cambridge — Harvard — so learning won't die with the founders." } }
        ]
      }
    },
    ending: "The real Winthrop governed Massachusetts for most of two decades. The 'city upon a hill' became one of the most quoted lines in American politics — and the colony's godly order kept banishing its dissenters into new colonies."
  },

  penn: {
    name: "William Penn",
    role: "Proprietor — Pennsylvania",
    colony: "Pennsylvania", good: "Wheat", startYear: 1681, startCash: 22,
    blurb: "Run the holy experiment: religious liberty, fair dealing, and a land office that never sleeps.",
    chapters: [2, 3, 4],
    drillTitle: "Watch and ward",
    events: {
      3: {
        title: "Under the elm at Shackamaxon",
        text: "The Lenape will treat with you. What kind of neighbor is Pennsylvania going to be?",
        choices: [
          { label: "Pay a fair price, write it down", effect: { legacy: 3, cash: -8, note: "A peace with no oath broken — rare enough that Voltaire will joke about it." } },
          { label: "Keep the boundaries vague", effect: { cash: 8, note: "Cheaper now. Someone will exploit that vagueness later." } }
        ]
      },
      6: {
        title: "The experiment fills up",
        text: "German farmers and Scots-Irish borderers pour off the ships at Philadelphia.",
        choices: [
          { label: "Sell land fast", effect: { cash: 12, note: "The land office roars; the backcountry pushes into Lenape country." } },
          { label: "Settle disputes patiently", effect: { legacy: 2, note: "Slower money, sturdier peace." } }
        ]
      },
      9: {
        title: "The Walking Purchase",
        text: "Your agents propose enforcing an old draft deed: as much land as a man can walk in a day and a half — then hiring runners.",
        choices: [
          { label: "Run the trick", effect: { cash: 18, legacy: -4, note: "Trained runners cover 65 miles. The Lenape lose the Lehigh Valley and never forget it." } },
          { label: "Burn the scheme", effect: { legacy: 3, note: "The land office grumbles. The treaty elm stands for something." } }
        ]
      },
      11: {
        title: "Philadelphia rises",
        text: "The gridded city between the rivers is becoming the colonies' front door.",
        choices: [
          { label: "Invest in the port", effect: { cash: 15, note: "Flour, ships, and credit — the breadbasket colony pays." } },
          { label: "Endow schools and meetinghouses", effect: { legacy: 3, cash: -10, note: "The experiment outlives the experimenter." } }
        ]
      }
    },
    ending: "The real Penn died poor — his colony thrived while his own finances collapsed. The Walking Purchase happened in 1737 under his sons, who chose the trick; it poisoned Lenape relations for a generation."
  },

  pinckney: {
    name: "Eliza Lucas Pinckney",
    role: "Planter & botanist — South Carolina",
    colony: "South Carolina", good: "Indigo", startYear: 1739, startCash: 18,
    blurb: "You are sixteen, running three plantations, and about to invent a new export for a whole colony.",
    chapters: [3, 4],
    drillTitle: "Charleston watch",
    events: {
      3: {
        title: "The vats keep failing",
        text: "Every batch of indigo dye spoils. A dye-master from Montserrat could fix it — for a price.",
        choices: [
          { label: "Hire him and press on", effect: { cash: -10, legacy: 1, note: "The blue finally sets true. The experiment is alive." } },
          { label: "Fall back on rice", effect: { cash: 5, note: "Safe. But rice is everyone's crop." } }
        ]
      },
      6: {
        title: "Blue gold",
        text: "The first cakes of Carolina indigo sell in London next to the French dye.",
        choices: [
          { label: "Scale production hard", effect: { cash: 16, note: "Parliament will even pay a bounty for it." } },
          { label: "Perfect the quality first", effect: { cash: 8, legacy: 1, note: "Fewer cakes, better price, stronger name." } }
        ]
      },
      9: {
        title: "After Stono",
        text: "1739. Enslaved rebels marched for Florida; the assembly answers with the brutal Negro Act.",
        choices: [
          { label: "Enforce it to the letter", effect: { cash: 5, legacy: -3, note: "Order by terror. The colony's enslaved majority remembers." } },
          { label: "Ease it quietly on your lands", effect: { legacy: 2, cash: -5, note: "A softer hand inside a system that has no soft version." } }
        ]
      },
      11: {
        title: "Seeds for every planter",
        text: "You can guard the indigo strain — or give it away.",
        choices: [
          { label: "Share seed freely", effect: { legacy: 4, cash: -5, note: "Within a decade, indigo is a third of the colony's exports." } },
          { label: "Guard the monopoly", effect: { cash: 12, note: "Rich, and briefly alone at the top." } }
        ]
      }
    },
    ending: "The real Eliza Lucas Pinckney shared the seed. Indigo became South Carolina's second staple, worth a fortune in bounties — grown, like the rice, by enslaved labor. George Washington asked to be a pallbearer at her funeral."
  },

  franklin: {
    name: "Benjamin Franklin",
    role: "Printer — Philadelphia",
    colony: "Pennsylvania", good: "Print runs", startYear: 1730, startCash: 15,
    blurb: "Ink, wit, and compound interest: print your way from runaway apprentice to the most famous American alive.",
    chapters: [3, 4],
    drillTitle: "Association muster",
    events: {
      3: {
        title: "Poor Richard",
        text: "An almanac under a pen name — proverbs, weather, and a little mischief.",
        choices: [
          { label: "Print it big", effect: { cash: 12, note: "Ten thousand copies a year. Early to bed, early to rise." } },
          { label: "Print rivals' work too", effect: { cash: 5, legacy: 1, note: "An open press earns slower and lasts longer." } }
        ]
      },
      6: {
        title: "The Junto",
        text: "Your club of tradesmen wants a subscription library — books owned in common.",
        choices: [
          { label: "Found the library", effect: { legacy: 3, cash: -8, note: "The first public library in the colonies. Improvement as a civic habit." } },
          { label: "Keep the shop focused", effect: { cash: 8, note: "Business first. The books can wait." } }
        ]
      },
      9: {
        title: "Lightning",
        text: "1752. The kite, the key, the storm — electricity is yours to name.",
        choices: [
          { label: "Publish freely for science", effect: { legacy: 4, note: "No patent on the lightning rod. Fame instead of fees — the real Franklin's choice." } },
          { label: "License everything", effect: { cash: 15, legacy: -2, note: "The rods sell; the reputation dims a little." } }
        ]
      },
      11: {
        title: "Join, or die",
        text: "1754. War with France is coming. Your Albany Plan would unite the colonies under one council.",
        choices: [
          { label: "Push the union plan", effect: { legacy: 3, cash: -5, note: "Every assembly rejects it. The idea, though, does not die." } },
          { label: "Mind the presses", effect: { cash: 10, note: "The snake cartoon runs anyway. Someone else can herd the colonies." } }
        ]
      }
    },
    ending: "The real Franklin retired from printing at 42, rich enough to spend the rest of his life on science, politics, and — eventually — revolution. The Albany Plan failed in 1754 and became the rough draft for everything after."
  },

  metacom: {
    name: "Metacom (King Philip)",
    role: "Sachem of the Wampanoag",
    colony: "Wampanoag homeland", good: "Furs & wampum", startYear: 1662, startCash: 16,
    blurb: "Your father kept fifty years of peace with Plymouth. You inherit the peace — and the squeeze.",
    chapters: [2, 3],
    drillTitle: "Warriors' drill",
    events: {
      3: {
        title: "Cattle in the corn",
        text: "English cattle trample Wampanoag fields, and the English courts fine the farmers, not the cattle.",
        choices: [
          { label: "Sell another tract to keep peace", effect: { cash: 12, legacy: -2, note: "Coin now, ground gone forever. The towns creep closer." } },
          { label: "Refuse and fence the fields", effect: { legacy: 2, cash: -5, note: "The court calls it insolence. Your people call it the obvious thing." } }
        ]
      },
      6: {
        title: "The praying towns",
        text: "Missionaries gather converts into supervised villages, apart from their kin.",
        choices: [
          { label: "Hold the villages together", effect: { legacy: 2, note: "Sovereignty first: each family stays under its own sachem." } },
          { label: "Trade with the missions anyway", effect: { cash: 8, note: "Their cloth is good and their prices are fair, whatever their sermons." } }
        ]
      },
      9: {
        title: "Sassamon's trial",
        text: "1675. Plymouth hangs three Wampanoag men on one witness's word. Your counselors are done waiting.",
        choices: [
          { label: "Prepare for war", effect: { legacy: 1, note: "Runners go to the Nipmuc and Narragansett. The powder is counted." } },
          { label: "Appeal to the governor once more", effect: { cash: -5, note: "You are heard politely and dismissed completely." } }
        ]
      },
      11: {
        title: "The war comes",
        text: "1675. Swansea burns first. Whatever happens now, the old peace is ash.",
        choices: [
          { label: "Lead the fight", skirmish: {
              prompt: "Defend the homeland",
              win: { legacy: 3, cash: 10, note: "Twelve English towns burn; for one winter the frontier rolls backward." },
              lose: { cash: -15, note: "The alliances crack, the food runs out, the swamps stop hiding you." } } },
          { label: "Move the villages west", effect: { cash: -10, legacy: 2, note: "Survival as strategy. The homeland is left to the towns." } }
        ]
      }
    },
    ending: "The real war of 1675–76 was, per capita, among the bloodiest in American history. Metacom was killed in August 1676; New England's native nations were broken, sold into slavery, or pushed west. This campaign lets you weigh choices he actually faced — history gave him far worse odds."
  }
};
