import { BACKEND_URL } from "../../../apiUrl.js";

// import React, { useEffect, useRef, useState } from "react";
// import Globe from "react-globe.gl";
// import axios from "axios";
// import HomeGraphs from "../../../variable/controllers/HomeControllers/HomeGraphs";
// import astronaut from "../../../variable/assets/fotos/space-dance-nasa.gif";
// import { buildCountryEconomicProfile } 
//   from "../../../variable/controllers/zutilz/countryEconomicEngine";
// import FredCategoryExplorer from "./Explorers/USMAP";
// import TSLookUpTool from '../../../pages/components/InitialPanel/TSLookUpTool'
// import TimeSeriesHistory from "../InitialPanel/TimeSeriesHistory";
// import MasterController from "../../../variable/controllers/MasterController";
// import HomeController from "../../../variable/controllers/HomeControllers/HomeController";
// import CommodityBar from "./CommodityBar";
// import ChinaDataExplorer from "./Explorers/ChinaEconomy";
// import NYTExplorer from "./Explorers/NYTExplorer";
// /* ===================== HELPERS ===================== */
// const normalize = s =>
//   s?.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();


// /* ===================== COMPONENT ===================== */
// const MacroeconomiaV2 = () => {
//   const globeRef = useRef();
// const COUNTRY_COMPONENTS = {
//   "United States of America": {
//     component: () => (
//       <>
//         <FredCategoryExplorer />
//         <NYTExplorer />
//       </>
//     ),
//     width: 900,
//   },
//   "China": {
//      component: () => (
//       <>
//         <ChinaDataExplorer />
//       </>
//     ),
//     width: 900,
//   }

//   // Add more countries here later:
//   // "Mexico": {
//   //   component: MexicoComponent,
//   //   width: 400,
//   // },
// };
//   const [geoData, setGeoData] = useState({ features: [] });
//   const [selectedCountries, setSelectedCountries] = useState([]);
//   const [categories, setCategories] = useState([]);
//   const [indicators, setIndicators] = useState([]);
//   const [isComparisonEnabled, setIsComparisonEnabled] = useState(false);
//   const [hoveredCountry, setHoveredCountry] = useState(null);
//   const [loadedSeries, setLoadedSeries] = useState([]);

//   const [countryProfile, setCountryProfile] = useState(null);
//   const [loadingProfile, setLoadingProfile] = useState(false);

//   /* ===================== INIT ===================== */
//   useEffect(() => {
//     fetch("../../../src/variable/assets/videos/countries.geo.json")
//       .then(r => r.json())
//       .then(setGeoData);

//     axios.get(`${BACKEND_URL}/Macroeconomics/Categories`)
//       .then(res => {
//         const valid = [1,3,5,7,11,12,13,14,20,21];
//         setCategories(res.data[1].filter(c => valid.includes(Number(c.id))));
//       });
//   }, []);
//      const setInputValueToday = () => {
//         // set date like 2024-05-02 as value for input element id = 'endDate'
//         const today = new Date();
//         const dd = String(today.getDate()).padStart(2, '0');
//         const mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
//         const yyyy = today.getFullYear();
//         document.getElementById('endDate').value = yyyy + '-' + mm + '-' + dd;
//         const calendarEndDate = document.getElementById('startDate');
//         const pastYear = yyyy - 2;
//         calendarEndDate.value = pastYear + '-' + mm + '-' + dd;
//       }
//   /* ===================== COMPARISON ===================== */
//   const toggleComparison = () => {
//     setIsComparisonEnabled(v => {
//       if (v) {
//         setSelectedCountries([]);
//         setIndicators([]);
//         setLoadedSeries([]);
//         setCountryProfile(null);
//         setLoadingProfile(false);
//       }
//       return !v;
//     });
//   };
//   function handleClick(event) {
//         const clickedElement = event.target.id;
//         const splitted = clickedElement.split("_");
//         const type = splitted[0]
//         const Controller = splitted[1]
//         const Test = splitted[2]
//         const ticker = document.getElementById('searchEntry').value
//         const ControllerRunning = MasterController[Controller];
//         const runnerFunction = ControllerRunning[Test];
//         if(type !== ''){
//           MasterController.WorkController.worklog.addItem(Test,ticker)
    
//         }
//        if(localStorage.getItem('lastCall')==='multiple'){
    
//         const tickers = getTickers()
//         const selector = document.getElementById('functionsTickerSelector')
//         selector.classList.remove('hidden')
//         selector.innerHTML = ''
//         tickers.map(tic =>{
//           const option = document.createElement('option')
//           option.innerText = tic
//           selector.append(option)
//         })
//        }
    
    
//         runnerFunction();
//       }
//   /* ===================== TRANSLATE ===================== */
//   const translateToEnglish = async text => {
//     try {
//       const r = await axios.post(
//         "https://corsproxy.io/?https://libretranslate.de/translate",
//         { q: text, source: "auto", target: "en", format: "text" },
//         { headers: { "Content-Type": "application/json" } }
//       );
//       return r.data.translatedText;
//     } catch {
//       return text;
//     }
//   };

