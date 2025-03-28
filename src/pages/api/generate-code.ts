import type { NextApiRequest, NextApiResponse } from 'next'

// Define a more general type for file content
type FileContent = string;

// Type for all possible template types
type TemplateType = 'graph' | 'implementation' | 'state' | 'config' | 'stub' | string;

// Updated GenerateResponse to include all possible files
type GenerateResponse = {
  files?: Record<TemplateType, FileContent>;
  stub?: string;
  implementation?: string;
  graph?: string;
  state?: string;
  config?: string;
  error?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<GenerateResponse>) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { spec, language, format, serverUrl, only, skip, templates, configValues } = req.body
    
    // Build the request body for the server
    const requestBody: any = {
      spec,
      language,
      format,
      only,
      skip,
    };
    
    // Add templates if provided
    if (templates && Object.keys(templates).length > 0) {
      requestBody.templates = templates;
    }
    
    // Ensure the server URL is properly formatted
    const normalizedServerUrl = serverUrl.endsWith('/generate') 
      ? serverUrl
      : serverUrl.endsWith('/') 
        ? `${serverUrl.slice(0, -1)}/generate`
        : `${serverUrl}/generate`;
    
    const response = await fetch(normalizedServerUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      throw new Error(`API responded with status ${response.status}`)
    }

    const data = await response.json();
    
    // Return all files from the server response
    // For backward compatibility, we maintain the individual properties
    // while also providing the complete files object
    return res.status(200).json({
      files: data.files || {},
      stub: data.files?.stub || data.stub,
      implementation: data.files?.implementation || data.implementation,
      graph: data.files?.graph,
      state: data.files?.state,
      config: data.files?.config,
    });
  } catch (error) {
    console.error('Error generating code:', error)
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to generate code',
    })
  }
}
