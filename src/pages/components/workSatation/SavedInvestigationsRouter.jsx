import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const SavedInvestigationsRouter = () => {
  const { invId } = useParams();
  const [investigation, setInvestigation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchInvestigation = async () => {
      try {
        // Fetch single investigation by ID
        const response = await axios.get(`http://localhost:5000/getInvestigation/${invId}`);
        setInvestigation(response.data);
      } catch (err) {
        // Fallback: fetch all and filter
        try {
          const all = await axios.get('http://localhost:5000/getInvestigations');
          const found = all.data.find(item => item._id === invId || item.id === invId);
          setInvestigation(found || null);
        } catch (innerErr) {
          setError(innerErr);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchInvestigation();
  }, [invId]);

  if (loading) return <p>Loading investigation...</p>;
  if (error) return <p>Error: {error.message}</p>;
  if (!investigation) return <p>Investigation not found.</p>;

  const { name, startDate, endDate, dependentVariables, independentVariables } = investigation;

  return (
    <div className="container">
      <h2>{name}</h2>
      <p>
        Date range: <strong>{startDate}</strong> &ndash; <strong>{endDate}</strong>
      </p>
      <div>
        <h4>Dependent Variable(s)</h4>
        <ul>
          {dependentVariables.map((v, i) => (
            <li key={i}>{v}</li>
          ))}
        </ul>
      </div>
      <div>
        <h4>Independent Variable(s)</h4>
        <ul>
          {independentVariables.map((v, i) => (
            <li key={i}>{v}</li>
          ))}
        </ul>
      </div>
      {/* Add your investigation display here */}
      <div id="investigationDetails"></div>
    </div>
  );
};

export default SavedInvestigationsRouter;
