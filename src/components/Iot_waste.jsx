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
  
  // Calculate fill level - inverse of the value
  // Higher values = less fill, Lower values = more fill
  const calculateFillLevel = (key) => {
    // If no initial values yet, return 50%
    if (!initialValues) return 50;
    
    // Use the initial value as reference and calculate inverse fill
    // This creates a simple inverse relationship - when values go up, fill level goes down
    const currentValue = storageValues[key];
    const refValue = initialValues[key];
    
    // Simple calculation: if value increases by 50%, fill decreases by 50%
    // Start with 50% fill level
    const baseLevel = 50;
    const percentChange = ((currentValue - refValue) / refValue) * 100;
    
    // Inverse relationship - subtract percent change from base level
    // If value increases, fill decreases. If value decreases, fill increases.
    let fillLevel = baseLevel - percentChange;
    
    // Ensure fill level stays between 5% and 95% for visibility
    fillLevel = Math.max(5, Math.min(95, fillLevel));
    
    return fillLevel;
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