
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState } from 'react';
import type { Lesson } from '../../../server/src/schema';

interface EditLessonFormProps {
  lesson: Lesson;
  onSubmit: (data: Lesson) => Promise<void>;
  onCancel: () => void;
}

const COMMON_SUBJECTS = [
  'Mathematics',
  'Science',
  'History',
  'English',
  'Art',
  'Physical Education',
  'Music',
  'Geography',
  'Chemistry',
  'Physics',
  'Biology',
  'Literature',
  'Computer Science'
];

const COMMON_CLASSROOMS = [
  'Room 101',
  'Room 102',
  'Room 103',
  'Lab A',
  'Lab B',
  'Gymnasium',
  'Art Room',
  'Music Room',
  'Library',
  'Auditorium'
];

export function EditLessonForm({ lesson, onSubmit, onCancel }: EditLessonFormProps) {
  const [formData, setFormData] = useState<Lesson>(lesson);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await onSubmit(formData);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDateTimeLocal = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="subject">Subject</Label>
        <Select 
          value={formData.subject || ''} 
          onValueChange={(value: string) => 
            setFormData((prev: Lesson) => ({ ...prev, subject: value }))
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {COMMON_SUBJECTS.map((subject: string) => (
              <SelectItem key={subject} value={subject}>
                {subject}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="teacher">Teacher</Label>
        <Input
          id="teacher"
          value={formData.teacher}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFormData((prev: Lesson) => ({ ...prev, teacher: e.target.value }))
          }
          placeholder="Teacher's name"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="scheduled_time">Scheduled Time</Label>
        <Input
          id="scheduled_time"
          type="datetime-local"
          value={formatDateTimeLocal(formData.scheduled_time)}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFormData((prev: Lesson) => ({ 
              ...prev, 
              scheduled_time: new Date(e.target.value) 
            }))
          }
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="classroom">Classroom</Label>
        <Select 
          value={formData.classroom || ''} 
          onValueChange={(value: string) => 
            setFormData((prev: Lesson) => ({ ...prev, classroom: value }))
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {COMMON_CLASSROOMS.map((classroom: string) => (
              <SelectItem key={classroom} value={classroom}>
                {classroom}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="duration_minutes">Duration (minutes)</Label>
        <Select 
          value={formData.duration_minutes.toString() || '60'} 
          onValueChange={(value: string) => 
            setFormData((prev: Lesson) => ({ 
              ...prev, 
              duration_minutes: parseInt(value) 
            }))
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="30">30 minutes</SelectItem>
            <SelectItem value="45">45 minutes</SelectItem>
            <SelectItem value="60">1 hour</SelectItem>
            <SelectItem value="90">1.5 hours</SelectItem>
            <SelectItem value="120">2 hours</SelectItem>
            <SelectItem value="180">3 hours</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={isLoading} className="flex-1">
          {isLoading ? 'Updating...' : 'Update Lesson'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
      </div>
    </form>
  );
}
