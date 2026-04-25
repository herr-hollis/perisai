const fs = require('fs');
const path = require('path');
const axios = require('axios');

// API endpoint for anomaly detection (replace with your actual endpoint)
const anomalyDetectionAPI = 'https://your-anomaly-detection-api.com/analyze';

// Your API key (replace with your actual API key)
const apiKey = 'your-api-key-here'; // Replace this with your actual API key

// Path to the folder containing log files
const logFolderPath = './logs'; // Update with your folder path

// Function to read log files and send to API for anomaly detection
function readAndSendLogs(logFolderPath) {
  // Read all files in the directory
  fs.readdir(logFolderPath, (err, files) => {
    if (err) {
      console.error('Error reading the directory:', err);
      return;
    }

    // Filter out non-text files
    const logFiles = files.filter(file => file.endsWith('.txt'));

    logFiles.forEach(file => {
      const filePath = path.join(logFolderPath, file);

      // Read the file content
      fs.readFile(filePath, 'utf-8', (err, data) => {
        if (err) {
          console.error(`Error reading file ${file}:`, err);
          return;
        }

        // Send the log data to the API for anomaly detection
        sendLogsToAPI(data, file);
      });
    });
  });
}

// Function to send log data to the anomaly detection API
async function sendLogsToAPI(logData, fileName) {
  try {
    const response = await axios.post(anomalyDetectionAPI, {
      fileName: fileName,
      logs: logData
    }, {
      headers: {
        'Authorization': `Bearer ${apiKey}`  // Pass the API key in the Authorization header
      }
    });

    // Handle the API response
    if (response.data.anomalyDetected) {
      console.log(`Anomaly detected in file: ${fileName}`);
      console.log(`Anomaly Details: ${response.data.details}`);
    } else {
      console.log(`No anomaly detected in file: ${fileName}`);
    }
  } catch (error) {
    console.error('Error sending logs to API:', error);
  }
}

// Start reading and sending logs
readAndSendLogs(logFolderPath);