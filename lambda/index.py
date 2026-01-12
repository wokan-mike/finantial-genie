import json
import base64
import os
import io
import hmac
import time
from datetime import datetime
from typing import List, Dict, Any, Optional, Tuple
from collections import defaultdict

try:
    import boto3
    from botocore.exceptions import ClientError
except ImportError:
    boto3 = None

# Try to import OpenAI with better error handling
OpenAI = None
import_error = None

try:
    # First, try to import pydantic_core to see if that's the issue
    try:
        import pydantic_core
        print(f"✓ pydantic_core imported successfully")
        print(f"  pydantic_core location: {pydantic_core.__file__}")
        
        # Try to access the _pydantic_core module specifically
        try:
            from pydantic_core import _pydantic_core
            print(f"✓ pydantic_core._pydantic_core imported successfully")
        except ImportError as inner_e:
            print(f"✗ Failed to import pydantic_core._pydantic_core: {str(inner_e)}")
            # Try to find the .so file
            try:
                import sys
                import os
                pydantic_core_dir = os.path.dirname(pydantic_core.__file__)
                print(f"  Looking for .so files in: {pydantic_core_dir}")
                for file in os.listdir(pydantic_core_dir):
                    if file.endswith('.so'):
                        so_path = os.path.join(pydantic_core_dir, file)
                        print(f"  Found .so file: {so_path}")
                        print(f"  File exists: {os.path.exists(so_path)}")
                        print(f"  File size: {os.path.getsize(so_path)} bytes")
            except Exception as debug_e:
                print(f"  Debug error: {debug_e}")
    except ImportError as e:
        print(f"✗ Failed to import pydantic_core: {str(e)}")
        # Try to find where it should be
        try:
            import sys
            import os
            print(f"  Python version: {sys.version}")
            print(f"  Python executable: {sys.executable}")
            print(f"  sys.path: {sys.path}")
            for path in sys.path:
                pydantic_core_path = os.path.join(path, 'pydantic_core')
                if os.path.exists(pydantic_core_path):
                    print(f"  Found pydantic_core at: {pydantic_core_path}")
                    # List files
                    files = os.listdir(pydantic_core_path)
                    print(f"  Files in pydantic_core: {files}")
                    # Check for .so files
                    so_files = [f for f in files if f.endswith('.so')]
                    if so_files:
                        print(f"  .so files found: {so_files}")
                    else:
                        print(f"  ⚠️  No .so files found!")
        except Exception as debug_e:
            print(f"  Debug error: {debug_e}")
    
    # Now try to import OpenAI
    from openai import OpenAI
    print("✓ OpenAI package imported successfully")
except ImportError as e:
    import_error = str(e)
    print(f"✗ Failed to import OpenAI: {import_error}")
    # Try to get more details about what's missing
    try:
        import sys
        print(f"Python path: {sys.path}")
        print(f"Current working directory: {os.getcwd()}")
        # Check for pydantic_core files
        for path in sys.path:
            pydantic_path = os.path.join(path, 'pydantic_core')
            if os.path.exists(pydantic_path):
                print(f"Found pydantic_core directory at: {pydantic_path}")
                # Look for .so files
                for root, dirs, files in os.walk(pydantic_path):
                    so_files = [f for f in files if f.endswith('.so')]
                    if so_files:
                        print(f"  Found .so files in {root}: {so_files[:5]}")
    except Exception as debug_error:
        print(f"Debug error: {debug_error}")
    OpenAI = None
except Exception as e:
    import_error = str(e)
    print(f"✗ Unexpected error importing OpenAI: {import_error}")
    import traceback
    traceback.print_exc()
    OpenAI = None

# Try to import PDF/image processing libraries
try:
    import fitz  # PyMuPDF
    print("✓ PyMuPDF (fitz) imported successfully")
except ImportError as e:
    print(f"⚠️  PyMuPDF not available: {e}")
    fitz = None

try:
    from PIL import Image
    print("✓ Pillow (PIL) imported successfully")
except ImportError as e:
    print(f"⚠️  Pillow not available: {e}")
    Image = None

# Initialize clients
s3_client = boto3.client('s3') if boto3 else None

# Initialize OpenAI client with better error handling
openai_client = None
openai_error = None

print(f"OpenAI class available: {OpenAI is not None}")

