import * as topojson from 'topojson-client';
import { geoMercator, geoNaturalEarth1, geoPath } from 'd3-geo';
import indiaTopo from '../data/maps/maps_india.js';
import worldTopo from '../data/maps/maps_world.js';
import physTopo from '../data/maps/maps_phys.js';

// Cache GeoJSON feature collections
let cachedIndiaFeatures = null;
let cachedWorldFeatures = null;
let cachedPhysFeatures = null;

export const CATEGORY_DEFINITIONS = [
  {
    id: 'india-states',
    pack: 'india',
    name: 'India: states and union territories',
    singular: 'state or union territory',
    icon: '🇮🇳'
  },
  {
    id: 'countries-world',
    pack: 'world',
    name: 'Countries of the world',
    singular: 'country',
    icon: '🌍'
  },
  {
    id: 'mountain-ranges',
    pack: 'mountains',
    name: 'Mountain ranges',
    singular: 'mountain range',
    icon: '🏔️'
  },
  {
    id: 'oceans-seas-lakes',
    pack: 'water',
    name: 'Oceans, seas and lakes',
    singular: 'ocean, sea or lake',
    icon: '🌊'
  },
  {
    id: 'deserts',
    pack: 'deserts',
    name: 'Deserts',
    singular: 'desert',
    icon: '🏜️'
  },
  {
    id: 'grasslands-plains',
    pack: 'grasslands',
    name: 'Grasslands and plains',
    singular: 'grassland or plain',
    icon: '🌾'
  },
  {
    id: 'plateaus-basins',
    pack: 'plateaus',
    name: 'Plateaus and basins',
    singular: 'plateau or basin',
    icon: '⛰️'
  }
];

export function getCategoryDefinition(catId) {
  const norm = (catId || '').toLowerCase();
  return (
    CATEGORY_DEFINITIONS.find(
      c => c.id === norm || c.pack === norm || norm.includes(c.pack)
    ) || CATEGORY_DEFINITIONS[0]
  );
}

export function getMapData(catId) {
  const cat = getCategoryDefinition(catId);

  if (!cachedWorldFeatures) {
    const topo = worldTopo.default || worldTopo;
    cachedWorldFeatures = topojson.feature(topo, topo.objects.f).features.map((f, i) => ({
      ...f,
      id: `world-${i}`
    }));
  }

  if (cat.pack === 'india') {
    if (!cachedIndiaFeatures) {
      const topo = indiaTopo.default || indiaTopo;
      cachedIndiaFeatures = topojson.feature(topo, topo.objects.f).features.map((f, i) => ({
        ...f,
        id: `india-${i}`
      }));
    }
    const width = 540;
    const height = 580;
    const projection = geoMercator().fitExtent(
      [[20, 20], [width - 20, height - 20]],
      { type: 'FeatureCollection', features: cachedIndiaFeatures }
    );
    const pathGen = geoPath(projection);

    return {
      def: cat,
      kind: 'india',
      base: cachedIndiaFeatures,
      targets: cachedIndiaFeatures,
      width,
      height,
      projection,
      pathGen
    };
  }

  if (cat.pack === 'world') {
    const width = 960;
    const height = 500;
    const projection = geoNaturalEarth1().fitExtent(
      [[10, 10], [width - 10, height - 10]],
      { type: 'Sphere' }
    );
    const pathGen = geoPath(projection);

    return {
      def: cat,
      kind: 'world',
      base: cachedWorldFeatures,
      targets: cachedWorldFeatures,
      width,
      height,
      projection,
      pathGen
    };
  }

  // Physical categories: mountains, water, deserts, grasslands, plateaus
  if (!cachedPhysFeatures) {
    const topo = physTopo.default || physTopo;
    cachedPhysFeatures = topojson.feature(topo, topo.objects.f).features.map((f, i) => ({
      ...f,
      id: `phys-${i}`
    }));
  }

  const physicalTargets = cachedPhysFeatures.filter(f => f.properties.pack === cat.pack);
  const width = 960;
  const height = 500;
  const projection = geoNaturalEarth1().fitExtent(
    [[10, 10], [width - 10, height - 10]],
    { type: 'Sphere' }
  );
  const pathGen = geoPath(projection);

  return {
    def: cat,
    kind: 'phys',
    base: cachedWorldFeatures,
    targets: physicalTargets,
    width,
    height,
    projection,
    pathGen
  };
}

export function getRandomQuestionsForCategory(catId, count = 10) {
  const mapData = getMapData(catId);
  const pool = [...mapData.targets];
  // Shuffle
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count);
}

export function generateMultipleChoiceOptions(targetFeature, pool, count = 4) {
  if (!targetFeature) return [];
  const targetName = targetFeature.properties?.name || 'Target';
  const continent = targetFeature.properties?.continent;
  
  // Prefer same continent / same group for distractors
  let candidates = pool.filter(f => f.properties?.name !== targetName);
  if (continent) {
    const sameContinent = candidates.filter(f => f.properties?.continent === continent);
    if (sameContinent.length >= count - 1) {
      candidates = sameContinent;
    }
  }

  // Shuffle candidates
  const shuffled = [...candidates].sort(() => Math.random() - 0.5);
  const distractors = shuffled.slice(0, count - 1).map(f => f.properties.name);

  // Combine and shuffle options
  const options = [targetName, ...distractors].sort(() => Math.random() - 0.5);
  return options.map(name => ({
    id: name,
    name,
    isCorrect: name === targetName
  }));
}
