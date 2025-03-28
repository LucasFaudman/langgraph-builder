import { Modal as MuiModal, ModalDialog } from '@mui/joy'
import { X } from 'lucide-react'

type ConfigModalProps = {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  className?: string
}

export default function ConfigModal({ isOpen, onClose, title, children, className }: ConfigModalProps) {
  return (
    <MuiModal
      hideBackdrop={true}
      onClose={onClose}
      onClick={(e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
      open={isOpen}
    >
      <ModalDialog className={`bg-slate-150 hidden sm:block absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-[600px] ${className || ''}`}>
        <div className='flex flex-col gap-4'>
          <div className='flex justify-between items-center'>
            <h2 className='text-lg font-medium'>{title}</h2>
            <button
              className='font-bold text-gray-400 hover:text-gray-600 transition-colors duration-300 ease-in-out'
              onClick={onClose}
            >
              <X size={25} />
            </button>
          </div>
          {children}
        </div>
      </ModalDialog>
    </MuiModal>
  )
} 