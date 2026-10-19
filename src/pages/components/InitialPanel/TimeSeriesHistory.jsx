import React, { useState, useEffect } from "react";
import axios from "axios";
import { NavLink } from "react-router-dom";

const TimeSeriesHistory = () => {
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await axios.get("http://localhost:5000/history/getHistory");
        setHistoryData(response.data);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  return (
    <div id="TSHistoryContainer" className="container">
   <div className="row">
    {/* <div className="col-6">   <h5>Undervalued</h5>

      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p>Error: {error.message}</p>
      ) : historyData.length === 0 ? (
        <p>Nothing to display.</p>
      ) : (
        <ul className="list-group">
          {historyData.map((item, index) => (
            <li
              key={`${item.ticker}-${item.startDate}-${item.endDate}-${index}`}
              className="list-group-item d-flex justify-content-between align-items-center"
            >
              <div>
                <div><strong>Ticker:</strong> {item.ticker}</div>
                <div>
                  <strong>Date Range:</strong> {item.startDate} to {item.endDate}
                </div>
              </div>
              <NavLink
                to={`/savedTimeSeries/${encodeURIComponent(item.ticker)}/${item.startDate}/${item.endDate}`}
                className="btn btn-sm btn-primary"
              >
                Load
              </NavLink>
            </li>
          ))}
        </ul>
      )}</div> */}
    <div className="col-12">
         <h5>Commodities Prices</h5>

      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p>Error: {error.message}</p>
      ) : historyData.length === 0 ? (
        <p>Nothing to display.</p>
      ) : (
        <ul className="list-group">
          {historyData.map((item, index) => (
            <li
              key={`${item.ticker}-${item.startDate}-${item.endDate}-${index}`}
              className="list-group-item d-flex justify-content-between align-items-center"
            >
              <div>
                <div><strong>Ticker:</strong> {item.ticker}</div>
                <div>
                  <strong>Date Range:</strong> {item.startDate} to {item.endDate}
                </div>
              </div>
              <NavLink
                to={`/savedTimeSeries/${encodeURIComponent(item.ticker)}/${item.startDate}/${item.endDate}`}
                className="btn btn-sm btn-primary"
              >
                Load
              </NavLink>
            </li>
          ))}
        </ul>
      )}
    </div>
   </div>
    </div>
  );
};

export default TimeSeriesHistory;