if OpenAI is None:
    error_detail = f"Import error: {import_error}" if import_error else "Unknown import error"
    openai_error = f"OpenAI package not installed. Make sure 'openai' is in requirements.txt and included in deployment package. {error_detail}"
    print(f"ERROR: {openai_error}")
else:
    openai_api_key = os.environ.get('OPENAI_API_KEY')
    print(f"OPENAI_API_KEY present: {bool(openai_api_key)}")
    print(f"OPENAI_API_KEY length: {len(openai_api_key) if openai_api_key else 0}")
    
    if not openai_api_key:
        openai_error = "OPENAI_API_KEY environment variable not set. Please configure it in Lambda environment variables."
        print(f"ERROR: {openai_error}")
    else:
        try:
            print("Attempting to initialize OpenAI client...")
            openai_client = OpenAI(api_key=openai_api_key)
            print("✓ OpenAI client initialized successfully")
        except Exception as e:
            openai_error = f"Failed to initialize OpenAI client: {str(e)}"
            print(f"ERROR: {openai_error}")
            import traceback
            traceback.print_exc()

# Default region
AWS_REGION = os.environ.get('AWS_REGION', 'us-east-1')

# API Key authentication
API_KEY = os.environ.get('API_KEY', '')
REQUIRE_AUTH = os.environ.get('REQUIRE_AUTH', 'true').lower() == 'true'

# File size limit (20 MB in bytes)
MAX_FILE_SIZE = 20 * 1024 * 1024  # 20 MB

# Rate limiting configuration
MAX_REQUESTS_PER_MINUTE = int(os.environ.get('MAX_REQUESTS_PER_MINUTE', '10'))
RATE_LIMIT_WINDOW = 60  # 60 seconds (1 minute)

# In-memory rate limiter (simple implementation)
# In production, consider using DynamoDB or ElastiCache for distributed rate limiting
_rate_limit_store: Dict[str, List[float]] = defaultdict(list)


def verify_api_key(event: Dict[str, Any]) -> bool:
    """Verificar API key del request"""
    if not REQUIRE_AUTH:
        return True  # Permitir sin auth en desarrollo
    
    if not API_KEY:
        print('Warning: API_KEY not configured but REQUIRE_AUTH is true')
        return False  # Si no hay API key configurada, rechazar
    
    # Obtener headers del event
    # Lambda Function URL pasa headers en diferentes formatos
    headers = event.get('headers', {}) or {}
    
    # Normalizar headers (Lambda puede pasarlos en lowercase o con diferentes casos)
    headers_lower = {k.lower(): v for k, v in headers.items()}
    
    # Buscar API key en diferentes formatos de header
    auth_header = (
        headers_lower.get('x-api-key') or 
        headers.get('X-Api-Key') or 
        headers.get('x-api-key') or
        headers.get('X-API-Key')
    )
    
    if not auth_header:
        print('Missing API key in request headers')
        return False
    
    # Comparación segura (timing-safe) para prevenir timing attacks
    try:
        return hmac.compare_digest(auth_header, API_KEY)
    except Exception as e:
        print(f'Error comparing API keys: {e}')
        return False


def get_client_identifier(event: Dict[str, Any]) -> str:
    """Obtener identificador único del cliente para rate limiting"""
    # Intentar obtener IP del cliente desde headers
    headers = event.get('headers', {}) or {}
    headers_lower = {k.lower(): v for k, v in headers.items()}
    
    # Lambda Function URL puede pasar la IP en diferentes headers
    client_ip = (
        headers_lower.get('x-forwarded-for') or
        headers_lower.get('x-real-ip') or
        headers.get('X-Forwarded-For') or
        headers.get('X-Real-Ip') or
        'unknown'
    )
    
    # Si hay múltiples IPs (proxies), tomar la primera
    if ',' in client_ip:
        client_ip = client_ip.split(',')[0].strip()
    
    return client_ip


