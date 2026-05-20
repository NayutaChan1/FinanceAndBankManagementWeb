import { useState } from "react";
import Sidebar from "../Component/Sidebar";
import * as XLSX from "xlsx";
import "../Css/UploadFilePage.css";
function UploadFilePage() {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/";
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const setTargetFile = e.target.files?.[0];
    if (setTargetFile) {
      setFile(setTargetFile);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      alert("Please select an Excel file first!");
      return;
    }

    setIsLoading(true);

    try {
      const reader = new FileReader();

      reader.onload = async (e) => {
        if (!e.target || !e.target.result) {
          alert("Failed to read the file. Please try again.");
          setIsLoading(false);
          return;
        }

        const arrayBuffer = e.target.result as ArrayBuffer;

        const data = new Uint8Array(arrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });

        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        console.log("Extracted Data Ready for Backend:", jsonData);

        const token = localStorage.getItem("token");
        const response = await fetch(
          "http://localhost:5555/transactions/upload",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ transactions: jsonData }),
          },
        );

        if (response.ok) {
          alert("File successfully processed and uploaded!");
          setFile(null);
        } else {
          alert("Failed to upload to the backend.");
        }
        setIsLoading(false);
      };
      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error("Error reading file:", error);
      alert("Something went wrong while parsing the file.");
      setIsLoading(false);
    }
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-container">
        <Sidebar activeMenu="uploadfile" />
        <div className="upload-page-wrapper">
          <div className="upload-content">
            <h2>Upload Bank Statement</h2>
            <p>Select your EZMutasi Excel file to analyze your finances.</p>

            <div className="upload-area">
              <input
                type="file"
                className="upload-input"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileChange}
              />
            </div>

            <button
              className="upload-button"
              onClick={handleUpload}
              disabled={!file || isLoading}
            >
              {isLoading ? "Processing..." : "Extract & Upload"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UploadFilePage;
