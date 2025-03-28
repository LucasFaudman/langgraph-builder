'use client'
import { type Node, type Edge, MarkerType } from '@xyflow/react'
import { type ReactNode } from 'react'

// Types for Onboarding
export type TooltipPlacement =
  | 'top'
  | 'left'
  | 'bottom'
  | 'right'
  | 'bottom-end'
  | 'bottom-start'
  | 'left-end'
  | 'left-start'
  | 'right-end'
  | 'right-start'
  | 'top-end'
  | 'top-start'

export type OnboardingStep = {
  key: string
  type: 'modal' | 'tooltip'
  title?: string
  content: string | JSX.Element
  buttonText?: string
  imageUrl?: string
  placement?: TooltipPlacement
  targetNodeId?: string
  tooltipOffset?: { x: number; y: number }
  nodes?: Node[]
  edges?: Edge[]
  position?: {
    top?: string
    right?: string
    bottom?: string
    left?: string
  }
  className?: string
}

// Mock Color Picker component
export const MockColorPicker = () => (
  <div className={`fixed bottom-5 cursor-disabled left-5 z-50 cursor-not-allowed`} style={{ width: '280px' }}>
    <div className='flex flex-col gap-3 bg-white p-4 rounded-lg shadow-xl'>
      <div className='flex justify-between items-center'>
        <span className='text-sm font-semibold text-gray-800'>Set edge color</span>
        <button
          disabled
          className='text-sm cursor-not-allowed bg-slate-800 hover:bg-slate-900 text-slate-100 py-1 px-2 rounded-md'
        >
          Done
        </button>
      </div>
      <div className='relative'>
        <div className='relative cursor-not-allowed w-full h-[80px] rounded-lg shadow-md ring-1 ring-gray-200 bg-gray-100'></div>
        <div className='mt-2 flex justify-center'>
          <div className='bg-gray-100 px-3 py-1 rounded-full'>
            <code className='text-sm font-mono text-gray-700'>#BDBDBD</code>
          </div>
        </div>
      </div>
    </div>
  </div>
)

// Helper function to calculate tooltip position
export const calculateTooltipPosition = (
  targetNodeId: string,
  placement: TooltipPlacement,
  offset: { x: number; y: number } = { x: 0, y: 0 },
  reactFlowInstance: any
): React.CSSProperties => {
  if (!reactFlowInstance || !targetNodeId) {
    return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }
  }

  const node = reactFlowInstance.getNode(targetNodeId)
  if (!node) {
    return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }
  }

  const transform = reactFlowInstance.getViewport()
  const nodePosition = {
    x: node.position.x * transform.zoom + transform.x,
    y: node.position.y * transform.zoom + transform.y,
  }

  const nodeElement = document.querySelector(`[data-id="${targetNodeId}"]`)
  const nodeRect = nodeElement?.getBoundingClientRect()
  const nodeHeight = nodeRect?.height || 40
  const nodeWidth = nodeRect?.width || 150
  const tooltipGap = 12 // Base gap between node and tooltip

  // Apply the user-provided offset to the node position
  nodePosition.x += offset.x
  nodePosition.y += offset.y

  switch (placement.split('-')[0]) {
    case 'top':
      return {
        top: `${nodePosition.y - tooltipGap}px`,
        left: `${nodePosition.x + nodeWidth / 2}px`,
        transform: 'translate(-50%, -100%)',
      }
    case 'bottom':
      return {
        top: `${nodePosition.y + nodeHeight + tooltipGap}px`,
        left: `${nodePosition.x + nodeWidth / 2}px`,
        transform: 'translate(-50%, 0)',
      }
    case 'left':
      return {
        top: `${nodePosition.y + nodeHeight / 2}px`,
        left: `${nodePosition.x - tooltipGap}px`,
        transform: 'translate(-100%, -50%)',
      }
    case 'right':
      return {
        top: `${nodePosition.y + nodeHeight / 2}px`,
        left: `${nodePosition.x + nodeWidth + tooltipGap}px`,
        transform: 'translate(0, -50%)',
      }
    default:
      return {
        top: `${nodePosition.y + nodeHeight + tooltipGap}px`,
        left: `${nodePosition.x + nodeWidth / 2}px`,
        transform: 'translate(-50%, 0)',
      }
  }
}

