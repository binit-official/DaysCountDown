import { useState } from 'react';
import { Plus, Edit3, Trash2, Target, Calendar, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export interface Task {
  id: string;
  title: string;
  targetDate: Date;
  startDate: Date;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'extreme';
}

interface TaskManagerProps {
  tasks: Task[];
  onTasksChange: (tasks: Task[]) => void;
  selectedTaskId: string | null;
  onSelectTask: (taskId: string) => void;
}

const priorityColors = {
  low: 'border-blue-500 bg-blue-500/10',
  medium: 'border-yellow-500 bg-yellow-500/10',
  high: 'border-orange-500 bg-orange-500/10',
  extreme: 'border-red-500 bg-red-500/10'
};

const priorityLabels = {
  low: 'Low',
  medium: 'Medium', 
  high: 'High',
  extreme: 'EXTREME'
};

export const TaskManager = ({ tasks, onTasksChange, selectedTaskId, onSelectTask }: TaskManagerProps) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    targetDate: '',
    category: '',
    priority: 'high' as Task['priority']
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.targetDate) return;
    
    const taskData = {
      id: editingTask?.id || Date.now().toString(),
      title: formData.title,
      targetDate: new Date(formData.targetDate),
      startDate: editingTask?.startDate || new Date(), // Keep original start date when editing, use current date for new tasks
      category: formData.category || 'General',
      priority: formData.priority
    };

    if (editingTask) {
      // Update existing task
      const updatedTasks = tasks.map(task => 
        task.id === editingTask.id ? taskData : task
      );
      onTasksChange(updatedTasks);
    } else {
      // Add new task
      onTasksChange([...tasks, taskData]);
    }

    // Reset form
    setFormData({ title: '', targetDate: '', category: '', priority: 'high' });
    setIsAddDialogOpen(false);
    setEditingTask(null);
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      targetDate: task.targetDate.toISOString().split('T')[0],
      category: task.category,
      priority: task.priority
    });
    setIsAddDialogOpen(true);
  };

  const handleDelete = (taskId: string) => {
    const updatedTasks = tasks.filter(task => task.id !== taskId);
    onTasksChange(updatedTasks);
    if (selectedTaskId === taskId && updatedTasks.length > 0) {
      onSelectTask(updatedTasks[0].id);
    }
  };

  const getTimeLeft = (targetDate: Date) => {
    const now = new Date();
    const difference = targetDate.getTime() - now.getTime();
    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    
    if (days > 0) return `${days} days left`;
    if (days === 0) return 'Today!';
    return `${Math.abs(days)} days overdue`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold neon-text">Active Missions</h3>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              className="cyberpunk-button"
              onClick={() => {
                setEditingTask(null);
                setFormData({ title: '', targetDate: '', category: '', priority: 'high' });
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              New Mission
            </Button>
          </DialogTrigger>
          
          <DialogContent className="bg-card border-primary/50">
            <DialogHeader>
              <DialogTitle className="neon-text">
                {editingTask ? 'Edit Mission' : 'Create New Mission'}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title" className="text-foreground">Mission Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="What are you fighting for?"
                  className="neon-border bg-background/50"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="targetDate" className="text-foreground">Deadline</Label>
                <Input
                  id="targetDate"
                  type="date"
                  value={formData.targetDate}
                  onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
                  className="neon-border bg-background/50"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="category" className="text-foreground">Category</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g., Fitness, Business, Study"
                  className="neon-border bg-background/50"
                />
              </div>
              
              <div>
                <Label htmlFor="priority" className="text-foreground">Priority Level</Label>
                <select
                  id="priority"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as Task['priority'] })}
                  className="w-full p-2 rounded-md neon-border bg-background/50 text-foreground"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="extreme">EXTREME</option>
                </select>
              </div>
              
              <div className="flex space-x-2 pt-4">
                <Button type="submit" className="flex-1 cyberpunk-button">
                  {editingTask ? 'Update Mission' : 'Launch Mission'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsAddDialogOpen(false)}
                  className="neon-border"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Task List */}
      <div className="grid gap-3">
        {tasks.map((task) => (
          <Card 
            key={task.id}
            className={`p-4 cursor-pointer transition-all duration-300 border-2 ${
              selectedTaskId === task.id 
                ? 'border-primary bg-primary/10 shadow-neon' 
                : priorityColors[task.priority]
            } hover:shadow-glow`}
            onClick={() => onSelectTask(task.id)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <Target className="w-4 h-4 text-primary" />
                  <h4 className="font-semibold text-foreground">{task.title}</h4>
                  <span className={`px-2 py-1 text-xs rounded-full font-bold ${
                    task.priority === 'extreme' ? 'bg-red-500 text-white animate-pulse' :
                    task.priority === 'high' ? 'bg-orange-500 text-white' :
                    task.priority === 'medium' ? 'bg-yellow-500 text-black' :
                    'bg-blue-500 text-white'
                  }`}>
                    {priorityLabels[task.priority]}
                  </span>
                </div>
                
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-3 h-3" />
                    <span>{task.targetDate.toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span className={getTimeLeft(task.targetDate).includes('overdue') ? 'text-red-500 font-bold' : ''}>
                      {getTimeLeft(task.targetDate)}
                    </span>
                  </div>
                  {task.category && (
                    <span className="bg-muted px-2 py-1 rounded text-xs">
                      {task.category}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="flex space-x-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit(task);
                  }}
                  className="h-8 w-8 p-0 hover:bg-primary/20"
                >
                  <Edit3 className="w-3 h-3" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(task.id);
                  }}
                  className="h-8 w-8 p-0 hover:bg-red-500/20 text-red-400"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
        
        {tasks.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg">No missions active.</p>
            <p className="text-sm">Time to stop making excuses.</p>
          </div>
        )}
      </div>
    </div>
  );
};