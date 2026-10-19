
import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { NavLink } from 'react-router-dom'

const InvestigationsHistory = () => {
  const [investigationsHistory, setInvestigationsHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchInvestigationsHistory = async () => {
      try {
        const response = await axios.get('http://localhost:5000/getInvestigations')
        setInvestigationsHistory(response.data)
      } catch (error) {
        setError(error)
      } finally {
        setLoading(false)
      }
    }

    fetchInvestigationsHistory()
  }, [])

  if (loading) return <p>Loading...</p>
  if (error) return <p>Error: {error.message}</p>

  return (
    <div>
      <h5 className='d-inline'>Investigations History</h5>

      {investigationsHistory.length === 0 ? (
        <p>No investigations found.</p>
      ) : (
        <ul>
          {investigationsHistory.map((inv) => (
            <li key={inv._id || inv.id} className='d-flex justify-content-between align-items-center'>
              <div>
                {inv.name} - {inv.startDate} to {inv.endDate}
              </div>
              <NavLink
                to={`/savedInvestigation/${encodeURIComponent(inv._id || inv.id)}/${inv.startDate}/${inv.endDate}`}
                className='btn btn-sm btn-primary'
              >
                Open
              </NavLink>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default InvestigationsHistory
