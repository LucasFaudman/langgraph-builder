'use client'

import React, { useEffect, useRef } from 'react'
import Image from 'next/image'

interface GenericModalProps {
  isOpen?: boolean
  onClose: () => void
  title: string
  content: string | React.ReactNode
  buttonText: string
  onButtonClick?: () => void
  hideBackDrop?: boolean
  className?: string
  noClickThrough?: boolean
  imageUrl?: string
}

const GenericModal: React.FC<GenericModalProps> = ({
  isOpen = true,
  onClose,
  title,
  content,
  buttonText,
  onButtonClick,
  hideBackDrop = false,
  className = '',
  noClickThrough = false,
  imageUrl,
}) => {
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node) && !noClickThrough) {
        onClose()
      }
    }

    if (isOpen && !hideBackDrop) {
      document.addEventListener('mousedown', handleOutsideClick)
    }

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
    }
  }, [isOpen, hideBackDrop, noClickThrough, onClose])

  if (!isOpen) return null

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center ${hideBackDrop ? '' : 'bg-black bg-opacity-50'}`}
      style={{ pointerEvents: noClickThrough ? 'auto' : 'none' }}
    >
      <div
        ref={modalRef}
        className={`bg-white ring-1 ring-black ring-opacity-5 border-3 border-slate-600 rounded-lg p-6 max-w-md mx-auto ${className}`}
        style={{ pointerEvents: 'auto' }}
      >
        <div className='flex flex-col justify-center items-center text-center'>
          {imageUrl && (
            <div className='flex justify-center mb-6'>
              <Image src={imageUrl} alt='Modal Image' width={150} height={150} />
            </div>
          )}
          <h2 className='text-2xl font-medium'>{title}</h2>
          <div className={`text-md md:text-lg text-gray-500 pt-2 text-center ${imageUrl ? 'max-w-lg' : 'max-w-md'}`}>
            {content}
          </div>
          <button
            onClick={onButtonClick || onClose}
            className={`bg-[#076699] rounded-md text-white px-4 py-2 font-medium hover:bg-[#06578a] ${
              imageUrl ? 'mt-6' : 'mt-3'
            }`}
          >
            {buttonText}
          </button>
        </div>
      </div>
    </div>
  )
}

export default GenericModal 