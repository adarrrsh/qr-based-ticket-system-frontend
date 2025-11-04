import React, { useState, useEffect, useRef } from "react";
import {
  Camera,
  Check,
  X,
  Ticket,
  Users,
  Search,
  StopCircle,
} from "lucide-react";

const QRTicketSystem = () => {
  const [activeTab, setActiveTab] = useState("scan");
  const [scanResult, setScanResult] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [scannerError, setScannerError] = useState(null);
  const scannerRef = useRef(null);
  const html5QrCodeRef = useRef(null);

  // Mock database of tickets (in production, this comes from MongoDB via API)
  const [tickets] = useState([
    {
      id: "STU-2024-001",
      qrCode: "QR-abc123xyz",
      studentName: "Rahul Kumar",
      email: "rahul@student.edu",
      rollNumber: "CS21B001",
      status: "valid",
      generatedAt: "2024-11-01T10:00:00",
      scannedAt: null,
    },
    {
      id: "STU-2024-002",
      qrCode: "QR-def456uvw",
      studentName: "Priya Sharma",
      email: "priya@student.edu",
      rollNumber: "CS21B002",
      status: "used",
      generatedAt: "2024-11-01T10:05:00",
      scannedAt: "2024-11-04T09:30:00",
    },
    {
      id: "STU-2024-003",
      qrCode: "QR-ghi789rst",
      studentName: "Amit Patel",
      email: "amit@student.edu",
      rollNumber: "CS21B003",
      status: "valid",
      generatedAt: "2024-11-01T10:10:00",
      scannedAt: null,
    },
  ]);

  const [ticketStatuses, setTicketStatuses] = useState(
    tickets.reduce((acc, ticket) => {
      acc[ticket.id] = ticket.status;
      return acc;
    }, {})
  );

  // Initialize QR Scanner
  const startScanner = async () => {
    try {
      setScannerError(null);
      setIsScanning(true);

      // Dynamically import the library
      const Html5Qrcode = (await import("html5-qrcode")).Html5Qrcode;

      const html5QrCode = new Html5Qrcode("qr-reader");
      html5QrCodeRef.current = html5QrCode;

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      };

      await html5QrCode.start(
        { facingMode: "environment" }, // Use back camera
        config,
        onScanSuccess,
        onScanFailure
      );
    } catch (err) {
      console.error("Scanner error:", err);
      setScannerError("Could not start camera. Please check permissions.");
      setIsScanning(false);
    }
  };

  // Stop QR Scanner
  const stopScanner = async () => {
    if (html5QrCodeRef.current && isScanning) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
        setIsScanning(false);
      } catch (err) {
        console.error("Error stopping scanner:", err);
      }
    }
  };

  // Handle successful QR scan
  const onScanSuccess = (decodedText, decodedResult) => {
    console.log("QR Code detected:", decodedText);

    // Extract ticketId from QR code data
    let ticketId;
    try {
      // If QR contains JSON data
      const qrData = JSON.parse(decodedText);
      ticketId = qrData.ticketId;
    } catch (e) {
      // If QR contains plain text (ticketId directly)
      ticketId = decodedText;
    }

    // Stop scanner and verify ticket
    stopScanner();
    verifyTicket(ticketId);
  };

  const onScanFailure = (error) => {
    // This is called frequently while scanning, so we don't log it
  };

  // Cleanup on unmount or tab change
  useEffect(() => {
    return () => {
      if (html5QrCodeRef.current && isScanning) {
        stopScanner();
      }
    };
  }, []);

  // Verify ticket (call backend API in production)
  const verifyTicket = async (identifier) => {
    try {
      console.log("🔍 Verifying ticket:", identifier);

      // Call backend API
      const response = await fetch("http://localhost:3000/api/tickets/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId: identifier }),
      });

      const data = await response.json();
      console.log("📡 API Response:", data);

      // Handle API response
      if (!response.ok) {
        // Handle error responses (404, 400, etc.)
        setScanResult({
          success: false,
          message: data.message || "Verification Failed",
          details: data.message || "Unable to verify ticket",
          ticket: data.ticket || null,
        });
        return;
      }

      // Success response
      if (data.success) {
        setScanResult({
          success: true,
          message: "Entry Approved ✓",
          details: "Student verified successfully",
          ticket: {
            id: data.ticket.id,
            studentName: data.ticket.studentName,
            rollNumber: data.ticket.rollNumber,
            email: data.ticket.email,
            eventName: data.ticket.eventName,
            status: "used",
            scannedAt: data.ticket.scannedAt,
          },
        });
      } else {
        setScanResult({
          success: false,
          message: data.message || "Verification Failed",
          details: data.message || "Unable to verify ticket",
          ticket: data.ticket || null,
        });
      }
    } catch (error) {
      console.error("❌ Verification error:", error);
      setScanResult({
        success: false,
        message: "Connection Error",
        details: "Unable to connect to server. Please check your connection.",
        ticket: null,
      });
    }
  };

  const stats = {
    total: tickets.length,
    used: Object.values(ticketStatuses).filter((s) => s === "used").length,
    valid: Object.values(ticketStatuses).filter((s) => s === "valid").length,
  };

  const filteredTickets = tickets.filter(
    (ticket) =>
      ticket.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.rollNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50 p-4">
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Student Event Entry System
          </h1>
          <p className="text-gray-600">
            Scan QR codes to verify student tickets
          </p>
        </header>

        {/* Stats Cards */}

        {/* Navigation Tabs */}
        <div className="flex gap-2 mb-6 bg-white rounded-lg p-1 shadow">
          <button
            onClick={() => {
              setActiveTab("scan");
              setScanResult(null);
              if (isScanning) stopScanner();
            }}
            className={`flex-1 py-3 px-4 rounded-md font-medium transition-all ${
              activeTab === "scan"
                ? "bg-blue-500 text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <Camera className="inline mr-2" size={20} />
            Scan Entry
          </button>
          {/* <button
            onClick={() => {
              setActiveTab("list");
              if (isScanning) stopScanner();
            }}
            className={`flex-1 py-3 px-4 rounded-md font-medium transition-all ${
              activeTab === "list"
                ? "bg-blue-500 text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <Ticket className="inline mr-2" size={20} />
            All Tickets
          </button> */}
        </div>

        {/* Scan Tab */}
        {activeTab === "scan" && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-6 text-gray-800 flex items-center gap-2">
              <Camera className="text-blue-500" />
              Verify Student Entry
            </h2>

            {/* QR Scanner */}
            <div className="mb-6">
              <div
                className="bg-gray-900 rounded-lg overflow-hidden mb-4"
                style={{ minHeight: "300px" }}
              >
                {!isScanning ? (
                  <div className="flex items-center justify-center h-64 bg-gray-800">
                    <button
                      onClick={startScanner}
                      className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-4 px-8 rounded-lg transition-colors flex items-center gap-2"
                    >
                      <Camera size={24} />
                      Start Camera Scanner
                    </button>
                  </div>
                ) : (
                  <div>
                    <div id="qr-reader" className="w-full"></div>
                    <div className="bg-gray-800 p-3 flex justify-center">
                      <button
                        onClick={stopScanner}
                        className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-6 rounded-lg transition-colors flex items-center gap-2"
                      >
                        <StopCircle size={20} />
                        Stop Scanner
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {scannerError && (
                <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4 mb-4">
                  <p className="text-red-700 text-sm">{scannerError}</p>
                  <p className="text-red-600 text-xs mt-2">
                    💡 Make sure you've granted camera permissions
                  </p>
                </div>
              )}

              <p className="text-sm text-gray-600 text-center">
                📱 Point your camera at the QR code to scan automatically
              </p>
            </div>

            {/* Manual Entry Fallback */}
            <div className="mb-6 pt-6 border-t border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Or Enter Ticket Details Manually
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  id="manualInput"
                  className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
                  placeholder="Enter Ticket ID, Roll Number, or Email"
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      const input = e.target.value;
                      if (input) {
                        verifyTicket(input);
                        e.target.value = "";
                      }
                    }
                  }}
                />
                <button
                  onClick={() => {
                    const input = document.getElementById("manualInput");
                    if (input.value) {
                      verifyTicket(input.value);
                      input.value = "";
                    }
                  }}
                  className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-8 rounded-lg transition-colors"
                >
                  Verify
                </button>
              </div>
            </div>

            {/* Quick Test Buttons */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                Quick Test (Demo)
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {tickets.map((ticket) => (
                  <button
                    key={ticket.id}
                    onClick={() => verifyTicket(ticket.id)}
                    className={`p-3 rounded-lg text-left text-sm transition-all ${
                      ticketStatuses[ticket.id] === "used"
                        ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                        : "bg-blue-50 text-blue-700 hover:bg-blue-100 border-2 border-blue-200"
                    }`}
                    disabled={ticketStatuses[ticket.id] === "used"}
                  >
                    <div className="font-semibold">{ticket.studentName}</div>
                    <div className="text-xs opacity-75">{ticket.id}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Scan Result */}
            {scanResult && (
              <div
                className={`p-8 rounded-xl border-4 ${
                  scanResult.success
                    ? "bg-green-50 border-green-500"
                    : "bg-red-50 border-red-500"
                } animate-in`}
              >
                <div className="flex items-start gap-6">
                  <div
                    className={`p-4 rounded-full ${
                      scanResult.success ? "bg-green-500" : "bg-red-500"
                    }`}
                  >
                    {scanResult.success ? (
                      <Check className="text-white" size={32} />
                    ) : (
                      <X className="text-white" size={32} />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3
                      className={`text-3xl font-bold mb-2 ${
                        scanResult.success ? "text-green-800" : "text-red-800"
                      }`}
                    >
                      {scanResult.message}
                    </h3>
                    <p
                      className={`text-lg mb-4 ${
                        scanResult.success ? "text-green-700" : "text-red-700"
                      }`}
                    >
                      {scanResult.details}
                    </p>
                    {scanResult.ticket && (
                      <div className="bg-white rounded-lg p-4 space-y-2">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-gray-500 uppercase">
                              Student Name
                            </p>
                            <p className="font-semibold text-gray-800">
                              {scanResult.ticket.studentName}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 uppercase">
                              Roll Number
                            </p>
                            <p className="font-semibold text-gray-800">
                              {scanResult.ticket.rollNumber}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 uppercase">
                              Email
                            </p>
                            <p className="font-semibold text-gray-800">
                              {scanResult.ticket.email}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 uppercase">
                              Ticket ID
                            </p>
                            <p className="font-semibold text-gray-800">
                              {scanResult.ticket.id}
                            </p>
                          </div>
                        </div>
                        {scanResult.ticket.scannedAt && (
                          <div className="pt-2 border-t mt-2">
                            <p className="text-xs text-gray-500">
                              Scanned at:{" "}
                              {new Date(
                                scanResult.ticket.scannedAt
                              ).toLocaleString()}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                    <button
                      onClick={() => {
                        setScanResult(null);
                        if (!isScanning) startScanner();
                      }}
                      className="mt-4 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
                    >
                      Scan Next Ticket
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* All Tickets Tab */}
        {activeTab === "list" && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">
                All Student Tickets
              </h2>
              <div className="flex items-center gap-2">
                <Search className="text-gray-400" size={20} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Search students..."
                />
              </div>
            </div>

            {filteredTickets.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Users size={48} className="mx-auto mb-4 opacity-50" />
                <p>No tickets found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      ticketStatuses[ticket.id] === "used"
                        ? "bg-gray-50 border-gray-300"
                        : "bg-green-50 border-green-300"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-bold text-lg text-gray-800">
                            {ticket.studentName}
                          </h3>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              ticketStatuses[ticket.id] === "used"
                                ? "bg-gray-200 text-gray-700"
                                : "bg-green-200 text-green-700"
                            }`}
                          >
                            {ticketStatuses[ticket.id] === "used"
                              ? "✓ SCANNED"
                              : "VALID"}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                          <div>
                            <p className="text-gray-500">Roll Number</p>
                            <p className="font-medium text-gray-800">
                              {ticket.rollNumber}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500">Email</p>
                            <p className="font-medium text-gray-800">
                              {ticket.email}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500">Ticket ID</p>
                            <p className="font-medium text-gray-800">
                              {ticket.id}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500">Generated</p>
                            <p className="font-medium text-gray-800">
                              {new Date(
                                ticket.generatedAt
                              ).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        {ticketStatuses[ticket.id] === "used" &&
                          ticket.scannedAt && (
                            <p className="text-xs text-gray-500 mt-2">
                              ✓ Scanned:{" "}
                              {new Date(ticket.scannedAt).toLocaleString()}
                            </p>
                          )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default QRTicketSystem;
