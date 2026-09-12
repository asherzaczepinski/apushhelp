// Sketch maps for chapter pages — shown only where a map helps explain
// the chapter. view = [minLon, minLat, maxLon, maxLat] (or native coords
// for the colonial-space map). All shapes are rough teaching sketches.
window.CHAPTER_MAPS = {
  1: {
    caption: "The Columbian Exchange: Old World animals and diseases sailed west; New World crops sailed east. Chapter 1's core story.",
    base: ['na', 'sa', 'eu', 'af', 'gb', 'cuba'],
    view: [-110, -12, 28, 62],
    layers: [
      { t: 'arrow', color: '#8c1c13', pts: [[-5, 40], [-30, 36], [-55, 30], [-72, 26]],
        label: { text: 'horses, cattle, smallpox', at: [-40, 38.5], side: 'w' } },
      { t: 'arrow', color: '#33506b', pts: [[-75, 14], [-45, 19], [-15, 27], [2, 33]],
        label: { text: 'corn, potatoes, tobacco', at: [-48, 14] } }
    ]
  },
  2: {
    caption: "Rival beachheads by 1630: Spain at St. Augustine, France on the St. Lawrence, the Dutch on the Hudson, England at Jamestown and in New England.",
    base: ['na', 'cuba'],
    view: [-86, 25, -58, 50],
    layers: [
      { t: 'dot', at: [-76.8, 37.2], label: { text: 'Jamestown 1607' } },
      { t: 'dot', at: [-70.7, 41.9], label: { text: 'Plymouth 1620' } },
      { t: 'dot', at: [-71.1, 42.6], label: { text: 'Boston 1630', side: 'w' } },
      { t: 'dot', at: [-74, 40.7], label: { text: 'New Amsterdam', side: 'w' } },
      { t: 'dot', at: [-71.2, 46.8], label: { text: 'Quebec 1608' } },
      { t: 'dot', at: [-81.3, 29.9], label: { text: 'St. Augustine 1565', side: 'w' } }
    ]
  },
  3: {
    caption: "The thirteen colonies by region — New England (navy), the Middle colonies (brass), the South (red) — each with its own economy and society.",
    space: 'colonial',
    base: 'colonies',
    view: [-13, -19, 15.5, 15],
    layers: []
  },
  4: {
    caption: "The triangular trade: British goods to West Africa, captive people across the Middle Passage, plantation staples back to Britain.",
    base: ['na', 'sa', 'eu', 'af', 'gb', 'cuba'],
    view: [-100, -15, 25, 60],
    layers: [
      { t: 'arrow', color: '#33506b', pts: [[-4, 50], [-10, 38], [-15, 25], [-16, 14]],
        label: { text: 'cloth, guns, rum', at: [-13, 32] } },
      { t: 'arrow', color: '#8c1c13', pts: [[-18, 11], [-35, 11], [-55, 14], [-71, 19]],
        label: { text: 'the Middle Passage', at: [-52, 10] } },
      { t: 'arrow', color: '#8b6f47', pts: [[-73, 26], [-55, 34], [-30, 44], [-7, 50]],
        label: { text: 'sugar, tobacco, rice', at: [-48, 42], side: 'w' } }
    ]
  },
  5: {
    caption: "The war moved south: Massachusetts 1775, Saratoga 1777 (which won the French alliance), and the trap at Yorktown 1781.",
    base: ['na'],
    view: [-84, 30, -64, 46],
    layers: [
      { t: 'dot', at: [-71.3, 42.5], label: { text: 'Lexington & Concord 1775', side: 'w' } },
      { t: 'dot', at: [-73.6, 43.0], label: { text: 'Saratoga 1777', side: 'w' } },
      { t: 'dot', at: [-74.8, 40.2], label: { text: 'Trenton 1776' } },
      { t: 'dot', at: [-76.5, 37.2], label: { text: 'Yorktown 1781' } },
      { t: 'dot', at: [-79.9, 32.8], label: { text: 'Charleston 1780', side: 'w' } }
    ]
  },
  7: {
    caption: "The Northwest Ordinance of 1787: an orderly path from territory to state north of the Ohio River — with slavery banned there.",
    base: ['na'],
    view: [-98, 33, -72, 50],
    layers: [
      { t: 'region', color: '#8b6f47',
        pts: [[-80.5, 40.6], [-84, 39], [-86, 38], [-89, 37.2], [-91, 37], [-91, 43], [-92.5, 46.5], [-89, 48], [-85, 46.5], [-83, 45], [-82.5, 42]],
        label: { text: 'Northwest Territory', at: [-91.5, 44.5], side: 'w' } },
      { t: 'line', color: '#33506b', pts: [[-80.5, 40.6], [-84, 39], [-86, 38], [-89, 37.3], [-90.2, 37]],
        label: { text: 'the Ohio River', at: [-88, 36.2], side: 'w' } }
    ]
  },
  8: {
    caption: "The Louisiana Purchase (1803) doubled the country for $15 million; Lewis and Clark went to see what Jefferson had bought.",
    base: ['na'],
    view: [-130, 24, -78, 52],
    layers: [
      { t: 'region', color: '#8b6f47',
        pts: [[-89.2, 29], [-91, 34], [-90, 38.5], [-91, 44], [-95, 49], [-110, 49], [-113, 47], [-110, 43], [-106, 40], [-103, 36], [-97, 33.5], [-94, 33], [-93, 31]],
        label: { text: 'Louisiana Purchase 1803', at: [-108, 39], side: 'w' } },
      { t: 'arrow', color: '#8c1c13',
        pts: [[-90, 38.6], [-96, 41], [-101, 45], [-108, 47], [-114, 46], [-119, 45.5], [-123.8, 46.2]],
        label: { text: 'Lewis & Clark 1804–06', at: [-118, 49] } },
      { t: 'dot', at: [-90, 29.9], label: { text: 'New Orleans', side: 'w' } }
    ]
  },
  9: {
    caption: "The market revolution ran on infrastructure: the Erie Canal made New York the front door of the West; the National Road carried settlers over the mountains.",
    base: ['na'],
    view: [-95, 34, -66, 48],
    layers: [
      { t: 'line', color: '#33506b', pts: [[-73.8, 42.7], [-75.2, 43.1], [-77, 43.1], [-78.9, 42.9]],
        label: { text: 'Erie Canal 1825', at: [-78.5, 44.6] } },
      { t: 'line', color: '#8b6f47', dash: true,
        pts: [[-78.8, 39.6], [-81.5, 40], [-84, 39.9], [-86.1, 39.8], [-89.1, 39]],
        label: { text: 'National Road', at: [-88, 37.9] } },
      { t: 'dot', at: [-74, 40.7], label: { text: 'New York' } }
    ]
  },
  10: {
    caption: "Indian removal in the 1830s: the Cherokee, Creek, Choctaw, Chickasaw, and Seminole forced west on the Trail of Tears.",
    base: ['na'],
    view: [-104, 26, -74, 40],
    layers: [
      { t: 'arrow', color: '#8c1c13', pts: [[-84.4, 34], [-87.5, 34.8], [-90.5, 35.2], [-94.9, 35.4]],
        label: { text: 'Trail of Tears 1838', at: [-92, 36.7], side: 'w' } },
      { t: 'dot', at: [-95.3, 35.4], label: { text: 'Indian Territory', side: 'w' } },
      { t: 'dot', at: [-84.5, 34.2], label: { text: 'Cherokee homeland' } }
    ]
  },
  11: {
    caption: "The cotton kingdom: the belt from South Carolina to Texas where cotton — and the internal slave trade feeding it — ruled everything.",
    base: ['na', 'cuba'],
    view: [-103, 24, -72, 38],
    layers: [
      { t: 'region', color: '#8c1c13',
        pts: [[-97, 29], [-96, 32.5], [-92, 34.5], [-88, 35], [-84, 34.5], [-80.5, 33.5], [-79.5, 32], [-82, 30.5], [-86, 30], [-90, 29.5], [-94, 28.8]],
        label: { text: 'the cotton belt', at: [-92, 33.8], side: 'w' } },
      { t: 'dot', at: [-90, 29.9], label: { text: 'New Orleans slave market', side: 'w' } }
    ]
  },
  13: {
    caption: "The compromises fail: the 36°30′ line held the balance from 1820 until Kansas-Nebraska repealed it in 1854 — and Kansas bled.",
    base: ['na'],
    view: [-114, 26, -72, 50],
    layers: [
      { t: 'line', color: '#8c1c13', dash: true, pts: [[-89.6, 36.5], [-104, 36.5]],
        label: { text: "36°30′ line (1820)", at: [-103, 35], } },
      { t: 'dot', at: [-98, 38.5], label: { text: 'Bleeding Kansas 1854–56', side: 'w' } }
    ]
  },
  14: {
    caption: "The Civil War: eleven states in rebellion, the turning points at Gettysburg and Vicksburg, and the end at Appomattox.",
    base: ['na', 'cuba'],
    view: [-108, 24, -68, 44],
    layers: [
      { t: 'region', color: '#8c1c13',
        pts: [[-77, 38], [-75.5, 36.5], [-76, 34], [-78, 33], [-80, 32], [-81, 30.5], [-81.5, 27], [-83, 29.5], [-85, 29.8], [-88, 30.2], [-91, 29], [-94, 29.5], [-97, 26.5], [-99.5, 27.5], [-104, 29.5], [-103, 32], [-100, 34], [-97, 34], [-94.5, 36.5], [-89.5, 36.5], [-85, 36.6], [-81.7, 36.6]],
        label: { text: 'the Confederacy', at: [-100, 30.8] } },
      { t: 'dot', at: [-79.9, 32.75], label: { text: 'Fort Sumter 1861' } },
      { t: 'dot', at: [-77.2, 39.8], label: { text: 'Gettysburg 1863', side: 'w' } },
      { t: 'dot', at: [-90.9, 32.35], label: { text: 'Vicksburg 1863', side: 'w' } },
      { t: 'dot', at: [-78.8, 37.4], label: { text: 'Appomattox 1865', side: 'w' } }
    ]
  },
  15: {
    caption: "Reconstruction: the former Confederacy under federal occupation and military districts — until the retreat of 1877 abandoned it.",
    base: ['na', 'cuba'],
    view: [-108, 24, -68, 44],
    layers: [
      { t: 'region', color: '#33506b',
        pts: [[-77, 38], [-75.5, 36.5], [-76, 34], [-78, 33], [-80, 32], [-81, 30.5], [-81.5, 27], [-83, 29.5], [-85, 29.8], [-88, 30.2], [-91, 29], [-94, 29.5], [-97, 26.5], [-99.5, 27.5], [-104, 29.5], [-103, 32], [-100, 34], [-97, 34], [-94.5, 36.5], [-89.5, 36.5], [-85, 36.6], [-81.7, 36.6]],
        label: { text: 'the occupied South', at: [-95, 31.5] } }
    ]
  },
  16: {
    caption: "The Gilded Age ran on rails: the first transcontinental line met at Promontory in 1869 and stitched the markets of a continent together.",
    base: ['na'],
    view: [-130, 30, -86, 48],
    layers: [
      { t: 'line', color: '#33506b',
        pts: [[-95.9, 41.3], [-101, 41], [-105, 41.1], [-109, 41.3], [-112.5, 41.6], [-116, 40.7], [-119.8, 39.5], [-121.5, 38.6]],
        label: { text: 'transcontinental railroad', at: [-122, 45.8] } },
      { t: 'dot', at: [-112.5, 41.6], label: { text: 'Promontory 1869' } },
      { t: 'dot', at: [-95.9, 41.3], label: { text: 'Omaha' } },
      { t: 'dot', at: [-121.5, 38.6], label: { text: 'Sacramento', side: 'w' } }
    ]
  },
  17: {
    caption: "1898: the empire in one year — Cuba, Puerto Rico, Guam, and the Philippines from Spain, with Hawai'i annexed the same summer.",
    base: ['world'],
    view: [-180, -25, 180, 58],
    layers: [
      { t: 'dot', at: [-157.8, 21.3], label: { text: "Hawai'i" } },
      { t: 'dot', at: [-79, 21.8], label: { text: 'Cuba' } },
      { t: 'dot', at: [-66.5, 18.2], label: { text: 'Puerto Rico' } },
      { t: 'dot', at: [122, 12], label: { text: 'Philippines', side: 'w' } },
      { t: 'dot', at: [144.7, 13.5], label: { text: 'Guam' } }
    ]
  },
  20: {
    caption: "The Great Migration: Black southerners moving to Chicago, Detroit, and New York — remaking the cities and the culture of the 1920s.",
    base: ['na'],
    view: [-100, 26, -68, 48],
    layers: [
      { t: 'arrow', color: '#8c1c13', pts: [[-90.2, 32.3], [-89.5, 36.5], [-87.6, 41.9]],
        label: { text: 'to Chicago', at: [-92.5, 40], side: 'w' } },
      { t: 'arrow', color: '#8c1c13', pts: [[-84.4, 33.7], [-84, 38], [-84.8, 42]],
        label: { text: 'to Detroit', at: [-83, 40] } },
      { t: 'arrow', color: '#8c1c13', pts: [[-77.5, 35], [-75.5, 38.5], [-74, 40.7]],
        label: { text: 'to Harlem', at: [-73.5, 39] } }
    ]
  },
  21: {
    caption: "The Depression's other disaster: the Dust Bowl drove a quarter-million 'Okies' down Route 66 toward California.",
    base: ['na'],
    view: [-128, 26, -86, 46],
    layers: [
      { t: 'region', color: '#8b6f47',
        pts: [[-103, 37], [-100, 37.5], [-98.5, 36], [-99, 33.5], [-101, 32.5], [-103.5, 33], [-104, 35]],
        label: { text: 'the Dust Bowl', at: [-102, 39], side: 'w' } },
      { t: 'arrow', color: '#8c1c13', pts: [[-104, 34.5], [-109, 34], [-114, 34.5], [-118.3, 34.3]],
        label: { text: 'Route 66 west', at: [-115, 32.5] } }
    ]
  },
  23: {
    caption: "The Cold War's front line: Churchill's Iron Curtain across Europe, with Berlin — blockaded, airlifted, and finally walled — trapped behind it.",
    base: ['eu', 'gb', 'ie'],
    view: [-12, 35, 33, 63],
    layers: [
      { t: 'line', color: '#33506b', dash: true,
        pts: [[9.8, 54.3], [10.5, 52], [12.2, 50.4], [13.6, 48.8], [14.3, 46.8], [13.6, 45.2]],
        label: { text: 'the Iron Curtain', at: [15.2, 49.5] } },
      { t: 'dot', at: [13.4, 52.5], label: { text: 'Berlin' } }
    ]
  },
  24: {
    caption: "The postwar move to the Sunbelt: air conditioning, defense plants, and interstates pulled America south and west.",
    base: ['na', 'cuba'],
    view: [-128, 24, -66, 48],
    layers: [
      { t: 'arrow', color: '#8c1c13', pts: [[-74, 41], [-77, 35], [-81.3, 28.8]],
        label: { text: 'to Florida', at: [-79, 32] } },
      { t: 'arrow', color: '#8c1c13', pts: [[-87.6, 41.9], [-93, 36], [-97.7, 30.5]],
        label: { text: 'to Texas', at: [-97, 34], side: 'w' } },
      { t: 'arrow', color: '#8c1c13', pts: [[-95, 42], [-105, 38], [-112, 33.6]],
        label: { text: 'to Phoenix', at: [-111, 36.5], side: 'w' } },
      { t: 'arrow', color: '#8c1c13', pts: [[-100, 44], [-110, 40], [-118, 34.3]],
        label: { text: 'to Los Angeles', at: [-116, 32.6] } }
    ]
  }
};
