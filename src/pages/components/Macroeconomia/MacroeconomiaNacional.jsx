import { BACKEND_URL } from "../../../apiUrl.js";

// import React, { useEffect, useState } from 'react';
// import L from 'leaflet';  // Ensure you import Leaflet
// import axios from 'axios';
// import HomeGraphs from '../../../variable/controllers/HomeControllers/HomeGraphs';
// const MacroeconomiaNacional = () => {
//   let CountryName = window.location.pathname.split("/")[3]; // Extract country from URL
//   CountryName = CountryName.split('%20')
//   CountryName = CountryName.join(" ")  
//   const [selectedSeries, setSelectedSeries] = useState('')
//   const obtainIndicatorsList = async ()=>{
//     const response = await  axios.get(
//       `${BACKEND_URL}/Macroeconomics/Listing`
//     ).then(response => {return (response.data)} )
    
//   const indicatorsList = document.getElementById('listIndicatorsCategories');
//   response[1].map((indicator) =>{
//       const indName = document.createElement('p')
//       indName.innerText = indicator.name
//       const indTopic = document.createElement('p')
//       indicatorsList.append(indName)
  
//       if( indicator.topics[0].value){
//         indTopic.innerText = indicator.topics[0].value
//         indicatorsList.append(indTopic)
  
//       }
//   })
  

//   }
//           const categoriesList = document.getElementById('listCategories');

// // const obtainCountriesNews =() =>{

// // }
//   useEffect(() => {
//     // Initialize the map, but leave center/zoom unset for now
//     const map = L.map('countryMap', {
//       minZoom: 2,
//       maxZoom: 18
//     });

//    obtainCategories(categoriesList)
//     L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
//       attribution: '© OpenStreetMap contributors'
//     }).addTo(map);

//     // Fetch the GeoJSON data (assuming it contains all countries)
//     fetch('../../../src/variable/assets/videos/countries.geo.json')
//       .then(response => response.json())
//       .then(geojsonData => {
//         // Find the country by its name in GeoJSON
//         const countryFeature = geojsonData.features.find(feature => 
//           feature.properties.name.toLowerCase() === CountryName.toLowerCase()
//         );

//         if (countryFeature) {
//           // Get the bounding box of the country and fit it to the map
//           const bounds = L.geoJSON(countryFeature).getBounds();
//           map.fitBounds(bounds);

//           // Add only the country's borders to the map
//           L.geoJSON(countryFeature, {
//             style: function () {
//               return {
//                 color: '#ffffff',
//                 weight: 1,
//                 opacity: 0.00002,
//               };
//             }
//           }).addTo(map);
//         } else {
//           console.error('Country not found in the GeoJSON data.');
//         }
//       })
//       .catch(error => console.error('Error loading GeoJSON:', error));
//   }, [CountryName]);

// // -----------------------------
// // Helper function: translate to English using LibreTranslate
// // -----------------------------
// const translateToEnglish = async (text) => {
//   try {
//     const res = await axios.post(
//       'https://libretranslate.de/translate',
//       {
//         q: text,
//         source: 'auto', // auto-detect language
//         target: 'en',   // translate to English
//         format: 'text'
//       },
//       { headers: { 'Content-Type': 'application/json' } }
//     );
//     return res.data.translatedText;
//   } catch (err) {
//     console.error('Translation error:', err);
//     return text; // fallback to original
//   }
// };

// // -----------------------------
// // Main function: fetch indicators & attach buttons
// // -----------------------------
// const obtainIndicators = async function (categoryId) {

//   // 1️⃣ Fetch category listing
//   const response = await axios
//     .get(`${BACKEND_URL}/Macroeconomics/obtainCategoryListing/${categoryId}`)
//     .then(res => res.data);

//   const listForEachCategory = document.getElementById('listForEachCategory');
//   listForEachCategory.innerHTML = '';

//   response[1].forEach(indicator => {
    
//     if (!indicator.name) return;