//   /* ===================== INDICATOR CLICK ===================== */
//   const handleIndicatorClick = async indicator => {
//     if (!selectedCountries.length) return;

//     const countries = await axios
//       .get("../../../src/variable/assets/countriesList.json")
//       .then(r => r.data);

//     let series = [];

//     for (const name of selectedCountries) {
//       let c = countries.find(x => normalize(x.name) === normalize(name));

//       if (!c) {
//         const t = await translateToEnglish(name);
//         c = countries.find(x => normalize(x.name) === normalize(t));
//       }

//       if (!c) continue;

//       const r = await axios.get(
//         `${BACKEND_URL}/Macroeconomics/IndicatorData/${indicator.id}/${c.id}?per_page=1000`
//       );

//       series.push({ country: name, data: r.data[1] });
//     }

//     HomeGraphs.graphMultipleMacronomicIndicators(
//       series,
//       `${indicator.name} - Comparación`
//     );
//   };

//   /* ===================== COUNTRY CLICK ===================== */
//   const onCountryClick = async (polygon, evt, { lat, lng }) => {
//     const name = polygon?.properties?.name;
//     if (!name || !polygon.geometry) return;

//     // deselect
//     if (!isComparisonEnabled && selectedCountries[0] === name) {
//       setSelectedCountries([]);
//       setCountryProfile(null);
//       setLoadingProfile(false);
//       return;
//     }
   
//     // comparison mode
//     if (isComparisonEnabled) {
//       setSelectedCountries(prev =>
//         prev.includes(name)
//           ? prev.filter(c => c !== name)
//           : [...prev, name]
//       );
//       return;
//     }
//      console.log(name)
//     if(name === 'United States of America'){
//       //add division to show USMAP
//       document.createElement('div').id = 'USMAP'
//       //show FredCategoryExplorer
      
//     }
//     // single country
//     setSelectedCountries([name]);
//     setIndicators([]);
//     setLoadedSeries([]);
//     setCountryProfile(null);
//     setLoadingProfile(true);

//     globeRef.current.pointOfView({ lat, lng, altitude: 0.6 }, 1200);

//     try {
//       const profile = await buildCountryEconomicProfile(name);
//       setCountryProfile(profile);
//     } catch {
//       setCountryProfile(null);
//     }

//     setLoadingProfile(false);
//   };

//   /* ===================== RENDER ===================== */
//   return (
//     <div style={{ background: "#00050a", height: "100vh", width: "100vw" }}>

//       <Globe
//         ref={globeRef}
//         globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
//         backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
//         polygonsData={geoData.features}
//         polygonAltitude={f =>
//           selectedCountries.includes(f.properties.name) ? 0.05 : 0.01
//         }
//         polygonCapColor={f => {
//           const n = f.properties.name;
//           if (selectedCountries.includes(n)) return "rgba(107,142,35,0.8)";
//           if (n === hoveredCountry) return "rgba(255,255,255,0.15)";
//           return "rgba(255,255,255,0.01)";
//         }}
//         polygonStrokeColor={() => "#6b8e23"}
//         onPolygonHover={setHoveredCountry}
//         onPolygonClick={onCountryClick}
//       />

//       {/* ASTRONAUT */}
//       <img
//         src={astronaut}
//         alt="loading"
//         style={{
//           position: "fixed",
//           bottom: 30,
//           right: 30,
//           width: 120,
//           opacity: loadingProfile ? 1 : 0.4,
//           zIndex: 50
//         }}
//       />


//       {/* COMPARISON TOGGLE */}
//       <div style={{ position: "fixed", top: 20, left: 20, color: "#cde6b3" }}>
//         <label>
//           <input type="checkbox" checked={isComparisonEnabled} onChange={toggleComparison} />
//           {" MODO COMPARACIÓN"}
//         </label>
//       </div>

//       {/* CATEGORIES */}
//       {/* <div className="eco-panel categories-panel">
       
//         {categories.map(cat => (
//           <button
//             key={cat.id}
//             className="eco-btn"
//             onClick={() =>
//               axios
//                 .get(`${BACKEND_URL}/Macroeconomics/obtainCategoryListing/${cat.id}`)
               
//             }
//           >
//             {cat.value}
//           </button>
//         ))}
      
//       </div> */}
     

