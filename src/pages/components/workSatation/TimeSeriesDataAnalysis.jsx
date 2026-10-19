import React from 'react'
import TimeSeriesHistory from '../InitialPanel/TimeSeriesHistory'
import OnGoingInvestigations from './OnGoingInvestigations'
import InvestigationsController from './controllers/InvestigationsController'
const TimeSeriesDataAnalysis = () => {
  return (
    <div className='d-flex flex-d-row'>
        <TimeSeriesHistory />
        {/* <OnGoingInvestigations/> */}
    </div>
  )
}

export default TimeSeriesDataAnalysis