def check_rate_limit(client_id: str) -> Tuple[bool, int]:
    """
    Verificar rate limit para un cliente
    Returns: (is_allowed, remaining_requests)
    """
    current_time = time.time()
    
    # Limpiar requests antiguos (fuera de la ventana de tiempo)
    window_start = current_time - RATE_LIMIT_WINDOW
    _rate_limit_store[client_id] = [
        req_time for req_time in _rate_limit_store[client_id]
        if req_time > window_start
    ]
    
    # Contar requests en la ventana actual
    request_count = len(_rate_limit_store[client_id])
    
    if request_count >= MAX_REQUESTS_PER_MINUTE:
        return False, 0
    
    # Registrar este request
    _rate_limit_store[client_id].append(current_time)
    remaining = MAX_REQUESTS_PER_MINUTE - request_count - 1
    
    return True, remaining


def check_file_size(file_base64: str) -> Tuple[bool, int]:
    """
    Verificar tamaño del archivo
    Returns: (is_valid, file_size_bytes)
    """
    # Calcular tamaño aproximado del archivo decodificado
    # Base64 aumenta el tamaño en ~33%, así que el tamaño real es menor
    # Pero para seguridad, verificamos el tamaño del base64
    base64_size = len(file_base64.encode('utf-8'))
    
    # El tamaño real del archivo es aproximadamente base64_size * 3/4
    # Pero para ser conservadores, usamos el tamaño base64 directamente
    # y comparamos con MAX_FILE_SIZE * 4/3 (tamaño base64 equivalente)
    max_base64_size = int(MAX_FILE_SIZE * 4 / 3)  # Tamaño base64 equivalente a 20MB
    
    if base64_size > max_base64_size:
        # Calcular tamaño real aproximado
        estimated_size = int(base64_size * 3 / 4)
        return False, estimated_size
    
    estimated_size = int(base64_size * 3 / 4)
    return True, estimated_size


def get_cors_headers() -> Dict[str, str]:
    """Get CORS headers for all responses"""
    return {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Api-Key, Authorization',
        'Access-Control-Max-Age': '3600',
    }


