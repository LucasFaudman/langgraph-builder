import { useState, useEffect } from 'react'
import { Highlight, themes } from 'prism-react-renderer'

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

type CodeTemplateConfigProps = {
  onlyTemplates: string[];
  skipTemplates: string[];
  availableTemplates: AvailableTemplates;
  configValues: {
    name: string;
    builder_name: string;
    compiled_name: string;
    config: string;
    state: string;
    input: string;
    output: string;
    implementation: string;
    language: 'python' | 'typescript';
  };
  customTemplates: {[key: string]: string};
  isLoadingTemplates: boolean;
  templateError: string | null;
  onSave: (config: {
    onlyTemplates: string[];
    skipTemplates: string[];
    customTemplates: {[key: string]: string};
    language: 'python' | 'typescript';
  }) => void;
}

// Placeholder templates when API call fails
const PLACEHOLDER_TEMPLATES = {
  python: {
    stub: `def run(state):
    """Run the agent."""
    return state
    
def condition(state):
    """Check condition."""
    return "path_1"`,
    implementation: `from typing import Dict, Any, List
from langchain.schema import HumanMessage, AIMessage

def run(state):
    """Run the agent."""
    # Add your implementation here
    return state
    
def condition(state):
    """Determine which path to take."""
    # Add your condition logic here
    return "path_1"`
  },
  typescript: {
    stub: `function run(state: any): any {
  // Run the agent
  return state;
}

function condition(state: any): string {
  // Check condition
  return "path_1";
}`,
    implementation: `import { HumanMessage, AIMessage } from "@langchain/core/messages";

interface State {
  messages: Array<HumanMessage | AIMessage>;
  [key: string]: any;
}

function run(state: State): State {
  // Add your implementation here
  return state;
}

function condition(state: State): string {
  // Add your condition logic here
  return "path_1";
}`
  }
};

