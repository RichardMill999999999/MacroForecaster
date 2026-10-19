import React, { useEffect, useState } from "react";
import L from "leaflet";  // Ensure you import Leaflet
import axios from "axios";
import geojsonData from "../../../variable/assets/videos/countries.geo.json";
const Macroeconomia = () => {
  const [countries, setCountries] = useState([]); // Store the country names

  // Sample GeoJSON Data (replace this with actual GeoJSON data for countries)
  useEffect(() => {
    // Initialize map first
    const map = L.map('worldMap', {
      center: [20, 0],  // Center at latitude 20, longitude 0
      zoom: 2,          // Initial zoom level
      minZoom: 2,       // Set the minimum zoom level
      maxZoom: 18       // You can adjust the maximum zoom level if needed
    });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);
    
    // Add countryData to map with correct GeoJSON structure
    L.geoJSON(geojsonData, {
          style: function (feature) {
            return {
              color: '#ffffff',
              weight: 2,
              opacity: 1,
              fillOpacity: 0.7,
              fillColor: '#718e7d',
            };
          },
          onEachFeature: function (feature, layer) {
            // Optionally bind popup info from the GeoJSON properties
            if (feature.properties && feature.properties.name) {
              layer.bindPopup(`<strong>Country:</strong> ${feature.properties.name}`);
            }
            // Add click event for navigation
            layer.on('click', function () {
              window.location.href = "/Macroeconomia/Country/" + feature.properties.name;
              //check country selected 
   
            });
          },
    }).addTo(map);
  
    // Extract country names and update state
    const countryNames = geojsonData.features.map((feature) => feature.properties.name);
    setCountries(countryNames);






  }, []);
  
  return (
    <div>

      
      <div style={{ height: "100px" }}>
        <center>
        </center>
      </div>
      <center>
      <div id="worldMap" style={{ height: "500px", width: '1000px' }}></div>
</center>
      <div>
       
        {/* <iframe
          src="https://www.inegi.org.mx/widgets/tendencias/default.html"
          height="590"
          width="900"
          title="Tendencias INEGI"
        ></iframe>
      */}
      </div>

      {/* Section for dynamically generated country buttons */}
      {/* <div style={{ marginTop: "20px" }}>
        <h4>Select a Country:</h4>
        {countries.map((country, index) => (
          <button
            key={index}
            onClick={() => window.location.href = `/economic-news/${country}`}
            style={{ margin: "5px", padding: "10px", cursor: "pointer" }}
          >
            {country}
          </button>
        ))}
      </div> */}
    </div>
  );
};

export default Macroeconomia;
