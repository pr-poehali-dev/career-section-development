import json
import smtplib
import os
import psycopg2
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Dict, Any, Optional
from pydantic import BaseModel, EmailStr, Field

class ApplicantData(BaseModel):
    name: str = Field(..., min_length=1)
    surname: str = Field(..., min_length=1)
    email: EmailStr
    phone: str = Field(..., min_length=1)
    position: str = Field(..., min_length=1)
    experience: int = Field(..., ge=0)
    cover_letter: str = Field(..., min_length=1)
    portfolio_url: Optional[str] = None

class StudentData(BaseModel):
    name: str = Field(..., min_length=1)
    surname: str = Field(..., min_length=1)
    email: EmailStr
    phone: str = Field(..., min_length=1)
    university: str = Field(..., min_length=1)
    course: int = Field(..., ge=1, le=6)
    specialty: str = Field(..., min_length=1)
    direction: str = Field(..., min_length=1)
    motivation_letter: str = Field(..., min_length=1)
    portfolio_url: Optional[str] = None

def send_email(name: str, surname: str, email: str) -> bool:
    '''Send confirmation email to applicant'''
    smtp_host = os.environ.get('SMTP_HOST')
    smtp_port = int(os.environ.get('SMTP_PORT', '587'))
    smtp_user = os.environ.get('SMTP_USER')
    smtp_password = os.environ.get('SMTP_PASSWORD')
    
    if not all([smtp_host, smtp_user, smtp_password]):
        return False
    
    msg = MIMEMultipart('alternative')
    msg['Subject'] = 'Ваша анкета получена'
    msg['From'] = smtp_user
    msg['To'] = email
    
    text_content = f'''Добрый день, {name} {surname},

Ваша анкета получена, в ближайшее время она будет рассмотрена и с Вами обязательно свяжутся.

С уважением,
Отдел кадров'''
    
    html_content = f'''
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #0EA5E9;">Ваша анкета получена</h2>
          <p>Добрый день, <strong>{name} {surname}</strong>,</p>
          <p>Ваша анкета получена, в ближайшее время она будет рассмотрена и с Вами обязательно свяжутся.</p>
          <br>
          <p style="color: #666;">С уважением,<br>Отдел кадров</p>
        </div>
      </body>
    </html>
    '''
    
    part1 = MIMEText(text_content, 'plain', 'utf-8')
    part2 = MIMEText(html_content, 'html', 'utf-8')
    
    msg.attach(part1)
    msg.attach(part2)
    
    try:
        with smtplib.SMTP(smtp_host, smtp_port) as server:
            server.starttls()
            server.login(smtp_user, smtp_password)
            server.send_message(msg)
        return True
    except Exception:
        return False

def save_to_database(application_type: str, data: Dict[str, Any]) -> int:
    '''Save application to database and return application ID'''
    database_url = os.environ.get('DATABASE_URL')
    if not database_url:
        raise ValueError('DATABASE_URL not configured')
    
    conn = psycopg2.connect(database_url)
    cur = conn.cursor()
    
    if application_type == 'applicant':
        query = '''
            INSERT INTO applications 
            (application_type, name, surname, email, phone, position, experience, cover_letter, portfolio_url)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        '''
        values = (
            'applicant',
            data['name'],
            data['surname'],
            data['email'],
            data['phone'],
            data['position'],
            data['experience'],
            data['cover_letter'],
            data.get('portfolio_url')
        )
    else:
        query = '''
            INSERT INTO applications 
            (application_type, name, surname, email, phone, university, course, specialty, direction, motivation_letter, portfolio_url)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        '''
        values = (
            'student',
            data['name'],
            data['surname'],
            data['email'],
            data['phone'],
            data['university'],
            data['course'],
            data['specialty'],
            data['direction'],
            data['motivation_letter'],
            data.get('portfolio_url')
        )
    
    cur.execute(query, values)
    application_id = cur.fetchone()[0]
    
    conn.commit()
    cur.close()
    conn.close()
    
    return application_id

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Save job application to database and send confirmation email
    Args: event with httpMethod, body containing application data
          context with request_id
    Returns: HTTP response with success/error status
    '''
    method: str = event.get('httpMethod', 'POST')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    body_data = json.loads(event.get('body', '{}'))
    application_type = body_data.get('application_type')
    
    if application_type == 'applicant':
        validated_data = ApplicantData(**body_data)
    elif application_type == 'student':
        validated_data = StudentData(**body_data)
    else:
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Invalid application_type'}),
            'isBase64Encoded': False
        }
    
    application_id = save_to_database(application_type, validated_data.model_dump())
    
    email_sent = send_email(validated_data.name, validated_data.surname, validated_data.email)
    
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({
            'success': True,
            'application_id': application_id,
            'email_sent': email_sent,
            'message': f'Application saved successfully. Email {"sent" if email_sent else "not sent (SMTP not configured)"}'
        }),
        'isBase64Encoded': False
    }
