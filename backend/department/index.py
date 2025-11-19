import json
import os
import psycopg2
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: API для управления отделом, группами, сотрудниками и задачами
    Args: event - dict с httpMethod, queryStringParameters, body
          context - объект с атрибутами request_id, function_name
    Returns: HTTP response dict
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    dsn = os.environ.get('DATABASE_URL')
    conn = psycopg2.connect(dsn)
    cur = conn.cursor()
    
    try:
        params = event.get('queryStringParameters') or {}
        resource = params.get('resource', 'groups')
        
        if method == 'GET':
            if resource == 'groups':
                cur.execute('''
                    SELECT g.id, g.name, g.description, g.created_at,
                           COUNT(DISTINCT e.id) as employee_count,
                           COUNT(DISTINCT t.id) as task_count
                    FROM groups g
                    LEFT JOIN employees e ON g.id = e.group_id
                    LEFT JOIN tasks t ON g.id = t.group_id
                    GROUP BY g.id, g.name, g.description, g.created_at
                    ORDER BY g.id
                ''')
                columns = [desc[0] for desc in cur.description]
                groups = [dict(zip(columns, row)) for row in cur.fetchall()]
                
                for group in groups:
                    if group['created_at']:
                        group['created_at'] = group['created_at'].isoformat()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'groups': groups})
                }
            
            elif resource == 'employees':
                group_id = params.get('group_id')
                if group_id:
                    cur.execute('''
                        SELECT e.*, g.name as group_name
                        FROM employees e
                        LEFT JOIN groups g ON e.group_id = g.id
                        WHERE e.group_id = %s
                        ORDER BY e.id
                    ''', (group_id,))
                else:
                    cur.execute('''
                        SELECT e.*, g.name as group_name
                        FROM employees e
                        LEFT JOIN groups g ON e.group_id = g.id
                        ORDER BY e.group_id, e.id
                    ''')
                
                columns = [desc[0] for desc in cur.description]
                employees = [dict(zip(columns, row)) for row in cur.fetchall()]
                
                for emp in employees:
                    if emp.get('created_at'):
                        emp['created_at'] = emp['created_at'].isoformat()
                    if emp.get('hired_date'):
                        emp['hired_date'] = emp['hired_date'].isoformat()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'employees': employees})
                }
            
            elif resource == 'tasks':
                group_id = params.get('group_id')
                if group_id:
                    cur.execute('''
                        SELECT t.*, e.name as employee_name, g.name as group_name
                        FROM tasks t
                        LEFT JOIN employees e ON t.employee_id = e.id
                        LEFT JOIN groups g ON t.group_id = g.id
                        WHERE t.group_id = %s
                        ORDER BY t.id DESC
                    ''', (group_id,))
                else:
                    cur.execute('''
                        SELECT t.*, e.name as employee_name, g.name as group_name
                        FROM tasks t
                        LEFT JOIN employees e ON t.employee_id = e.id
                        LEFT JOIN groups g ON t.group_id = g.id
                        ORDER BY t.created_at DESC
                    ''')
                
                columns = [desc[0] for desc in cur.description]
                tasks = [dict(zip(columns, row)) for row in cur.fetchall()]
                
                for task in tasks:
                    if task.get('created_at'):
                        task['created_at'] = task['created_at'].isoformat()
                    if task.get('completed_at'):
                        task['completed_at'] = task['completed_at'].isoformat()
                    if task.get('due_date'):
                        task['due_date'] = task['due_date'].isoformat()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'tasks': tasks})
                }
        
        elif method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            
            if resource == 'employees':
                cur.execute('''
                    INSERT INTO employees (group_id, name, position, email, phone, status, hired_date)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                    RETURNING id
                ''', (
                    body_data.get('group_id'),
                    body_data['name'],
                    body_data.get('position'),
                    body_data.get('email'),
                    body_data.get('phone'),
                    body_data.get('status', 'active'),
                    body_data.get('hired_date')
                ))
                new_id = cur.fetchone()[0]
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True, 'id': new_id})
                }
            
            elif resource == 'tasks':
                cur.execute('''
                    INSERT INTO tasks (group_id, employee_id, title, description, status, priority, due_date)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                    RETURNING id
                ''', (
                    body_data.get('group_id'),
                    body_data.get('employee_id'),
                    body_data['title'],
                    body_data.get('description'),
                    body_data.get('status', 'todo'),
                    body_data.get('priority', 'medium'),
                    body_data.get('due_date')
                ))
                new_id = cur.fetchone()[0]
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True, 'id': new_id})
                }
        
        elif method == 'PUT':
            body_data = json.loads(event.get('body', '{}'))
            item_id = body_data.get('id')
            
            if resource == 'tasks' and item_id:
                update_fields = []
                values = []
                
                if 'status' in body_data:
                    update_fields.append('status = %s')
                    values.append(body_data['status'])
                    if body_data['status'] == 'completed':
                        update_fields.append('completed_at = CURRENT_TIMESTAMP')
                
                if 'title' in body_data:
                    update_fields.append('title = %s')
                    values.append(body_data['title'])
                
                if 'employee_id' in body_data:
                    update_fields.append('employee_id = %s')
                    values.append(body_data['employee_id'])
                
                if update_fields:
                    values.append(item_id)
                    cur.execute(f'''
                        UPDATE tasks SET {', '.join(update_fields)}
                        WHERE id = %s
                    ''', tuple(values))
                    conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True})
                }
            
            elif resource == 'employees' and item_id:
                update_fields = []
                values = []
                
                for field in ['name', 'position', 'email', 'phone', 'status']:
                    if field in body_data:
                        update_fields.append(f'{field} = %s')
                        values.append(body_data[field])
                
                if update_fields:
                    values.append(item_id)
                    cur.execute(f'''
                        UPDATE employees SET {', '.join(update_fields)}
                        WHERE id = %s
                    ''', tuple(values))
                    conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True})
                }
        
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Invalid request'})
        }
    
    finally:
        cur.close()
        conn.close()
