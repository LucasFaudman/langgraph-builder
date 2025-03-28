'use client'
import type { Node } from '@xyflow/react'
import { useCallback, useState, useRef, useEffect } from 'react'
import {
  Background,
  ReactFlow,
  addEdge,
  useNodesState,
  useEdgesState,
  OnConnectStart,
  type OnConnect,
  applyNodeChanges,
  type Edge,
} from '@xyflow/react'
import { MarkerType } from 'reactflow'
import '@xyflow/react/dist/style.css'
import { initialNodes, nodeTypes, type CustomNodeType } from './nodes'
import { initialEdges, edgeTypes, type CustomEdgeType } from './edges'
import { useButtonText } from '@/contexts/ButtonTextContext'
import { useEdgeLabel } from '@/contexts/EdgeLabelContext'
import { Modal as MuiModal, ModalDialog, Tooltip, Snackbar } from '@mui/joy'
import { X, Copy, Info, Check, Download, Settings } from 'lucide-react'
import { Highlight, themes } from 'prism-react-renderer'
import MultiButton from './ui/multibutton'
import { ConfigModal, GraphConfigModal, ServerConfigModal, CodeTemplateConfig, GenericModal, KeyCommandsModal } from './modals'
import { ColorEditingProvider } from './edges/SelfConnectingEdge'
import TemplatesPanel, { type Template } from './ui/TemplatesPanel'
import { parseYamlSpec, generateSpec, type YamlConfig, type YamlNode, type YamlEdge } from '@/utils/yamlUtils'
import { downloadFile, downloadAsZip, type GeneratedFiles } from '@/utils/downloadUtils'
// Import onboarding components from the new file
import { 
  OnboardingContent, 
  MockColorPicker, 
  getOnboardingSteps, 
  type OnboardingStep
} from './onboarding'

// Define template types for code generation
type TemplateContentMap = {[name: string]: string};
type LanguageTemplates = {
  [templateType: string]: {
    names: string[],
    contentMap: TemplateContentMap
  }
};
type AvailableTemplates = {
  python: LanguageTemplates,
  typescript: LanguageTemplates
};

// Loading spinner component
const LoadingSpinner = () => (
  <div className='flex items-center justify-center'>
    <div className='w-12 h-12 border-4 border-[#2F6868] border-t-transparent rounded-full animate-spin'></div>
  </div>
)