//       {/* INDICATORS */}
//       {indicators.length > 0 && (
//         <div className="eco-panel indicators-panel">
//           <button className="eco-btn danger" onClick={() => setIndicators([])}>✕</button>
//           <div className="indicators-scroll">
//             {indicators.map(ind => (
//               <button
//                 key={ind.id}
//                 className="eco-pill"
//                 onClick={() => handleIndicatorClick(ind)}
//               >
//                 {ind.name}
//               </button>
//             ))}
//           </div>
//         </div>
//       )}
// {/* COUNTRY-SPECIFIC COMPONENT */}
// {!isComparisonEnabled &&
//   selectedCountries.length === 1 &&
//   COUNTRY_COMPONENTS[selectedCountries[0]] && (
//     <div
//       style={{
//         position: "fixed",
//         top: "50px",
//         left: "0px",
//         width: `${COUNTRY_COMPONENTS[selectedCountries[0]].width}px`,
//         minWidth: "300px",
//         maxWidth: "80vw",
//         height: "calc(50vh - 50px)",

//         resize: "both",      // <-- drag with mouse
//         overflow: "auto",          // required for resize

//         zIndex: 100,
//         background: "#f8fafc",
//         boxShadow: "5px 0 20px rgba(0,0,0,.35)",
//         borderRight: "2px solid #ccc",
//       }}
//     >
//       {React.createElement(
//         COUNTRY_COMPONENTS[selectedCountries[0]].component
//       )}
//     </div>
// )}
//       {/* PROFILE */}
      

//       {loadingProfile && (
//         <div style={{ position: "fixed", top: "50%", left: "50%", color: "#6b8e23" }}>
//         </div>
//       )}
// <div>

//      <div className="row ts-panel row" >
//       <div className="col-4"></div>
//       <div className="col-8">
             

//       {/* <TimeSeriesHistory/> */}

// {/* <div className="row">
//   <div className="col-4">      
//                 <div className="row">  
                  
//                   <div className="col-12">
//                   <div className="row">
//                     <div className="col-3">
//                       <h6>Ticker</h6>
//                     </div>
//                     <div className="col-9">
//                       {" "}
//                       <input
//                         id="searchEntry"
//                         type="text"
//                         className="ts-input"
//                         placeholder="Ticker"
//                         defaultValue={""}
//                       />
//                     </div>
//                   </div>
//                 </div>
//                 <div className="col-12 seccionBusqueda-derecha-fechas">
//                   <div className="row">
//                     <div className="col-4">Start D.</div>
//                     <div className="col-8">
//                       {" "}
//                    <div className="row">
//                     <div className="col-12 ">   <input
//                         id="startDate"
//                         className="ts-input"
//                         type="text"
//                         placeholder="Start Date"
//                         defaultValue=""
//                       /></div>
//                    </div>
//                     </div>
//                   </div>
//                   <div className="row">
//                     <div className="col-3">End D.</div>
//                     <div className="col-9">
//                       {" "}
                 
//                 <div className="row date-row">
//   <div className="col-7">
//     <input id="endDate" className="ts-input"  />
//   </div>
//   <div className="col-4">
//                 <button className="ts-btn secondary" onClick={setInputValueToday}>
//     Today
//   </button>
//   </div>

// </div>
//                     </div>
//                   </div>
//                 </div>
//                 <div className="col-12">
//                   {" "}
//                   <button
//                     className="actionButton ts-btn"
//                     id="Function_HomeController_individualSearch"
//                     onClick={handleClick}
//                   >
//                     Search & Graph
//                   </button>{" "}
//                 </div>
//              </div>
              
//               <div className="col-7">
//                 <div id="worklog"></div>
//                 <div id="printTickerInfo"></div>
//               </div></div>
//               <div className="col-8">
//                 <div id="graphSearch"></div>
//               </div>
// </div> */}
//          {/* <TSLookUpTool/> */}
//            <CommodityBar />
//       </div>
//       </div>
    
// </div>
//       <style>{`
//         .eco-panel {
//           background: rgba(10,20,10,.95);
//           border: 1px solid #2f4f2f;
//           padding: 12px;
//           border-radius: 12px;
//           color: #cde6b3;
//         }
//           .seccionBusqueda-derecha-fechas .row {
//   margin-bottom: 8px;
// }

// .date-row {
//   display: flex;
//   align-items: center;
//   gap: 8px;
// }

//      .ts-panel {
//   background: rgba(10,20,10,.95);
//   border: 1px solid #2f4f2f;
//   border-radius: 16px;
//   padding: 24px;              /* ⬅ more breathing */
//   margin-top: 20px;           /* ⬅ separates from map */
//   color: #cde6b3;
//   box-shadow: 0 0 20px rgba(107,142,35,.25);
// }

