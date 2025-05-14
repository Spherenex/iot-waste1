import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import './GoogleSheetViewer.css'; // Import external CSS

// Register Chart.js components
ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Title, Tooltip, Legend);

// API Keys and Constants
const apiKey = import.meta.env.VITE_GOOGLE_SHEETS_API_KEY || "YOUR_API_KEY";
const sheetId = "YOUR_SPREADSHEET_ID"; // Replace with your spreadsheet ID
const weatherApiKey = "eaf2e165d05bb27d14be627793ae5317";

// Recorded Ranges for Crop Recommendation
const recordedRanges = {
  Rice: {
    temperature: { min: 28, max: 32, unit: '°C' },
    humidity: { min: 50, max: 55, unit: '%' },
    soilmoisture: { min: 1000, max: 1024, unit: '' },
    turbidity: { min: 500, max: 515, unit: '' },
    ph: { min: 6.0, max: 7.0, unit: '' },
    tds: { min: 22, max: 30, unit: '' },
    soil: 'Loamy soil',
  },
  Wheat: {
    temperature: { min: 25, max: 31, unit: '°C' },
    humidity: { min: 45, max: 52, unit: '%' },
    soilmoisture: { min: 950, max: 1024, unit: '' },
    turbidity: { min: 490, max: 510, unit: '' },
    ph: { min: 6.0, max: 7.0, unit: '' },
    tds: { min: 20, max: 28, unit: '' },
    soil: 'Clay loam',
  },
  Tomato: {
    temperature: { min: 27, max: 32, unit: '°C' },
    humidity: { min: 50, max: 60, unit: '%' },
    soilmoisture: { min: 980, max: 1020, unit: '' },
    turbidity: { min: 500, max: 520, unit: '' },
    ph: { min: 6.0, max: 7.0, unit: '' },
    tds: { min: 25, max: 30, unit: '' },
    soil: 'Sandy loam',
  },
  Onion: {
    temperature: { min: 26, max: 30, unit: '°C' },
    humidity: { min: 50, max: 55, unit: '%' },
    soilmoisture: { min: 1000, max: 1024, unit: '' },
    turbidity: { min: 505, max: 515, unit: '' },
    ph: { min: 6.0, max: 7.0, unit: '' },
    tds: { min: 20, max: 29, unit: '' },
    soil: 'Loamy soil',
  },
  Cotton: {
    temperature: { min: 29, max: 35, unit: '°C' },
    humidity: { min: 40, max: 50, unit: '%' },
    soilmoisture: { min: 900, max: 1020, unit: '' },
    turbidity: { min: 500, max: 520, unit: '' },
    ph: { min: 6.0, max: 7.5, unit: '' },
    tds: { min: 22, max: 30, unit: '' },
    soil: 'Black soil',
  },
};

