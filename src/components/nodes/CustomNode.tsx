import { Handle, Position, useReactFlow } from '@xyflow/react'
import type { Node as NodeType, NodeProps } from '@xyflow/react'
import { useCallback, useState, useMemo, useRef, useEffect } from 'react'
import { useButtonText } from '@/contexts/ButtonTextContext'

export type CustomNodeData = {
  label: string
}

export type CustomNode = NodeType<CustomNodeData>

export default function CustomNode({ data, id, selected }: NodeProps<CustomNode>) {
  const { setNodes } = useReactFlow()
  const { buttonTexts, updateButtonText } = useButtonText()
  const [nodeWidth, setNodeWidth] = useState(150)
  const inputRef = useRef<HTMLInputElement>(null)

  const { borderColor: randomBorderColor, backgroundColor: randomBackgroundColor } = useMemo(() => {
    const hue = Math.floor(Math.random() * 360)
    const saturation = 70 + Math.random() * 30
    const lightness = 60 + Math.random() * 20
    const borderColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`

    const lightnessIncrement = 90
    const backgroundLightness = Math.min(lightness + lightnessIncrement, 95)
    const backgroundColor = `hsl(${hue}, ${saturation}%, ${backgroundLightness}%)`

    return { borderColor, backgroundColor }
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newLabel = e.target.value
    updateButtonText(id, newLabel)
    // Update the node label in React Flow
    setNodes((nds: any[]) =>
      nds.map((node) => {
        if (node.id === id) {
          return {
            ...node,
            data: {
              ...node.data,
              label: newLabel,
            },
          }
        }
        return node
      }),
    )

    adjustNodeSize()
  }

  const adjustNodeSize = useCallback(() => {
    if (inputRef.current) {
      // Create a temporary span to measure text width more accurately
      const tempSpan = document.createElement('span');
      tempSpan.style.visibility = 'hidden';
      tempSpan.style.position = 'absolute';
      tempSpan.style.whiteSpace = 'nowrap';
      tempSpan.style.fontSize = window.getComputedStyle(inputRef.current).fontSize;
      tempSpan.style.fontFamily = window.getComputedStyle(inputRef.current).fontFamily;
      tempSpan.innerText = inputRef.current.value || '';
      document.body.appendChild(tempSpan);
      
      // Get the accurate width and add padding
      const textWidth = tempSpan.getBoundingClientRect().width;
      document.body.removeChild(tempSpan);
      
      // Set a minimum width and add extra padding (30px) to ensure text isn't cut off
      const newWidth = Math.max(150, textWidth + 30);
      console.log('Adjusting node size:', { text: inputRef.current.value, textWidth, newWidth });
      setNodeWidth(newWidth);
    }
  }, [])

  useEffect(() => {
    updateButtonText(id, data.label);
    // Initial size adjustment
    setTimeout(adjustNodeSize, 0);
  }, [])

  useEffect(() => {
    adjustNodeSize();
  }, [buttonTexts[id], adjustNodeSize])

  return (
    <div className='rounded-md p-0' style={{ border: 'none', backgroundColor: 'transparent' }}>
      <div
        className='rounded-md p-2'
        style={{
          border: `2px solid ${randomBorderColor}`,
          backgroundColor: randomBackgroundColor,
          width: `${nodeWidth}px`,
          boxShadow: selected ? '0 0 12px rgba(0, 0, 0, 0.3)' : 'none',
          transition: 'width 0.1s ease-out',
        }}
      >
        <input
          ref={inputRef}
          type='text'
          className='w-full outline-none rounded-md text-center p-1 text-black'
          value={buttonTexts[id]}
          onChange={handleInputChange}
          style={{
            backgroundColor: 'transparent',
            color: '#333333',
            width: '100%',
            minWidth: '100%',
            border: 'none',
            textOverflow: 'ellipsis',
          }}
          onBlur={adjustNodeSize}
          onFocus={adjustNodeSize}
        />
        <Handle
          type='source'
          style={{
            width: '10px',
            height: '10px',
            backgroundColor: '#FFFFFF',
            border: `2px solid ${randomBorderColor}`,
          }}
          position={Position.Bottom}
        />
        <Handle
          type='target'
          style={{
            width: '10px',
            height: '10px',
            backgroundColor: '#FFFFFF',
            border: `2px solid ${randomBorderColor}`,
          }}
          position={Position.Top}
        />
      </div>
    </div>
  )
}
