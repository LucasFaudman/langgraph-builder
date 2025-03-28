import type { NextApiRequest, NextApiResponse } from 'next'

type Template = {
  name: string
  path: string
  language: string
  template_type: string
  content: string
}

type TemplatesResponse = {
  templates?: Template[]
  error?: string
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<TemplatesResponse>) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { serverUrl } = req.body
    
    // Ensure the server URL is properly formatted for templates endpoint
    const baseServerUrl = serverUrl.endsWith('/templates') 
      ? serverUrl.substring(0, serverUrl.lastIndexOf('/'))
      : serverUrl.endsWith('/') 
        ? serverUrl.slice(0, -1)
        : serverUrl;
    
    const templatesUrl = `${baseServerUrl}/templates`;
    
    const response = await fetch(templatesUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    })

    if (!response.ok) {
      throw new Error(`API responded with status ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    return res.status(200).json({
      templates: data.templates
    })
  } catch (error) {
    console.error('Error fetching templates:', error)
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to fetch templates'
    })
  }
} 