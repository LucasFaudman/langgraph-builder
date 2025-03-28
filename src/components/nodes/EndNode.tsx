import { Handle, Position } from '@xyflow/react'
import type { Node } from '@xyflow/react'

export type EndNode = Node

export default function EndNode() {
  return (
    <div
      className='rounded-3xl p-[0.5px]'
      style={{ border: `1px solid ${'#333333'}`, backgroundColor: 'transparent' }}
    >
      <div className='p-3 px-8 font-medium rounded-3xl whitespace-nowrap' style={{ color: '#333333', minWidth: '100px' }}>
        __end__
      </div>
      <Handle
        type='target'
        style={{ width: '10px', height: '10px', border: `2px solid ${'#333333'}`, backgroundColor: '#FFFFFF' }}
        position={Position.Top}
      />
    </div>
  )
}