// /* Inputs */
// .ts-input {
//   width: 100%;
//   background: rgba(20,40,20,.9);
//   border: 1px solid #6b8e23;
//   border-radius: 8px;
//   padding: 6px 10px;
//   color: #cde6b3;
//   outline: none;
// }

// .ts-input::placeholder {
//   color: #9fb58a;
// }

// /* Buttons */
// .ts-btn {
//   background: rgba(30,60,30,.95);
//   border: 1px solid #6b8e23;
//   border-radius: 10px;
//   padding: 8px 14px;
//   color: #cde6b3;
//   cursor: pointer;
//   transition: all .2s ease;
// }

// .ts-btn:hover {
//   box-shadow: 0 0 14px #6b8e23;
//   transform: translateY(-1px);
// }

// .ts-btn.secondary {
//   background: rgba(60,60,60,.7);
//   border-color: #888;
// }
// .commodities-wrapper {
//   margin: 10px 0;
// }

// .commodities-row {
//   display: flex;
//   gap: 14px;
//   align-items: center;
// }

// .commodity-chip {
//   display: flex;
//   align-items: center;
//   gap: 6px;
//   padding: 6px 10px;
//   border-radius: 8px;
//   cursor: pointer;
//   background: rgba(255,255,255,0.06);
//   transition: all .2s ease;
//   position: relative;
// }

// .commodity-chip img {
//   width: 26px;
//   height: 26px;
//   transition: opacity .15s ease;
// }

// .commodity-chip span {
//   color: #cde6b3;
//   font-family: monospace;
// }

// .commodity-chip:hover img {
//   opacity: 0;
// }

// .commodity-chip:hover::after {
//   content: "✖";
//   position: absolute;
//   left: 10px;
//   font-size: 18px;
//   color: gold;
// }

// .commodity-chip.active {
//   outline: 1px solid gold;
// }

// .commodity-chip.compare {
//   font-size: 18px;
//   padding: 6px 12px;
// }

// /* Labels */
// .ts-panel h6,
// .ts-panel .col-3,
// .ts-panel .col-4 {
//   font-size: 12px;
//   opacity: .85;
// }

// /* Output */
// #worklog,
// #printTickerInfo {
//   margin-top: 10px;
//   font-size: 13px;
//   color: #9fb58a;
// }


//         .categories-panel {
//           position: fixed;
//           left: 20px;
//           bottom: 30px;
//           width: 240px;
//           max-height: 420px;
//           display: flex;
//           flex-direction: column;
//           gap: 6px;
//         }


//         .indicators-panel {
//           position: fixed;
//           left: 280px;
//           bottom: 30px;
//           width: 240px;
//           max-height: 420px;
//           display: flex;
//           flex-direction: column;
//         }

//         .indicators-scroll {
//           overflow-y: auto;
//           scrollbar-width: none;
//         }

//         .indicators-scroll::-webkit-scrollbar {
//           display: none;
//         }

//         .eco-btn, .eco-pill {
//           background: rgba(20,40,20,.9);
//           border: 1px solid #6b8e23;
//           color: #cde6b3;
//           padding: 8px;
//           border-radius: 8px;
//           cursor: pointer;
//         }

//         .eco-btn:hover, .eco-pill:hover {
//           box-shadow: 0 0 12px #6b8e23;
//         }

//         .danger {
//           border-color: #ff6b6b;
//           color: #ff6b6b;
//         }
//       `}</style>
//     </div>
//   );
// };

// export default MacroeconomiaV2;


import React, { useCallback, useEffect, useRef, useState } from "react";
import Globe from "react-globe.gl";
import axios from "axios";
import HomeGraphs from "../../../variable/controllers/HomeControllers/HomeGraphs";
import FredCategoryExplorer from "./Explorers/USMAP";
import TSLookUpTool from '../../../pages/components/InitialPanel/TSLookUpTool'
import TimeSeriesHistory from "../InitialPanel/TimeSeriesHistory";
import MasterController from "../../../variable/controllers/MasterController";
import HomeController from "../../../variable/controllers/HomeControllers/HomeController";
import CommodityBar from "./CommodityBar";
import ChinaDataExplorer from "./Explorers/ChinaEconomy";
import NYTExplorer from "./Explorers/NYTExplorer";
import WorldCountryExplorer from "./Explorers/WorldCountryExplorer";
import CountryComparison from "./Explorers/CountryComparison";
import AIChatPanel from "../AIChatPanel";
import MacroInsightMascot from "./MacroInsightMascot";
import "./MacroeconomiaV2.css";
import geoData from "../../../variable/assets/videos/countries.geo.json";
import countries from "../../../variable/assets/countriesList.json";
/* ===================== HELPERS ===================== */
const normalize = s =>
  s?.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();


/* Keep these component types at module scope. Defining them inside the map
   component remounted the whole dashboard on every hover/state update. */
