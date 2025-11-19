import { useState, useEffect } from "react";
import axios from "axios";

const FileUploadCard = ({ onUploadSuccess }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState("trend-v1");

  useEffect(() => {
    // Fetch available models
    axios.get("http://localhost:8000/api/v1/price/models")
      .then(response => {
        setModels(response.data.models || []);
      })
      .catch(error => {
        console.error("Failed to load models:", error);
      });
  }, []);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.name.endsWith(".xlsx") || selectedFile.name.endsWith(".xls")) {
        setFile(selectedFile);
        setMessage("");
      } else {
        setMessage("Please select an Excel file (.xlsx or .xls)");
        setFile(null);
      }
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage("Please select a file first");
      return;
    }

    setUploading(true);
    setMessage("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("forecast_days", 60);
      formData.append("model_id", selectedModel);

      const response = await axios.post(
        "http://localhost:8000/api/v1/price/upload-and-forecast",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data"
          }
        }
      );

      setMessage("File uploaded and forecast generated successfully!");
      setFile(null);
      if (onUploadSuccess) onUploadSuccess(response.data);
    } catch (error) {
      setMessage(`Error: ${error.response?.data?.message || error.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      style={{
        background: "#ffffff",
        padding: "1.5rem",
        borderRadius: "12px",
        border: "2px solid #e5e7eb",
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)"
      }}
    >
      <h3 style={{ marginTop: 0, color: "#dc2626" }}>Upload Data & Run Forecast</h3>
      <p style={{ color: "#6b7280", fontSize: "0.875rem", marginBottom: "1rem" }}>
        Upload an Excel file (raw_2025.xlsx) to generate a new forecast
      </p>

      <div style={{ display: "grid", gap: "1rem" }}>
        <div>
          <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600, color: "#991b1b" }}>
            Select Forecasting Model
          </label>
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            style={{
              width: "100%",
              padding: "0.75rem",
              border: "2px solid #e5e7eb",
              borderRadius: "8px",
              fontSize: "0.875rem",
              cursor: "pointer",
              background: "#ffffff"
            }}
          >
            {models.map(model => (
              <option key={model.id} value={model.id}>
                {model.name} ({model.type})
              </option>
            ))}
          </select>
          {models.find(m => m.id === selectedModel)?.description && (
            <p style={{ fontSize: "0.75rem", color: "#6b7280", marginTop: "0.25rem", marginBottom: 0 }}>
              {models.find(m => m.id === selectedModel).description}
            </p>
          )}
        </div>

        <div>
          <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600, color: "#991b1b" }}>
            Upload Excel File
          </label>
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            style={{
              width: "100%",
              padding: "0.5rem",
              border: "2px solid #e5e7eb",
              borderRadius: "8px",
              fontSize: "0.875rem",
              cursor: "pointer"
            }}
          />
        </div>

        {file && (
          <p style={{ color: "#059669", fontSize: "0.875rem", margin: 0, fontWeight: 600 }}>
            ✓ Selected: {file.name}
          </p>
        )}

        <button
          onClick={handleUpload}
          disabled={uploading || !file}
          style={{
            background: uploading || !file ? "#fecaca" : "#dc2626",
            color: "#ffffff",
            padding: "0.75rem 1.5rem",
            border: "none",
            borderRadius: "8px",
            fontSize: "1rem",
            fontWeight: "600",
            cursor: uploading || !file ? "not-allowed" : "pointer",
            transition: "background 0.2s"
          }}
          onMouseEnter={(e) => {
            if (!uploading && file) e.target.style.background = "#991b1b";
          }}
          onMouseLeave={(e) => {
            if (!uploading && file) e.target.style.background = "#dc2626";
          }}
        >
          {uploading ? "Uploading & Forecasting..." : "Upload & Generate Forecast"}
        </button>

        {message && (
          <p
            style={{
              padding: "0.75rem",
              borderRadius: "8px",
              background: message.includes("Error") ? "#fee2e2" : "#d1fae5",
              color: message.includes("Error") ? "#991b1b" : "#065f46",
              fontSize: "0.875rem",
              margin: 0
            }}
          >
            {message}
          </p>
        )}
      </div>
    </div>
  );
};

export default FileUploadCard;