//     // 2️⃣ Create button for each indicator
//     const indName = document.createElement('button');
//     indName.innerText = indicator.name;
//     indName.style.width = '350px';
//     listForEachCategory.append(indName);

//     // 3️⃣ Click handler for indicator
//     indName.addEventListener('click', async () => {

//       // 3a️⃣ Load countries list
//       const countriesList = await axios
//         .get('../../../src/variable/assets/countriesList.json')
//         .then(res => res.data);

//       // 3b️⃣ Try to match country directly
//       let countryObj = countriesList.find(
//         c => c.name.toLowerCase() === CountryName.toLowerCase()
//       );

//       // 3c️⃣ If not found, translate to English and retry
//       if (!countryObj) {
//         const translatedCountryName = await translateToEnglish(CountryName);
//         countryObj = countriesList.find(
//           c => c.name.toLowerCase() === translatedCountryName.toLowerCase()
//         );
//       }

//       // 3d️⃣ Stop if country still not found
//       if (!countryObj) {
//         console.warn('Country not found:', CountryName);
//         return;
//       }

//       const CountryIdName = countryObj.id;

//       // 4️⃣ Fetch indicator data for that country
//       const indicatorResponse = await axios
//         .get(
//           `${BACKEND_URL}/Macroeconomics/IndicatorData/${indicator.id}/${CountryIdName}?per_page=1000`
//         )
//         .then(res => res.data);

//       // 5️⃣ Render chart
//       HomeGraphs.graphMacronomicIndicators(
//         indicatorResponse[1],
//         `${indicator.name} - ${CountryName}`
//       );

//       setSelectedSeries(`Selected Series: ${indicator.name} - ${CountryName}`);
//     });
//   });
// };


  
//  const obtainCategories = async function(categoriesList) {
//   // 1. Fetch data (simplified with await and destructuring)
//   console.log('run');
//  const response = await axios.get(
//   `${BACKEND_URL}/Macroeconomics/Categories`
// );

// const data = response.data; // FIX

// const valuableIds = new Set([1, 3, 5, 7, 11, 12, 13, 14, 20, 21]);

// const { foundEm, otherInd } = data.reduce(
//   (acc, category) => {
//     if (valuableIds.has(category.id)) {
//       acc.foundEm.push(category);
//     } else {
//       acc.otherInd.push(category);
//     }
//     return acc;
//   },
//   { foundEm: [], otherInd: [] }
// );

//   // 4. Create UI elements for the "Found" categories
//   foundEm.forEach(category => {
//     const catName = document.createElement('button');
//     catName.innerText = category.value;
//     catName.value = category.id;
//     catName.style.width = '150px';
    
//     catName.addEventListener('click', () => obtainIndicators(category.id));
    
//     categoriesList.append(catName);
//   });
//   //   otherInd.forEach(category => {
//   //   const catName = document.createElement('button');
//   //   catName.innerText = category.value;
//   //   catName.value = category.id;
//   //   catName.style.width = '150px';
    
//   //   catName.addEventListener('click', () => obtainIndicators(category.id));
    
//   //   categoriesList.append(catName);
//   // });
// };
// const getMainIndicatorsList = (countryName) => {
// {/***
  
  
 
//   const CountryName = window.location.pathname.split("/")[3]
  
//   const obtainCountriesNews = async function(){}
//   */}
//  }
 
//   return (
//     <div>
//       <center><h3>{CountryName}</h3></center>
//       <div id="countryMap" style={{ height: "480px", width: '500px', position: 'absolute',right: '0px', top:'440px' }}></div>

//       <div className="d-flex flex-row">
//         <div className='d-flex flex-row'>
//           {/* <button onClick={getMainIndicatorsList()}>Indicadores Principales</button> */}

//           {/* <button onClick={() => obtainCategories()}>Todos los indicadores</button>
 
//           <button onClick={() => obtainCountriesNews()}>Noticias</button>  */}
//         </div>
//         <p id='selectedSeries'>{}</p>
        