def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Lambda handler to process credit card statement PDFs
    
    Expected event structure (from Lambda Function URL):
    {
        "headers": {
            "x-api-key": "your-api-key"
        },
        "body": "{\"fileBase64\": \"...\", \"creditCardId\": \"...\"}"
    }
    """
    print(f'Received event: {json.dumps(event, default=str)}')
    
    # Handle CORS preflight (OPTIONS) requests
    request_method = event.get('requestContext', {}).get('http', {}).get('method') or \
                     event.get('httpMethod') or \
                     event.get('requestContext', {}).get('httpMethod', '')
    
    if request_method == 'OPTIONS':
        cors_headers = get_cors_headers()
        return {
            'statusCode': 200,
            'headers': cors_headers,
            'body': '',
        }
    
    # Obtener identificador del cliente para rate limiting
    client_id = get_client_identifier(event)
    
    # Verificar rate limit
    is_allowed, remaining = check_rate_limit(client_id)
    if not is_allowed:
        cors_headers = get_cors_headers()
        cors_headers.update({
            'Retry-After': '60',
            'X-RateLimit-Limit': str(MAX_REQUESTS_PER_MINUTE),
            'X-RateLimit-Remaining': '0',
        })
        return {
            'statusCode': 429,
            'headers': cors_headers,
            'body': json.dumps({
                'success': False,
                'error': f'Rate limit exceeded. Maximum {MAX_REQUESTS_PER_MINUTE} requests per minute allowed.',
            }),
        }
    
    # Verificar autenticación
    if not verify_api_key(event):
        cors_headers = get_cors_headers()
        cors_headers.update({
            'X-RateLimit-Limit': str(MAX_REQUESTS_PER_MINUTE),
            'X-RateLimit-Remaining': str(remaining),
        })
        return {
            'statusCode': 401,
            'headers': cors_headers,
            'body': json.dumps({
                'success': False,
                'error': 'Unauthorized: Invalid or missing API key',
            }),
        }
    
    # Parsear body (Lambda Function URL envía body como string)
    body = event.get('body')
    if isinstance(body, str):
        try:
            body = json.loads(body)
        except json.JSONDecodeError as e:
            return {
                'statusCode': 400,
                'headers': get_cors_headers(),
                'body': json.dumps({
                    'success': False,
                    'error': f'Invalid JSON in request body: {str(e)}',
                }),
            }
    else:
        body = body or {}
    
    # Si el body está vacío, intentar leer del event directamente (backward compatibility)
    if not body and 'fileBase64' in event:
        body = event
    
    try:
        # Verificar que el body tenga el archivo
        file_base64_str = body.get('fileBase64') or body.get('pdfBase64')
        if not file_base64_str:
            raise ValueError('Either fileBase64/pdfBase64 or s3Bucket+s3Key must be provided')
        
        # Verificar tamaño del archivo
        is_valid_size, file_size = check_file_size(file_base64_str)
        if not is_valid_size:
            cors_headers = get_cors_headers()
            cors_headers.update({
                'X-RateLimit-Limit': str(MAX_REQUESTS_PER_MINUTE),
                'X-RateLimit-Remaining': str(remaining),
            })
            return {
                'statusCode': 413,
                'headers': cors_headers,
                'body': json.dumps({
                    'success': False,
                    'error': f'File too large. Maximum file size is {MAX_FILE_SIZE / (1024*1024):.0f} MB. Received file is approximately {file_size / (1024*1024):.2f} MB.',
                }),
            }
        
        # Extract file content (PDF or image)
        file_buffer = None
        file_type = None
        
        if 'fileBase64' in body:
            file_buffer = base64.b64decode(body['fileBase64'])
            file_type = body.get('fileType', 'pdf')  # pdf, png, jpg, jpeg
        elif 'pdfBase64' in body:  # Backward compatibility
            file_buffer = base64.b64decode(body['pdfBase64'])
            file_type = 'pdf'
        elif 's3Bucket' in body and 's3Key' in body:
            # Alternative: fetch from S3
            if not s3_client:
                raise ValueError('boto3 not available for S3 access')
            response = s3_client.get_object(
                Bucket=body['s3Bucket'],
                Key=body['s3Key']
            )
            file_buffer = response['Body'].read()
            # Try to detect file type from S3 key
            s3_key_lower = body['s3Key'].lower()
            if s3_key_lower.endswith('.png'):
                file_type = 'png'
            elif s3_key_lower.endswith(('.jpg', '.jpeg')):
                file_type = 'jpeg'
            elif s3_key_lower.endswith('.pdf'):
                file_type = 'pdf'
            else:
                file_type = 'pdf'  # Default
        else:
            raise ValueError('Either fileBase64/pdfBase64 or s3Bucket+s3Key must be provided')
        
        print(f'File received, type: {file_type}, size: {len(file_buffer)} bytes')
        
        # Use OpenAI Vision API to extract transactions directly from file
        transactions = extract_transactions_with_llm_vision(
            file_buffer,
            file_type,
            body.get('creditCardName', 'Credit Card'),
            body.get('billingPeriod'),
            body.get('cutDate')
        )
        
        print(f'Returning {len(transactions)} transactions to client')
        print(f'First few transactions: {json.dumps(transactions[:3], indent=2) if transactions else "None"}')
        
        cors_headers = get_cors_headers()
        cors_headers.update({
            'X-RateLimit-Limit': str(MAX_REQUESTS_PER_MINUTE),
            'X-RateLimit-Remaining': str(remaining),
        })
        return {
            'statusCode': 200,
            'headers': cors_headers,
            'body': json.dumps({
                'success': True,
                'transactions': transactions,
                'metadata': {
                    'totalExtracted': len(transactions),
                },
            }),
        }
    except Exception as error:
        print(f'Error processing statement: {str(error)}')
        import traceback
        traceback.print_exc()
        
        cors_headers = get_cors_headers()
        cors_headers.update({
            'X-RateLimit-Limit': str(MAX_REQUESTS_PER_MINUTE),
            'X-RateLimit-Remaining': str(remaining),
        })
        return {
            'statusCode': 500,
            'headers': cors_headers,
            'body': json.dumps({
                'success': False,
                'error': str(error),
                'stack': traceback.format_exc() if os.environ.get('NODE_ENV') == 'development' else None,
            }),
        }


def extract_transactions_with_llm_vision(
    file_buffer: bytes,
    file_type: str,
    card_name: str,
    billing_period: Optional[Dict[str, Any]],
    cut_date: Optional[int]
) -> List[Dict[str, Any]]:
    """Extract transactions from PDF/image file using OpenAI Vision API"""
    
    if not openai_client:
        error_msg = openai_error or 'OpenAI client not available'
        print(f'ERROR: {error_msg}')
        raise ValueError(error_msg)
    
    # Get month names from billing period (no specific dates)
    billing_start_month = billing_period.get('startMonth', 'N/A') if billing_period else 'N/A'
    billing_end_month = billing_period.get('endMonth', 'N/A') if billing_period else 'N/A'
    billing_start_year = billing_period.get('startYear') if billing_period else None
    billing_end_year = billing_period.get('endYear') if billing_period else None
    
    # Build period description
    if billing_start_year and billing_end_year:
        period_description = f"{billing_start_month} {billing_start_year} a {billing_end_month} {billing_end_year}"
    else:
        period_description = f"{billing_start_month} a {billing_end_month}"
    
    # Convert PDF to images if needed (OpenAI Vision API only accepts images)
    if file_type.lower() == 'pdf':
        if not fitz:
            raise ValueError('PyMuPDF (fitz) not available. Cannot convert PDF to images.')
        
        print(f'Converting PDF to images...')
        pdf_document = fitz.open(stream=file_buffer, filetype="pdf")
        print(f'PDF has {len(pdf_document)} pages')
        
        # Convert all pages to images
        images = []
        for page_num in range(len(pdf_document)):
            page = pdf_document[page_num]
            # Render page as image (300 DPI for good quality)
            pix = page.get_pixmap(matrix=fitz.Matrix(300/72, 300/72))
            img_data = pix.tobytes("png")
            images.append(img_data)
            print(f'Converted page {page_num + 1} to image ({len(img_data)} bytes)')
        
        pdf_document.close()
        
        if not images:
            raise ValueError('No pages found in PDF')
        
        # Process all pages - OpenAI Vision API can handle multiple images
        print(f'Processing all {len(images)} pages of the PDF...')
        
        # Convert all images to base64 - store as list for multi-page processing
        image_base64_list = [base64.b64encode(img).decode('utf-8') for img in images]
        file_base64 = image_base64_list  # Store as list for multi-page PDFs
        mime_type = 'image/png'
        print(f'Converted {len(image_base64_list)} pages to base64 images')
    else:
        # For images, use directly (single image)
        mime_type_map = {
            'png': 'image/png',
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
        }
        mime_type = mime_type_map.get(file_type.lower(), 'image/png')
        file_base64 = base64.b64encode(file_buffer).decode('utf-8')  # Single string for single image
    
    system_prompt = f"""You are a financial data extraction assistant. Your task is to extract credit card transactions from a statement document.

