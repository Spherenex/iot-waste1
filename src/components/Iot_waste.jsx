import React, { useState, useEffect } from 'react';
import './Iot_waste.css';

const StorageVisualizer = () => {
  const [storageValues, setStorageValues] = useState({
    U1_Dry: 0,
    U2_Wet: 0,
    U3_Metal: 0
  });
  
  const [previousValues, setPreviousValues] = useState({
    U1_Dry: 0,
    U2_Wet: 0,
    U3_Metal: 0
  });
  
  // Initial values to calculate relative changes
  const [initialValues, setInitialValues] = useState(null);
  
  useEffect(() => {
    // Function to fetch data from Firebase
    const fetchData = async () => {
      try {
        // Firebase configuration
        const firebaseUrl = 'https://iot-waste-06052025-default-rtdb.firebaseio.com/Storage.json';
        const response = await fetch(firebaseUrl);
        const data = await response.json();
        
        // Set initial values if not already set
        if (!initialValues) {
          setInitialValues({
            U1_Dry: data.U1_Dry,
            U2_Wet: data.U2_Wet,
            U3_Metal: data.U3_Metal
          });
        }
        
        // Save previous values before updating
        setPreviousValues(storageValues);
        
        // Update with new values from Firebase
        setStorageValues({
          U1_Dry: data.U1_Dry,
          U2_Wet: data.U2_Wet,
          U3_Metal: data.U3_Metal
        });
      } catch (error) {
        console.error('Error fetching data from Firebase:', error);
      }
    };

    // Initial fetch
    fetchData();
    
    // Set up interval for fetching data
    const interval = setInterval(fetchData, 5000); // Update every 5 seconds
    
    // Clean up interval on component unmount
    return () => clearInterval(interval);
  }, [storageValues, initialValues]);
  
  // Calculate fill level based on different thresholds for each type
  const calculateFillLevel = (key) => {
    // If no values yet, return minimum fill
    if (!initialValues) return 5;
    
    const currentValue = storageValues[key];
    
    // Different calculation logic for each storage type
    if (key === 'U1_Dry') {
      // For U1_Dry, keep the existing relative approach
      const refValue = initialValues[key];
      const baseLevel = 50;
      const percentChange = ((currentValue - refValue) / refValue) * 100;
      let fillLevel = baseLevel - percentChange;
      return Math.max(5, Math.min(95, fillLevel));
    } 
    else if (key === 'U2_Wet') {
      // For U2_Wet, fill when below 19
      const threshold = 19;
      
      if (currentValue >= threshold) {
        // If at or above threshold, minimal fill
        return 5;
      } else {
        // Calculate fill based on how far below threshold
        // When value is 0, fill should be 95%
        // When value is at threshold (19), fill should be 5%
        const fillPercent = 95 - ((currentValue / threshold) * 90);
        return Math.max(5, Math.min(95, fillPercent));
      }
    } 
    else if (key === 'U3_Metal') {
      // For U3_Metal, fill when below 9
      const threshold = 9;
      
      if (currentValue >= threshold) {
        // If at or above threshold, minimal fill
        return 5;
      } else {
        // Calculate fill based on how far below threshold
        // When value is 0, fill should be 95%
        // When value is at threshold (9), fill should be 5%
        const fillPercent = 95 - ((currentValue / threshold) * 90);
        return Math.max(5, Math.min(95, fillPercent));
      }
    }
    
    // Default return
    return 5;
  };
  
  return (
    <div className="storage-container">
      <h2 className="storage-title">Storage</h2>
      
      <div className="storage-item">
        <div className="storage-label">U1_Dry:</div>
        <div className="storage-value">{storageValues.U1_Dry.toFixed(3)}</div>
        <div className="box-container">
          <div 
            className="fill-box fill-box-u1"
            style={{ width: `${calculateFillLevel('U1_Dry')}%` }}
          ></div>
        </div>
      </div>
      
      <div className="storage-item">
        <div className="storage-label">U2_Wet:</div>
        <div className="storage-value">{storageValues.U2_Wet.toFixed(3)}</div>
        <div className="box-container">
          <div 
            className="fill-box fill-box-u2"
            style={{ width: `${calculateFillLevel('U2_Wet')}%` }}
          ></div>
        </div>
      </div>
      
      <div className="storage-item">
        <div className="storage-label">U3_Metal:</div>
        <div className="storage-value">{storageValues.U3_Metal.toFixed(3)}</div>
        <div className="box-container">
          <div 
            className="fill-box fill-box-u3"
            style={{ width: `${calculateFillLevel('U3_Metal')}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default StorageVisualizer;