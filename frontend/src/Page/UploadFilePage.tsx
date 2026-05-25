import { useState } from "react";
import Sidebar from "../Component/Sidebar";
import * as XLSX from "xlsx";
import "../Css/UploadFilePage.css";
import "../Css/FinancialDashboard.css";
type DateFormat = 'DMY' | 'MDY';

function UploadFilePage() {
  const currentYear = new Date().getFullYear();
  const [file, setFile] = useState<File | null>(null);
  const [year, setYear] = useState<number>(currentYear);
  const [dateFormat, setDateFormat] = useState<DateFormat>('DMY');
  const [isLoading, setIsLoading] = useState(false);

  const yearOptions = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);

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
            body: JSON.stringify({ transactions: jsonData, year, dateFormat }),
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

            <div className="upload-year-field">
              <label htmlFor="upload-year" className="upload-year-label">
                Statement Year
              </label>
              <select
                id="upload-year"
                className="upload-year-select"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <div className="upload-year-field">
              <label htmlFor="upload-date-format" className="upload-year-label">
                Date Format in Excel
              </label>
              <select
                id="upload-date-format"
                className="upload-year-select"
                value={dateFormat}
                onChange={(e) => setDateFormat(e.target.value as DateFormat)}
              >
                <option value="DMY">DD/MM (day first — Indonesian / EZMutasi)</option>
                <option value="MDY">MM/DD (month first — US format)</option>
              </select>
            </div>

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
