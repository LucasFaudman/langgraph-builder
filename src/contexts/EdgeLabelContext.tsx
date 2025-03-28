import React, { createContext, useState, useContext, useEffect } from 'react'

type EdgeLabelContextType = {
  edgeLabels: { [sourceNodeId: string]: string }
  updateEdgeLabel: (sourceNodeId: string, label: string) => void
  getEdgeLabel: (sourceNodeId: string, defaultLabel: string) => string
}

const EdgeLabelContext = createContext<EdgeLabelContextType | undefined>(undefined)

export const EdgeLabelProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [edgeLabels, setEdgeLabels] = useState<{ [sourceNodeId: string]: string }>({})

  // Load edge labels from localStorage on mount
  useEffect(() => {
    try {
      const savedEdgeLabels = localStorage.getItem('lg-builder-edge-labels')
      if (savedEdgeLabels) {
        setEdgeLabels(JSON.parse(savedEdgeLabels))
        console.log('Loaded edge labels from localStorage:', JSON.parse(savedEdgeLabels))
      }
    } catch (error) {
      console.error('Error loading edge labels from localStorage:', error)
    }
  }, [])

  const updateEdgeLabel = (sourceNodeId: string, label: string) => {
    setEdgeLabels((prev) => {
      const newLabels = { ...prev, [sourceNodeId]: label }
      // Save to localStorage
      try {
        localStorage.setItem('lg-builder-edge-labels', JSON.stringify(newLabels))
      } catch (error) {
        console.error('Error saving edge labels to localStorage:', error)
      }
      return newLabels
    })
  }

  const getEdgeLabel = (sourceNodeId: string, defaultLabel: string) => {
    return edgeLabels[sourceNodeId] || defaultLabel
  }

  return (
    <EdgeLabelContext.Provider value={{ edgeLabels, updateEdgeLabel, getEdgeLabel }}>
      {children}
    </EdgeLabelContext.Provider>
  )
}

export const useEdgeLabel = () => {
  const context = useContext(EdgeLabelContext)
  if (context === undefined) {
    throw new Error('useEdgeLabel must be used within an EdgeLabelProvider')
  }
  return context
}
