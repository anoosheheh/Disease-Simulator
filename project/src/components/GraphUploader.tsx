import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, AlertTriangle, Check, RefreshCw } from 'lucide-react';
import { useSimulationContext } from '../context/SimulationContext';

const GraphUploader: React.FC = () => {
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { uploadGraph, generateRandomGraph } = useSimulationContext();
  
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    
    const file = acceptedFiles[0];
    if (file.type !== 'application/json') {
      setUploadStatus('error');
      setErrorMessage('Please upload a JSON file');
      return;
    }
    
    try {
      setUploadStatus('uploading');
      setErrorMessage(null);
      
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const jsonData = JSON.parse(e.target?.result as string);
          await uploadGraph(jsonData);
          setUploadStatus('success');
        } catch (error) {
          setUploadStatus('error');
          setErrorMessage('Invalid JSON format');
        }
      };
      reader.readAsText(file);
    } catch (error) {
      setUploadStatus('error');
      setErrorMessage('Failed to process file');
    }
  }, [uploadGraph]);
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
      'application/json': ['.json']
    },
    maxFiles: 1
  });

  const handleGenerateRandom = async () => {
    try {
      setUploadStatus('uploading');
      setErrorMessage(null);
      await generateRandomGraph();
      setUploadStatus('success');
    } catch (error) {
      setUploadStatus('error');
      setErrorMessage('Failed to generate graph');
    }
  };
  
  return (
    <div className="bg-gray-800 rounded-lg shadow-lg p-4">
      <h2 className="text-lg font-semibold mb-4 flex items-center">
        <Upload size={20} className="mr-2" /> Graph Data
      </h2>
      
      <div 
        {...getRootProps()} 
        className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-blue-500 bg-blue-500 bg-opacity-10' : 'border-gray-600 hover:border-gray-500'}
          ${uploadStatus === 'error' ? 'border-red-500' : ''}
          ${uploadStatus === 'success' ? 'border-green-500' : ''}
        `}
      >
        <input {...getInputProps()} />
        
        {uploadStatus === 'uploading' ? (
          <div className="py-4 flex flex-col items-center">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-t-blue-500"></div>
            <p className="mt-2 text-sm text-gray-400">Processing...</p>
          </div>
        ) : uploadStatus === 'error' ? (
          <div className="py-2 flex flex-col items-center text-red-400">
            <AlertTriangle size={24} />
            <p className="mt-1 text-sm">{errorMessage || 'Error uploading file'}</p>
            <p className="mt-2 text-xs text-gray-400">Click or drop to try again</p>
          </div>
        ) : uploadStatus === 'success' ? (
          <div className="py-2 flex flex-col items-center text-green-400">
            <Check size={24} />
            <p className="mt-1 text-sm">Graph uploaded successfully!</p>
            <p className="mt-2 text-xs text-gray-400">Click or drop to upload another</p>
          </div>
        ) : (
          <div className="py-4">
            <p className="text-sm">
              {isDragActive ? 
                'Drop the JSON file here' : 
                'Drag & drop a graph JSON file, or click to select'
              }
            </p>
            <p className="mt-1 text-xs text-gray-400">
              File should contain nodes and links data
            </p>
          </div>
        )}
      </div>
      
      <div className="mt-2 flex justify-center">
        <button
          onClick={handleGenerateRandom}
          className="flex items-center justify-center text-sm text-gray-400 hover:text-white transition-colors py-2"
        >
          <RefreshCw size={14} className="mr-1" /> Generate random network
        </button>
      </div>
    </div>
  );
};

export default GraphUploader;