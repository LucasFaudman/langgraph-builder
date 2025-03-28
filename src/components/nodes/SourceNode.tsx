import { Handle, Position } from '@xyflow/react'
import type { Node, NodeProps } from '@xyflow/react'
import { useMemo } from 'react'

export type SourceNodeData = {
  label: string
}

export type SourceNode = Node<SourceNodeData>

export default function SourceNode({ data }: NodeProps<SourceNode>) {
  return (
    <div
      className='rounded-3xl p-[0.5px]'
      style={{ border: `1px solid ${'#333333'}`, backgroundColor: 'transparent' }}
    >
      <div className='p-3 px-8 rounded-3xl whitespace-nowrap' style={{ color: '#333333', minWidth: '100px' }}>
        __start__
      </div>
      <Handle
        type='source'
        style={{ width: '10px', height: '10px', border: `2px solid ${'#333333'}`, backgroundColor: '#FFFFFF' }}
        position={Position.Bottom}
      />
    </div>
  )
}