CRITICAL: You MUST extract ALL transactions visible in the document. Do NOT filter by date - extract EVERYTHING you see.

The billing period for this statement is approximately: {period_description}
Use this ONLY as context to infer the correct year if dates show only day/month. Do NOT use it to filter transactions.

For each transaction, extract:
- date: The date when the transaction occurred (YYYY-MM-DD format). If only day/month is shown, infer the year from the billing period context.
- amount: The transaction amount as a positive number (expenses are positive)
- description: A clear, concise description of the merchant/store/service. Normalize names (e.g., "WALMART" -> "Walmart")
- category: One of: Comida, Entretenimiento, Familia, Transporte, Salud, Educación, Ropa, Servicios, Vivienda, Otros

Important rules:
1. Extract ALL transactions visible in the document, regardless of date
2. Ignore: payments made to the card, credits, interest charges, fees, and balance transfers
3. For installment purchases, extract each monthly payment as a separate transaction if shown
4. Look carefully at tables, lists, and any formatted sections
5. If dates are ambiguous (only day/month shown), use the billing period ({period_description}) to infer the correct year
6. Return dates in ISO format (YYYY-MM-DD)
7. If you cannot find any transactions, return an empty array but still return the JSON structure

Return ONLY a valid JSON object with this exact structure:
{{
  "transactions": [
    {{
      "date": "2024-11-20",
      "amount": 150.50,
      "description": "Walmart Supercenter",
      "category": "Comida"
    }}
  ]
}}

If no transactions are found, return: {{"transactions": []}}"""

    # Build user prompt - make it very explicit
    if isinstance(file_base64, list):
        # Multi-page PDF
        user_prompt = f"""Extract ALL transactions from this credit card statement for {card_name}.

This document has {len(file_base64)} pages. You MUST look at ALL pages and extract transactions from EVERY page.

The billing period for this statement is approximately: {period_description}
Use this ONLY as context to infer the correct year if dates show only day/month. Do NOT use it to filter transactions.