export default function App() {
  const proOptions = { hideAttribution: true }
  const [nodes, setNodes, onNodesChange] = useNodesState<CustomNodeType>(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState<CustomEdgeType>(initialEdges)
  const [generateCodeModalOpen, setGenerateCodeModalOpen] = useState(false)
  const [showOnboardingToast, setShowOnboardingToast] = useState(false)
  const reactFlowWrapper = useRef<any>(null)
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const { buttonTexts, updateButtonText } = useButtonText()
  const [maxNodeLength, setMaxNodeLength] = useState(0)
  const [maxEdgeLength, setMaxEdgeLength] = useState(0)
  const [conditionalGroupCount, setConditionalGroupCount] = useState(0)
  const { edgeLabels, updateEdgeLabel } = useEdgeLabel()
  const [activeFile, setActiveFile] = useState<'stub' | 'implementation' | 'spec' | 'graph' | 'state' | 'config'>('stub')
  const [generatedFiles, setGeneratedFiles] = useState<GeneratedFiles>({})
  const [initialOnboardingComplete, setInitialOnboardingComplete] = useState<boolean | null>(null)
  const [currentOnboardingStep, setCurrentOnboardingStep] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [infoPanelOpen, setInfoPanelOpen] = useState(false)
  const [justCopied, setJustCopied] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [generatedYamlSpec, setGeneratedYamlSpec] = useState<string>('')
  const [isTemplatesPanelOpen, setIsTemplatesPanelOpen] = useState(false)
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false)
  const [isServerConfigModalOpen, setIsServerConfigModalOpen] = useState(false)
  const [isTemplateConfigModalOpen, setIsTemplateConfigModalOpen] = useState(false)
  const [serverUrl, setServerUrl] = useState<string>('https://langgraph-gen-server-570601939772.us-central1.run.app')
  const [configValues, setConfigValues] = useState({
    name: 'CustomAgent',
    builder_name: 'builder',
    compiled_name: 'graph',
    config: 'config.Configuration',
    state: 'state.State',
    input: 'state.InputState',
    output: 'Any',
    implementation: 'implementation.IMPLEMENTATION',
    language: 'python' as 'python' | 'typescript'
  })
  const [skipTemplates, setSkipTemplates] = useState<string[]>([])
  const [availableTemplates, setAvailableTemplates] = useState<AvailableTemplates>({
    python: {},
    typescript: {}
  })
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false)
  const [templateError, setTemplateError] = useState<string | null>(null)
  const [customTemplates, setCustomTemplates] = useState<{[key: string]: string}>({})
  const [currentTemplates, setCurrentTemplates] = useState<{[key: string]: string}>({})

  const nodesRef = useRef(nodes)
  const edgesRef = useRef(edges)

  // Load config values from localStorage on mount
  useEffect(() => {
    try {
      // Load server URL
      const savedServerUrl = localStorage.getItem('lg-builder-server-url');
      if (savedServerUrl) {
        setServerUrl(savedServerUrl);
      }

      // Load skip templates
      const savedSkipTemplates = localStorage.getItem('lg-builder-skip-templates');
      if (savedSkipTemplates) {
        setSkipTemplates(JSON.parse(savedSkipTemplates));
      }

      // Load custom templates
      const savedCustomTemplates = localStorage.getItem('lg-builder-custom-templates');
      if (savedCustomTemplates) {
        const parsedTemplates = JSON.parse(savedCustomTemplates);
        setCustomTemplates(parsedTemplates);
        setCurrentTemplates(parsedTemplates); // Also set as current templates
      }

      // Load language preference
      const savedLanguage = localStorage.getItem('lg-builder-language');
      if (savedLanguage && (savedLanguage === 'python' || savedLanguage === 'typescript')) {
        setConfigValues(prev => ({
          ...prev,
          language: savedLanguage as 'python' | 'typescript'
        }));
      }

      // Load graph configuration
      const savedGraphConfig = localStorage.getItem('lg-builder-graph-config');
      if (savedGraphConfig) {
        try {
          const parsedConfig = JSON.parse(savedGraphConfig);
          setConfigValues(prev => ({
            ...prev,
            name: parsedConfig.name || prev.name,
            builder_name: parsedConfig.builder_name || prev.builder_name,
            compiled_name: parsedConfig.compiled_name || prev.compiled_name,
            config: parsedConfig.config || prev.config,
            state: parsedConfig.state || prev.state,
            input: parsedConfig.input || prev.input,
            output: parsedConfig.output || prev.output,
            implementation: parsedConfig.implementation || prev.implementation
          }));
        } catch (e) {
          console.error('Error parsing saved graph config:', e);
        }
      }
    } catch (error) {
      console.error('Error loading settings from localStorage:', error);
    }
  }, []);

  // Custom wrapper functions to update both state and localStorage
  const updateServerUrl = (url: string) => {
    setServerUrl(url);
    localStorage.setItem('lg-builder-server-url', url);
  };

  const updateSkipTemplates = (templates: string[]) => {
    setSkipTemplates(templates);
    localStorage.setItem('lg-builder-skip-templates', JSON.stringify(templates));
  };

  const updateCustomTemplates = (templates: {[key: string]: string}) => {
    setCustomTemplates(templates);
    localStorage.setItem('lg-builder-custom-templates', JSON.stringify(templates));
  };

  const updateLanguage = (lang: 'python' | 'typescript') => {
    setConfigValues(prev => ({
      ...prev,
      language: lang
    }));
    localStorage.setItem('lg-builder-language', lang);
  };

  // Function to fetch available templates from the server
  const fetchTemplates = async (baseUrl: string) => {
    setIsLoadingTemplates(true)
    setTemplateError(null)
    try {
      const response = await fetch('/api/get-templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          serverUrl: baseUrl
        })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch templates: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      if (!data.templates || !Array.isArray(data.templates) || data.templates.length === 0) {
        setTemplateError("No templates returned from server");
        setAvailableTemplates({
          python: {},
          typescript: {}
        });
        return;
      }
      
      // Organize templates by language and template type
      const templatesData: AvailableTemplates = {
        python: {},
        typescript: {}
      };
      
      data.templates.forEach((template: { language: 'python' | 'typescript', template_type: string, name: string, content: string }) => {
        const { language, template_type, name, content } = template;
        if (!templatesData[language]) {
          templatesData[language] = {};
        }
        if (!templatesData[language][template_type]) {
          templatesData[language][template_type] = { names: [], contentMap: {} };
        }
        templatesData[language][template_type].names.push(name);
        templatesData[language][template_type].contentMap[name] = content;
      });
      
      setAvailableTemplates(templatesData);
    } catch (error) {
      console.error('Error fetching templates:', error);
      setTemplateError(error instanceof Error ? error.message : 'Unknown error');
      setAvailableTemplates({
        python: {},
        typescript: {}
      });
    } finally {
      setIsLoadingTemplates(false);
    }
  };

  // Fetch templates when the server URL changes
  useEffect(() => {
    if (serverUrl) {
      fetchTemplates(serverUrl);
    }
  }, [serverUrl]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()

    window.addEventListener('resize', checkMobile)

    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const hasValidSourceToEndPath = useCallback(() => {
    if (!edges.length) return false

    const sourceNode = nodes.find((node) => node.type === 'source')
    const endNode = nodes.find((node) => node.type === 'end')

    if (!sourceNode || !endNode) return false

    const hasSourceEdge = edges.some((edge) => edge.source === sourceNode.id)
    const hasEndEdge = edges.some((edge) => edge.target === endNode.id)

    return hasSourceEdge && hasEndEdge
  }, [nodes, edges])

  useEffect(() => {
    nodesRef.current = nodes
    edgesRef.current = edges
    
    // Save the current graph to localStorage when nodes or edges change
    if (initialOnboardingComplete && nodes.length > 0) {
      try {
        const yaml = generateSpec(edges, nodes, configValues as YamlConfig);
        localStorage.setItem('lg-builder-yaml-spec', yaml);
      } catch (error) {
        console.error('Error saving graph to localStorage:', error);
      }
    }
  }, [nodes, edges, configValues, initialOnboardingComplete])

  useEffect(() => {
    const initialComplete = localStorage.getItem('initialOnboardingComplete')
    setInitialOnboardingComplete(initialComplete === 'true' ? true : false)
    
    // Load saved graph from localStorage if onboarding is complete
    if (initialComplete === 'true') {
      try {
        const savedYaml = localStorage.getItem('lg-builder-yaml-spec');
        if (savedYaml) {
          // Parse the YAML and recreate the graph
          const parsed = parseYamlSpec(savedYaml);
          if (parsed) {
            setGeneratedYamlSpec(savedYaml);
            
            // Update configuration values if present in the YAML
            if (parsed.name || parsed.builder_name || parsed.compiled_name || 
                parsed.config || parsed.state || parsed.input || 
                parsed.output || parsed.implementation || parsed.language) {
              
              const newConfig = {
                ...configValues,
                name: parsed.name || configValues.name,
                builder_name: parsed.builder_name || configValues.builder_name,
                compiled_name: parsed.compiled_name || configValues.compiled_name,
                config: parsed.config || configValues.config,
                state: parsed.state || configValues.state,
                input: parsed.input || configValues.input,
                output: parsed.output || configValues.output,
                implementation: parsed.implementation || configValues.implementation
              };
              
              if (parsed.language && (parsed.language === 'python' || parsed.language === 'typescript')) {
                newConfig.language = parsed.language;
              }
              
              setConfigValues(newConfig);
              
              // Save to localStorage
              localStorage.setItem('lg-builder-graph-config', JSON.stringify({
                name: newConfig.name,
                builder_name: newConfig.builder_name,
                compiled_name: newConfig.compiled_name,
                config: newConfig.config,
                state: newConfig.state,
                input: newConfig.input,
                output: newConfig.output,
                implementation: newConfig.implementation
              }));
              
              if (parsed.language && (parsed.language === 'python' || parsed.language === 'typescript')) {
                localStorage.setItem('lg-builder-language', parsed.language);
              }
            }
            
            // Create nodes from the YAML
            const newNodes = [
              // Add source and end nodes
              { id: 'source', type: 'source', position: { x: 0, y: 0 }, data: { label: 'source' } },
              { id: 'end', type: 'end', position: { x: 0, y: 600 }, data: { label: 'end' } },
              // Add custom nodes with evenly spaced positions
              ...parsed.nodes.map((node: YamlNode, index: number) => {
                // Calculate vertical spacing between nodes
                const totalHeight = 500; // Height between source and end nodes
                const numNodes = parsed.nodes.length;
                const spacing = totalHeight / (numNodes + 1);
                const yPosition = spacing * (index + 1) + 50; // Add 50px offset from source node
                
                // Alternate between left and right side for better visualization
                const xOffset = index % 2 === 0 ? -200 : 200;
                
                // Initialize button text for this node
                const nodeId = `node-${index + 1}`;
                updateButtonText(nodeId, node.name);
                
                return {
                  id: nodeId, // Use consistent ID format
                  type: 'custom',
                  position: { x: xOffset, y: yPosition },
                  data: { label: node.name }
                };
              })
            ];

            // Update maxNodeLength based on the number of loaded nodes
            setMaxNodeLength(parsed.nodes.length);

            // Create edges from the YAML
            const newEdges: Edge[] = [];
            
            // Process each edge from the YAML
            parsed.edges.forEach((edge: YamlEdge, index: number) => {
              if ('condition' in edge && edge.paths) {
                // Handle conditional edges
                const sourceNode = newNodes.find(n => n.data.label === edge.from);
                const sourceId = edge.from === '__start__' ? 'source' : 
                               edge.from === '__end__' ? 'end' : 
                               sourceNode?.id || '';
                               
                edge.paths.forEach((path, pathIndex) => {
                  const targetNode = newNodes.find(n => n.data.label === path);
                  const targetId = path === '__start__' ? 'source' : 
                                 path === '__end__' ? 'end' : 
                                 targetNode?.id || 'end';
                  
                  newEdges.push({
                    id: `edge-${index}-${pathIndex}`,
                    source: sourceId,
                    target: targetId,
                    animated: true,
                    type: 'self-connecting-edge',
                    label: edge.condition,
                    markerEnd: { type: MarkerType.ArrowClosed },
                    data: {
                      text: edge.condition || '',
                      edgeId: `edge-${index}-${pathIndex}`,
                      onEdgeLabelChange: (id: string, text: string) => {
                        updateEdgeLabel(id, text);
                      },
                      isConditional: true,
                      onEdgeUnselect: handleEdgeUnselect
                    }
                  });
                  
                  // Update the edge label context
                  if (edge.condition && sourceId) {
                    updateEdgeLabel(sourceId, edge.condition);
                  }
                });
              } else {
                // Handle normal edges
                const sourceNode = newNodes.find(n => n.data.label === edge.from);
                const targetNode = newNodes.find(n => n.data.label === edge.to);
                const sourceId = edge.from === '__start__' ? 'source' : 
                               edge.from === '__end__' ? 'end' : 
                               sourceNode?.id || '';
                const targetId = edge.to === '__start__' ? 'source' : 
                               edge.to === '__end__' ? 'end' : 
                               targetNode?.id || 'end';
                
                newEdges.push({
                  id: `edge-${index}`,
                  source: sourceId,
                  target: targetId,
                  type: 'self-connecting-edge',
                  markerEnd: { type: MarkerType.ArrowClosed },
                  data: {
                    text: '',
                    edgeId: `edge-${index}`,
                    onEdgeLabelChange: (id: string, text: string) => {
                      updateEdgeLabel(id, text);
                    },
                    isConditional: false,
                    onEdgeUnselect: handleEdgeUnselect
                  }
                });
              }
            });

            // Update edge labels from the stored edgeLabels
            for (const edge of newEdges) {
              if (edge.data && edgeLabels[edge.id]) {
                edge.data.text = edgeLabels[edge.id];
              }
            }

            setNodes(newNodes);
            setEdges(newEdges);
            console.log('Loaded graph from localStorage');
            
            // Adjust all node sizes after a brief timeout to ensure the DOM is ready
            setTimeout(() => {
              document.querySelectorAll('input[type="text"]').forEach((input) => {
                // Force the input events to trigger size adjustment
                const event = new Event('input', { bubbles: true });
                input.dispatchEvent(event);
              });
            }, 200);
          }
        }
      } catch (error) {
        console.error('Error loading graph from localStorage:', error);
      }
    }
  }, [])

  const onboardingSteps = getOnboardingSteps(isMobile)

  const handleOnboardingNext = () => {
    if (currentOnboardingStep === onboardingSteps.length - 1) {
      localStorage.setItem('initialOnboardingComplete', 'true')
      setInitialOnboardingComplete(true)
    } else {
      if (currentOnboardingStep === onboardingSteps.length - 2) {
        setNodes(initialNodes)
        setEdges(initialEdges)
      }
      setCurrentOnboardingStep((prev) => prev + 1)
    }
  }

  const handleRestartOnboarding = () => {
    localStorage.setItem('initialOnboardingComplete', 'false')
    setInitialOnboardingComplete(false)
    setCurrentOnboardingStep(0)
    setInfoPanelOpen(false)
  }

  const handleNodesChange = useCallback(
    (changes: any) => {
      onNodesChange(changes)
    },
    [onNodesChange],
  )

  const handleEdgesChange = useCallback(
    (changes: any) => {
      onEdgesChange(changes)
    },
    [onEdgesChange],
  )

  const onConnectStart: OnConnectStart = useCallback(() => {
    setIsConnecting(true)
  }, [nodes, setIsConnecting])

  const onConnect: OnConnect = useCallback(
    (connection) => {
      const edgeId = `edge-${maxEdgeLength + 1}`
      setMaxEdgeLength((prev) => prev + 1)

      const existingSourceEdges = edges.filter((edge) => edge.source === connection.source)
      let defaultLabel = 'conditional_edge'
      let newCount = conditionalGroupCount

      if (existingSourceEdges.length > 0) {
        // Check if there's a template edge label we should preserve
        const templateLabel = existingSourceEdges[0].label?.toString()
        if (templateLabel && !templateLabel.startsWith('conditional_edge')) {
          defaultLabel = templateLabel
        } else {
          const hasAnimatedEdges = existingSourceEdges.some((edge) => edge.animated)
          if (!hasAnimatedEdges) {
            newCount = conditionalGroupCount + 1
            setConditionalGroupCount(newCount)
          }
          defaultLabel = `conditional_edge_${newCount}`
        }
      }

      console.log('Creating new edge with id:', edgeId, 'and label:', defaultLabel);
      
      const newEdge: CustomEdgeType = {
        ...connection,
        id: edgeId,
        markerEnd: { type: MarkerType.ArrowClosed },
        type: 'self-connecting-edge',
        animated: connection.source === connection.target,
        label: defaultLabel,
      }

      setEdges((prevEdges) => {
        const updatedEdges = addEdge(newEdge, prevEdges)
        const sourceEdges = updatedEdges.filter((edge) => edge.source === connection.source)
        if (sourceEdges.length > 1) {
          console.log('Multiple edges from same source, setting animated to true');
          return updatedEdges.map((edge) =>
            edge.source === connection.source
              ? {
                  ...edge,
                  animated: true,
                  label: defaultLabel,
                }
              : edge,
          )
        }
        return updatedEdges
      })
      
      // Update the edge label context so that the SelfConnectingEdge component can access it
      if (connection.source) {
        console.log('Updating edge label for source:', connection.source, 'to:', defaultLabel);
        updateEdgeLabel(connection.source, defaultLabel);
      }
      
      setIsConnecting(false)
    },
    [setEdges, edges, conditionalGroupCount, buttonTexts, updateEdgeLabel, edgeLabels, maxEdgeLength],
  )

  const addNode = useCallback(
    (event: React.MouseEvent) => {
      if (isConnecting) {
        setIsConnecting(false)
        return
      }

      if (reactFlowWrapper) {
        const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect()

        const position = reactFlowInstance.screenToFlowPosition({
          x: event.clientX - reactFlowBounds.left,
          y: event.clientY - reactFlowBounds.top,
        })

        const newNodeLabel = `Node ${maxNodeLength + 1}`
        const newNode: CustomNodeType = {
          id: `node-${maxNodeLength + 1}`,
          type: 'custom',
          position,
          selected: true,
          data: { label: newNodeLabel },
        }
        setMaxNodeLength(maxNodeLength + 1)

        setNodes((prevNodes) => {
          return applyNodeChanges(
            [
              {
                type: 'add',
                item: newNode,
              },
            ],
            prevNodes,
          )
        })
      }
    },
    [nodes, setNodes, reactFlowInstance, reactFlowWrapper, isConnecting, applyNodeChanges, maxNodeLength],
  )

  const handlePaneClick = useCallback(
    (event: React.MouseEvent) => {
      const isCmdOrCtrlPressed = event.metaKey || event.ctrlKey
      if (isCmdOrCtrlPressed) {
        if (initialOnboardingComplete === false) {
          setShowOnboardingToast(true)
          setTimeout(() => setShowOnboardingToast(false), 3000)
          return
        }
        addNode(event)
      }
    },
    [addNode, initialOnboardingComplete],
  )

  const onEdgeClick = useCallback(
    (event: React.MouseEvent, edge: Edge) => {
      const isCmdOrCtrlPressed = event.metaKey || event.ctrlKey
      if (isCmdOrCtrlPressed) {
        setEdges((eds) => eds.map((e) => (e.id === edge.id ? { ...e, animated: !e.animated } : e)))
      }
    },
    [setEdges],
  )

  const handleEdgeUnselect = (edgeId: string) => {
    setEdges((eds) =>
      eds.map((edge) => ({
        ...edge,
        selected: edge.id === edgeId ? false : edge.selected,
      })),
    )
  }

  const flowNodes =
    !initialOnboardingComplete &&
    currentOnboardingStep < onboardingSteps.length &&
    onboardingSteps[currentOnboardingStep].nodes
      ? onboardingSteps[currentOnboardingStep].nodes
      : nodes

  const flowEdges =
    !initialOnboardingComplete &&
    currentOnboardingStep < onboardingSteps.length &&
    onboardingSteps[currentOnboardingStep].edges
      ? onboardingSteps[currentOnboardingStep].edges
      : edges.map((edge) => ({
          ...edge,
          data: {
            ...edge.data,
            onEdgeUnselect: handleEdgeUnselect,
          },
        }))

  const handleLanguageChange = async (option: string) => {
    const newLanguage = option.toLowerCase() as 'python' | 'typescript'
    if (newLanguage === configValues.language) return;
    
    updateLanguage(newLanguage);
    
    // Update the YAML spec with new file extensions
    setGeneratedYamlSpec(generateSpec(edges, nodes, configValues as YamlConfig, newLanguage))
    
    // If we have code generated already, fetch the alternative language
    if (Object.keys(generatedFiles).length > 0) {
      await generateCodeWithLanguage(newLanguage, true)
    }
    
    // Make sure the active file is available in the new language
    if (activeFile !== 'spec' && !generatedFiles[newLanguage]?.[activeFile]) {
      // Current file isn't available, find the first available one in the preferred order
      if (generatedYamlSpec) {
        setActiveFile('spec');
      } else {
        // Check each file type in the specified order and select the first one with content
        const orderedFileTypes = ['graph', 'stub', 'implementation', 'state', 'config'] as const;
        for (const fileType of orderedFileTypes) {
          if (generatedFiles[newLanguage]?.[fileType]) {
            setActiveFile(fileType);
            break;
          }
        }
      }
    }
  }

  const generateCodeWithLanguage = async (lang: 'python' | 'typescript' = configValues.language, keepExistingFiles: boolean = false) => {
    try {
      setIsLoading(true)
      if (!generateCodeModalOpen) {
        setGenerateCodeModalOpen(true)
      }
      
      const spec = generateSpec(edges, nodes, configValues as YamlConfig, lang)
      setGeneratedYamlSpec(spec)
      
      // Make sure the server URL doesn't end with a trailing slash
      const baseServerUrl = serverUrl.endsWith('/') 
        ? serverUrl.substring(0, serverUrl.length - 1) 
        : serverUrl;
      const generateEndpoint = `${baseServerUrl}/generate`;

      const response = await fetch('/api/generate-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          spec: spec,
          language: lang,
          format: 'yaml',
          serverUrl: generateEndpoint,
          skip: skipTemplates.length > 0 ? skipTemplates : null,
          templates: currentTemplates,
          configValues: configValues,
        }),
      });

      const data = await response.json();

      // Update generated files
      if (keepExistingFiles) {
        // Keep files for the other language, update only the requested language
        setGeneratedFiles(prev => ({
          ...prev,
          [lang]: {
            stub: data.stub,
            implementation: data.implementation,
            graph: data.graph,
            state: data.state,
            config: data.config,
          }
        }));
      } else {
        // Replace all files
        setGeneratedFiles({
          [lang]: {
            stub: data.stub,
            implementation: data.implementation,
            graph: data.graph,
            state: data.state,
            config: data.config,
          }
        });
      }
      
      // Set initial active file - prefer spec if it exists, otherwise check files in the specified order
      if (generatedYamlSpec) {
        setActiveFile('spec');
      } else {
        // Check each file type in the specified order and select the first one with content
        const orderedFileTypes = ['graph', 'stub', 'implementation', 'state', 'config'] as const;
        for (const fileType of orderedFileTypes) {
          if (data[fileType]) {
            setActiveFile(fileType);
            break;
          }
        }
      }
    } catch (error) {
      console.error('Failed to generate code:', error);
      setGeneratedFiles({});
    } finally {
      setIsLoading(false);
    }
  }

  const handleGenerateCode = () => {
    generateCodeWithLanguage(configValues.language || 'python');
  }

  // Handle template change for a specific file type
  const handleTemplateChange = async (fileType: string, templateName: string) => {
    // Save current active file
    const prevActiveFile = activeFile;
    
    // Update current template selection
    const updatedTemplates: {[key: string]: string} = { ...currentTemplates };
    
    if (templateName === 'default') {
      // If 'default' is selected, remove the entry
      delete updatedTemplates[fileType];
    } else {
      // Otherwise set the template name
      updatedTemplates[fileType] = templateName;
    }
    
    setCurrentTemplates(updatedTemplates);
    
    // Regenerate code with new template
    setIsLoading(true);
    
    try {
      const lang = configValues.language;
      const spec = generateSpec(edges, nodes, configValues as YamlConfig, lang);
      
      const baseServerUrl = serverUrl.endsWith('/') 
        ? serverUrl.substring(0, serverUrl.length - 1) 
        : serverUrl;
      const generateEndpoint = `${baseServerUrl}/generate`;
      
      const response = await fetch('/api/generate-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          spec: spec,
          language: lang,
          format: 'yaml',
          serverUrl: generateEndpoint,
          skip: skipTemplates.length > 0 ? skipTemplates : null,
          templates: updatedTemplates,  // Use the updated templates
          configValues: configValues,
        }),
      });
      
      const data = await response.json();
      
      // Update generated files
      setGeneratedFiles(prev => ({
        ...prev,
        [lang]: {
          stub: data.stub,
          implementation: data.implementation,
          graph: data.graph,
          state: data.state,
          config: data.config,
        }
      }));
      
      // Restore previous active file
      setActiveFile(prevActiveFile);
    } catch (error) {
      console.error('Failed to regenerate code:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const activeCode = activeFile === 'spec' 
    ? generatedYamlSpec 
    : generatedFiles[configValues.language]?.[activeFile] || ''
  const fileExtension = configValues.language === 'python' ? '.py' : '.ts'

  // New helper to copy active code to the clipboard
  const copyActiveCode = () => {
    if (activeCode) {
      navigator.clipboard
        .writeText(activeCode)
        .then(() => {
          setJustCopied(true)
          setTimeout(() => setJustCopied(false), 1500)
        })
        .catch((err) => console.error('Failed to copy code: ', err))
    }
  }

  const handleTemplateSelect = (template: Template) => {
    setNodes(template.nodes)
    setEdges(template.edges)
    setIsTemplatesPanelOpen(false)
  }

  // Function to update graph configuration and save to localStorage
  const updateGraphConfig = (newGraphConfig: {
    name: string;
    builder_name: string;
    compiled_name: string;
    config: string;
    state: string;
    input: string;
    output: string;
    implementation: string;
  }) => {
    setConfigValues(prev => ({
      ...prev,
      ...newGraphConfig
    }));
    localStorage.setItem('lg-builder-graph-config', JSON.stringify(newGraphConfig));
  };

  return (
    <div className='w-screen h-screen'>
      <div className='absolute top-5 left-5 z-50 flex gap-2'>
        <button
          onClick={() => initialOnboardingComplete && setIsTemplatesPanelOpen(!isTemplatesPanelOpen)}
          className={`flex items-center gap-2 px-3 py-2 bg-white rounded-lg shadow-md transition-shadow ${
            !initialOnboardingComplete ? 'cursor-not-allowed opacity-70' : 'hover:shadow-lg'
          }`}
          disabled={!initialOnboardingComplete}
        >
          <svg
            xmlns='http://www.w3.org/2000/svg'
            width='16'
            height='16'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
          >
            <rect x='3' y='3' width='18' height='18' rx='2' ry='2'></rect>
            <line x1='3' y1='9' x2='21' y2='9'></line>
            <line x1='9' y1='21' x2='9' y2='9'></line>
          </svg>
          Templates
        </button>

        <label
          className={`flex items-center gap-2 px-3 py-2 bg-white rounded-lg shadow-md transition-shadow cursor-pointer ${
            !initialOnboardingComplete ? 'cursor-not-allowed opacity-70' : 'hover:shadow-lg'
          }`}
        >
          <input
            type="file"
            accept=".yml,.yaml"
            className="hidden"
            onChange={(e) => {
              if (!e.target.files?.length) return;
              const file = e.target.files[0];
              const reader = new FileReader();
              reader.onload = (event) => {
                if (!event.target?.result) return;
                const content = event.target.result as string;
                const parsed = parseYamlSpec(content);
                if (!parsed) {
                  alert('Failed to parse YAML file');
                  return;
                }
                
                // Update configuration values
                const newConfig = {
                  name: parsed.name || 'CustomAgent',
                  builder_name: parsed.builder_name || 'builder',
                  compiled_name: parsed.compiled_name || 'graph',
                  config: parsed.config || 'config.Configuration',
                  state: parsed.state || 'state.State',
                  input: parsed.input || 'state.InputState',
                  output: parsed.output || 'Any',
                  implementation: parsed.implementation || 'implementation.IMPLEMENTATION',
                  language: parsed.language || configValues.language
                };

                // Save to localStorage
                localStorage.setItem('lg-builder-graph-config', JSON.stringify({
                  name: newConfig.name,
                  builder_name: newConfig.builder_name,
                  compiled_name: newConfig.compiled_name,
                  config: newConfig.config,
                  state: newConfig.state,
                  input: newConfig.input,
                  output: newConfig.output,
                  implementation: newConfig.implementation
                }));
                
                if (parsed.language && (parsed.language === 'python' || parsed.language === 'typescript') && 
                    parsed.language !== configValues.language) {
                  localStorage.setItem('lg-builder-language', parsed.language);
                }
                
                setConfigValues(newConfig);

                // Create nodes from the YAML
                const newNodes = [
                  // Add source and end nodes
                  { id: 'source', type: 'source', position: { x: 0, y: 0 }, data: { label: 'source' } },
                  { id: 'end', type: 'end', position: { x: 0, y: 600 }, data: { label: 'end' } },
                  // Add custom nodes with evenly spaced positions
                  ...parsed.nodes.map((node, index) => {
                    // Calculate vertical spacing between nodes
                    const totalHeight = 500; // Height between source and end nodes
                    const numNodes = parsed.nodes.length;
                    const spacing = totalHeight / (numNodes + 1);
                    const yPosition = spacing * (index + 1) + 50; // Add 50px offset from source node
                    
                    // Alternate between left and right side for better visualization
                    const xOffset = index % 2 === 0 ? -200 : 200;
                    
                    // Initialize button text for this node
                    const nodeId = `node-${index + 1}`;
                    updateButtonText(nodeId, node.name);
                    
                    return {
                      id: nodeId, // Use consistent ID format
                      type: 'custom',
                      position: { x: xOffset, y: yPosition },
                      data: { label: node.name }
                    };
                  })
                ];

                // Update maxNodeLength based on the number of loaded nodes
                setMaxNodeLength(parsed.nodes.length);

                // Create edges from the YAML
                const newEdges: Edge[] = [];
                
                // Process each edge from the YAML
                parsed.edges.forEach((edge, index) => {
                  if ('condition' in edge && edge.paths) {
                    // Handle conditional edges
                    const sourceNode = newNodes.find(n => n.data.label === edge.from);
                    const sourceId = edge.from === '__start__' ? 'source' : 
                                   edge.from === '__end__' ? 'end' : 
                                   sourceNode?.id || '';
                                   
                    edge.paths.forEach((path, pathIndex) => {
                      const targetNode = newNodes.find(n => n.data.label === path);
                      const targetId = path === '__start__' ? 'source' : 
                                     path === '__end__' ? 'end' : 
                                     targetNode?.id || 'end';
                      
                      newEdges.push({
                        id: `edge-${index}-${pathIndex}`,
                        source: sourceId,
                        target: targetId,
                        animated: true,
                        type: 'self-connecting-edge',
                        label: edge.condition,
                        markerEnd: { type: MarkerType.ArrowClosed },
                        data: {
                          text: edge.condition || '',
                          edgeId: `edge-${index}-${pathIndex}`,
                          onEdgeLabelChange: (id: string, text: string) => {
                            updateEdgeLabel(id, text);
                          },
                          isConditional: true,
                          onEdgeUnselect: handleEdgeUnselect
                        }
                      });
                      
                      // Update the edge label context
                      if (edge.condition && sourceId) {
                        updateEdgeLabel(sourceId, edge.condition);
                      }
                    });
                  } else {
                    // Handle normal edges
                    const sourceNode = newNodes.find(n => n.data.label === edge.from);
                    const targetNode = newNodes.find(n => n.data.label === edge.to);
                    const sourceId = edge.from === '__start__' ? 'source' : 
                                   edge.from === '__end__' ? 'end' : 
                                   sourceNode?.id || '';
                    const targetId = edge.to === '__start__' ? 'source' : 
                                   edge.to === '__end__' ? 'end' : 
                                   targetNode?.id || 'end';
                    
                    newEdges.push({
                      id: `edge-${index}`,
                      source: sourceId,
                      target: targetId,
                      type: 'self-connecting-edge',
                      markerEnd: { type: MarkerType.ArrowClosed },
                      data: {
                        text: '',
                        edgeId: `edge-${index}`,
                        onEdgeLabelChange: (id: string, text: string) => {
                          updateEdgeLabel(id, text);
                        },
                        isConditional: false,
                        onEdgeUnselect: handleEdgeUnselect
                      }
                    });
                  }
                });

                // Update maxEdgeLength based on the number of loaded edges
                setMaxEdgeLength(newEdges.length);

                // Update the graph
                setNodes(newNodes);
                setEdges(newEdges);
                
                // Adjust all node sizes after a brief timeout to ensure the DOM is ready
                setTimeout(() => {
                  document.querySelectorAll('input[type="text"]').forEach((input) => {
                    // Force the input events to trigger size adjustment
                    const event = new Event('input', { bubbles: true });
                    input.dispatchEvent(event);
                  });
                }, 200);
              };
              reader.readAsText(file);
            }}
          />
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          Load Spec
        </label>

        <button
          onClick={() => {
            const spec = generateSpec(edges, nodes, configValues as YamlConfig)
            downloadFile(spec, 'spec.yml')
          }}
          className={`flex items-center gap-2 px-3 py-2 bg-white rounded-lg shadow-md transition-shadow ${
            !initialOnboardingComplete ? 'cursor-not-allowed opacity-70' : 'hover:shadow-lg'
          }`}
          disabled={!initialOnboardingComplete}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Download Spec
        </button>

        <button
          onClick={() => {
            if (confirm('Are you sure you want to clear your saved graph? This action cannot be undone.')) {
              localStorage.removeItem('lg-builder-yaml-spec');
              localStorage.removeItem('lg-builder-edge-labels');
              // Reset to initial state
              setNodes(initialNodes);
              setEdges(initialEdges);
              setGeneratedYamlSpec('');
              setGeneratedFiles({});
              
              // Reset edge labels in context
              const edgeLabelKeys = Object.keys(edgeLabels);
              if (edgeLabelKeys.length > 0) {
                edgeLabelKeys.forEach(key => {
                  updateEdgeLabel(key, '');
                });
              }
            }
          }}
          className={`flex items-center gap-2 px-3 py-2 bg-white rounded-lg shadow-md transition-shadow ${
            !initialOnboardingComplete ? 'cursor-not-allowed opacity-70' : 'hover:shadow-lg'
          }`}
          disabled={!initialOnboardingComplete}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 6h18"></path>
            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
            <line x1="10" y1="11" x2="10" y2="17"></line>
            <line x1="14" y1="11" x2="14" y2="17"></line>
          </svg>
          Clear Graph
        </button>
      </div>
      <div className='absolute top-5 right-5 z-50 flex gap-2'>
        <div className='flex flex-row gap-2'>
          <Tooltip
            title={!hasValidSourceToEndPath() && initialOnboardingComplete ? 'Create a valid graph to generate code' : ''}
            placement='bottom'
            arrow
          >
            <button
              className={`py-2 px-3 rounded-md transition-colors duration-200 ${
                !initialOnboardingComplete
                  ? currentOnboardingStep >= 3
                    ? 'bg-[#2F6868] cursor-not-allowed opacity-100'
                    : 'bg-gray-500 opacity-70 cursor-not-allowed'
                  : hasValidSourceToEndPath()
                    ? 'bg-[#2F6868] cursor-pointer hover:bg-[#245757]'
                    : 'bg-gray-500 opacity-70 cursor-not-allowed'
              }`}
              onClick={hasValidSourceToEndPath() && initialOnboardingComplete ? handleGenerateCode : undefined}
              disabled={!hasValidSourceToEndPath() || !initialOnboardingComplete}
            >
              <div className='text-[#333333] font-medium text-center text-slate-100'>Generate Code</div>
            </button>
          </Tooltip>

          <Tooltip
            title="Configure Templates"
            placement='bottom'
            arrow
          >
            <button
              disabled={!initialOnboardingComplete}
              className={`p-3 rounded-md shadow-lg border border-[#2F6868] text-[#2F6868] focus:outline-none ${
                !initialOnboardingComplete ? 'cursor-not-allowed' : ''
              }`}
              aria-label='Templates Configuration'
              onClick={() => setIsTemplateConfigModalOpen(true)}
            >
              <div className="flex items-center gap-2">
                <Settings className='h-6 w-6' />
                <span className="text-sm">Code</span>
              </div>
            </button>
          </Tooltip>

          <Tooltip
            title="Configure API Server URL"
            placement='bottom'
            arrow
          >
            <button
              disabled={!initialOnboardingComplete}
              className={`p-3 rounded-md shadow-lg border border-[#2F6868] text-[#2F6868] focus:outline-none ${
                !initialOnboardingComplete ? 'cursor-not-allowed' : ''
              }`}
              aria-label='Server Configuration'
              onClick={() => setIsServerConfigModalOpen(true)}
            >
              <div className="flex items-center gap-2">
                <Settings className='h-6 w-6' />
                <span className="text-sm">API</span>
              </div>
            </button>
          </Tooltip>

          <Tooltip
            title="Configure Graph Settings"
            placement='bottom'
            arrow
          >
            <button
              disabled={!initialOnboardingComplete}
              className={`p-3 rounded-md shadow-lg border border-[#2F6868] text-[#2F6868] focus:outline-none ${
                !initialOnboardingComplete ? 'cursor-not-allowed' : ''
              }`}
              aria-label='Graph Configuration'
              onClick={() => setIsConfigModalOpen(true)}
            >
              <div className="flex items-center gap-2">
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  width='24'
                  height='24'
                  viewBox='0 0 24 24'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth='2'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                >
                  <circle cx='12' cy='12' r='3'></circle>
                  <path d='M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z'></path>
                </svg>
                <span className="text-sm">Graph</span>
              </div>
            </button>
          </Tooltip>

          <Tooltip
            title="Toggle Information Panel"
            placement='bottom'
            arrow
          >
            <button
              disabled={!initialOnboardingComplete}
              className={`p-3 rounded-md shadow-lg border border-[#2F6868] text-[#2F6868] focus:outline-none ${
                !initialOnboardingComplete ? 'cursor-not-allowed' : ''
              }`}
              aria-label='Toggle Information Panel'
              onClick={() => setInfoPanelOpen(!infoPanelOpen)}
            >
              <Info className='h-6 w-6' />
            </button>
          </Tooltip>
        </div>
      </div>

      {isTemplatesPanelOpen && (
        <TemplatesPanel onSelectTemplate={handleTemplateSelect} onClose={() => setIsTemplatesPanelOpen(false)} />
      )}

      <div ref={reactFlowWrapper} className='no-scrollbar no-select' style={{ width: '100vw', height: '100vh' }}>
        <ColorEditingProvider>
          {!initialOnboardingComplete && (
            <style>
              {`
                .react-flow__node,
                .react-flow__node *,
                .react-flow__node:hover,
                .react-flow__node:hover * {
                  cursor: not-allowed !important;
                  pointer-events: none !important;
                }
              `}
            </style>
          )}
          <ReactFlow<CustomNodeType, CustomEdgeType>
            nodes={flowNodes}
            nodeTypes={nodeTypes}
            onEdgeClick={onEdgeClick}
            onNodesChange={handleNodesChange}
            edges={flowEdges?.map((edge) => ({
              ...edge,
              data: {
                ...edge.data,
              },
            }))}
            edgeTypes={edgeTypes}
            onEdgesChange={handleEdgesChange}
            onConnect={onConnect}
            onInit={setReactFlowInstance}
            fitView
            onConnectStart={onConnectStart}
            className='z-10 bg-[#EAEAEA]'
            style={{ backgroundColor: '#EAEAEA' }}
            proOptions={proOptions}
            zoomOnDoubleClick={false}
            onPaneClick={handlePaneClick}
          >
            <Background />
          </ReactFlow>
        </ColorEditingProvider>

        <Snackbar
          open={showOnboardingToast}
          onClose={() => setShowOnboardingToast(false)}
          autoHideDuration={3000}
          color='neutral'
          variant='outlined'
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          Canvas interaction is temporarily disabled during onboarding
        </Snackbar>

        <div className='sm:hidden z-20 absolute top-0 left-0 w-full h-full flex items-center justify-center bg-black bg-opacity-50'>
          <GenericModal
            imageUrl='/langgraph-logo.png'
            onButtonClick={() => {
              window.location.href = 'sms:&body=build.langchain.com'
            }}
            isOpen={true}
            onClose={() => {}}
            title='Desktop Only'
            content='LangGraph Builder is not supported on mobile devices'
            buttonText='Text me the link'
          />
        </div>
        <div className='hidden sm:block'>
          {/* Sidebar */}
          <KeyCommandsModal 
            isOpen={infoPanelOpen}
            onClose={() => setInfoPanelOpen(false)}
            onRedoOnboarding={handleRestartOnboarding}
          />

          {initialOnboardingComplete === false && currentOnboardingStep < onboardingSteps.length && (
            <div
              className='fixed inset-0 z-10'
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                zIndex: 10,
                pointerEvents: 'none',
              }}
            >
              <OnboardingContent
                currentStep={currentOnboardingStep}
                onboardingSteps={onboardingSteps}
                onNext={handleOnboardingNext}
                reactFlowInstance={reactFlowInstance}
              />
            </div>
          )}

          {initialOnboardingComplete === false && currentOnboardingStep === 5 && <MockColorPicker />}

          <MuiModal
            hideBackdrop={true}
            onClose={() => {
              setGenerateCodeModalOpen(false)
            }}
            onClick={(e: React.MouseEvent) => {
              if (e.target === e.currentTarget) {
                setGenerateCodeModalOpen(false)
              }
            }}
            open={generateCodeModalOpen}
          >
            <ModalDialog className='bg-slate-150 hidden sm:block absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2'>
              <>
                <div className='flex flex-col'>
                  {!isLoading && (generatedFiles[configValues.language?.toLowerCase() as 'python' | 'typescript']?.stub || generatedFiles[configValues.language?.toLowerCase() as 'python' | 'typescript']?.implementation) && (
                    <div className='flex flex-row justify-between items-center'>
                      <div className='flex items-center gap-3'>
                        <h2 className='md:text-lg font-medium'>Generated Code:</h2>
                        
                        {/* Template selection dropdown - only show for non-spec files */}
                        {activeFile !== 'spec' && availableTemplates[configValues.language] && availableTemplates[configValues.language][activeFile] && (
                          <div className='flex items-center'>
                            <select
                              className='px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2F6868] focus:border-transparent'
                              value={currentTemplates[activeFile] || 'default'}
                              onChange={(e) => handleTemplateChange(activeFile, e.target.value)}
                            >
                              <option value="default">Default Template</option>
                              {!templateError && 
                               availableTemplates[configValues.language][activeFile]?.names?.length > 0 && 
                               availableTemplates[configValues.language][activeFile].names.map(template => (
                                <option key={template} value={template}>{template}</option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>
                      <div className='flex py-3 md:py-0 flex-row gap-2'>
                        <button
                          onClick={() => downloadAsZip(generatedFiles, generatedYamlSpec, configValues.language || 'python')}
                          className='px-3 rounded-t-md bg-white rounded-b-md border border-gray-300 hover:bg-gray-50'
                          title='Download as ZIP'
                        >
                          <Download size={18} />
                        </button>
                        <div className='max-w-xs pr-3'>
                          <MultiButton 
                            onSelectionChange={(option) => handleLanguageChange(option)}
                            initialSelection={configValues.language === 'typescript' ? 'TypeScript' : 'Python'}
                          />
                        </div>
                        <button
                          className='font-bold pr-3 text-gray-400 hover:text-gray-600 transition-colors duration-300 ease-in-out'
                          onClick={() => {
                            setGenerateCodeModalOpen(false)
                          }}
                        >
                          <X size={25} />
                        </button>
                      </div>
                    </div>
                  )}

                  <div className='flex flex-col gap-3'>
                    {!isLoading && (generatedFiles[configValues.language?.toLowerCase() as 'python' | 'typescript']?.stub || generatedFiles[configValues.language?.toLowerCase() as 'python' | 'typescript']?.implementation) ? (
                      <div className='mt-3 md:w-[50vw] md:h-[80vh]'>
                        <div className='flex flex-wrap'>
                          {/* Tabs in specific order: spec, graph, stub, implementation, others */}
                          {/* spec tab */}
                          {generatedYamlSpec && (
                            <button
                              className={`px-3 rounded-t-md ${activeFile === 'spec' ? 'bg-[#246161] text-white' : 'bg-gray-200'}`}
                              onClick={() => setActiveFile('spec')}
                            >
                              spec.yml
                            </button>
                          )}
                          
                          {/* graph tab */}
                          {generatedFiles[configValues.language?.toLowerCase() as 'python' | 'typescript']?.graph && (
                            <button
                              key="graph"
                              className={`px-3 rounded-t-md ${activeFile === 'graph' ? 'bg-[#246161] text-white' : 'bg-gray-200'}`}
                              onClick={() => setActiveFile('graph')}
                            >
                              {`graph${fileExtension}`}
                            </button>
                          )}
                          
                          {/* stub tab */}
                          {generatedFiles[configValues.language?.toLowerCase() as 'python' | 'typescript']?.stub && (
                            <button
                              key="stub"
                              className={`px-3 rounded-t-md ${activeFile === 'stub' ? 'bg-[#246161] text-white' : 'bg-gray-200'}`}
                              onClick={() => setActiveFile('stub')}
                            >
                              {`stub${fileExtension}`}
                            </button>
                          )}
                          
                          {/* implementation tab */}
                          {generatedFiles[configValues.language?.toLowerCase() as 'python' | 'typescript']?.implementation && (
                            <button
                              key="implementation"
                              className={`px-3 rounded-t-md ${activeFile === 'implementation' ? 'bg-[#246161] text-white' : 'bg-gray-200'}`}
                              onClick={() => setActiveFile('implementation')}
                            >
                              {`implementation${fileExtension}`}
                            </button>
                          )}
                          
                          {/* state tab */}
                          {generatedFiles[configValues.language?.toLowerCase() as 'python' | 'typescript']?.state && (
                            <button
                              key="state"
                              className={`px-3 rounded-t-md ${activeFile === 'state' ? 'bg-[#246161] text-white' : 'bg-gray-200'}`}
                              onClick={() => setActiveFile('state')}
                            >
                              {`state${fileExtension}`}
                            </button>
                          )}
                          
                          {/* config tab */}
                          {generatedFiles[configValues.language?.toLowerCase() as 'python' | 'typescript']?.config && (
                            <button
                              key="config"
                              className={`px-3 rounded-t-md ${activeFile === 'config' ? 'bg-[#246161] text-white' : 'bg-gray-200'}`}
                              onClick={() => setActiveFile('config')}
                            >
                              {`config${fileExtension}`}
                            </button>
                          )}
                          
                          {/* Any other file types not explicitly handled above */}
                          {Object.keys(generatedFiles[configValues.language?.toLowerCase() as 'python' | 'typescript'] || {})
                            .filter(fileType => 
                              fileType !== 'spec' && 
                              fileType !== 'graph' && 
                              fileType !== 'stub' && 
                              fileType !== 'implementation' && 
                              fileType !== 'state' && 
                              fileType !== 'config')
                            .map(fileType => (
                              <button
                                key={fileType}
                                className={`px-3 rounded-t-md ${activeFile === fileType ? 'bg-[#246161] text-white' : 'bg-gray-200'}`}
                                onClick={() => setActiveFile(fileType as any)}
                              >
                                {`${fileType}${fileExtension}`}
                              </button>
                            ))
                          }
                        </div>
                        <div className='relative bg-gray-100 overflow-hidden h-[calc(80vh-30px)]'>
                          <div className='absolute top-5 right-6 z-10 flex gap-2'>
                            <button
                              onClick={() => downloadFile(activeCode, activeFile === 'spec' ? 'spec.yml' : `${activeFile}${fileExtension}`)}
                              className='p-1 bg-white rounded border border-gray-300 hover:bg-gray-50'
                              title='Download file'
                            >
                              <Download size={18} />
                            </button>
                            <button
                              onClick={copyActiveCode}
                              className='p-1 bg-white rounded border border-gray-300 hover:bg-gray-50'
                              title='Copy code to clipboard'
                            >
                              {justCopied ? <Check size={18} /> : <Copy size={18} />}
                            </button>
                          </div>
                          <Highlight
                            theme={themes.nightOwl}
                            code={activeCode}
                            language={activeFile === 'spec' ? 'yaml' : configValues.language === 'python' ? 'python' : 'typescript'}
                          >
                            {({ style, tokens, getLineProps, getTokenProps }) => (
                              <pre className='p-3 overflow-auto h-full max-h-full' style={{ ...style, height: '100%' }}>
                                {tokens.map((line, i) => (
                                  <div key={i} {...getLineProps({ line })}>
                                    {line.map((token, key) => (
                                      <span key={key} {...getTokenProps({ token })} />
                                    ))}
                                  </div>
                                ))}
                              </pre>
                            )}
                          </Highlight>
                        </div>
                      </div>
                    ) : (
                      <div className='mt-3 md:w-[50vw] md:h-[80vh] flex items-center justify-center'>
                        <div className='flex flex-col items-center gap-4'>
                          <div className='flex'>
                            <LoadingSpinner />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            </ModalDialog>
          </MuiModal>
        </div>
      </div>
      <ConfigModal
        isOpen={isServerConfigModalOpen}
        onClose={() => setIsServerConfigModalOpen(false)}
        title="Server Configuration"
      >
        <ServerConfigModal
          serverUrl={serverUrl}
          onSave={({ serverUrl: newServerUrl }) => {
            updateServerUrl(newServerUrl);
            setIsServerConfigModalOpen(false);
          }}
          onRefreshTemplates={fetchTemplates}
        />
      </ConfigModal>
      <ConfigModal
        isOpen={isTemplateConfigModalOpen}
        onClose={() => setIsTemplateConfigModalOpen(false)}
        title="Template Configuration"
        className="md:w-[50vw] md:max-w-[800px]"
      >
        <CodeTemplateConfig
          onlyTemplates={[]}
          skipTemplates={skipTemplates}
          availableTemplates={availableTemplates}
          configValues={configValues}
          customTemplates={currentTemplates}
          isLoadingTemplates={isLoadingTemplates}
          templateError={templateError}
          onSave={({ skipTemplates: newSkip, customTemplates: newCustomTemplates, language: newLanguage }) => {
            updateSkipTemplates(newSkip);
            
            // Update both template states
            updateCustomTemplates(newCustomTemplates);
            setCurrentTemplates(newCustomTemplates);
            
            // If language has changed, update it in configValues and potentially regenerate code
            if (newLanguage !== configValues.language) {
              updateLanguage(newLanguage);
              
              // Update the YAML spec with new file extensions
              setGeneratedYamlSpec(generateSpec(edges, nodes, {
                ...configValues,
                language: newLanguage
              } as YamlConfig, newLanguage));
              
              // If we have code generated already, fetch the alternative language
              if (Object.keys(generatedFiles).length > 0) {
                generateCodeWithLanguage(newLanguage, true);
              }
            }
            
            setIsTemplateConfigModalOpen(false);
          }}
        />
      </ConfigModal>
      <ConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        title="Graph Configuration"
      >
        <GraphConfigModal 
          configValues={{
            name: configValues.name,
            builder_name: configValues.builder_name,
            compiled_name: configValues.compiled_name,
            config: configValues.config,
            state: configValues.state,
            input: configValues.input,
            output: configValues.output,
            implementation: configValues.implementation
          }}
          onSave={(newGraphConfigValues) => {
            updateGraphConfig(newGraphConfigValues);
            setIsConfigModalOpen(false);
          }}
        />
      </ConfigModal>
    </div>
  )
}