export default function CodeTemplateConfig({
  onlyTemplates,
  skipTemplates,
  availableTemplates,
  configValues,
  customTemplates,
  isLoadingTemplates,
  templateError,
  onSave
}: CodeTemplateConfigProps) {
  const [selectedTemplateType, setSelectedTemplateType] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('default');
  const [selectedTemplates, setSelectedTemplates] = useState<{[key: string]: string}>(customTemplates || {});
  const [disabledTemplates, setDisabledTemplates] = useState<string[]>(skipTemplates || []);
  const [language, setLanguage] = useState<'python' | 'typescript'>(configValues.language || 'python');
  const [templatePreview, setTemplatePreview] = useState<string>('');
  
  // Update disabledTemplates when skipTemplates prop changes
  useEffect(() => {
    setDisabledTemplates(skipTemplates || []);
  }, [skipTemplates]);

  // Update selectedTemplates when customTemplates prop changes  
  useEffect(() => {
    setSelectedTemplates(customTemplates || {});
  }, [customTemplates]);
  
  // Set template preview when selected template changes
  useEffect(() => {
    if (selectedTemplateType) {
      if (selectedTemplate !== 'disabled') {
        // Get the actual template content
        if (availableTemplates[language] && 
            availableTemplates[language][selectedTemplateType]) {
          
          // For "Default" option, use the "default.j2" template if available
          if (selectedTemplate === 'default' && 
              availableTemplates[language][selectedTemplateType].contentMap && 
              availableTemplates[language][selectedTemplateType].contentMap['default.j2']) {
            setTemplatePreview(availableTemplates[language][selectedTemplateType].contentMap['default.j2']);
          } 
          // For custom template selection, use the selected template's content
          else if (selectedTemplate !== 'default' && 
                  availableTemplates[language][selectedTemplateType].contentMap && 
                  availableTemplates[language][selectedTemplateType].contentMap[selectedTemplate]) {
            setTemplatePreview(availableTemplates[language][selectedTemplateType].contentMap[selectedTemplate]);
          } 
          // Fallback to placeholder if template content is not available
          else {
            setTemplatePreview(
              PLACEHOLDER_TEMPLATES[language][selectedTemplateType as keyof typeof PLACEHOLDER_TEMPLATES[typeof language]] || 
              '// Template preview not available'
            );
          }
        } else {
          // Fallback to placeholder
          setTemplatePreview(
            PLACEHOLDER_TEMPLATES[language][selectedTemplateType as keyof typeof PLACEHOLDER_TEMPLATES[typeof language]] || 
            '// Template preview not available'
          );
        }
      } else {
        // For disabled option, clear the preview
        setTemplatePreview('');
      }
    } else {
      setTemplatePreview('');
    }
  }, [selectedTemplateType, selectedTemplate, language, availableTemplates]);

  // Save changes and close modal
  const handleClose = () => {
    // Update values and close
    onSave({
      onlyTemplates: [], // We're no longer using onlyTemplates
      skipTemplates: disabledTemplates,
      customTemplates: Object.fromEntries(
        Object.entries(selectedTemplates).filter(([_, template]) => template && template !== 'default' && template !== 'disabled')
      ),
      language
    });
  };

  // Reset all fields to defaults
  const handleReset = () => {
    setSelectedTemplates({});
    setDisabledTemplates([]);
    setSelectedTemplateType(null);
    setSelectedTemplate('default');
    setLanguage('python');
    setTemplatePreview('');
  };

  // Helper to get template types from available templates
  const getTemplateTypes = () => {
    const currentLang = language;
    const types = new Set<string>();
    
    // If API call failed, provide default template types
    if (templateError || Object.keys(availableTemplates[currentLang] || {}).length === 0) {
      return ['stub', 'implementation'];
    }
    
    if (availableTemplates[currentLang]) {
      Object.keys(availableTemplates[currentLang]).forEach(type => {
        types.add(type);
      });
    }
    
    // Sort types in the specific order
    const result = Array.from(types);
    const orderedTemplateTypes = ['graph', 'stub', 'implementation'];
    
    return [
      ...orderedTemplateTypes.filter(type => result.includes(type)),
      ...result.filter(type => !orderedTemplateTypes.includes(type))
    ];
  };

  // Get templates for the selected type
  const getTemplatesForType = (type: string) => {
    const currentLang = language;
    return availableTemplates[currentLang]?.[type]?.names || [];
  };

  // Handle template type selection
  const handleTemplateTypeChange = (type: string | null) => {
    setSelectedTemplateType(type);
    if (type && disabledTemplates.includes(type)) {
      setSelectedTemplate('disabled');
    } else {
      setSelectedTemplate('default');
    }
  };

  // Handle template selection
  const handleTemplateSelection = (templateName: string) => {
    setSelectedTemplate(templateName);
    
    if (selectedTemplateType) {
      if (templateName === 'disabled') {
        // Add to disabled templates
        if (!disabledTemplates.includes(selectedTemplateType)) {
          setDisabledTemplates([...disabledTemplates, selectedTemplateType]);
        }
        // Remove any custom template selection for this type
        const newSelectedTemplates = {...selectedTemplates};
        delete newSelectedTemplates[selectedTemplateType];
        setSelectedTemplates(newSelectedTemplates);
      } else if (templateName !== 'default') {
        // Set custom template
        setSelectedTemplates({
          ...selectedTemplates,
          [selectedTemplateType]: templateName
        });
        // Remove from disabled templates if previously disabled
        if (disabledTemplates.includes(selectedTemplateType)) {
          setDisabledTemplates(disabledTemplates.filter(t => t !== selectedTemplateType));
        }
      } else {
        // Default selected
        // Remove from disabled templates if previously disabled
        if (disabledTemplates.includes(selectedTemplateType)) {
          setDisabledTemplates(disabledTemplates.filter(t => t !== selectedTemplateType));
        }
        // Remove any custom template selection for this type
        const newSelectedTemplates = {...selectedTemplates};
        delete newSelectedTemplates[selectedTemplateType];
        setSelectedTemplates(newSelectedTemplates);
      }
    }
  };

  const fileExtension = language === 'python' ? '.py' : '.ts';

  return (
    <div className='flex flex-col gap-4'>
      <div className='flex flex-col gap-1'>
        <label className='text-sm font-medium text-gray-700'>
          Language
        </label>
        <select
          value={language}
          onChange={(e) => {
            const newLanguage = e.target.value as 'python' | 'typescript';
            setLanguage(newLanguage);
            setSelectedTemplateType(null);
            setSelectedTemplate('default');
          }}
          className='px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2F6868] focus:border-transparent'
        >
          <option value="python">Python</option>
          <option value="typescript">TypeScript</option>
        </select>
        <p className="text-xs text-gray-500 mt-1">
          Changing the language will fetch new code when you generate again
        </p>
      </div>
      
      {/* Template selection section */}
      <div className='flex flex-col gap-2'>
        <label className='text-sm font-medium text-gray-700'>
          Template Selection
        </label>
        
        {isLoadingTemplates ? (
          <div className="flex justify-center py-4">
            <div className="w-6 h-6 border-2 border-t-[#2F6868] border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className='text-xs text-gray-600'>Template Type</label>
                <select 
                  className='w-full px-3 py-2 mt-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2F6868] focus:border-transparent'
                  value={selectedTemplateType || ''}
                  onChange={(e) => handleTemplateTypeChange(e.target.value || null)}
                >
                  <option value="">Select a type</option>
                  {getTemplateTypes().map(type => (
                    <option key={type} value={type}>
                      {type}{disabledTemplates.includes(type) ? ' (Disabled)' : ''}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className='text-xs text-gray-600'>Template Name</label>
                <select 
                  className='w-full px-3 py-2 mt-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2F6868] focus:border-transparent'
                  value={selectedTemplate}
                  onChange={(e) => handleTemplateSelection(e.target.value)}
                  disabled={!selectedTemplateType}
                >
                  <option value="default">Default</option>
                  <option value="disabled">Disabled</option>
                  {selectedTemplateType && 
                   !templateError && 
                   availableTemplates[language]?.[selectedTemplateType]?.names?.length > 0 && 
                   availableTemplates[language][selectedTemplateType].names.map(template => (
                     <option key={template} value={template}>{template}</option>
                   ))
                  }
                </select>
              </div>
            </div>
            
            {templateError && (
              <div className="mt-2 text-sm text-amber-700 bg-amber-50 p-3 rounded-md border border-amber-200">
                <p>
                  <strong>Note:</strong> Custom templates couldn't be loaded. 
                  Only Default and Disabled options are available.
                </p>
              </div>
            )}
            
            {/* Template Preview */}
            {selectedTemplateType && selectedTemplate !== 'disabled' && templatePreview && (
              <div className="mt-3">
                <label className='text-sm font-medium text-gray-700'>
                  Template Preview: {selectedTemplateType}{fileExtension}
                  {selectedTemplate === 'default' ? ' (Default)' : ` (${selectedTemplate})`}
                </label>
                <div className='mt-1 border border-gray-300 rounded-md overflow-hidden'>
                  <Highlight
                    theme={themes.nightOwl}
                    code={templatePreview}
                    language={language === 'python' ? 'python' : 'typescript'}
                  >
                    {({ style, tokens, getLineProps, getTokenProps }) => (
                      <pre className='p-3 overflow-auto max-h-72' style={{ ...style }}>
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
            )}
            
            {/* Show the selected templates */}
            {(Object.keys(selectedTemplates).length > 0 || disabledTemplates.length > 0) && (
              <div className="mt-2">
                <label className='text-xs text-gray-600'>Selected Template Configuration:</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {Object.entries(selectedTemplates).map(([type, template]) => (
                    template !== 'default' && template !== 'disabled' && (
                      <div key={type} className="bg-gray-100 rounded-full px-3 py-1 text-xs flex items-center gap-1">
                        <span>{type}: {template}</span>
                        <button 
                          onClick={() => {
                            const newTemplates = {...selectedTemplates};
                            delete newTemplates[type];
                            setSelectedTemplates(newTemplates);
                          }}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                          </svg>
                        </button>
                      </div>
                    )
                  ))}
                  {disabledTemplates.map((type) => (
                    <div key={type} className="bg-red-50 text-red-700 rounded-full px-3 py-1 text-xs flex items-center gap-1">
                      <span>{type}: Disabled</span>
                      <button 
                        onClick={() => {
                          setDisabledTemplates(disabledTemplates.filter(t => t !== type));
                        }}
                        className="text-red-500 hover:text-red-700"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18"></line>
                          <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
      
      <div className='bg-gray-50 p-3 rounded-md border border-gray-200'>
        <p className='text-xs text-gray-600'>
          Select a template type and choose "Disabled" to skip generating that file type.
          Select a custom template to use a specific template for that file type.
          The "Default" option uses the server's default template (typically 'default.j2').
          {templateError ? " Only stub and implementation template types are available when templates can't be loaded." : ""}
        </p>
      </div>
      
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