// Define the onboarding steps
export const getOnboardingSteps = (isMobile: boolean): OnboardingStep[] => [
  {
    key: 'tooltip0',
    type: 'modal',
    placement: 'top' as TooltipPlacement,
    title: 'Graph Builder',
    content: (
      <span>Let's get started with a quick onboarding! During onboarding, canvas interaction will be disabled</span>
    ),
    buttonText: 'Start',
    imageUrl: '/langgraph-logo.png',
  },
  {
    key: 'tooltip1',
    type: 'tooltip',
    placement: 'left' as TooltipPlacement,
    title: '1 of 7: How to create a node',
    content: '⌘ + click anywhere on the canvas to create a node. Nodes can have custom labels',
    targetNodeId: 'custom1',
    tooltipOffset: { x: 0, y: 0 },
    nodes: [
      { id: 'source', type: 'source', position: { x: 0, y: 0 }, data: { label: 'source' } },
      { id: 'end', type: 'end', position: { x: 0, y: 600 }, data: { label: 'end' } },
      { id: 'custom1', type: 'custom', position: { x: 0, y: 200 }, data: { label: 'Supervisor' } },
    ],
  },
  {
    key: 'tooltip2',
    type: 'tooltip',
    placement: 'left' as TooltipPlacement,
    title: '2 of 7: How to create an edge',
    content: 'Connect two nodes by dragging from the bottom of one node to the top of another',
    targetNodeId: 'custom1',
    tooltipOffset: { x: 0, y: -120 },
    nodes: [
      { id: 'source', type: 'source', position: { x: 0, y: 0 }, data: { label: 'source' } },
      { id: 'end', type: 'end', position: { x: 0, y: 600 }, data: { label: 'end' } },
      { id: 'custom1', type: 'custom', position: { x: 0, y: 200 }, data: { label: 'Supervisor' } },
    ],
    edges: [
      { id: 'source->custom1', source: 'source', target: 'custom1', markerEnd: { type: MarkerType.ArrowClosed } },
    ],
  },
  {
    key: 'tooltip3',
    type: 'tooltip',
    placement: 'right' as TooltipPlacement,
    title: '3 of 7: How to create a conditional edge',
    content:
      'Connect one node to multiple nodes to create a conditional edge. Conditional edges can have custom labels',
    targetNodeId: 'custom1',
    tooltipOffset: { x: 10, y: 0 },
    nodes: [
      { id: 'source', type: 'source', position: { x: 0, y: 0 }, data: { label: 'source' } },
      { id: 'end', type: 'end', position: { x: 0, y: 600 }, data: { label: 'end' } },
      { id: 'custom1', type: 'custom', position: { x: 0, y: 200 }, data: { label: 'Supervisor' } },
      { id: 'custom2', type: 'custom', position: { x: isMobile ? -120 : -200, y: 350 }, data: { label: 'RAG' } },
      { id: 'custom3', type: 'custom', position: { x: isMobile ? 120 : 200, y: 350 }, data: { label: 'Web Search' } },
    ],
    edges: [
      { id: 'source->custom1', source: 'source', target: 'custom1', markerEnd: { type: MarkerType.ArrowClosed } },
      {
        id: 'custom1->custom2',
        source: 'custom1',
        target: 'custom2',
        animated: true,
        markerEnd: { type: MarkerType.ArrowClosed },
        type: 'self-connecting-edge',
        label: 'conditional_edge_1',
      },
      {
        id: 'custom1->custom3',
        source: 'custom1',
        target: 'custom3',
        animated: true,
        markerEnd: { type: MarkerType.ArrowClosed },
        type: 'self-connecting-edge',
        label: 'conditional_edge_1',
      },
      { id: 'custom2->end', source: 'custom2', target: 'end', markerEnd: { type: MarkerType.ArrowClosed } },
      { id: 'custom3->end', source: 'custom3', target: 'end', markerEnd: { type: MarkerType.ArrowClosed } },
    ],
  },
  {
    key: 'tooltip4',
    type: 'tooltip',
    placement: 'left' as TooltipPlacement,
    title: '4 of 7: How to create a cycle',
    content: 'Create a loop by dragging from the bottom of one node to the top of itself',
    targetNodeId: 'custom3',
    tooltipOffset: { x: -10, y: 0 },
    nodes: [
      { id: 'source', type: 'source', position: { x: 0, y: 0 }, data: { label: 'source' } },
      { id: 'end', type: 'end', position: { x: 0, y: 600 }, data: { label: 'end' } },
      { id: 'custom1', type: 'custom', position: { x: 0, y: 200 }, data: { label: 'Supervisor' } },
      { id: 'custom2', type: 'custom', position: { x: isMobile ? -120 : -200, y: 350 }, data: { label: 'RAG' } },
      { id: 'custom3', type: 'custom', position: { x: isMobile ? 120 : 200, y: 350 }, data: { label: 'Web Search' } },
    ],
    edges: [
      { id: 'source->custom1', source: 'source', target: 'custom1', markerEnd: { type: MarkerType.ArrowClosed } },
      {
        id: 'custom1->custom2',
        source: 'custom1',
        target: 'custom2',
        animated: true,
        label: 'conditional_edge_1',
        markerEnd: { type: MarkerType.ArrowClosed },
        type: 'self-connecting-edge',
      },
      {
        id: 'custom1->custom3',
        source: 'custom1',
        target: 'custom3',
        animated: true,
        label: 'conditional_edge_1',
        markerEnd: { type: MarkerType.ArrowClosed },
        type: 'self-connecting-edge',
      },
      { id: 'custom2->end', source: 'custom2', target: 'end', markerEnd: { type: MarkerType.ArrowClosed } },
      {
        id: 'custom3->end',
        source: 'custom3',
        animated: true,
        label: 'conditional_edge_2',
        target: 'end',
        type: 'self-connecting-edge',
        markerEnd: { type: MarkerType.ArrowClosed },
      },
      {
        id: 'custom1->custom1',
        source: 'custom3',
        target: 'custom3',
        animated: true,
        label: 'conditional_edge_2',
        type: 'self-connecting-edge',
        markerEnd: { type: MarkerType.ArrowClosed },
      },
    ],
  },
  {
    key: 'tooltip5',
    type: 'tooltip',
    placement: 'left' as TooltipPlacement,
    title: '5 of 7: Edge colors',
    content:
      'You can click on an edge and give it a color. This helps distinguish between different edges on the graph',
    targetNodeId: 'custom1',
    tooltipOffset: { x: 0, y: 0 },
    nodes: [
      { id: 'source', type: 'source', position: { x: 0, y: 0 }, data: { label: 'source' } },
      { id: 'end', type: 'end', position: { x: 0, y: 600 }, data: { label: 'end' } },
      { id: 'custom1', type: 'custom', position: { x: 0, y: 200 }, data: { label: 'Supervisor' } },
      { id: 'custom2', type: 'custom', position: { x: isMobile ? -120 : -200, y: 350 }, data: { label: 'RAG' } },
      { id: 'custom3', type: 'custom', position: { x: isMobile ? 120 : 200, y: 350 }, data: { label: 'Web Search' } },
    ],
    edges: [
      { id: 'source->custom1', source: 'source', target: 'custom1', markerEnd: { type: MarkerType.ArrowClosed } },
      {
        id: 'custom1->custom2',
        source: 'custom1',
        target: 'custom2',
        animated: true,
        label: 'conditional_edge_1',
        markerEnd: { type: MarkerType.ArrowClosed },
        type: 'self-connecting-edge',
      },
      {
        id: 'custom1->custom3',
        source: 'custom1',
        target: 'custom3',
        animated: true,
        label: 'conditional_edge_1',
        markerEnd: { type: MarkerType.ArrowClosed },
        type: 'self-connecting-edge',
      },
      {
        id: 'custom2->end',
        source: 'custom2',
        target: 'end',
        markerEnd: { type: MarkerType.ArrowClosed },
      },
      {
        id: 'custom3->end',
        source: 'custom3',
        animated: true,
        label: 'conditional_edge_2',
        type: 'self-connecting-edge',
        target: 'end',
        markerEnd: { type: MarkerType.ArrowClosed },
      },
      {
        id: 'custom1->custom1',
        source: 'custom3',
        target: 'custom3',
        animated: true,
        label: 'conditional_edge_2',
        type: 'self-connecting-edge',
        markerEnd: { type: MarkerType.ArrowClosed },
      },
    ],
  },
  {
    key: 'tooltip6',
    type: 'tooltip',
    placement: 'left' as TooltipPlacement,
    title: '6 of 7: Delete a node or edge',
    content: 'To delete a node or edge, click on it and press backspace',
    targetNodeId: 'custom1',
    tooltipOffset: { x: 0, y: 0 },
    nodes: [
      { id: 'source', type: 'source', position: { x: 0, y: 0 }, data: { label: 'source' } },
      { id: 'end', type: 'end', position: { x: 0, y: 600 }, data: { label: 'end' } },
      { id: 'custom1', type: 'custom', position: { x: 0, y: 200 }, data: { label: 'Supervisor' } },
      { id: 'custom2', type: 'custom', position: { x: isMobile ? -120 : -200, y: 350 }, data: { label: 'RAG' } },
      { id: 'custom3', type: 'custom', position: { x: isMobile ? 120 : 200, y: 350 }, data: { label: 'Web Search' } },
    ],
    edges: [
      { id: 'source->custom1', source: 'source', target: 'custom1', markerEnd: { type: MarkerType.ArrowClosed } },
      {
        id: 'custom1->custom2',
        source: 'custom1',
        target: 'custom2',
        animated: true,
        label: 'conditional_edge_1',
        markerEnd: { type: MarkerType.ArrowClosed },
        type: 'self-connecting-edge',
      },
      {
        id: 'custom1->custom3',
        source: 'custom1',
        target: 'custom3',
        animated: true,
        label: 'conditional_edge_1',
        markerEnd: { type: MarkerType.ArrowClosed },
        type: 'self-connecting-edge',
      },
      { id: 'custom2->end', source: 'custom2', target: 'end', markerEnd: { type: MarkerType.ArrowClosed } },
      {
        id: 'custom3->end',
        source: 'custom3',
        target: 'end',
        animated: true,
        label: 'conditional_edge_2',
        type: 'self-connecting-edge',
        markerEnd: { type: MarkerType.ArrowClosed },
      },
      {
        id: 'custom1->custom1',
        source: 'custom3',
        target: 'custom3',
        animated: true,
        label: 'conditional_edge_2',
        type: 'self-connecting-edge',
        markerEnd: { type: MarkerType.ArrowClosed },
      },
    ],
  },
  {
    key: 'tooltip7',
    type: 'tooltip',
    title: '7 of 7: Generate Code',
    content:
      "Once you're finished designing the graph, you can generate boilerplate code for it in Python and TypeScript",
    position: {
      top: '100px',
      right: '10px',
    },
    placement: 'bottom',
    nodes: [
      { id: 'source', type: 'source', position: { x: 0, y: 0 }, data: { label: 'source' } },
      { id: 'end', type: 'end', position: { x: 0, y: 600 }, data: { label: 'end' } },
      { id: 'custom1', type: 'custom', position: { x: 0, y: 200 }, data: { label: 'Supervisor' } },
      { id: 'custom2', type: 'custom', position: { x: isMobile ? -120 : -200, y: 350 }, data: { label: 'RAG' } },
      { id: 'custom3', type: 'custom', position: { x: isMobile ? 120 : 200, y: 350 }, data: { label: 'Web Search' } },
    ],
    edges: [
      { id: 'source->custom1', source: 'source', target: 'custom1', markerEnd: { type: MarkerType.ArrowClosed } },
      {
        id: 'custom1->custom2',
        source: 'custom1',
        target: 'custom2',
        animated: true,
        label: 'conditional_edge_1',
        markerEnd: { type: MarkerType.ArrowClosed },
        type: 'self-connecting-edge',
      },
      {
        id: 'custom1->custom3',
        source: 'custom1',
        target: 'custom3',
        animated: true,
        label: 'conditional_edge_1',
        markerEnd: { type: MarkerType.ArrowClosed },
        type: 'self-connecting-edge',
      },
      { id: 'custom2->end', source: 'custom2', target: 'end', markerEnd: { type: MarkerType.ArrowClosed } },
      {
        id: 'custom3->end',
        source: 'custom3',
        animated: true,
        label: 'conditional_edge_2',
        type: 'self-connecting-edge',
        target: 'end',
        markerEnd: { type: MarkerType.ArrowClosed },
      },
      {
        id: 'custom1->custom1',
        source: 'custom3',
        target: 'custom3',
        animated: true,
        label: 'conditional_edge_2',
        type: 'self-connecting-edge',
        markerEnd: { type: MarkerType.ArrowClosed },
      },
    ],
  },
  {
    key: 'tooltip8',
    type: 'modal',
    placement: 'top' as TooltipPlacement,
    title: "You're ready!",
    content: <span>Onboarding complete. Happy building!</span>,
    buttonText: 'Start',
    imageUrl: '/langgraph-logo.png',
  },
]

