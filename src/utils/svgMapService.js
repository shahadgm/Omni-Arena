import * as topojson from 'topojson-client';
import { geoMercator, geoNaturalEarth1, geoPath } from 'd3-geo';
import indiaTopo from '../data/maps/maps_india.js';
import worldTopo from '../data/maps/maps_world.js';
import physTopo from '../data/maps/maps_phys.js';
import { INDIAN_CITIES } from '../data/maps/indian_cities_data.js';
import { INDIAN_TOURIST_PLACES } from '../data/maps/indian_tourist_places_data.js';

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
    id: 'india-cities',
    pack: 'india-cities',
    name: 'India: Major Cities (60+)',
    singular: 'city',
    icon: '🏙️'
  },
  {
    id: 'india-tourist',
    pack: 'india-tourist',
    name: 'India: Famous Tourist Places (60+)',
    singular: 'tourist place or heritage site',
    icon: '🏛️'
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
  const norm = (catId || '').toLowerCase().trim();

  if (norm.includes('cit') || norm === 'india-cities' || norm === 'indian-cities') {
    return CATEGORY_DEFINITIONS.find(c => c.id === 'india-cities');
  }

  if (norm.includes('tourist') || norm.includes('heritage') || norm === 'india-tourist') {
    return CATEGORY_DEFINITIONS.find(c => c.id === 'india-tourist');
  }

  return (
    CATEGORY_DEFINITIONS.find(
      c => c.id === norm || c.pack === norm || norm.includes(c.pack)
    ) || CATEGORY_DEFINITIONS[0]
  );
}

export function getMapData(catId) {
  const cat = getCategoryDefinition(catId);

  // 1. Ensure India base outline is loaded
  if (!cachedIndiaFeatures) {
    const topo = indiaTopo.default || indiaTopo;
    cachedIndiaFeatures = topojson.feature(topo, topo.objects.f).features.map((f, i) => ({
      ...f,
      id: `india-${i}`
    }));
  }

  // 2. India States and Union Territories (Polygon regions)
  if (cat.pack === 'india') {
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

  // 3. India: 60+ Major Cities (Point targets on India map)
  if (cat.pack === 'india-cities') {
    const width = 540;
    const height = 580;
    const projection = geoMercator().fitExtent(
      [[20, 20], [width - 20, height - 20]],
      { type: 'FeatureCollection', features: cachedIndiaFeatures }
    );
    const pathGen = geoPath(projection);

    const cityTargets = INDIAN_CITIES.map(c => ({
      type: 'Feature',
      id: c.id,
      geometry: {
        type: 'Point',
        coordinates: c.coordinates
      },
      properties: {
        ...c,
        subtitle: `${c.state} • ${c.region} India`
      }
    }));

    return {
      def: cat,
      kind: 'india-points',
      subType: 'cities',
      base: cachedIndiaFeatures,
      targets: cityTargets,
      width,
      height,
      projection,
      pathGen
    };
  }

  // 4. India: 60 Famous Tourist Places (Point targets on India map)
  if (cat.pack === 'india-tourist') {
    const width = 540;
    const height = 580;
    const projection = geoMercator().fitExtent(
      [[20, 20], [width - 20, height - 20]],
      { type: 'FeatureCollection', features: cachedIndiaFeatures }
    );
    const pathGen = geoPath(projection);

    const touristTargets = INDIAN_TOURIST_PLACES.map(t => ({
      type: 'Feature',
      id: t.id,
      geometry: {
        type: 'Point',
        coordinates: t.coordinates
      },
      properties: {
        ...t,
        subtitle: `${t.location} • ${t.type}`
      }
    }));

    return {
      def: cat,
      kind: 'india-points',
      subType: 'tourist',
      base: cachedIndiaFeatures,
      targets: touristTargets,
      width,
      height,
      projection,
      pathGen
    };
  }

  // 5. World countries
  if (!cachedWorldFeatures) {
    const topo = worldTopo.default || worldTopo;
    cachedWorldFeatures = topojson.feature(topo, topo.objects.f).features.map((f, i) => ({
      ...f,
      id: `world-${i}`
    }));
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

  // 6. Physical categories: mountains, water, deserts, grasslands, plateaus
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
  const targetRegion = targetFeature.properties?.region || targetFeature.properties?.continent;
  const targetType = targetFeature.properties?.type;

  let candidates = pool.filter(f => f.properties?.name !== targetName);

  // Smart distractor selection: prioritize same region or type
  if (targetRegion) {
    const sameRegion = candidates.filter(
      f => (f.properties?.region === targetRegion || f.properties?.continent === targetRegion)
    );
    if (sameRegion.length >= count - 1) {
      candidates = sameRegion;
    }
  } else if (targetType) {
    const sameType = candidates.filter(f => f.properties?.type === targetType);
    if (sameType.length >= count - 1) {
      candidates = sameType;
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
