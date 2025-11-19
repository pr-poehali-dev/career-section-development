import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

const API_URL = 'https://functions.poehali.dev/6364865b-6b4a-4d0e-bdce-76fa0f6dc777';

interface Group {
  id: number;
  name: string;
  description: string;
  employee_count: number;
  task_count: number;
}

interface Employee {
  id: number;
  group_id: number;
  name: string;
  position: string;
  email: string;
  phone?: string;
  status: string;
  group_name?: string;
}

interface Task {
  id: number;
  group_id: number;
  employee_id?: number;
  title: string;
  description?: string;
  status: string;
  priority: string;
  employee_name?: string;
  group_name?: string;
}

const Department = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [addEmployeeOpen, setAddEmployeeOpen] = useState(false);
  const [addTaskOpen, setAddTaskOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [groupsRes, employeesRes, tasksRes] = await Promise.all([
        fetch(`${API_URL}?resource=groups`),
        fetch(`${API_URL}?resource=employees`),
        fetch(`${API_URL}?resource=tasks`)
      ]);

      const groupsData = await groupsRes.json();
      const employeesData = await employeesRes.json();
      const tasksData = await tasksRes.json();

      setGroups(groupsData.groups || []);
      setEmployees(employeesData.employees || []);
      setTasks(tasksData.tasks || []);
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить данные',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddEmployee = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    try {
      const response = await fetch(`${API_URL}?resource=employees`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          group_id: parseInt(formData.get('group_id') as string),
          name: formData.get('name'),
          position: formData.get('position'),
          email: formData.get('email'),
          phone: formData.get('phone'),
          status: 'active'
        })
      });

      if (response.ok) {
        toast({ title: 'Успешно', description: 'Сотрудник добавлен' });
        setAddEmployeeOpen(false);
        fetchData();
        (e.target as HTMLFormElement).reset();
      }
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Не удалось добавить сотрудника', variant: 'destructive' });
    }
  };

  const handleAddTask = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    try {
      const response = await fetch(`${API_URL}?resource=tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          group_id: parseInt(formData.get('group_id') as string),
          employee_id: formData.get('employee_id') ? parseInt(formData.get('employee_id') as string) : null,
          title: formData.get('title'),
          description: formData.get('description'),
          status: 'todo',
          priority: formData.get('priority')
        })
      });

      if (response.ok) {
        toast({ title: 'Успешно', description: 'Задача создана' });
        setAddTaskOpen(false);
        fetchData();
        (e.target as HTMLFormElement).reset();
      }
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Не удалось создать задачу', variant: 'destructive' });
    }
  };

  const handleUpdateTaskStatus = async (taskId: number, newStatus: string) => {
    try {
      const response = await fetch(`${API_URL}?resource=tasks`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: taskId, status: newStatus })
      });

      if (response.ok) {
        toast({ title: 'Успешно', description: 'Статус задачи обновлён' });
        fetchData();
      }
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Не удалось обновить статус', variant: 'destructive' });
    }
  };

  const filteredEmployees = selectedGroup 
    ? employees.filter(e => e.group_id === selectedGroup)
    : employees;

  const filteredTasks = selectedGroup 
    ? tasks.filter(t => t.group_id === selectedGroup)
    : tasks;

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      todo: { variant: 'secondary', label: 'К выполнению' },
      in_progress: { variant: 'default', label: 'В работе' },
      completed: { variant: 'outline', label: 'Завершено' }
    };
    const config = variants[status] || variants.todo;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      high: { variant: 'destructive', label: 'Высокий' },
      medium: { variant: 'default', label: 'Средний' },
      low: { variant: 'secondary', label: 'Низкий' }
    };
    const config = variants[priority] || variants.medium;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 flex items-center justify-center">
        <p className="text-muted-foreground">Загрузка...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Управление отделом</h1>
          <p className="text-muted-foreground">Координация работы двух групп</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {groups.map(group => (
            <Card 
              key={group.id}
              className={`cursor-pointer transition-all hover:shadow-lg ${selectedGroup === group.id ? 'ring-2 ring-primary' : ''}`}
              onClick={() => setSelectedGroup(selectedGroup === group.id ? null : group.id)}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon name="Users" size={24} />
                  {group.name}
                </CardTitle>
                <CardDescription>{group.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <Icon name="User" size={16} className="text-muted-foreground" />
                    <span className="text-sm">{group.employee_count} сотрудников</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Icon name="CheckSquare" size={16} className="text-muted-foreground" />
                    <span className="text-sm">{group.task_count} задач</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="employees" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="employees">Сотрудники</TabsTrigger>
            <TabsTrigger value="tasks">Задачи</TabsTrigger>
          </TabsList>

          <TabsContent value="employees" className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold">
                {selectedGroup ? `Сотрудники ${groups.find(g => g.id === selectedGroup)?.name}` : 'Все сотрудники'}
              </h2>
              <Dialog open={addEmployeeOpen} onOpenChange={setAddEmployeeOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Icon name="UserPlus" size={16} className="mr-2" />
                    Добавить сотрудника
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Новый сотрудник</DialogTitle>
                    <DialogDescription>Добавьте информацию о новом сотруднике</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleAddEmployee} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="emp-group">Группа *</Label>
                      <Select name="group_id" required>
                        <SelectTrigger>
                          <SelectValue placeholder="Выберите группу" />
                        </SelectTrigger>
                        <SelectContent>
                          {groups.map(g => (
                            <SelectItem key={g.id} value={g.id.toString()}>{g.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="emp-name">ФИО *</Label>
                      <Input id="emp-name" name="name" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="emp-position">Должность *</Label>
                      <Input id="emp-position" name="position" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="emp-email">Email</Label>
                      <Input id="emp-email" name="email" type="email" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="emp-phone">Телефон</Label>
                      <Input id="emp-phone" name="phone" type="tel" />
                    </div>
                    <Button type="submit" className="w-full">Добавить</Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredEmployees.map(employee => (
                <Card key={employee.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">{employee.name}</CardTitle>
                    <CardDescription>{employee.position}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Icon name="Building" size={14} />
                      {employee.group_name}
                    </div>
                    {employee.email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Icon name="Mail" size={14} />
                        {employee.email}
                      </div>
                    )}
                    {employee.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Icon name="Phone" size={14} />
                        {employee.phone}
                      </div>
                    )}
                    <Badge variant={employee.status === 'active' ? 'default' : 'secondary'}>
                      {employee.status === 'active' ? 'Активен' : 'Неактивен'}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="tasks" className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold">
                {selectedGroup ? `Задачи ${groups.find(g => g.id === selectedGroup)?.name}` : 'Все задачи'}
              </h2>
              <Dialog open={addTaskOpen} onOpenChange={setAddTaskOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Icon name="Plus" size={16} className="mr-2" />
                    Создать задачу
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Новая задача</DialogTitle>
                    <DialogDescription>Создайте задачу для сотрудника</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleAddTask} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="task-group">Группа *</Label>
                      <Select name="group_id" required>
                        <SelectTrigger>
                          <SelectValue placeholder="Выберите группу" />
                        </SelectTrigger>
                        <SelectContent>
                          {groups.map(g => (
                            <SelectItem key={g.id} value={g.id.toString()}>{g.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="task-employee">Исполнитель</Label>
                      <Select name="employee_id">
                        <SelectTrigger>
                          <SelectValue placeholder="Выберите сотрудника (опционально)" />
                        </SelectTrigger>
                        <SelectContent>
                          {employees.map(e => (
                            <SelectItem key={e.id} value={e.id.toString()}>{e.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="task-title">Название *</Label>
                      <Input id="task-title" name="title" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="task-desc">Описание</Label>
                      <Textarea id="task-desc" name="description" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="task-priority">Приоритет</Label>
                      <Select name="priority" defaultValue="medium">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Низкий</SelectItem>
                          <SelectItem value="medium">Средний</SelectItem>
                          <SelectItem value="high">Высокий</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button type="submit" className="w-full">Создать</Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="space-y-4">
              {filteredTasks.map(task => (
                <Card key={task.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{task.title}</CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-1">
                          <Icon name="Building" size={14} />
                          {task.group_name}
                          {task.employee_name && (
                            <>
                              <span>•</span>
                              <Icon name="User" size={14} />
                              {task.employee_name}
                            </>
                          )}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        {getPriorityBadge(task.priority)}
                        {getStatusBadge(task.status)}
                      </div>
                    </div>
                  </CardHeader>
                  {task.description && (
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-3">{task.description}</p>
                      <div className="flex gap-2">
                        {task.status !== 'completed' && (
                          <>
                            {task.status === 'todo' && (
                              <Button size="sm" onClick={() => handleUpdateTaskStatus(task.id, 'in_progress')}>
                                Начать работу
                              </Button>
                            )}
                            {task.status === 'in_progress' && (
                              <Button size="sm" onClick={() => handleUpdateTaskStatus(task.id, 'completed')}>
                                Завершить
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Department;