// Custom Hook: useVehicleData
const useVehicleData = () => {
  const [data, setData] = useState(null);
  const [currentTemp, setCurrentTemp] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [lastRowId, setLastRowId] = useState(null);

  const fetchGoogleSheetData = async () => {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Sheet1?key=${apiKey}`;
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}, message: ${await response.text()}`);
      }
      const result = await response.json();
      console.log('API Response:', result); // Debug log
      if (!result.values || result.values.length === 0) {
        throw new Error('No data found in spreadsheet');
      }

      const rows = result.values.slice(1);
      const latestRow = rows[rows.length - 1];
      const currentRowId = `${latestRow[0]}-${latestRow[1]}`;

      if (currentRowId === lastRowId) {
        return data;
      }

      setLastRowId(currentRowId);
      const newData = {
        date: latestRow[0],
        time: latestRow[1],
        turbidity: parseFloat(latestRow[2]),
        soilmoisture: parseFloat(latestRow[3]),
        ph: parseFloat(latestRow[4]),
        tds: parseFloat(latestRow[5]),
        temperature: parseFloat(latestRow[6]),
        humidity: parseFloat(latestRow[7]),
      };
      setData(newData);
      setLastUpdate(currentRowId);
      return newData;
    } catch (err) {
      console.warn('Using mock data due to fetch error:', err);
      if (!data) {
        const mockData = {
          date: "30/04/2025",
          time: "14:33:55",
          turbidity: 510,
          soilmoisture: 1024,
          ph: 6.5,
          tds: 29,
          temperature: 30.9,
          humidity: 54.8,
        };
        setData(mockData);
        setError(`Failed to fetch data: ${err.message}`);
        return mockData;
      }
      return data;
    }
  };

  const fetchCurrentTemperature = async () => {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=Bengaluru&units=metric&appid=${weatherApiKey}`;
    try {
      const response = await fetch(url);
      const result = await response.json();
      if (!result.main || typeof result.main.temp === "undefined") {
        throw new Error("Temperature data not available");
      }
      setCurrentTemp(result.main.temp);
    } catch (err) {
      console.error('Error fetching temperature:', err);
      setError('Warning: Could not fetch current temperature data.');
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const sheetData = await fetchGoogleSheetData();
      await fetchCurrentTemperature();
      setLoading(false);
    } catch (err) {
      setError(`Failed to fetch data: ${err.message}`);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000); // Poll every 10 seconds
    return () => clearInterval(interval);
  }, []);

  return { data, currentTemp: currentTemp || data?.temperature, error, loading, lastUpdate };
};

// Component: Login
const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (username === 'sphere' && password === '123') {
      onLogin();
    } else {
      setError('Invalid username or password');
    }
  };

  return (
    <div className="login-container">
      <h1 className="login-title">Agriculture Monitoring System</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="login-input"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="login-input"
        />
        <button type="submit" className="login-button">
          Login
        </button>
      </form>
      {error && <p className="login-error">{error}</p>}
    </div>
  );
};

// Component: VehicleData
const VehicleData = ({ data, currentTemp }) => {
  if (!data) return null;

  const cards = [
    {
      title: 'Temperature',
      icon: 'https://img.icons8.com/fluency/48/thermometer.png',
      values: [
        { label: 'Recorded', value: `${data.temperature} °C` },
        { label: 'Current', value: `${currentTemp} °C` },
      ],
      className: 'card card-temperature',
      gridArea: 'temp',
    },
    {
      title: 'Time',
      icon: 'https://img.icons8.com/fluency/48/clock.png',
      values: [{ label: '', value: `${data.date} ${data.time}` }],
      className: 'card card-time',
      gridArea: 'time',
    },
    {
      title: 'Humidity',
      icon: 'https://img.icons8.com/fluency/48/humidity.png',
      values: [{ label: '', value: `${data.humidity} %` }],
      className: 'card card-humidity',
      gridArea: 'humidity',
    },
    {
      title: 'Soil Moisture',
      icon: 'https://img.icons8.com/fluency/48/water.png',
      values: [{ label: '', value: data.soilmoisture }],
      className: 'card card-soilmoisture',
      gridArea: 'soilmoisture',
    },
    {
      title: 'Turbidity',
      icon: 'https://img.icons8.com/fluency/48/cloud.png',
      values: [{ label: '', value: data.turbidity }],
      className: 'card card-turbidity',
      gridArea: 'turbidity',
    },
    {
      title: 'pH',
      icon: 'https://img.icons8.com/fluency/48/flask.png',
      values: [{ label: '', value: data.ph }],
      className: 'card card-ph',
      gridArea: 'ph',
    },
    {
      title: 'TDS',
      icon: 'https://img.icons8.com/fluency/48/water-element.png',
      values: [{ label: '', value: data.tds }],
      className: 'card card-tds',
      gridArea: 'tds',
    },
  ];

  return (
    <div className="vehicle-data-grid">
      {cards.map((card, index) => (
        <div
          key={index}
          className={card.className}
          style={{ gridArea: card.gridArea }}
        >
          <img src={card.icon} alt={`${card.title} Icon`} className="card-icon" />
          <h3 className="card-title">{card.title}</h3>
          {card.values.map((val, i) => (
            <p key={i} className="card-value">
              {val.label ? `${val.label}: ${val.value}` : val.value}
            </p>
          ))}
        </div>
      ))}
    </div>
  );
};

// Component: VehicleTable
const VehicleTable = ({ data, currentTemp }) => {
  if (!data) return null;

  const parameters = [
    { label: 'Date', value: data.date },
    { label: 'Time', value: data.time },
    { label: 'Temperature (Recorded)', value: `${data.temperature} °C` },
    { label: 'Temperature (Current)', value: `${currentTemp} °C` },
    { label: 'pH', value: data.ph },
    { label: 'Soil Moisture', value: data.soilmoisture },
    { label: 'Turbidity', value: data.turbidity },
    { label: 'Humidity', value: `${data.humidity} %` },
    { label: 'TDS', value: data.tds },
  ];

  return (
    <div className="vehicle-table-container">
      <table className="vehicle-table">
        <thead>
          <tr>
            <th className="table-header">Parameter</th>
            <th className="table-header">Value</th>
          </tr>
        </thead>
        <tbody>
          {parameters.map((param, index) => (
            <tr key={index} className={index % 2 === 0 ? 'table-row-even' : 'table-row-odd'}>
              <td className="table-cell">{param.label}</td>
              <td className="table-cell">{param.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Component: CombinedGraph
const CombinedGraph = ({ data, currentTemp }) => {
  if (!data) return null;

  const now = new Date();
  const timeLabels = [];
  for (let i = 5; i >= 0; i--) {
    const timePoint = new Date(now - i * 60000);
    timeLabels.push(timePoint.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  }

  const chartData = {
    labels: timeLabels,
    datasets: [
      {
        label: 'Temperature (°C)',
        data: [
          data.temperature * 0.9,
          data.temperature * 0.95,
          data.temperature * 0.97,
          data.temperature * 0.99,
          data.temperature,
          data.temperature,
        ],
        borderColor: 'rgba(255, 99, 132, 1)',
        backgroundColor: 'rgba(255, 99, 132, 0.1)',
        borderWidth: 2,
        yAxisID: 'y',
      },
      {
        label: 'pH',
        data: [data.ph * 0.95, data.ph * 0.97, data.ph * 0.98, data.ph * 0.99, data.ph, data.ph],
        borderColor: 'rgba(54, 162, 235, 1)',
        backgroundColor: 'rgba(54, 162, 235, 0.1)',
        borderWidth: 2,
        yAxisID: 'y1',
      },
      {
        label: 'Humidity (%)',
        data: [
          data.humidity * 0.9,
          data.humidity * 0.93,
          data.humidity * 0.95,
          data.humidity * 0.98,
          data.humidity,
          data.humidity,
        ],
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.1)',
        borderWidth: 2,
        yAxisID: 'y',
      },
      {
        label: 'TDS',
        data: [data.tds * 0.8, data.tds * 0.85, data.tds * 0.9, data.tds * 0.95, data.tds, data.tds],
        borderColor: 'rgba(153, 102, 255, 1)',
        backgroundColor: 'rgba(153, 102, 255, 0.1)',
        borderWidth: 2,
        yAxisID: 'y2',
      },
    ],
  };

  const options = {
    responsive: true,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 15,
          font: { size: 12 },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        padding: 10,
        titleFont: { size: 14 },
        bodyFont: { size: 13 },
        displayColors: true,
        usePointStyle: true,
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Time',
          font: { size: 14, weight: 'bold' },
        },
        grid: { color: 'rgba(0, 0, 0, 0.05)' },
      },
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: 'Temperature & Humidity',
          font: { size: 14, weight: 'bold' },
        },
        grid: { color: 'rgba(0, 0, 0, 0.05)' },
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        title: {
          display: true,
          text: 'pH',
          font: { size: 14, weight: 'bold' },
        },
        grid: { drawOnChartArea: false },
        min: 0,
        max: 14,
      },
      y2: {
        type: 'linear',
        display: true,
        position: 'right',
        title: {
          display: true,
          text: 'TDS',
          font: { size: 14, weight: 'bold' },
        },
        grid: { drawOnChartArea: false },
      },
    },
  };

  return (
    <div className="combined-graph-container">
      <Line data={chartData} options={options} />
    </div>
  );
};

// Component: SeparateGraphs
const SeparateGraphs = ({ data, currentTemp }) => {
  if (!data) return null;

  const createTimeLabels = () => {
    const now = new Date();
    const labels = [];
    for (let i = 5; i >= 0; i--) {
      const timePoint = new Date(now - i * 60000);
      labels.push(timePoint.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }
    return labels;
  };

  const createHistoricalData = (currentValue) => {
    const variance = 0.05;
    return [
      currentValue * (1 - variance * 2),
      currentValue * (1 - variance),
      currentValue * (1 - variance * 0.5),
      currentValue,
      currentValue * (1 + variance * 0.2),
      currentValue,
    ];
  };

  const getCommonOptions = (title, min = null, max = null, suffix = '') => ({
    responsive: true,
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          color: '#000',
          font: { size: 14, weight: 'bold' },
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => `${context.dataset.label}: ${context.raw.toFixed(2)}${suffix}`,
        },
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        titleFont: { size: 14 },
        bodyFont: { size: 13 },
        padding: 10,
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Time',
          color: '#333',
          font: { size: 14 },
        },
        grid: { color: 'rgba(200, 200, 200, 0.2)' },
      },
      y: {
        title: {
          display: true,
          text: title,
          color: '#333',
          font: { size: 14 },
        },
        grid: { color: 'rgba(200, 200, 200, 0.2)' },
        ...(min !== null && { min }),
        ...(max !== null && { max }),
      },
    },
    animation: {
      duration: 1000,
      easing: 'easeOutQuart',
    },
  });

  const timeLabels = createTimeLabels();

  const graphs = [
    {
      id: 'tempGraph',
      title: 'Temperature (°C)',
      data: createHistoricalData(parseFloat(data.temperature)),
      borderColor: 'rgba(255, 99, 132, 1)',
      backgroundColor: 'rgba(255, 99, 132, 0.2)',
      borderClass: 'graph-border-blue',
      options: getCommonOptions('Temperature (°C)', null, null, ' °C'),
    },
    {
      id: 'humidityGraph',
      title: 'Humidity (%)',
      data: createHistoricalData(parseFloat(data.humidity)),
      borderColor: 'rgba(54, 162, 235, 1)',
      backgroundColor: 'rgba(54, 162, 235, 0.2)',
      borderClass: 'graph-border-blue',
      options: getCommonOptions('Humidity (%)', 0, 100, '%'),
    },
    {
      id: 'soilMoistureGraph',
      title: 'Soil Moisture',
      data: createHistoricalData(parseFloat(data.soilmoisture)),
      borderColor: 'rgba(75, 192, 192, 1)',
      backgroundColor: 'rgba(75, 192, 192, 0.2)',
      borderClass: 'graph-border-green',
      options: getCommonOptions('Soil Moisture'),
    },
    {
      id: 'turbidityGraph',
      title: 'Turbidity',
      data: createHistoricalData(parseFloat(data.turbidity)),
      borderColor: 'rgba(255, 159, 64, 1)',
      backgroundColor: 'rgba(255, 159, 64, 0.2)',
      borderClass: 'graph-border-yellow',
      options: getCommonOptions('Turbidity'),
    },
    {
      id: 'phGraph',
      title: 'pH',
      data: createHistoricalData(parseFloat(data.ph)),
      borderColor: 'rgba(75, 192, 192, 1)',
      backgroundColor: 'rgba(75, 192, 192, 0.2)',
      borderClass: 'graph-border-green',
      options: getCommonOptions('pH', 0, 14),
    },
    {
      id: 'tdsGraph',
      title: 'TDS',
      data: createHistoricalData(parseFloat(data.tds)),
      borderColor: 'rgba(153, 102, 255, 1)',
      backgroundColor: 'rgba(153, 102, 255, 0.2)',
      borderClass: 'graph-border-purple',
      options: getCommonOptions('TDS'),
    },
  ];

  return (
    <div className="separate-graphs-container">
      {graphs.map((graph) => (
        <div key={graph.id} className={`graph-card ${graph.borderClass}`}>
          <h3 className="graph-title">{graph.title}</h3>
          <Line
            data={{
              labels: timeLabels,
              datasets: [
                {
                  label: graph.title,
                  data: graph.data,
                  borderColor: graph.borderColor,
                  pointBackgroundColor: graph.borderColor,
                  pointBorderColor: '#fff',
                  backgroundColor: graph.backgroundColor,
                  borderWidth: 3,
                  pointRadius: 5,
                  tension: 0.4,
                  fill: true,
                },
              ],
            }}
            options={graph.options}
          />
        </div>
      ))}
    </div>
  );
};

// Component: CropRecommendation
const CropRecommendation = ({ data }) => {
  const [selectedCrop, setSelectedCrop] = useState('');
  const [selectedMonths, setSelectedMonths] = useState('');
  const [ranges, setRanges] = useState(null);
  const [outOfRangeMessages, setOutOfRangeMessages] = useState([]);
  const [isAnalyzeDisabled, setIsAnalyzeDisabled] = useState(true);

  useEffect(() => {
    setIsAnalyzeDisabled(!selectedCrop);
  }, [selectedCrop]);

  const updateRanges = () => {
    if (!selectedCrop || !selectedMonths) {
      alert('Please select a crop and number of months.');
      return;
    }

    const monthFactor = parseInt(selectedMonths) / 12;
    const adjustedRanges = JSON.parse(JSON.stringify(recordedRanges[selectedCrop]));
    Object.keys(adjustedRanges).forEach((param) => {
      const range = adjustedRanges[param];
      if (range.min !== undefined && range.max !== undefined) {
        range.min = Math.round(range.min * monthFactor);
        range.max = Math.round(range.max * monthFactor);
      }
    });
    setRanges(adjustedRanges);
  };

  const analyze = () => {
    if (!selectedCrop || !data) return;

    const monthFactor = selectedMonths ? parseInt(selectedMonths) / 12 : 1;
    const adjustedRanges = JSON.parse(JSON.stringify(recordedRanges[selectedCrop]));
    Object.keys(adjustedRanges).forEach((param) => {
      const range = adjustedRanges[param];
      if (range.min !== undefined && range.max !== undefined) {
        range.min = (parseFloat(range.min) * monthFactor).toFixed(1);
        range.max = (parseFloat(range.max) * monthFactor).toFixed(1);
      }
    });

    const messages = [];
    Object.keys(adjustedRanges).forEach((param) => {
      if (param === 'soil') return;
      const { min, max, unit } = adjustedRanges[param];
      const currentValue = data[param];
      const isInRange = currentValue >= min && currentValue <= max;

      if (!isInRange) {
        let message = '';
        if (currentValue < min) {
          message = `${param.toUpperCase()} is less than the minimum acceptable range (${min} ${unit}).`;
        } else {
          message = `${param.toUpperCase()} is more than the maximum acceptable range (${max} ${unit}).`;
        }
        messages.push({
          message,
          action: `Adjust ${param} levels to be within ${min} - ${max} ${unit}.`,
        });
      }
    });

    setOutOfRangeMessages(messages);
    setRanges(adjustedRanges);
  };

  return (
    <div className="crop-recommendation-container">
      <h2 className="crop-recommendation-title">Crop Recommendation</h2>
      <div className="crop-recommendation-form">
        <div className="form-group">
          <label className="form-label">Select Crop:</label>
          <select
            value={selectedCrop}
            onChange={(e) => setSelectedCrop(e.target.value)}
            className="form-select"
          >
            <option value="">--Select--</option>
            {Object.keys(recordedRanges).map((crop) => (
              <option key={crop} value={crop}>
                {crop}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Select Number of Months:</label>
          <select
            value={selectedMonths}
            onChange={(e) => setSelectedMonths(e.target.value)}
            onBlur={updateRanges}
            className="form-select"
          >
            <option value="">--Select Months--</option>
            {[4, 5, 6, 7, 8, 9, 10, 11, 12].map((month) => (
              <option key={month} value={month}>
                {month} Months
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={analyze}
          disabled={isAnalyzeDisabled}
          className={isAnalyzeDisabled ? 'form-button-disabled' : 'form-button'}
        >
          Analyze
        </button>
      </div>
      {selectedCrop && <p className="soil-type">Recommended soil type: {recordedRanges[selectedCrop].soil}</p>}
      {ranges && (
        <div className="ranges-table-container">
          <table className="ranges-table">
            <thead>
              <tr>
                <th className="ranges-table-header">Parameter</th>
                <th className="ranges-table-header">Recommended Range</th>
                <th className="ranges-table-header">Current Value</th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(ranges)
                .filter((param) => param !== 'soil')
                .map((param) => {
                  const { min, max, unit } = ranges[param];
                  const currentValue = data[param];
                  const isInRange = currentValue >= min && currentValue <= max;
                  return (
                    <tr key={param}>
                      <td className="ranges-table-cell">{param.toUpperCase()}</td>
                      <td className="ranges-table-cell">{`${min} - ${max} ${unit}`}</td>
                      <td className={`ranges-table-cell ${isInRange ? 'text-green' : 'text-red'}`}>
                        {currentValue} {unit}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      )}
      <div className="messages-container">
        {outOfRangeMessages.length > 0 ? (
          outOfRangeMessages.map((msg, index) => (
            <div key={index} className="message-warning">
              <p className="message-text">{msg.message}</p>
              <p className="message-action">Recommendation: {msg.action}</p>
            </div>
          ))
        ) : (
          ranges && (
            <div className="message-success">
              <p>All parameters are within the acceptable range.</p>
            </div>
          )
        )}
      </div>
    </div>
  );
};

// Component: Dashboard
const Dashboard = () => {
  const { data, currentTemp, error, loading, lastUpdate } = useVehicleData();
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    if (data && lastUpdate) {
      setShowNotification(true);
      const timer = setTimeout(() => setShowNotification(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [lastUpdate]);

  return (
    <div className="dashboard-container">
      {loading && (
        <div className="loading-indicator">
          Loading initial data...
        </div>
      )}
      {showNotification && (
        <div className="notification">
          New data received!
        </div>
      )}
      {lastUpdate && (
        <div className="last-update">
          <strong>Last Updated:</strong> {data.date} at {data.time} (Last checked: {new Date().toLocaleTimeString()})
        </div>
      )}
      {error && <p className="error-message">{error}</p>}
      <div className="dashboard-content">
        <VehicleData data={data} currentTemp={currentTemp} />
        <VehicleTable data={data} currentTemp={currentTemp} />
        <CombinedGraph data={data} currentTemp={currentTemp} />
      </div>
      <SeparateGraphs data={data} currentTemp={currentTemp} />
      <CropRecommendation data={data} />
    </div>
  );
};

// Main App Component
const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  return (
    <div className="app-container">
      {isLoggedIn ? <Dashboard /> : <Login onLogin={handleLogin} />}
    </div>
  );
};

export default App;
