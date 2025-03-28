import React from 'react'
import { X } from 'lucide-react'

type KeyCommandsModalProps = {
  isOpen: boolean
  onClose: () => void
  onRedoOnboarding?: () => void
}

export default function KeyCommandsModal({ isOpen, onClose, onRedoOnboarding }: KeyCommandsModalProps) {
  return (
    <div
      className={`
        fixed bottom-0 left-0 bg-white shadow-xl rounded-md z-20 
        transform transition-transform duration-300 
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}
    >
      <div className='flex flex-col p-6 space-y-5'>
        <div className='flex flex-row items-center justify-between'>
          <h2 className='text-xl font-medium'>Key Commands</h2>
          <button
            className='font-bold text-gray-400 hover:text-gray-600 transition-colors duration-300 ease-in-out'
            onClick={onClose}
          >
            <X size={25} />
          </button>
        </div>
        <div>
          <p className='text-sm text-slate-800'>Create a node</p>
          <p className='mt-2'>⌘ + click anywhere on the canvas</p>
        </div>
        <div>
          <p className='text-sm text-slate-800'>Create an edge</p>
          <p className='mt-2'>click + drag from the bottom of one node to the top of another</p>
        </div>
        <div>
          <p className='text-sm text-slate-800'>Create a conditional edge</p>
          <p className='mt-2'>connect one node to multiple nodes</p>
        </div>
        <div>
          <p className='text-sm text-slate-800'>Create a cycle</p>
          <p className='mt-2'>click + drag from the bottom to the top of a node</p>
        </div>
        <div>
          <p className='text-sm text-slate-800'>Delete an edge/node</p>
          <p className='mt-2'>click the edge/node and hit the backspace key</p>
        </div>
        <div>
          <p className='text-sm text-slate-800'>Color an edge</p>
          <p className='mt-2'>click the edge and select an option from the color picker</p>
        </div>
        <div className='pt-4 border-t border-gray-200'>
          <button
            onClick={onRedoOnboarding}
            className='w-full py-2 px-4 bg-[#2F6868] hover:bg-[#245757] text-white rounded-md transition-colors'
          >
            Redo Onboarding
          </button>
        </div>
      </div>
    </div>
  )
} 