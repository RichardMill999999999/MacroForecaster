import React from 'react'
import InvestigationsHistory from './InvestigationsHistory'
import InvestigationsController from './controllers/InvestigationsController'
const OnGoingInvestigations = () => {

  return (
    <div>
        <div><h5 className='d-inline'>On going investigations (theories) </h5> <button onClick={InvestigationsController.addInvestigation}>
            +</button></div>
            <InvestigationsHistory />
    
    </div>
  )
}

export default OnGoingInvestigations