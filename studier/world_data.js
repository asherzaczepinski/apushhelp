// Gilded Globe — stylized world chart (hand-drawn low-poly coastlines,
// [lon, lat] pairs) plus tycoon territories and rival moguls.

window.WORLD_LAND = [
  // North America (with Mexico + Central America)
  [[-168,66],[-166,60],[-158,58],[-152,58],[-145,60],[-135,57],[-130,53],[-125,48],
   [-124,41],[-118,33],[-111,27],[-106,23],[-97,17],[-92,15],[-86,13],[-83,9],[-79,8],
   [-81,13],[-84,16],[-88,17],[-90,21],[-87,22],[-91,29],[-96,28],[-94,30],[-89,29],
   [-84,29],[-81,25],[-80,27],[-80,32],[-76,35],[-74,39],[-70,42],[-66,44],[-61,45],
   [-56,47],[-60,49],[-65,50],[-58,52],[-61,56],[-65,60],[-70,60],[-75,62],[-80,63],
   [-86,66],[-95,69],[-105,69],[-115,69],[-125,70],[-135,69],[-145,70],[-155,71],[-162,69],[-168,66]],
  // Greenland
  [[-45,60],[-52,63],[-56,68],[-58,73],[-55,77],[-46,81],[-34,83],[-24,81],[-19,76],
   [-24,71],[-33,66],[-40,61],[-45,60]],
  // South America
  [[-77,7],[-79,2],[-81,-5],[-77,-13],[-71,-19],[-70,-26],[-71,-33],[-73,-41],[-74,-48],
   [-71,-53],[-66,-55],[-63,-52],[-63,-45],[-60,-38],[-56,-33],[-51,-29],[-45,-24],
   [-39,-19],[-35,-9],[-36,-5],[-44,-2],[-51,1],[-56,5],[-63,9],[-70,11],[-77,7]],
  // Europe (with Scandinavia, rough Mediterranean)
  [[-10,36],[-9,42],[-4,48],[0,49],[4,52],[8,55],[6,58],[5,61],[10,64],[16,68],
   [24,71],[31,70],[30,66],[27,60],[31,56],[36,53],[40,47],[33,45],[28,41],[24,37],
   [18,40],[14,37],[8,38],[3,36],[-6,36],[-10,36]],
  // Africa
  [[-17,15],[-17,21],[-12,29],[-6,35],[3,37],[11,34],[20,32],[30,31],[34,27],[36,19],
   [40,15],[44,11],[51,12],[46,1],[40,-5],[37,-13],[35,-21],[32,-29],[26,-34],[19,-35],
   [15,-29],[12,-19],[10,-8],[9,4],[3,6],[-5,5],[-12,8],[-17,15]],
  // Asia (Urals to Pacific, with India + Southeast Asia)
  [[27,41],[33,37],[36,31],[40,20],[44,13],[52,13],[57,19],[60,25],[67,25],[71,20],
   [73,12],[77,8],[80,14],[87,22],[92,21],[95,15],[98,9],[103,2],[105,9],[104,17],
   [108,16],[110,20],[116,23],[121,29],[121,37],[125,40],[131,43],[136,48],[141,53],
   [150,59],[157,61],[163,63],[170,66],[179,68],[179,71],[160,71],[140,73],[120,74],
   [100,73],[85,71],[72,69],[65,69],[57,67],[48,63],[40,58],[34,53],[30,48],[27,41]],
  // Australia
  [[114,-22],[114,-31],[117,-35],[125,-33],[132,-32],[137,-35],[141,-38],[147,-39],
   [151,-36],[153,-30],[153,-24],[148,-19],[144,-14],[141,-11],[136,-12],[131,-11],
   [126,-14],[121,-18],[114,-22]],
  // British Isles
  [[-5,50],[-6,53],[-6,56],[-4,59],[-1,58],[0,54],[1,52],[-2,50],[-5,50]],
  // Ireland
  [[-10,52],[-10,55],[-7,55],[-6,53],[-8,51],[-10,52]],
  // Cuba
  [[-85,22],[-80,23],[-75,20],[-78,20],[-84,21],[-85,22]],
  // Hispaniola
  [[-74,18],[-71,20],[-68,18],[-71,18],[-74,18]],
  // Japan
  [[130,31],[133,34],[136,35],[140,36],[141,40],[143,44],[145,44],[142,41],[140,37],
   [136,33],[132,31],[130,31]],
  // Borneo / Indonesia hint
  [[109,-1],[113,3],[118,1],[117,-3],[112,-4],[109,-1]],
  // Sumatra + Java hint
  [[95,5],[99,1],[104,-4],[110,-7],[114,-8],[112,-6],[105,-5],[100,0],[95,5]],
  // Philippines
  [[120,18],[122,16],[123,12],[125,8],[122,8],[120,13],[120,18]],
  // New Zealand
  [[172,-35],[175,-37],[174,-40],[171,-43],[167,-46],[169,-44],[172,-40],[172,-35]],
  // Madagascar
  [[44,-16],[47,-15],[50,-16],[49,-22],[46,-25],[44,-20],[44,-16]],
  // Hawai'i dots (drawn slightly large so they exist at chart scale)
  [[-160,22.5],[-157,22],[-155,19],[-157,20.5],[-160,22.5]],
  // Iceland
  [[-24,64],[-22,66],[-17,66],[-14,65],[-18,63],[-24,64]]
];