const UnitedStatesCountryPanel = () => (
  <>
    <FredCategoryExplorer />
    <NYTExplorer />
  </>
);

const ChinaCountryPanel = () => <ChinaDataExplorer />;

const COUNTRY_COMPONENTS = {
  "United States of America": {
    component: UnitedStatesCountryPanel,
    width: 900,
  },
  China: {
    component: ChinaCountryPanel,
    width: 900,
  },
};

/* ===================== COMPONENT ===================== */
const MacroeconomiaV2 = () => {
  const today = new Date();
  const localDateValue = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");
  const globeRef = useRef();
  const [selectedCountries, setSelectedCountries] = useState([]);
  const [countryLocations, setCountryLocations] = useState({});
  const [globeFocus, setGlobeFocus] = useState({ lat: 0, lng: 0 });
  const [categories, setCategories] = useState([]);
  const [indicators, setIndicators] = useState([]);
  const [isComparisonEnabled, setIsComparisonEnabled] = useState(false);
  const [hoveredCountry, setHoveredCountry] = useState(null);
  const [loadedSeries, setLoadedSeries] = useState([]);
  const [selectionNotice, setSelectionNotice] = useState("");
  const [macroChatContexts, setMacroChatContexts] = useState({});

  const updateMacroChatContext = useCallback((source, context) => {
    setMacroChatContexts((current) => {
      if (!context && !current[source]) return current;
      if (context && current[source] === context) return current;
      const next = { ...current };
      if (context) next[source] = context;
      else delete next[source];
      return next;
    });
  }, []);

  /* ===================== INIT ===================== */
  useEffect(() => {
    axios.get(`${BACKEND_URL}/Macroeconomics/Categories`)
      .then(res => {
        const valid = [1,3,5,7,11,12,13,14,20,21];
        setCategories(res.data[1].filter(c => valid.includes(Number(c.id))));
      });
  }, []);
     const setInputValueToday = () => {
        // set date like 2024-05-02 as value for input element id = 'endDate'
        const today = new Date();
        const dd = String(today.getDate()).padStart(2, '0');
        const mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
        const yyyy = today.getFullYear();
        document.getElementById('endDate').value = yyyy + '-' + mm + '-' + dd;
        const calendarEndDate = document.getElementById('startDate');
        const pastYear = yyyy - 2;
        calendarEndDate.value = pastYear + '-' + mm + '-' + dd;
      }
  /* ===================== COMPARISON ===================== */
  const toggleComparison = () => {
    setIsComparisonEnabled(v => {
      if (v) {
        setSelectedCountries([]);
        setCountryLocations({});
        setIndicators([]);
        setLoadedSeries([]);
      }
      return !v;
    });
  };
  const closeCountryPanels = () => {
    setSelectedCountries([]);
    setCountryLocations({});
    setIndicators([]);
    setLoadedSeries([]);
    setSelectionNotice("");
    setMacroChatContexts({});
    setIsComparisonEnabled(false);
  };
  const removeSelectedCountry = (name) => {
    const remaining = selectedCountries.filter((country) => country !== name);
    setSelectedCountries(remaining);
    setCountryLocations((previous) => {
      const next = { ...previous };
      delete next[name];
      return next;
    });
    const nextTarget = countryLocations[remaining[remaining.length - 1]];
    if (nextTarget) {
      setGlobeFocus({ lat: nextTarget.lat, lng: nextTarget.lng });
      globeRef.current?.pointOfView({ lat: nextTarget.lat, lng: nextTarget.lng, altitude: 0.8 }, 900);
    }
  };
  function handleClick(event) {
        const clickedElement = event.target.id;
        const splitted = clickedElement.split("_");
        const type = splitted[0]
        const Controller = splitted[1]
        const Test = splitted[2]
        const ticker = document.getElementById('searchEntry').value
        const ControllerRunning = MasterController[Controller];
        const runnerFunction = ControllerRunning[Test];
        if(type !== ''){
          MasterController.WorkController.worklog.addItem(Test,ticker)
    
        }
       if(localStorage.getItem('lastCall')==='multiple'){
    
        const tickers = getTickers()
        const selector = document.getElementById('functionsTickerSelector')
        selector.classList.remove('hidden')
        selector.innerHTML = ''
        tickers.map(tic =>{
          const option = document.createElement('option')
          option.innerText = tic
          selector.append(option)
        })
       }
    
    
        runnerFunction();
      }
  /* ===================== TRANSLATE ===================== */
  const translateToEnglish = async text => {
    try {
      const r = await axios.post(
        "https://corsproxy.io/?https://libretranslate.de/translate",
        { q: text, source: "auto", target: "en", format: "text" },
        { headers: { "Content-Type": "application/json" } }
      );
      return r.data.translatedText;
    } catch {
      return text;
    }
  };

  /* ===================== INDICATOR CLICK ===================== */
  const handleIndicatorClick = async indicator => {
    if (!selectedCountries.length) return;

    let series = [];

    for (const name of selectedCountries) {
      let c = countries.find(x => normalize(x.name) === normalize(name));

      if (!c) {
        const t = await translateToEnglish(name);
        c = countries.find(x => normalize(x.name) === normalize(t));
      }

      if (!c) continue;

      const r = await axios.get(
        `${BACKEND_URL}/Macroeconomics/IndicatorData/${indicator.id}/${c.id}?per_page=1000`
      );

      series.push({ country: name, data: r.data[1] });
    }

    HomeGraphs.graphMultipleMacronomicIndicators(
      series,
      `${indicator.name} - Comparación`
    );
  };

  /* ===================== COUNTRY CLICK ===================== */
  const onCountryClick = async (polygon, evt, { lat, lng }) => {
    const name = polygon?.properties?.name;
    if (!name || !polygon.geometry) return;

    // deselect
    if (!isComparisonEnabled && selectedCountries[0] === name) {
      setSelectedCountries([]);
      setCountryLocations({});
      return;
    }
   
    // comparison mode
    if (isComparisonEnabled) {
      const alreadySelected = selectedCountries.includes(name);
      if (!alreadySelected && selectedCountries.length >= 6) {
        setSelectionNotice("Compare up to six countries at a time. Remove a country to add another.");
        return;
      }
      const remaining = selectedCountries.filter((country) => country !== name);
      const nextFocus = alreadySelected
        ? countryLocations[remaining[remaining.length - 1]]
        : { lat, lng };
      if (nextFocus) {
        setGlobeFocus({ lat: nextFocus.lat, lng: nextFocus.lng });
        globeRef.current?.pointOfView({ lat: nextFocus.lat, lng: nextFocus.lng, altitude: 0.8 }, 900);
      }
      setSelectionNotice("");
      setSelectedCountries(prev => {
        return alreadySelected
          ? prev.filter(country => country !== name)
          : [...prev, name];
      });
      setCountryLocations((previous) => {
        const next = { ...previous };
        if (alreadySelected) delete next[name];
        else next[name] = { name, lat, lng };
        return next;
      });
      return;
    }
    setSelectionNotice("");
     // Select immediately. The country panel mounts now and each API
    // section manages its own loading state instead of blocking the map.
    setSelectedCountries([name]);
    setCountryLocations({ [name]: { name, lat, lng } });
    setIndicators([]);
    setLoadedSeries([]);

    globeRef.current?.pointOfView({ lat, lng, altitude: 0.6 }, 1200);
  };

  const insightSource = macroChatContexts.commodity
    || macroChatContexts.comparison
    || macroChatContexts.country
    || null;
  const mascotTargetCountry = countryLocations[selectedCountries[selectedCountries.length - 1]] || null;

  /* ===================== RENDER ===================== */
  return (
    <div className="macro-v2-shell">

      <Globe
        ref={globeRef}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
        backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
        polygonsData={geoData.features}
        polygonAltitude={f =>
          selectedCountries.includes(f.properties.name) ? 0.05 : 0.01
        }
        polygonCapColor={f => {
          const n = f.properties.name;
          if (selectedCountries.includes(n)) return "rgba(107,142,35,0.8)";
          if (n === hoveredCountry) return "rgba(255,255,255,0.15)";
          return "rgba(255,255,255,0.01)";
        }}
        polygonStrokeColor={() => "#6b8e23"}
        onPolygonHover={setHoveredCountry}
        onPolygonClick={onCountryClick}
      />

      <div className="macro-v2-brand">
        <span className="macro-v2-kicker">WORLD ECONOMY</span>
        <strong>Global macro atlas</strong>
        <span>Explore a country or compare economies</span>
      </div>

      {/* COMPARISON TOGGLE */}
      <div className="macro-v2-control">
        <label>
          <input type="checkbox" checked={isComparisonEnabled} onChange={toggleComparison} />
          <span>{isComparisonEnabled ? "Comparison mode on" : "Enable comparison"}</span>
        </label>
        <time dateTime={localDateValue}>
          {today.toLocaleDateString(undefined, {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </time>
      </div>
      {selectedCountries.length > 0 && (
        <div className="macro-v2-selection">
          <div className="macro-v2-selection-chips">
            {selectedCountries.map((name, index) => (
              <button
                key={name}
                type="button"
                onClick={() => removeSelectedCountry(name)}
                title={`Remove ${name}`}
              >
                <span style={{ background: ["#167d72", "#3569ad", "#b56827", "#9257a0", "#c34b59", "#5c7480"][index] }} />
                {name}<b aria-hidden="true">×</b>
              </button>
            ))}
            <button
              className="macro-v2-clear"
              type="button"
              onClick={() => {
                setSelectedCountries([]);
                setCountryLocations({});
              }}
            >
              Clear
            </button>
          </div>
          {selectionNotice && <div className="macro-v2-selection-notice">{selectionNotice}</div>}
        </div>
      )}
      {/* CATEGORIES */}
      {/* <div className="eco-panel categories-panel">
       
        {categories.map(cat => (
          <button
            key={cat.id}
            className="eco-btn"
            onClick={() =>
              axios
                .get(`${BACKEND_URL}/Macroeconomics/obtainCategoryListing/${cat.id}`)
               
            }
          >
            {cat.value}
          </button>
        ))}
      
      </div> */}
     

      {/* INDICATORS */}
      {indicators.length > 0 && (
        <div className="eco-panel indicators-panel">
          <button className="eco-btn danger" onClick={() => setIndicators([])}>✕</button>
          <div className="indicators-scroll">
            {indicators.map(ind => (
              <button
                key={ind.id}
                className="eco-pill"
                onClick={() => handleIndicatorClick(ind)}
              >
                {ind.name}
              </button>
            ))}
          </div>
        </div>
      )}
{/* COUNTRY-SPECIFIC COMPONENT */}
{isComparisonEnabled && (
  <div className="macro-country-panel macro-country-comparison-panel">
    <button
      className="macro-country-close"
      type="button"
      onClick={closeCountryPanels}
      aria-label="Close country comparison"
    >
      ×
    </button>
    <CountryComparison
      countryNames={selectedCountries}
      onRemoveCountry={removeSelectedCountry}
      onChatContextChange={updateMacroChatContext}
    />
  </div>
)}
{!isComparisonEnabled && selectedCountries.length === 1 && (
  <div
    key={selectedCountries[0]}
    className="macro-country-panel"
    style={{ width: `${COUNTRY_COMPONENTS[selectedCountries[0]]?.width || 760}px` }}
  >
    <button
      className="macro-country-close"
      type="button"
      onClick={closeCountryPanels}
      aria-label={`Close ${selectedCountries[0]} country information`}
    >
      ×
    </button>
    {COUNTRY_COMPONENTS[selectedCountries[0]]
      ? React.createElement(COUNTRY_COMPONENTS[selectedCountries[0]].component)
      : <WorldCountryExplorer countryName={selectedCountries[0]} onChatContextChange={updateMacroChatContext} />}
  </div>
)}
<CommodityBar onChatContextChange={updateMacroChatContext} />
{(() => {
  const activeChat = macroChatContexts.commodity
    || macroChatContexts.comparison
    || macroChatContexts.country;
  const selectedSubject = selectedCountries.length
    ? selectedCountries.join(", ")
    : "the world economy";
  const fallbackChat = {
    title: `Ask AI about ${selectedSubject}`,
    description: "Ask about the economic information currently shown. The chat includes a text snapshot of the page when you send a question.",
    contextType: "country-profile",
    context: { selectedCountries },
    contextKey: `macro:${selectedCountries.join("|")}`,
    downloadName: "macroeconomics-data.json",
  };
  const chat = activeChat || fallbackChat;
  return (
    <AIChatPanel
      key={chat.contextKey}
      title={chat.title}
      description={chat.description}
      contextType={chat.contextType}
      context={chat.context}
      contextKey={chat.contextKey}
      downloadName={chat.downloadName}
      side="left"
    />
  );
})()}
      <MacroInsightMascot
        context={insightSource?.context ?? { selectedCountries }}
        contextType={insightSource?.contextType ?? "country-profile"}
        contextKey={insightSource?.contextKey ?? `macro:${selectedCountries.join("|")}`}
        countries={selectedCountries}
        globeRef={globeRef}
        globeFocus={globeFocus}
        targetCountry={mascotTargetCountry}
      />
      {/* PROFILE */}
      

<div>

     <div className="row ts-panel row" >
      <div className="col-4"></div>
      <div className="col-8">
             

      {/* <TimeSeriesHistory/> */}

{/* <div className="row">
  <div className="col-4">      
                <div className="row">  
                  
                  <div className="col-12">
                  <div className="row">
                    <div className="col-3">
                      <h6>Ticker</h6>
                    </div>
                    <div className="col-9">
                      {" "}
                      <input
                        id="searchEntry"
                        type="text"
                        className="ts-input"
                        placeholder="Ticker"
                        defaultValue={""}
                      />
                    </div>
                  </div>
                </div>
                <div className="col-12 seccionBusqueda-derecha-fechas">
                  <div className="row">
                    <div className="col-4">Start D.</div>
                    <div className="col-8">
                      {" "}
                   <div className="row">
                    <div className="col-12 ">   <input
                        id="startDate"
                        className="ts-input"
                        type="text"
                        placeholder="Start Date"
                        defaultValue=""
                      /></div>
                   </div>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-3">End D.</div>
                    <div className="col-9">
                      {" "}
                 
                <div className="row date-row">
  <div className="col-7">
    <input id="endDate" className="ts-input"  />
  </div>
  <div className="col-4">
                <button className="ts-btn secondary" onClick={setInputValueToday}>
    Today
  </button>
  </div>

</div>
                    </div>
                  </div>
                </div>
                <div className="col-12">
                  {" "}
                  <button
                    className="actionButton ts-btn"
                    id="Function_HomeController_individualSearch"
                    onClick={handleClick}
                  >
                    Search & Graph
                  </button>{" "}
                </div>
             </div>
              
              <div className="col-7">
                <div id="worklog"></div>
                <div id="printTickerInfo"></div>
              </div></div>
              <div className="col-8">
                <div id="graphSearch"></div>
              </div>
</div> */}
         {/* <TSLookUpTool/> */}
      </div>
      </div>
    
</div>
      <style>{`
        .eco-panel {
          background: rgba(10,20,10,.95);
          border: 1px solid #2f4f2f;
          padding: 12px;
          border-radius: 12px;
          color: #cde6b3;
        }
          .seccionBusqueda-derecha-fechas .row {
  margin-bottom: 8px;
}

.date-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

     .ts-panel {
  background: rgba(10,20,10,.95);
  border: 1px solid #2f4f2f;
  border-radius: 16px;
  padding: 24px;              /* ⬅ more breathing */
  margin-top: 20px;           /* ⬅ separates from map */
  color: #cde6b3;
  box-shadow: 0 0 20px rgba(107,142,35,.25);
}

/* Inputs */
.ts-input {
  width: 100%;
  background: rgba(20,40,20,.9);
  border: 1px solid #6b8e23;
  border-radius: 8px;
  padding: 6px 10px;
  color: #cde6b3;
  outline: none;
}

.ts-input::placeholder {
  color: #9fb58a;
}

/* Buttons */
.ts-btn {
  background: rgba(30,60,30,.95);
  border: 1px solid #6b8e23;
  border-radius: 10px;
  padding: 8px 14px;
  color: #cde6b3;
  cursor: pointer;
  transition: all .2s ease;
}

.ts-btn:hover {
  box-shadow: 0 0 14px #6b8e23;
  transform: translateY(-1px);
}

.ts-btn.secondary {
  background: rgba(60,60,60,.7);
  border-color: #888;
}
.commodities-wrapper {
  margin: 10px 0;
}

.commodities-row {
  display: flex;
  gap: 14px;
  align-items: center;
}

.commodity-chip {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 8px;
  cursor: pointer;
  background: rgba(255,255,255,0.06);
  transition: all .2s ease;
  position: relative;
}

.commodity-chip img {
  width: 26px;
  height: 26px;
  transition: opacity .15s ease;
}

.commodity-chip span {
  color: #cde6b3;
  font-family: monospace;
}

.commodity-chip:hover img {
  opacity: 0;
}

.commodity-chip:hover::after {
  content: "✖";
  position: absolute;
  left: 10px;
  font-size: 18px;
  color: gold;
}

.commodity-chip.active {
  outline: 1px solid gold;
}

.commodity-chip.compare {
  font-size: 18px;
  padding: 6px 12px;
}

/* Labels */
.ts-panel h6,
.ts-panel .col-3,
.ts-panel .col-4 {
  font-size: 12px;
  opacity: .85;
}

/* Output */
#worklog,
#printTickerInfo {
  margin-top: 10px;
  font-size: 13px;
  color: #9fb58a;
}


        .categories-panel {
          position: fixed;
          left: 20px;
          bottom: 30px;
          width: 240px;
          max-height: 420px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }


        .indicators-panel {
          position: fixed;
          left: 280px;
          bottom: 30px;
          width: 240px;
          max-height: 420px;
          display: flex;
          flex-direction: column;
        }

        .indicators-scroll {
          overflow-y: auto;
          scrollbar-width: none;
        }

        .indicators-scroll::-webkit-scrollbar {
          display: none;
        }

        .eco-btn, .eco-pill {
          background: rgba(20,40,20,.9);
          border: 1px solid #6b8e23;
          color: #cde6b3;
          padding: 8px;
          border-radius: 8px;
          cursor: pointer;
        }

        .eco-btn:hover, .eco-pill:hover {
          box-shadow: 0 0 12px #6b8e23;
        }

        .danger {
          border-color: #ff6b6b;
          color: #ff6b6b;
        }
      `}</style>
    </div>
  );
};

export default MacroeconomiaV2;
