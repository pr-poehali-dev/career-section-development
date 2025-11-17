import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

interface Job {
  id: number;
  title: string;
  department: string;
  location: string;
  type: string;
  description: string;
}

const jobs: Job[] = [
  {
    id: 1,
    title: 'Frontend Developer',
    department: 'Разработка',
    location: 'Москва',
    type: 'Полная занятость',
    description: 'Ищем опытного frontend-разработчика для работы над современными веб-приложениями.'
  },
  {
    id: 2,
    title: 'UX/UI Designer',
    department: 'Дизайн',
    location: 'Удалённо',
    type: 'Полная занятость',
    description: 'Творческий дизайнер для создания интуитивных и красивых интерфейсов.'
  },
  {
    id: 3,
    title: 'Product Manager',
    department: 'Продукт',
    location: 'Санкт-Петербург',
    type: 'Полная занятость',
    description: 'Опытный product manager для управления развитием наших продуктов.'
  },
  {
    id: 4,
    title: 'Data Analyst',
    department: 'Аналитика',
    location: 'Москва',
    type: 'Полная занятость',
    description: 'Аналитик данных для работы с метриками и принятия решений на основе данных.'
  },
  {
    id: 5,
    title: 'Marketing Intern',
    department: 'Маркетинг',
    location: 'Москва',
    type: 'Стажировка',
    description: 'Стажёр в отдел маркетинга для студентов, интересующихся digital-маркетингом.'
  },
  {
    id: 6,
    title: 'Backend Developer',
    department: 'Разработка',
    location: 'Удалённо',
    type: 'Полная занятость',
    description: 'Backend-разработчик для создания масштабируемых серверных решений.'
  }
];