// Territories a mogul can control. income is per round at level 1.
window.TYCOON_TERR = [
  { id: 'nyc',        name: 'New York',        industry: 'finance',        lon: -74,    lat: 40.7, cost: 120, income: 20, chapters: [16, 18] },
  { id: 'chicago',    name: 'Chicago',         industry: 'railroads',      lon: -87.6,  lat: 41.9, cost: 100, income: 18, chapters: [16] },
  { id: 'pittsburgh', name: 'Pittsburgh',      industry: 'steel',          lon: -79.5,  lat: 40,   cost: 90,  income: 16, chapters: [16] },
  { id: 'cleveland',  name: 'Cleveland',       industry: 'oil',            lon: -83,    lat: 43,   cost: 90,  income: 16, chapters: [16] },
  { id: 'detroit',    name: 'Detroit',         industry: 'automobiles',    lon: -85.5,  lat: 45.5, cost: 95,  income: 17, chapters: [20] },
  { id: 'lowell',     name: 'Lowell',          industry: 'textile mills',  lon: -71,    lat: 43.5, cost: 60,  income: 10, chapters: [9] },
  { id: 'richmond',   name: 'Richmond',        industry: 'tobacco',        lon: -77.5,  lat: 37,   cost: 50,  income: 9,  chapters: [11] },
  { id: 'appalachia', name: 'Appalachia',      industry: 'coal',           lon: -82,    lat: 35.5, cost: 65,  income: 12, chapters: [16] },
  { id: 'neworleans', name: 'New Orleans',     industry: 'cotton',         lon: -90,    lat: 30,   cost: 80,  income: 14, chapters: [11, 12] },
  { id: 'texas',      name: 'Texas Plains',    industry: 'cattle',         lon: -100,   lat: 32,   cost: 70,  income: 12, chapters: [16] },
  { id: 'sf',         name: 'San Francisco',   industry: 'gold & banking', lon: -122.4, lat: 37.8, cost: 85,  income: 15, chapters: [13] },
  { id: 'seattle',    name: 'Seattle',         industry: 'timber',         lon: -122.3, lat: 47.6, cost: 55,  income: 10, chapters: [16] },
  { id: 'london',     name: 'London',          industry: 'bond market',    lon: -0.1,   lat: 51.5, cost: 110, income: 18, chapters: [16] },
  { id: 'liverpool',  name: 'Liverpool',       industry: 'shipping lines', lon: -4.5,   lat: 54.5, cost: 75,  income: 13, chapters: [12] },
  { id: 'havana',     name: 'Havana',          industry: 'sugar',          lon: -82.4,  lat: 23.1, cost: 70,  income: 13, chapters: [17] },
  { id: 'panama',     name: 'Panama',          industry: 'the canal route', lon: -79.5, lat: 9,    cost: 90,  income: 16, chapters: [18] },
  { id: 'hawaii',     name: "Hawai'i",         industry: 'sugar plantations', lon: -157.8, lat: 21.3, cost: 65, income: 12, chapters: [17] },
  { id: 'manila',     name: 'Manila',          industry: 'Pacific gateway', lon: 121,   lat: 14.6, cost: 60,  income: 11, chapters: [17] },
  { id: 'canton',     name: 'Canton',          industry: 'China trade',    lon: 113.3,  lat: 23.1, cost: 85,  income: 15, chapters: [17] },
  { id: 'yokohama',   name: 'Yokohama',        industry: 'Pacific trade',  lon: 139.6,  lat: 35.4, cost: 70,  income: 13, chapters: [13] }
];

// Rival moguls. prefs are industries they chase first.
window.TYCOON_RIVALS = [
  { id: 'vanderbilt', name: 'Cornelius Vanderbilt', color: '#33506b',
    prefs: ['railroads', 'shipping lines', 'finance', 'the canal route', 'Pacific trade'] },
  { id: 'rockefeller', name: 'John D. Rockefeller', color: '#8b6f47',
    prefs: ['oil', 'coal', 'sugar', 'bond market', 'sugar plantations'] },
  { id: 'carnegie', name: 'Andrew Carnegie', color: '#6d7b86',
    prefs: ['steel', 'coal', 'timber', 'textile mills', 'automobiles'] }
];
