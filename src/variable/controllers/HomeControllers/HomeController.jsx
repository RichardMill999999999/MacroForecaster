import { BACKEND_URL } from "../../../apiUrl.js";
import React from "react";
import axios, { all } from "axios";
import { useState } from "react";
import HomeGraphs from "./HomeGraphs";

const HomeController =  {
   
  // Set the initial rangeDates
  searchAndGraph:  async function searchAndGraph(prop='') {
    let searchValue = ''
    if (prop !== ''){
      searchValue = prop
    }else{ searchValue = document.getElementById("searchEntry").value;}
    var months = {};
    if (searchValue !== "") {
      const startDate = document.getElementById("startDate").value;
      const endDate = document.getElementById("endDate").value;
  
      const data = await axios.get(
        `${BACKEND_URL}/getData/${searchValue}/${startDate}/${endDate}`
      );
      localStorage.setItem('IndividualTicker',data.data.ticker)

      localStorage.setItem('functionsTicker',data.data.ticker)

      var tempArray = [];
      var dates = [];
      const timeSeries = { dates: dates, datos: tempArray };
      if (data) {
        const printResponse = document.getElementById("printTickerInfo");
        printResponse.classList.add("row");
        printResponse.innerHTML = "";
        for (var attr in data.data) {
          if ( attr === "ticker" || attr === "status") {
            const colContainerDiv = document.createElement("div");
            colContainerDiv.classList.add("col-6");
            const colContainerDiv2 = document.createElement("div");
            colContainerDiv2.classList.add("col-6");
            let infoPrinterTitle = document.createElement("h6");
            let infoPrinterInfo = document.createElement("p");
            colContainerDiv.append(infoPrinterTitle);
            colContainerDiv2.append(infoPrinterInfo);
            infoPrinterTitle.innerText = attr;
            infoPrinterInfo.innerText = data.data[attr];
            printResponse.append(colContainerDiv, colContainerDiv2);
          }
        }
        data.data.results.map((obj) => {
          tempArray.push(obj.c);
          var date = new Date(obj.t);
          var formattedDate = `${date.getFullYear()}/${(date.getMonth() + 1)
            .toString()
            .padStart(2, "0")}/${date.getDate().toString().padStart(2, "0")}`;
          dates.push(formattedDate);
        });
        localStorage.setItem('timeSeries',timeSeries.datos)
        HomeGraphs.graphScript(timeSeries,`${searchValue} from ${startDate} to ${endDate} `)
        //   var years = {};
        //   dates.forEach((date) => {
        //     var year = date.slice(0, 4);
        //     if (!years[year]) {
        //       years[year] = [];
        //     }
        //     years[year].push(date);
        //   });

        //   // Generate HTML for table
        //   for (var year in years) {
        //     var yearRow = document.createElement("tr");
        //     var yearCell = document.createElement("td");
        //     yearCell.textContent = year;
        //     yearRow.appendChild(yearCell);
        //     yearCell.classList.add("clickable-element");

        //     var monthCell = document.createElement("td");
        //     var monthList = document.createElement("ul");
        //     monthCell.appendChild(monthList);
        //     yearRow.appendChild(monthCell);
        //     monthList.classList.add("clickable-element");

        //     var dayCell = document.createElement("td");
        //     var dayList = document.createElement("ul");
        //     dayList.id = `daysOfmonthIn${year}`;
        //     dayCell.appendChild(dayList);
        //     yearRow.appendChild(dayCell);

        //     var valueCell = document.createElement("td");
        //     var valueList = document.createElement("ul");
        //     valueCell.appendChild(valueList);
        //     yearRow.appendChild(valueCell);
        //     valueList.id = `valuesOfmonthIn${year}`;

        //     yearRow.classList.add("year");

        //     monthCell.classList.add("month");
        //     dayCell.classList.add("day");

        //     // // Group dates by month

        //     months[year] = new Set();
        //     years[year].forEach((dateObj) => {
        //       if (typeof dateObj === "string") {
        //         var month = dateObj.slice(5, 7);
        //         months[year].add(month);
        //       }
        //     });
        //     dateTableBody.appendChild(yearRow);
        //   }
        //   for (var year in years) {
        //     console.log(year);
        //     console.log(months[year]);

        //     months[year].forEach((month) => {
        //       var monthItem = document.createElement("li");

        //       monthItem.textContent = month;
        //       monthItem.classList.add("month");
        //       monthItem.style.cursor = "pointer";
        //       monthItem.id = `${year}/${month}`;

        //       monthItem.addEventListener("click", function (e) {
        //         const selectedMonth = e.target;
        //         let monthlyValues = [];
        //         const monthDaysList = document.createElement("ul");
        //         const daysAndValues = [
        //           document.getElementById(
        //             `daysOfmonthIn${selectedMonth.id.slice(0, 4)}`
        //           ),
        //           document.getElementById(
        //             `valuesOfmonthIn${selectedMonth.id.slice(0, 4)}`
        //           ),
        //         ];
        //         daysAndValues.map((element) => {
        //           while (element.firstChild)
        //             element.removeChild(element.firstChild);
        //         });

        //         const monthlyValuesDiv = document.createElement("ul");
        //         timeSeries.dates.map((dates) => {
        //           if (typeof dates === "string") {
        //             const dateMonth = dates.slice(0, 7);
        //             if (dateMonth === selectedMonth.id) {
        //               let index = timeSeries.dates.indexOf(dates);
        //               const dayInMonth = document.createElement("li");
        //               dayInMonth.innerText = dates.slice(8);
        //               monthDaysList.appendChild(dayInMonth);
        //               const valueInDate = document.createElement("li");
        //               valueInDate.innerText = timeSeries.datos[index];
        //               monthlyValuesDiv.appendChild(valueInDate);
        //             }
        //           }
        //         });
        //         document
        //           .getElementById(
        //             `daysOfmonthIn${selectedMonth.id.slice(0, 4)}`
        //           )
        //           .appendChild(monthDaysList);
        //         document
        //           .getElementById(
        //             `valuesOfmonthIn${selectedMonth.id.slice(0, 4)}`
        //           )
        //           .appendChild(monthlyValuesDiv);
        //       });
        //       monthList.appendChild(monthItem);
        //     });

        // }
      }
    }
  },
  individualSearch:async function individualSearch(prop = '') {


      console.log('individualSearch')  // Fixed the window.onload assignment
        let searchValue = document.getElementById("searchEntry")
      searchValue = searchValue.value

        if (searchValue !== "") {
            const startDate = document.getElementById("startDate").value;
            const endDate = document.getElementById("endDate").value;
            const data = await axios.get(`${BACKEND_URL}/getData/${searchValue}/${startDate}/${endDate}`);

            let tempArray = [];
            let dates = [];
            let timestamps = [];
            const timeSeries = { dates: dates, datos: tempArray, ticker: searchValue, startDate: startDate, endDate: endDate };

            if (data) {
                const printResponse = document.getElementById("printTickerInfo");
                printResponse.classList.add("row");
                printResponse.innerHTML = "";

                for (let attr in data.data) {
                    if (attr === "ticker" || attr === "status") {
                        const colContainerDiv = document.createElement("div");
                        colContainerDiv.classList.add("col-6");
                        const colContainerDiv2 = document.createElement("div");
                        colContainerDiv2.classList.add("col-6");
                        let infoPrinterTitle = document.createElement("h6");
                        let infoPrinterInfo = document.createElement("p");
                        colContainerDiv.append(infoPrinterTitle);
                        colContainerDiv2.append(infoPrinterInfo);
                        infoPrinterTitle.innerText = attr;
                        infoPrinterInfo.innerText = data.data[attr];
                        printResponse.append(colContainerDiv, colContainerDiv2);
                    }
                }

                data.data.results.forEach((obj) => {
                    tempArray.push(obj.c);
                    let timestamp = obj.t;
                    timestamps.push(timestamp);

                    let date = new Date(timestamp);
                    let formattedDate = `${date.getFullYear()}/${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getDate().toString().padStart(2, "0")}`;
                    dates.push(formattedDate);
                });

                localStorage.setItem('timeSeries', JSON.stringify(timeSeries.datos));
                HomeGraphs.graphScript(timeSeries, `${searchValue} from ${startDate} to ${endDate}`);
                localStorage.setItem('lastCall', 'individual');

                try {
                    timeSeries['timestamps'] = timestamps;
                    console.log(timeSeries);
                    await axios.post(`${BACKEND_URL}/history/saveData`, timeSeries, {
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    });
                } catch (error) {
                    console.error('Error saving data to history:', error);
                }
            }
        }
    
}

 ,
  getTickers:async function getTickers() {
    const searchValue = document.getElementById('searchTicker').value
    const marketType = document.getElementById('marketType').value
    let tickers = {}
    if (marketType !== ''){
       tickers = await axios.get(
        `${BACKEND_URL}/getTickersByTypes/us/stock/${searchValue}/${marketType}`
      );
    }else{
       tickers = await axios.get(
        `${BACKEND_URL}/getTickers/${searchValue}`
      );
    }
    const subCategorySelector = document.getElementById("subCategorySelector");
    // Create a table element
const table = document.createElement('table');

// Create a table header row
const headerRow = table.insertRow();
const nameHeader = headerRow.insertCell();
const marketHeader = headerRow.insertCell();
const primaryExchangeHeader = headerRow.insertCell();
const tickerHeader = headerRow.insertCell();
const activeHeader = headerRow.insertCell();
nameHeader.textContent = 'Name';
marketHeader.textContent = 'Market';
primaryExchangeHeader.textContent = 'Primary Exchange';
tickerHeader.textContent = 'Ticker';
activeHeader.textContent = 'Active';

// Create additional rows and cells
tickers.data.results.map((result)=>{
  const row = table.insertRow();
  const nameHeader = row.insertCell();

const marketHeader = row.insertCell();
const primaryExchangeHeader = row.insertCell();
const tickerHeader = row.insertCell();
const activeHeader = row.insertCell();
nameHeader.textContent = result.name
  marketHeader.textContent = result.market;
  primaryExchangeHeader.textContent = result.primary_exchange
  activeHeader.textContent = result.active.toString()
  tickerHeader.textContent = result.ticker
})
// Append the table to the document body or another element
document.getElementById('searchTable').innerHTML = ''
document.getElementById('searchTable').appendChild(table);
  
  },
  addDVariable: async function addDVariable(){
    const variablesSetUp = document.getElementById('dependentVariableSetUp')

    const newDependentV = document.createElement('input')
    newDependentV.type = 'text'
    newDependentV.classList.add('dependentVariable')
    variablesSetUp.append(newDependentV)
  },
  addIVariable: async function addIVariable(){
    const variablesSetUp = document.getElementById('independentVariableSetUp')

    const newDependentV = document.createElement('input')
    newDependentV.type = 'text'
    newDependentV.classList.add('dependentVariable')
    variablesSetUp.append(newDependentV)
  }
,
saveVariables: async function(){
  const dependentVariables = document.getElementsByClassName('dependentVariable')
  const independentVariables = document.getElementsByClassName('independentVariable')
  const MultiDependentVarTickers = []
  for(let i = 0; i < dependentVariables.length; i++){
    MultiDependentVarTickers.push(dependentVariables[i].value)
    HomeController.searchAndGraph(dependentVariables[i].value)
  }
const MultiIndependentVarTickers = []
  for(let i = 0; i < independentVariables.length; i++){
    MultiIndependentVarTickers.push(independentVariables[i].value)
    HomeController.searchAndGraph(independentVariables[i].value)
  }
  localStorage.setItem(`MultiDependentVarTickers`,MultiDependentVarTickers)
  localStorage.setItem(`MultiIndependentVarTickers`,MultiIndependentVarTickers)
  const allTickers = MultiIndependentVarTickers.concat(MultiDependentVarTickers)
  localStorage.setItem(`allTickers`,allTickers)

  localStorage.setItem(`lastCall`,'multiple')

}
};
export default HomeController;
