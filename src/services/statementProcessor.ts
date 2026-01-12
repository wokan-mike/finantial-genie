/**
 * Service to communicate with the Lambda function that processes credit card statements
 */

export interface BillingPeriod {
  startMonth: string; // Month name in Spanish (e.g., "noviembre", "diciembre")
  endMonth: string; // Month name in Spanish (e.g., "noviembre", "diciembre")
  startYear?: number; // Optional year for start month
  endYear?: number; // Optional year for end month
}

export interface ExtractedTransaction {
  date: string; // ISO date string
  amount: number;
  description: string;
  category: string; // Category name (e.g., "Comida", "Transporte")
}

export interface StatementProcessingResult {
  success: boolean;
  transactions: ExtractedTransaction[];
  metadata?: {
    totalExtracted: number;
    pdfPageCount?: number;
  };
  error?: string;
}

/**
 * Get API key from environment or secure storage
 * In production, consider using secure storage (e.g., Keychain/Keystore)
 */
function getApiKey(): string {
  // Opción 1: Desde variable de entorno (para desarrollo/producción)
  const envKey = process.env.EXPO_PUBLIC_API_KEY || process.env.REACT_APP_API_KEY;
  if (envKey) {
    return envKey;
  }
  
  // Opción 2: Desde AsyncStorage (para React Native - implementar si es necesario)
  // import AsyncStorage from '@react-native-async-storage/async-storage';
  // const storedKey = await AsyncStorage.getItem('api_key');
  // if (storedKey) return storedKey;
  
  // Si no hay API key configurada, lanzar error
  throw new Error('API key not configured. Please set EXPO_PUBLIC_API_KEY environment variable.');
}

/**
 * Process a credit card statement PDF or image using the Lambda function
 * 
 * @param file - File object (PDF or image) or base64 string
 * @param creditCardId - ID of the credit card
 * @param creditCardName - Name of the credit card
 * @param cutDate - Cut date of the credit card (1-31)
 * @param billingPeriod - Billing period for the statement
 * @param lambdaEndpoint - URL of the Lambda function endpoint
 */
export async function processStatement(
  file: File | string,
  creditCardId: string,
  creditCardName: string,
  cutDate: number,
  billingPeriod: BillingPeriod,
  lambdaEndpoint: string
): Promise<StatementProcessingResult> {
  try {
    // Convert file to base64 and detect type
    let fileBase64: string;
    let fileType: string = 'pdf';
    
    if (typeof file === 'string') {
      // Already base64
      fileBase64 = file;
      // Try to detect type from string (if it includes data URL)
      if (file.includes('data:')) {
        const match = file.match(/data:([^;]+)/);
        if (match) {
          const mimeType = match[1];
          if (mimeType.includes('png')) fileType = 'png';
          else if (mimeType.includes('jpeg') || mimeType.includes('jpg')) fileType = 'jpeg';
          else if (mimeType.includes('pdf')) fileType = 'pdf';
        }
      }
    } else {
      // File object - convert to base64 and detect type
      fileBase64 = await fileToBase64(file);
      const fileName = file.name.toLowerCase();
      if (fileName.endsWith('.png')) {
        fileType = 'png';
      } else if (fileName.endsWith('.jpg') || fileName.endsWith('.jpeg')) {
        fileType = 'jpeg';
      } else if (fileName.endsWith('.pdf')) {
        fileType = 'pdf';
      }
    }

    // Prepare request payload
    const payload = {
      fileBase64, // New field name
      fileType,   // New field
      pdfBase64: fileBase64, // Keep for backward compatibility
      creditCardId,
      creditCardName,
      cutDate,
      billingPeriod,
    };

    console.log('[processStatement] Sending request to Lambda:', {
      creditCardId,
      creditCardName,
      cutDate,
      billingPeriod,
      fileType,
      fileSize: fileBase64.length,
    });

    // Obtener API key
    const apiKey = getApiKey();

    // Call Lambda function con autenticación
    const response = await fetch(lambdaEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': apiKey, // Agregar header de autenticación
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      // Si es 401, el error es de autenticación
      if (response.status === 401) {
        const errorData = await response.json().catch(() => ({ error: 'Unauthorized' }));
        throw new Error('Authentication failed: ' + (errorData.error || 'Invalid API key'));
      }
      
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    
    // Handle Lambda response format (could be direct body or wrapped)
    if (result.body) {
      // Lambda returns body as string, parse it
      const parsedBody = typeof result.body === 'string' ? JSON.parse(result.body) : result.body;
      return parsedBody;
    }

    return result;
  } catch (error) {
    console.error('[processStatement] Error:', error);
    return {
      success: false,
      transactions: [],
      error: error instanceof Error ? error.message : 'Unknown error processing statement',
    };
  }
}

/**
 * Convert File to base64 string
 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix if present
      const base64 = result.includes(',') ? result.split(',')[1] : result;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Get Lambda endpoint URL from environment or config
 * In production, this should be set via environment variables
 */
export function getLambdaEndpoint(): string {
  // TODO: Replace with your actual Lambda endpoint URL
  // This could be:
  // - API Gateway endpoint
  // - Lambda Function URL
  // - Custom domain pointing to Lambda
  return process.env.EXPO_PUBLIC_LAMBDA_ENDPOINT || 
         process.env.REACT_APP_LAMBDA_ENDPOINT || 
         'https://your-lambda-endpoint.execute-api.us-east-1.amazonaws.com/prod/process-statement';
}