//       </div>
//       {/* Additional code for other components */}
//       <div className="row">
//         <div className="col-1">
//              <div id='listCategories' className='d-flex flex-column flex-wrap'>
//       </div>
//         </div>
//         <div className="col-6">                      <div id='listForEachCategory' className='m-4 d-flex flex-row flex-wrap'></div>
// </div>
//         <div className="col-3" id='categoryContainer' style={{ height: '300px'}}>
          
//         </div>
//       </div>
   


//     </div>
//   );
// };

// export default MacroeconomiaNacional;




import React, { useEffect, useState } from 'react';
import L from 'leaflet';
import axios from 'axios';
import HomeGraphs from '../../../variable/controllers/HomeControllers/HomeGraphs';
import geoData from '../../../variable/assets/videos/countries.geo.json';

const MacroeconomiaNacional = () => {
  // Extract Country Name from URL
  const pathParts = window.location.pathname.split("/");
  const initialCountry = decodeURIComponent(pathParts[3] || "");

  const [countryName] = useState(initialCountry);
  const [categories, setCategories] = useState([]);
  const [indicators, setIndicators] = useState([]);
  const [selectedSeries, setSelectedSeries] = useState('');

  // 1. Initialize Map
  useEffect(() => {
    const map = L.map('countryMap').setView([0, 0], 2);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

    const feature = geoData.features.find(f =>
      f.properties.name.toLowerCase() === countryName.toLowerCase()
    );
    if (feature) {
      const bounds = L.geoJSON(feature).getBounds();
      map.fitBounds(bounds);
      L.geoJSON(feature, { style: { color: '#0b203f', weight: 2, fillOpacity: 0.1 } }).addTo(map);
    }

    return () => map.remove(); // Cleanup map on unmount
  }, [countryName]);

  // 2. Fetch Categories on Mount
  useEffect(() => {
    const getCats = async () => {
      try {
        const res = await axios.get(`${BACKEND_URL}/Macroeconomics/Categories`);
        const valuableIds = [1, 3, 5, 7, 11, 12, 13, 14, 20, 21];
        const filtered = res.data[1].filter(cat => valuableIds.includes(parseInt(cat.id)));
        setCategories(filtered);
      } catch (err) { console.error("Cats Error", err); }
    };
    getCats();
  }, []);

  // 3. Fetch Indicators for a Category
  const handleCategoryClick = async (id) => {
    const res = await axios.get(`${BACKEND_URL}/Macroeconomics/obtainCategoryListing/${id}`);
    setIndicators(res.data[1] || []);
  };

  // 4. Graph the data
  const handleIndicatorClick = async (indicator) => {
    // ... insert your logic for countriesList.json and translation here ...
    // Final Step:
    // HomeGraphs.graphMacronomicIndicators(data, `${indicator.name} - ${countryName}`);
    setSelectedSeries(`${indicator.name} - ${countryName}`);
  };

  return (
    <div className="container-fluid">
      <center><h3>{countryName}</h3></center>
      
      <div className="row">
        {/* Categories Column */}
        <div className="col-2 d-flex flex-column">
          {categories.map(cat => (
            <button key={cat.id} className="btn btn-outline-primary mb-2" onClick={() => handleCategoryClick(cat.id)}>
              {cat.value}
            </button>
          ))}
        </div>

        {/* Indicators Column */}
        <div className="col-5 d-flex flex-wrap">
          {indicators.map(ind => (
            <button key={ind.id} className="btn btn-sm btn-light m-1" style={{width: '200px'}} onClick={() => handleIndicatorClick(ind)}>
              {ind.name}
            </button>
          ))}
        </div>

        {/* Map Column */}
        <div className="col-5">
           <div id="countryMap" style={{ height: "400px", width: '100%' }}></div>
           <p className="mt-2 text-primary">{selectedSeries}</p>
        </div>
      </div>
    </div>
  );
};

export default MacroeconomiaNacional;