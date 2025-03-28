import { useState } from 'react'

type ServerConfigModalProps = {
  serverUrl: string;
  onSave: (config: {
    serverUrl: string;
  }) => void;
  onRefreshTemplates: (url: string) => void;
}

export default function ServerConfigModal({
  serverUrl,
  onSave,
  onRefreshTemplates
}: ServerConfigModalProps) {
  const [localServerUrl, setLocalServerUrl] = useState(serverUrl);

  // Save changes and close modal
  const handleClose = () => {
    // Update values and close
    onSave({
      serverUrl: localServerUrl
    });
  };

  // Reset all fields to defaults
  const handleReset = () => {
    setLocalServerUrl('https://langgraph-gen-server-570601939772.us-central1.run.app');
  };

  // Refresh templates from the server
  const refreshTemplates = () => {
    onRefreshTemplates(localServerUrl);
  };

  return (
    <div className='flex flex-col gap-4'>
      <div className='flex flex-col gap-1'>
        <label className='text-sm font-medium text-gray-700'>Server URL</label>
        <div className="flex gap-2">
          <input
            type='text'
            value={localServerUrl}
            onChange={(e) => setLocalServerUrl(e.target.value)}
            className='flex-grow px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2F6868] focus:border-transparent'
            autoComplete="off"
          />
          <button
            onClick={refreshTemplates}
            className='px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors'
            title="Refresh templates"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
            </svg>
          </button>
        </div>
      </div>
      
      <div className='bg-gray-50 p-3 rounded-md border border-gray-200'>
        <p className='text-xs text-gray-600'>
          The server URL is used to generate code templates. It should point to an instance of the langgraph-gen server.
        </p>
      </div>
      
      <div className='flex justify-end gap-2 mt-4'>
        <button
          onClick={handleReset}
          className='px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors'
        >
          Reset
        </button>
        <button
          onClick={handleClose}
          className='px-4 py-2 bg-[#2F6868] text-white rounded-md hover:bg-[#245757] transition-colors'
        >
          Save
        </button>
      </div>
    </div>
  )
} 