IMPORTANT INSTRUCTIONS:
1. Look at ALL images/pages provided
2. Extract EVERY transaction you see, regardless of date
3. Each transaction should have: date (YYYY-MM-DD), amount (positive number), description, and category
4. If dates show only day/month, use the billing period ({period_description}) to infer the correct year
5. Ignore payments, credits, interest, and fees
6. Return ALL transactions found across all pages

Return a JSON object with this exact structure:
{{
  "transactions": [
    {{
      "date": "2024-11-20",
      "amount": 150.50,
      "description": "Walmart Supercenter",
      "category": "Comida"
    }}
  ]
}}

If you find transactions, return them. If you find NO transactions at all, return {{"transactions": []}}."""
    else:
        # Single image
        user_prompt = f"""Extract ALL transactions from this credit card statement for {card_name}.

The billing period for this statement is approximately: {period_description}
Use this ONLY as context to infer the correct year if dates show only day/month. Extract ALL transactions you see, regardless of date.

Return a JSON object with this exact structure:
{{
  "transactions": [
    {{
      "date": "2024-11-20",
      "amount": 150.50,
      "description": "Walmart Supercenter",
      "category": "Comida"
    }}
  ]
}}"""

    try:
        all_transactions = []
        
        # Process pages one by one if multiple pages, or single image
        images_to_process = file_base64 if isinstance(file_base64, list) else [file_base64]
        
        print(f'Processing {len(images_to_process)} image(s)...')
        
        for page_idx, img_base64 in enumerate(images_to_process):
            page_num = page_idx + 1
            print(f'Processing page {page_num} of {len(images_to_process)}...')
            
            # Build content for this page
            page_prompt = user_prompt
            if len(images_to_process) > 1:
                page_prompt = f"""Extract ALL transactions from page {page_num} of {len(images_to_process)} of this credit card statement for {card_name}.

The billing period for this statement is approximately: {period_description}
Use this ONLY as context to infer the correct year if dates show only day/month. Extract ALL transactions you see, regardless of date.

Look carefully at this page and extract EVERY transaction you see. Return ALL transactions found on this page.

