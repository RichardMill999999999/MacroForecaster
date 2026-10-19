// import axios from "axios";

// // Controller for managing investigations
// const InvestigationsController = {
//   // Show the investigation creation form
//   addInvestigation: function () {
//     document.body.appendChild(InvestigationTemplate);
//   },

//   // Placeholder for opening an existing investigation
//   openInvestigation: async function (id) {
//     // TODO: implement fetching and displaying an existing investigation by ID
//     console.log("Open investigation with ID:", id);
//   },

//   // Save a new investigation
//   saveInvestigation: async function () {
//     // Scope queries to the template container
//     const container = InvestigationTemplate;
//     const name = container.querySelector("#investigationName").value;
//     const dependentVariables = container.querySelector("#dependentVariableSetUp").value;
//     const independentVariables = container.querySelector("#independentVariableSetUp").value;
//     const startDate = container.querySelector("#startDate").value;
//     const endDate = container.querySelector("#endDate").value;

//     // Validate inputs
//     if (!name || !dependentVariables || !independentVariables || !startDate || !endDate) {
//       alert("Please fill in all fields, including dates.");
//       return;
//     }

//     // Prepare the investigation object
//     const investigationData = {
//       name,
//       dependentVariables: dependentVariables.split(",").map(v => v.trim()),
//       independentVariables: independentVariables.split(",").map(v => v.trim()),
//       startDate, // should be in YYYY-MM-DD format
//       endDate,
//     };
//     const investigationSent  = await axios.post(`http://localhost:5000/saveInvestigation/`, investigationData);
//     console.log("Investigation sent:", investigationSent.data);
//     // Log out the data object for sending
//     console.log("Investigation data:", investigationData);

//     // Remove the form from the document
//     InvestigationTemplate.remove();

//     // Return the data object for further handling (e.g., sending via axios)
//     return investigationData;
//   }
// };

// // Create the HTML template for a new investigation form
// const InvestigationTemplate = document.createElement("div");
// InvestigationTemplate.innerHTML = `
//   <div style="position:fixed; top:20%; left:50%; transform:translateX(-50%); background:white; padding:1rem; border:1px solid #ccc; border-radius:8px; box-shadow:0 2px 10px rgba(0,0,0,0.1);" id="investigationFormContainer">
//     <h4>New Investigation Creator</h4>
//     <input id="investigationName" type="text" placeholder="Name" style="display:block; margin-bottom:0.5rem; width:100%;" />
//     <input id="dependentVariableSetUp" type="text" placeholder="Dependent Variable(s) ticker(s), comma-separated" style="display:block; margin-bottom:0.5rem; width:100%;" />
//     <input id="independentVariableSetUp" type="text" placeholder="Independent Variable(s) ticker(s), comma-separated" style="display:block; margin-bottom:0.5rem; width:100%;" />
//     <label for="startDate">Start Date:</label>
//     <input id="startDate" type="date" style="display:block; margin-bottom:0.5rem; width:100%;" />
//     <label for="endDate">End Date:</label>
//     <input id="endDate" type="date" style="display:block; margin-bottom:0.5rem; width:100%;" />
//     <button id="createInvestigationButton" style="padding:0.5rem 1rem;">Create Investigation</button>
//   </div>
// `;

// // Attach event listener to the create button
// InvestigationTemplate.querySelector("#createInvestigationButton").addEventListener("click", async () => {
//   const data = await InvestigationsController.saveInvestigation();
//   // You can now send `data` via axios or handle it further
//   console.log('Returned investigation object:', data);
// });

// export default InvestigationsController;
import axios from "axios";

// Controller for managing investigations
const InvestigationsController = {
  // Show the investigation creation form
  addInvestigation: function () {
    document.body.appendChild(InvestigationTemplate);
  },

  // Placeholder for opening an existing investigation

  // Save a new investigation via Flask route with URL params
  saveInvestigation: async function () {
    const container = InvestigationTemplate;
    const name = container.querySelector("#investigationName").value;
    const depVarsInput = container.querySelector("#dependentVariableSetUp").value;
    const indepVarsInput = container.querySelector("#independentVariableSetUp").value;
    const startDate = container.querySelector("#startDate").value;
    const endDate = container.querySelector("#endDate").value;

    // Validate inputs
    if (!name || !depVarsInput || !indepVarsInput || !startDate || !endDate) {
      alert("Please fill in all fields, including dates.");
      return;
    }

    // Prepare arrays and strings
    const dependentVariables = depVarsInput.split(",").map(v => v.trim());
    const independentVariables = indepVarsInput.split(",").map(v => v.trim());
    const depVarsStr = dependentVariables.join(",");
    const indepVarsStr = independentVariables.join(",");
    const id = Math.random().toString(36).substring(2, 15); // Generate a random ID
    // Build the Flask route URL (all segments must be URI-encoded)
    const url = `http://localhost:5000/saveInvestigation/${encodeURIComponent(name)}/${encodeURIComponent(startDate)}/${encodeURIComponent(endDate)}/${encodeURIComponent(depVarsStr)}/${encodeURIComponent(indepVarsStr)}/${encodeURIComponent(id)}`;

    try {
      const response = await axios.get(url);
      console.log("Investigation saved, server response:", response.data);
      alert("Investigation created successfully!");
    } catch (error) {
      console.error("Error saving investigation:", error);
      alert("Failed to save investigation. Please try again.");
    }

    // Remove the form from the document
    InvestigationTemplate.remove();
  }
};

// Create the HTML template for a new investigation form
const InvestigationTemplate = document.createElement("div");
InvestigationTemplate.innerHTML = `
  <div style="position:fixed; top:20%; left:50%; transform:translateX(-50%); background:white; padding:1rem; border:1px solid #ccc; border-radius:8px; box-shadow:0 2px 10px rgba(0,0,0,0.1);" id="investigationFormContainer">
    <h4>New Investigation Creator</h4>
    <input id="investigationName" type="text" placeholder="Name" style="display:block; margin-bottom:0.5rem; width:100%;" />
    <input id="dependentVariableSetUp" type="text" placeholder="Dependent Variable(s) ticker(s), comma-separated" style="display:block; margin-bottom:0.5rem; width:100%;" />
    <input id="independentVariableSetUp" type="text" placeholder="Independent Variable(s) ticker(s), comma-separated" style="display:block; margin-bottom:0.5rem; width:100%;" />
    <label for="startDate">Start Date:</label>
    <input id="startDate" type="date" style="display:block; margin-bottom:0.5rem; width:100%;" />
    <label for="endDate">End Date:</label>
    <input id="endDate" type="date" style="display:block; margin-bottom:0.5rem; width:100%;" />
    <button id="createInvestigationButton" style="padding:0.5rem 1rem;">Create Investigation</button>
  </div>
`;

// Attach event listener to the create button
InvestigationTemplate.querySelector("#createInvestigationButton").addEventListener("click", InvestigationsController.saveInvestigation);

export default InvestigationsController;
