import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../Styles/FileUpload.css';

function FileUpload() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadUrl, setUploadUrl] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [files, setFiles] = useState<string[]>([]);
  
  useEffect(() => {
    fetchFiles();
  }, []);
  
  const fetchFiles = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/files/list');
      if (response.ok) {
        const fileList = await response.json();
        setFiles(fileList);
      }
    } catch (error) {
      console.error('Error fetching files:', error);
    }
  };
  
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setSelectedFile(event.target.files[0]);
      setErrorMessage('');
      setUploadUrl('');
    }
  };
  
  const handleUpload = async () => {
    if (!selectedFile) {
      setErrorMessage('Please select a file to upload');
      return;
    }
    
    setIsUploading(true);
    setUploadProgress(0);
    
    const formData = new FormData();
    formData.append('file', selectedFile);
    
    try {
      // Use XMLHttpRequest for progress tracking
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(percentComplete);
        }
      });
      
      xhr.onload = () => {
        if (xhr.status === 200) {
          setUploadUrl(xhr.responseText);
          fetchFiles(); // Refresh the file list
          setSelectedFile(null);
        } else {
          setErrorMessage('Upload failed');
        }
        setIsUploading(false);
      };
      
      xhr.onerror = () => {
        setErrorMessage('Upload failed');
        setIsUploading(false);
      };
      
      xhr.open('POST', 'http://localhost:8080/api/files/upload', true);
      xhr.send(formData);
      
    } catch (error) {
      console.error('Error during upload:', error);
      setErrorMessage('Upload failed');
      setIsUploading(false);
    }
  };

  // Function to get file type icon
  const getFileIcon = (filename: string): string => {
    const extension = filename.split('.').pop()?.toLowerCase();
    
    if (['mp4', 'mov', 'avi', 'wmv', 'webm', 'mkv'].includes(extension || '')) {
      return '🎬'; // Video
    } else if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg'].includes(extension || '')) {
      return '🖼️'; // Image
    } else if (['pdf'].includes(extension || '')) {
      return '📄'; // Document
    } else {
      return '📁'; // Generic file
    }
  };

  return (
    <div className="file-upload-container">
      <h2>Upload Files</h2>
      
      <div className="upload-section">
        <input 
          type="file" 
          onChange={handleFileSelect}
          disabled={isUploading} 
        />
        
        <button
          onClick={handleUpload}
          disabled={!selectedFile || isUploading}
          className="upload-btn"
        >
          {isUploading ? 'Uploading...' : 'Upload'}
        </button>
      </div>
      
      {isUploading && (
        <div className="progress-container">
          <div className="progress-bar" style={{ width: `${uploadProgress}%` }}>
            {uploadProgress}%
          </div>
        </div>
      )}
      
      {errorMessage && (
        <div className="error-message">{errorMessage}</div>
      )}
      
      {uploadUrl && (
        <div className="success-message">
          <p>File uploaded successfully!</p>
          <a href={uploadUrl} target="_blank" rel="noreferrer">View/Download File</a>
        </div>
      )}
      
      <div className="file-list">
        <h3>Uploaded Files:</h3>
        {files.length === 0 ? (
          <p>No files have been uploaded yet.</p>
        ) : (
          <ul>
            {files.map((file, index) => (
              <li key={index}>
                {getFileIcon(file)}{' '}
                <a 
                  href={`http://localhost:8080/api/files/download/${file}`} 
                  target="_blank"
                  rel="noreferrer"
                >
                  {file}
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
      
      <Link to="/" className="back-btn">Back to Movies</Link>
    </div>
  );
}

export default FileUpload;