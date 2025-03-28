import JSZip from 'jszip'

/**
 * Downloads a string content as a file with the specified filename
 */
export const downloadFile = (content: string, filename: string) => {
  const blob = new Blob([content], { type: 'text/plain' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

/**
 * Interface for generated files by language
 */
export interface GeneratedFiles {
  python?: { 
    stub?: string; 
    implementation?: string;
    graph?: string;
    state?: string;
    config?: string;
  }
  typescript?: { 
    stub?: string; 
    implementation?: string;
    graph?: string;
    state?: string;
    config?: string;
  }
}

/**
 * Creates and downloads a zip file containing all generated files for the current language
 */
export const downloadAsZip = (generatedFiles: GeneratedFiles, generatedYamlSpec: string, language: 'python' | 'typescript') => {
  const zip = new JSZip()

  // Use the stored YAML specification
  zip.file('spec.yml', generatedYamlSpec)

  // Only add files for the currently selected language
  if (language === 'python') {
    if (generatedFiles.python?.stub) {
      zip.file('stub.py', generatedFiles.python.stub)
    }
    if (generatedFiles.python?.implementation) {
      zip.file('implementation.py', generatedFiles.python.implementation)
    }
    if (generatedFiles.python?.graph) {
      zip.file('graph.py', generatedFiles.python.graph)
    }
    if (generatedFiles.python?.state) {
      zip.file('state.py', generatedFiles.python.state)
    }
    if (generatedFiles.python?.config) {
      zip.file('config.py', generatedFiles.python.config)
    }
  } else {
    if (generatedFiles.typescript?.stub) {
      zip.file('stub.ts', generatedFiles.typescript.stub)
    }
    if (generatedFiles.typescript?.implementation) {
      zip.file('implementation.ts', generatedFiles.typescript.implementation)
    }
    if (generatedFiles.typescript?.graph) {
      zip.file('graph.ts', generatedFiles.typescript.graph)
    }
    if (generatedFiles.typescript?.state) {
      zip.file('state.ts', generatedFiles.typescript.state)
    }
    if (generatedFiles.typescript?.config) {
      zip.file('config.ts', generatedFiles.typescript.config)
    }
  }

  // Generate and download the zip
  zip.generateAsync({ type: 'blob' }).then((content) => {
    const url = window.URL.createObjectURL(content)
    const link = document.createElement('a')
    link.href = url
    link.download = 'langgraph-agent.zip'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  })
} 