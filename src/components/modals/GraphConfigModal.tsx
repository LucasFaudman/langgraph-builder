import { useState } from 'react'

type GraphConfigModalProps = {
  configValues: {
    name: string;
    builder_name: string;
    compiled_name: string;
    config: string;
    state: string;
    input: string;
    output: string;
    implementation: string;
  };
  onSave: (configValues: any) => void;
}

export default function GraphConfigModal({ configValues, onSave }: GraphConfigModalProps) {
  const [localConfigValues, setLocalConfigValues] = useState({
    ...configValues
  })

  const handleInputChange = (key: string, value: string) => {
    setLocalConfigValues(prev => ({ ...prev, [key]: value }))
  }

  const handleClose = () => {
    onSave(localConfigValues)
  }

  const handleReset = () => {
    setLocalConfigValues({
      name: 'CustomAgent',
      builder_name: 'builder',
      compiled_name: 'graph',
      config: 'config.Configuration',
      state: 'state.State',
      input: 'state.InputState',
      output: 'Any',
      implementation: 'implementation.IMPLEMENTATION'
    })
  }

  return (
    <div className='flex flex-col gap-4'>
      {Object.entries(localConfigValues).map(([key, value]) => (
        <div key={key} className='flex flex-col gap-1'>
          <label className='text-sm font-medium text-gray-700'>
            {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </label>
          <input
            type='text'
            value={value as string}
            onChange={(e) => handleInputChange(key, e.target.value)}
            className='px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2F6868] focus:border-transparent'
            autoComplete="off"
          />
        </div>
      ))}
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