// Onboarding component for rendering current onboarding step
export const OnboardingContent = ({
  currentStep,
  onboardingSteps,
  onNext,
  reactFlowInstance,
}: {
  currentStep: number
  onboardingSteps: OnboardingStep[]
  onNext: () => void
  reactFlowInstance: any
}) => {
  if (currentStep >= onboardingSteps.length) return null

  const step = onboardingSteps[currentStep]

  if (step.type === 'modal') {
    return (
      <div>
        <div className="fixed inset-0 bg-black bg-opacity-30 z-50 flex items-center justify-center pointer-events-auto">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
            {step.imageUrl && (
              <div className="flex justify-center mb-4">
                <img src={step.imageUrl} alt="Onboarding" className="h-16" />
              </div>
            )}
            {step.title && <h3 className="text-lg font-medium mb-2">{step.title}</h3>}
            <div className="mb-4">{step.content}</div>
            <div className="flex justify-end">
              <button
                onClick={onNext}
                className="px-4 py-2 bg-[#2F6868] text-white rounded hover:bg-[#245757]"
              >
                {step.buttonText || 'Next'}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // For tooltip type
  let tooltipStyles: React.CSSProperties = {}
  if (step.position) {
    tooltipStyles = { ...step.position }
  } else if (step.targetNodeId) {
    tooltipStyles = calculateTooltipPosition(
      step.targetNodeId,
      step.placement || 'top',
      step.tooltipOffset,
      reactFlowInstance
    )
  }

  return (
    <>
      {/* Desktop Tooltip */}
      <div
        className={`fixed pointer-events-auto ${step.className || ''} hidden lg:block`}
        style={{
          ...tooltipStyles,
          pointerEvents: 'auto',
        }}
      >
        <div className='py-3 px-3 flex bg-white rounded-lg shadow-lg flex-col w-[280px] md:w-[380px]'>
          <div className='flex flex-row items-center justify-between'>
            <div className='text-sm font-medium'>{step.title}</div>
            <button
              onClick={onNext}
              className='text-sm bg-slate-800 hover:bg-slate-900 text-slate-100 py-1 px-2 rounded-md'
            >
              Next
            </button>
          </div>
          <div className='text-sm pt-3'>{step.content}</div>
        </div>
      </div>

      {/* Mobile Tooltip */}
      <div className='fixed bottom-[150px] right-5 z-50 pointer-events-auto lg:hidden'>
        <div className='py-3 px-3 flex bg-white rounded-lg shadow-lg flex-col w-[280px] md:w-[380px]'>
          <div className='flex flex-row items-center justify-between'>
            <div className='text-sm font-medium'>{step.title}</div>
            <button
              onClick={onNext}
              className='text-sm bg-slate-800 hover:bg-slate-900 text-slate-100 py-1 px-2 rounded-md'
            >
              Next
            </button>
          </div>
          <div className='text-sm pt-3'>{step.content}</div>
        </div>
      </div>
    </>
  )
} 