Return a JSON object with this exact structure:
{{
  "transactions": [
    {{
      "date": "2024-11-20",
      "amount": 150.50,
      "description": "Walmart Supercenter",
      "category": "Comida"
    }}
  ]
}}"""
            
            content = [
                {
                    'type': 'text',
                    'text': page_prompt
                },
                {
                    'type': 'image_url',
                    'image_url': {
                        'url': f'data:{mime_type};base64,{img_base64}',
                        'detail': 'high'  # Use high detail for better OCR accuracy
                    }
                }
            ]
            
            messages = [
                {
                    'role': 'system',
                    'content': system_prompt
                },
                {
                    'role': 'user',
                    'content': content
                }
            ]
            
            # Use gpt-4o for vision capabilities
            model = 'gpt-4o'
            
            print(f'Calling OpenAI for page {page_num}...')
            completion = openai_client.chat.completions.create(
                model=model,
                messages=messages,
                temperature=0.1,  # Low temperature for consistent extraction
                response_format={'type': 'json_object'},
            )
            
            response_text = completion.choices[0].message.content
            if not response_text:
                print(f'WARNING: No response from OpenAI for page {page_num}')
                continue
            
            print(f'OpenAI response for page {page_num} length: {len(response_text)} characters')
            print(f'OpenAI response preview: {response_text[:300]}...')
            
            # Parse JSON response
            try:
                parsed_response = json.loads(response_text)
            except json.JSONDecodeError as parse_error:
                print(f'JSON parse error for page {page_num}: {parse_error}')
                print(f'Response text: {response_text}')
                # Sometimes OpenAI returns JSON wrapped in markdown code blocks
                import re
                json_match = re.search(r'```json\s*([\s\S]*?)\s*```', response_text) or \
                            re.search(r'```\s*([\s\S]*?)\s*```', response_text)
                if json_match:
                    parsed_response = json.loads(json_match.group(1))
                else:
                    print(f'Skipping page {page_num} due to parse error')
                    continue
            
            # Extract transactions from this page
            page_transactions = parsed_response.get('transactions', [])
            print(f'Found {len(page_transactions)} transactions on page {page_num}')
            
            if isinstance(page_transactions, list):
                all_transactions.extend(page_transactions)
            else:
                print(f'WARNING: Page {page_num} transactions is not a list: {type(page_transactions)}')
        
        # Use all transactions from all pages
        transactions = all_transactions
        print(f'Total transactions from all pages: {len(transactions)}')
        
        if len(transactions) == 0:
            print('WARNING: No transactions found in any page')
        
        # Validate and normalize transactions
        normalized_transactions = []
        for idx, txn in enumerate(transactions):
            print(f'Processing transaction {idx + 1}: {json.dumps(txn)}')
            if not all(key in txn for key in ['date', 'amount', 'description']):
                missing_keys = [key for key in ['date', 'amount', 'description'] if key not in txn]
                print(f'Skipping transaction {idx + 1}: missing keys {missing_keys}')
                continue
            
            try:
                normalized_txn = {
                    'date': normalize_date(txn['date']),
                    'amount': abs(float(txn['amount'])),  # Ensure positive
                    'description': normalize_description(txn['description']),
                    'category': normalize_category(txn.get('category', 'Otros')),
                }
                
                # Filter by billing period if provided
                if billing_period and billing_period.get('start') and billing_period.get('end'):
                    txn_date = normalized_txn['date']
                    period_start = billing_period['start']
                    period_end = billing_period['end']
                    if txn_date >= period_start and txn_date <= period_end:
                        print(f'Transaction {idx + 1} within period: {txn_date} in [{period_start}, {period_end}]')
                        normalized_transactions.append(normalized_txn)
                    else:
                        print(f'Transaction {idx + 1} outside period: {txn_date} not in [{period_start}, {period_end}]')
                else:
                    normalized_transactions.append(normalized_txn)
            except (ValueError, KeyError) as e:
                print(f'Skipping invalid transaction {idx + 1}: {e}')
                import traceback
                traceback.print_exc()
                continue
        
        print(f'Final normalized transactions count: {len(normalized_transactions)}')
        return normalized_transactions
        
    except Exception as error:
        print(f'Error in LLM extraction: {str(error)}')
        raise ValueError(f'Failed to extract transactions: {str(error)}')


def normalize_date(date_str: str) -> str:
    """Normalize date to ISO format"""
    try:
        # Try parsing various date formats
        date_formats = [
            '%Y-%m-%d',
            '%d/%m/%Y',
            '%m/%d/%Y',
            '%d-%m-%Y',
            '%Y-%m-%d %H:%M:%S',
        ]
        
        for fmt in date_formats:
            try:
                date_obj = datetime.strptime(date_str.strip(), fmt)
                return date_obj.strftime('%Y-%m-%d')
            except ValueError:
                continue
        
        # If no format matches, try parsing with dateutil (if available)
        try:
            from dateutil import parser
            date_obj = parser.parse(date_str)
            return date_obj.strftime('%Y-%m-%d')
        except ImportError:
            pass
        
        raise ValueError(f'Invalid date format: {date_str}')
    except Exception as e:
        raise ValueError(f'Invalid date: {date_str} - {str(e)}')


def normalize_description(desc: str) -> str:
    """Normalize description"""
    if not desc:
        return ''
    
    normalized = ' '.join(desc.split())  # Normalize whitespace
    return normalized[:100]  # Limit length


def normalize_category(category: str) -> str:
    """Normalize category to match app categories"""
    category_map = {
        'comida': 'Comida',
        'food': 'Comida',
        'restaurant': 'Comida',
        'entretenimiento': 'Entretenimiento',
        'entertainment': 'Entretenimiento',
        'familia': 'Familia',
        'family': 'Familia',
        'transporte': 'Transporte',
        'transport': 'Transporte',
        'gasolina': 'Transporte',
        'gas': 'Transporte',
        'salud': 'Salud',
        'health': 'Salud',
        'farmacia': 'Salud',
        'educación': 'Educación',
        'education': 'Educación',
        'ropa': 'Ropa',
        'clothing': 'Ropa',
        'servicios': 'Servicios',
        'services': 'Servicios',
        'vivienda': 'Vivienda',
        'housing': 'Vivienda',
        'renta': 'Vivienda',
        'otros': 'Otros',
        'other': 'Otros',
    }
    
    normalized = category.lower().strip()
    return category_map.get(normalized, 'Otros')