import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center space-y-6 p-8">
        <h1 className="text-6xl font-bold text-gray-900">
          Добро пожаловать
        </h1>
        <p className="text-xl text-gray-600 max-w-md mx-auto">
          Присоединяйтесь к нашей команде профессионалов
        </p>
        <Button size="lg" className="mt-4" onClick={() => navigate('/careers')}>
          <Icon name="Briefcase" size={20} className="mr-2" />
          Открытые вакансии
        </Button>
      </div>
    </div>
  );
};

export default Index;