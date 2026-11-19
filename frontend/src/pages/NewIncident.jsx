import { useState } from "react";
import { createIncident } from "../services/api";




function NewIncident() {
  const initialFormData = {
    title: "",
    description: "",
    category: "",
    subcategory: "",
    affected_service: "",
    priority: "P3",
    status: "Open",
  };




  const [formData, setFormData] =
    useState(initialFormData);



  const [message, setMessage] =
    useState("");



  const [messageType, setMessageType] =
    useState("");



  const [isSubmitting, setIsSubmitting] =
    useState(false);




  // ------------------------------------------------
  // Handle Form Changes
  // ------------------------------------------------


  const handleChange = (event) => {
  const { name, value } = event.target;

  setFormData((previousData) => ({
    ...previousData,
    [name]: value,
  }));
};


  // ------------------------------------------------
  // Submit Incident
  // ------------------------------------------------



  const handleSubmit = async (
    event
  ) => {
    event.preventDefault();



    setIsSubmitting(true);
    setMessage("");
    setMessageType("");



    try {
      const incidentPayload = {
        title:
          formData.title.trim(),



        description:
          formData.description.trim(),



        category:
          formData.category.trim(),



        subcategory:
          formData.subcategory.trim() ||
          null,



        affected_service:
          formData.affected_service.trim(),



        priority:
          formData.priority,



        status:
          formData.status,



        // New incidents do not have
        // confirmed RCA/resolution yet.
        root_cause: null,



        resolution: null,
      };




      const createdIncident =
        await createIncident(
          incidentPayload
        );




      setMessage(
        `Incident ${createdIncident.incident_number} created successfully.`
      );



      setMessageType(
        "success"
      );



      setFormData(
        initialFormData
      );



    } catch (error) {
      console.error(
        "Create incident error:",
        error
      );



      setMessage(
        error?.message ||
          "Unable to create incident. Please check the FastAPI server."
      );



      setMessageType(
        "error"
      );



    } finally {
      setIsSubmitting(false);
    }
  };




  // ------------------------------------------------
  // Reset Form
  // ------------------------------------------------



  const handleReset = () => {
    setFormData(
      initialFormData
    );



    setMessage("");
    setMessageType("");
  };




  return (
    <div className="new-incident-page">



      <div className="form-card">



        {/* ====================================== */}
        {/* Header */}
        {/* ====================================== */}



        <div className="form-header">



          <span className="section-eyebrow">
            INCIDENT MANAGEMENT
          </span>



          <h3>
            Create New Incident
          </h3>



          <p>
            Report a new IT incident for
            correlation, root cause analysis
            and ML prediction. The incident
            number will be generated
            automatically.
          </p>



        </div>




        {/* ====================================== */}
        {/* Message */}
        {/* ====================================== */}



        {message && (



          <div
            className={
              `form-message ${messageType}`
            }
          >
            {message}
          </div>



        )}




        {/* ====================================== */}
        {/* Form */}
        {/* ====================================== */}



        <form
          className="incident-form"
          onSubmit={handleSubmit}
          autoComplete="off"
        >



          <div className="form-grid">



            {/* Priority */}



            <div className="form-group">



              <label htmlFor="priority">
                Priority
              </label>



              <select
                id="priority"
                name="priority"
                value={
                  formData.priority
                }
                onChange={
                  handleChange
                }
                disabled={
                  isSubmitting
                }
              >



                <option value="P1">
                  P1 - Critical
                </option>



                <option value="P2">
                  P2 - High
                </option>



                <option value="P3">
                  P3 - Medium
                </option>



                <option value="P4">
                  P4 - Low
                </option>



              </select>



            </div>




            {/* Status */}



            <div className="form-group">



              <label htmlFor="status">
                Status
              </label>



              <select
                id="status"
                name="status"
                value={
                  formData.status
                }
                onChange={
                  handleChange
                }
                disabled={
                  isSubmitting
                }
              >



                <option value="Open">
                  Open
                </option>



                <option value="Investigating">
                  Investigating
                </option>



                <option value="Resolved">
                  Resolved
                </option>



              </select>



            </div>




            {/* Title */}



            <div className="form-group full-width">



              <label htmlFor="title">
                Incident Title
              </label>



              <input
                id="title"
                name="title"
                type="text"
                autoComplete="off"
                placeholder="Example: Users unable to login"
                value={
                  formData.title
                }
                onChange={
                  handleChange
                }
                disabled={
                  isSubmitting
                }
                required
              />



            </div>




            {/* Description */}



            <div className="form-group full-width">



              <label htmlFor="description">
                Description
              </label>



              <textarea
                id="description"
                name="description"
                rows={5}
                autoComplete="off"
                placeholder="Describe the incident symptoms, affected users and impact..."
                value={
                  formData.description
                }
                onChange={
                  handleChange
                }
                disabled={
                  isSubmitting
                }
                required
              />



            </div>




            {/* Category */}



            <div className="form-group">



              <label htmlFor="category">
                Category
              </label>



              <input
                id="category"
                name="category"
                type="text"
                autoComplete="off"
                placeholder="Authentication"
                value={
                  formData.category
                }
                onChange={
                  handleChange
                }
                disabled={
                  isSubmitting
                }
                required
              />



            </div>




            {/* Subcategory */}



            <div className="form-group">



              <label htmlFor="subcategory">
                Subcategory
              </label>



              <input
                id="subcategory"
                name="subcategory"
                type="text"
                autoComplete="off"
                placeholder="Login"
                value={
                  formData.subcategory
                }
                onChange={
                  handleChange
                }
                disabled={
                  isSubmitting
                }
              />



            </div>




            {/* Affected Service */}



            <div className="form-group full-width">



              <label htmlFor="affected_service">
                Affected Service
              </label>



              <input
                id="affected_service"
                name="affected_service"
                type="text"
                autoComplete="off"
                placeholder="Identity Service"
                value={
                  formData.affected_service
                }
                onChange={
                  handleChange
                }
                disabled={
                  isSubmitting
                }
                required
              />



            </div>



          </div>




          {/* ==================================== */}
          {/* Actions */}
          {/* ==================================== */}



          <div className="form-actions">



            <button
              type="button"
              className="secondary-button"
              onClick={
                handleReset
              }
              disabled={
                isSubmitting
              }
            >
              Reset
            </button>




            <button
              type="submit"
              className="new-incident-btn"
              disabled={
                isSubmitting
              }
            >



              {isSubmitting
                ? "Creating..."
                : "Create Incident"}



            </button>



          </div>



        </form>



      </div>



    </div>
  );
}




export default NewIncident;