const Careers = () => {
  const [selectedDepartment, setSelectedDepartment] = useState<string>('Все');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const departments = ['Все', ...Array.from(new Set(jobs.map(job => job.department)))];

  const filteredJobs = selectedDepartment === 'Все' 
    ? jobs 
    : jobs.filter(job => job.department === selectedDepartment);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>, formType: string) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const surname = formData.get('surname') as string;
    const email = formData.get('email') as string;

    try {
      const response = await fetch('https://functions.poehali.dev/e84fc33a-bb8b-4280-a36d-a69de81a66d9', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          surname,
          email,
          application_type: formType
        })
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          title: 'Анкета отправлена',
          description: `Письмо отправлено на ${email}. Проверьте почту для подтверждения.`,
        });
        (e.target as HTMLFormElement).reset();
      } else {
        toast({
          title: 'Ошибка',
          description: result.error || 'Не удалось отправить анкету. Попробуйте позже.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось отправить анкету. Проверьте соединение.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16 max-w-7xl">
        <div className="text-center mb-16 animate-fade-in">
          <h1 className="text-5xl font-bold mb-4 text-foreground">Карьера</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Присоединяйтесь к нашей команде профессионалов и развивайтесь вместе с нами
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 mb-20">
          <Card className="lg:col-span-2 animate-scale-in">
            <CardHeader>
              <CardTitle className="text-3xl flex items-center gap-2">
                <Icon name="Briefcase" size={32} className="text-primary" />
                Открытые вакансии
              </CardTitle>
              <CardDescription>Найдите свою идеальную позицию</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 mb-6">
                {departments.map((dept) => (
                  <Badge
                    key={dept}
                    variant={selectedDepartment === dept ? 'default' : 'outline'}
                    className="cursor-pointer transition-all hover:scale-105"
                    onClick={() => setSelectedDepartment(dept)}
                  >
                    {dept}
                  </Badge>
                ))}
              </div>

              <div className="space-y-4">
                {filteredJobs.map((job, index) => (
                  <Card 
                    key={job.id} 
                    className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-primary/20 hover:border-l-primary"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-xl mb-2">{job.title}</CardTitle>
                          <CardDescription>{job.description}</CardDescription>
                        </div>
                        <Badge variant="secondary">{job.type}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Icon name="Building2" size={16} />
                          {job.department}
                        </span>
                        <span className="flex items-center gap-1">
                          <Icon name="MapPin" size={16} />
                          {job.location}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="animate-scale-in" style={{ animationDelay: '0.2s' }}>
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Icon name="Users" size={28} className="text-primary" />
                  Контакты HR
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <Icon name="Mail" size={20} className="text-primary mt-1" />
                  <div>
                    <p className="font-medium">Email</p>
                    <a href="mailto:hr@company.ru" className="text-primary hover:underline">
                      hr@company.ru
                    </a>
                  </div>
                </div>

                <Separator />

                <div className="flex items-start gap-3">
                  <Icon name="Phone" size={20} className="text-primary mt-1" />
                  <div>
                    <p className="font-medium">Телефон</p>
                    <a href="tel:+74951234567" className="text-primary hover:underline">
                      +7 (495) 123-45-67
                    </a>
                  </div>
                </div>

                <Separator />

                <div className="flex items-start gap-3">
                  <Icon name="MapPin" size={20} className="text-primary mt-1" />
                  <div>
                    <p className="font-medium">Адрес</p>
                    <p className="text-sm text-muted-foreground">
                      г. Москва, ул. Примерная, д. 123
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="flex items-start gap-3">
                  <Icon name="Clock" size={20} className="text-primary mt-1" />
                  <div>
                    <p className="font-medium">Время работы</p>
                    <p className="text-sm text-muted-foreground">
                      Пн-Пт: 9:00 - 18:00
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-primary/5 border-primary/20 animate-scale-in" style={{ animationDelay: '0.3s' }}>
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <Icon name="Info" size={24} className="text-primary mt-1" />
                  <div>
                    <p className="font-medium mb-2">Важная информация</p>
                    <p className="text-sm text-muted-foreground">
                      Мы рассматриваем все резюме в течение 5 рабочих дней и обязательно отвечаем всем кандидатам.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Card className="max-w-4xl mx-auto animate-fade-in">
          <CardHeader>
            <CardTitle className="text-3xl flex items-center gap-2">
              <Icon name="FileText" size={32} className="text-primary" />
              Отправить анкету
            </CardTitle>
            <CardDescription>
              Заполните форму ниже, и мы обязательно рассмотрим вашу кандидатуру
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="applicant" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8">
                <TabsTrigger value="applicant" className="text-base">
                  Для соискателей
                </TabsTrigger>
                <TabsTrigger value="student" className="text-base">
                  Для студентов
                </TabsTrigger>
              </TabsList>

              <TabsContent value="applicant">
                <form onSubmit={(e) => handleSubmit(e, 'applicant')} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="app-name">Имя *</Label>
                      <Input id="app-name" name="name" placeholder="Иван" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="app-surname">Фамилия *</Label>
                      <Input id="app-surname" name="surname" placeholder="Иванов" required />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="app-email">Email *</Label>
                    <Input id="app-email" name="email" type="email" placeholder="ivan@example.com" required />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="app-phone">Телефон *</Label>
                    <Input id="app-phone" type="tel" placeholder="+7 (999) 123-45-67" required />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="app-position">Желаемая позиция *</Label>
                    <Input id="app-position" placeholder="Frontend Developer" required />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="app-experience">Опыт работы (в годах) *</Label>
                    <Input id="app-experience" type="number" min="0" placeholder="3" required />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="app-cover">Сопроводительное письмо *</Label>
                    <Textarea
                      id="app-cover"
                      placeholder="Расскажите о себе и почему вы хотите работать у нас..."
                      className="min-h-32"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="app-portfolio">Ссылка на портфолио/LinkedIn</Label>
                    <Input id="app-portfolio" type="url" placeholder="https://..." />
                  </div>

                  <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
                    <Icon name="Send" size={20} className="mr-2" />
                    {isSubmitting ? 'Отправка...' : 'Отправить анкету'}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="student">
                <form onSubmit={(e) => handleSubmit(e, 'student')} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="stu-name">Имя *</Label>
                      <Input id="stu-name" name="name" placeholder="Мария" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="stu-surname">Фамилия *</Label>
                      <Input id="stu-surname" name="surname" placeholder="Петрова" required />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="stu-email">Email *</Label>
                    <Input id="stu-email" name="email" type="email" placeholder="maria@example.com" required />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="stu-phone">Телефон *</Label>
                    <Input id="stu-phone" type="tel" placeholder="+7 (999) 123-45-67" required />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="stu-university">Университет *</Label>
                    <Input id="stu-university" placeholder="МГУ им. М.В. Ломоносова" required />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="stu-course">Курс *</Label>
                      <Input id="stu-course" type="number" min="1" max="6" placeholder="3" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="stu-specialty">Специальность *</Label>
                      <Input id="stu-specialty" placeholder="Информатика" required />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="stu-direction">Интересующее направление *</Label>
                    <Input id="stu-direction" placeholder="Frontend-разработка, Дизайн, Аналитика..." required />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="stu-motivation">Мотивационное письмо *</Label>
                    <Textarea
                      id="stu-motivation"
                      placeholder="Расскажите, почему хотите пройти стажировку у нас..."
                      className="min-h-32"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="stu-portfolio">Ссылка на портфолио/проекты</Label>
                    <Input id="stu-portfolio" type="url" placeholder="https://..." />
                  </div>

                  <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
                    <Icon name="Send" size={20} className="mr-2" />
                    {isSubmitting ? 'Отправка...' : 'Отправить анкету студента'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Careers;