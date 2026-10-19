import axios from "axios";

/* ===============================
   CONFIG
================================ */

const WB_BASE = "https://api.worldbank.org/v2";
const COMTRADE_BASE = "https://comtradeapi.worldbank.org/v1/get/HS";

/* ===============================
   HELPERS
================================ */

const safeGet = async (fn, fallback = null) => {
  try {
    return await fn();
  } catch (e) {
    console.warn("Fallback used:", e.message);
    return fallback;
  }
};

const latestValue = (wbResponse) =>
  wbResponse?.data?.[1]?.[0]?.value ?? null;

/* ===============================
   COUNTRY PROFILE
================================ */

export async function getCountryProfile(countryCode) {
  return safeGet(async () => {
    const res = await axios.get(
      `${WB_BASE}/country/${countryCode}?format=json`
    );
    const c = res.data[1][0];

    return {
      name: c.name,
      region: c.region?.value,
      incomeLevel: c.incomeLevel?.id,
      currency: c.currencyUnit || "USD",
      capital: c.capitalCity,
    };
  }, {
    name: countryCode,
    region: "Unknown",
    incomeLevel: "UNK",
    currency: "USD",
    capital: null
  });
}

/* ===============================
   INDUSTRY STRUCTURE
================================ */

const INDUSTRY_INDICATORS = {
  agriculture: "NV.AGR.TOTL.ZS",
  industry: "NV.IND.TOTL.ZS",
  manufacturing: "NV.IND.MANF.ZS",
  services: "NV.SRV.TOTL.ZS",
};

export async function getIndustryStructure(countryCode) {
  const result = {};

  for (const [key, code] of Object.entries(INDUSTRY_INDICATORS)) {
    result[key] = await safeGet(async () => {
      const res = await axios.get(
        `${WB_BASE}/country/${countryCode}/indicator/${code}?format=json&per_page=1`
      );
      return latestValue(res);
    }, 0);
  }

  return result;
}

/* ===============================
   PRODUCTION (PHYSICAL)
================================ */

const PRODUCTION = {
  oil: "EG.EGY.PROD.KT.OE",
  gas: "EG.EGY.NGAS.KT.OE",
  electricity: "EG.ELC.PROD.KH",
  wheat: "AG.PRD.CROP.XD",
};

export async function getProduction(countryCode) {
  const prod = {};

  for (const [k, code] of Object.entries(PRODUCTION)) {
    prod[k] = await safeGet(async () => {
      const res = await axios.get(
        `${WB_BASE}/country/${countryCode}/indicator/${code}?format=json&per_page=1`
      );
      return latestValue(res) ?? 0;
    }, 0);
  }

  return prod;
}

/* ===============================
   GLOBAL COMMODITY PRICES
================================ */

const COMMODITIES = {
  gold: "PGOLD",
  silver: "PSILVER",
  oil: "POILWTI",
  gas: "PNGAS",
  wheat: "PWHEAMT",
};

export async function getGlobalCommodityPrices() {
  const prices = {};

  for (const [name, code] of Object.entries(COMMODITIES)) {
    prices[name] = await safeGet(async () => {
      const res = await axios.get(
        `${WB_BASE}/country/WLD/indicator/${code}?format=json&per_page=1`
      );
      return latestValue(res);
    }, null);
  }

  return prices;
}

/* ===============================
   TRADE (IMPORT DEPENDENCY)
================================ */

export async function getImports(countryCode, commodityCode) {
  return safeGet(async () => {
    const res = await axios.get(
      `${COMTRADE_BASE}?reporterCode=${countryCode}&cmdCode=${commodityCode}&flowCode=M`
    );
    return res.data?.dataset ?? [];
  }, []);
}

/* ===============================
   LOCAL PRICE ADJUSTMENT (MODEL)
================================ */

function priceMultiplier(profile) {
  const incomeFactor = {
    LIC: 1.35,
    LMC: 1.25,
    UMC: 1.15,
    HIC: 1.05,
    UNK: 1.2,
  };

  return incomeFactor[profile.incomeLevel] || 1.2;
}

function adjustedLocalPrice(globalPrice, profile) {
  if (!globalPrice) return null;
  return +(globalPrice * priceMultiplier(profile)).toFixed(2);
}

/* ===============================
   MASTER CONSOLIDATOR
================================ */

export async function buildCountryEconomicProfile(countryCode) {
  const profile = await getCountryProfile(countryCode);
  const industries = await getIndustryStructure(countryCode);
  const production = await getProduction(countryCode);
  const globalPrices = await getGlobalCommodityPrices();

  const commodities = {};

  for (const commodity of Object.keys(COMMODITIES)) {
    commodities[commodity] = {
      produces: production[commodity] > 0,
      productionLevel: production[commodity],
      globalPrice: globalPrices[commodity],
      estimatedLocalPrice: adjustedLocalPrice(
        globalPrices[commodity],
        profile
      ),
    };
  }

  return {
    profile,
    industries,
    production,
    commodities,
    generatedAt: new Date().toISOString(),
  };
}

/* ===============================
   USAGE EXAMPLE
================================ */

// const mexico = await buildCountryEconomicProfile("MEX");
// console.log(mexico);