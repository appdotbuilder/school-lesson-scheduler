
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Clock, MapPin, User, BookOpen, Plus, Filter, Trash2, Edit } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import type { Lesson, CreateLessonInput, GetLessonsQuery } from '../../server/src/schema';
import { LessonForm } from '@/components/LessonForm';
import { EditLessonForm } from '@/components/EditLessonForm';

function App() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [filters, setFilters] = useState<GetLessonsQuery>({});
  const [activeTab, setActiveTab] = useState('all');

  const loadLessons = useCallback(async () => {
    try {
      const result = await trpc.getLessons.query(filters);
      setLessons(result);
    } catch (error) {
      console.error('Failed to load lessons:', error);
    }
  }, [filters]);

  useEffect(() => {
    loadLessons();
  }, [loadLessons]);

  const handleCreateLesson = async (data: CreateLessonInput) => {
    setIsLoading(true);
    try {
      const newLesson = await trpc.createLesson.mutate(data);
      setLessons((prev: Lesson[]) => [...prev, newLesson]);
      setIsCreateOpen(false);
    } catch (error) {
      console.error('Failed to create lesson:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateLesson = async (lesson: Lesson) => {
    try {
      await trpc.updateLesson.mutate({
        id: lesson.id,
        subject: lesson.subject,
        teacher: lesson.teacher,
        scheduled_time: lesson.scheduled_time,
        classroom: lesson.classroom,
        duration_minutes: lesson.duration_minutes
      });
      setLessons((prev: Lesson[]) =>
        prev.map((l: Lesson) => l.id === lesson.id ? lesson : l)
      );
      setEditingLesson(null);
    } catch (error) {
      console.error('Failed to update lesson:', error);
    }
  };

  const handleDeleteLesson = async (id: number) => {
    try {
      await trpc.deleteLesson.mutate(id);
      setLessons((prev: Lesson[]) => prev.filter((l: Lesson) => l.id !== id));
    } catch (error) {
      console.error('Failed to delete lesson:', error);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString([], { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getSubjectColor = (subject: string) => {
    const colors = {
      'Mathematics': 'bg-blue-100 text-blue-800',
      'Science': 'bg-green-100 text-green-800',
      'History': 'bg-amber-100 text-amber-800',
      'English': 'bg-purple-100 text-purple-800',
      'Art': 'bg-pink-100 text-pink-800',
      'Physical Education': 'bg-orange-100 text-orange-800',
      'Music': 'bg-indigo-100 text-indigo-800',
    };
    return colors[subject as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const todayLessons = lessons.filter((lesson: Lesson) => {
    const today = new Date();
    const lessonDate = new Date(lesson.scheduled_time);
    return lessonDate.toDateString() === today.toDateString();
  });

  const upcomingLessons = lessons.filter((lesson: Lesson) => {
    const now = new Date();
    const lessonDate = new Date(lesson.scheduled_time);
    return lessonDate > now;
  }).slice(0, 5);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-indigo-100 rounded-xl">
              <BookOpen className="h-8 w-8 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">📚 School Schedule</h1>
              <p className="text-gray-600">Manage lessons, teachers, and classrooms</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 items-center">
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button className="bg-indigo-600 hover:bg-indigo-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Lesson
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Create New Lesson</DialogTitle>
                  <DialogDescription>
                    Schedule a new lesson for your students
                  </DialogDescription>
                </DialogHeader>
                <LessonForm onSubmit={handleCreateLesson} isLoading={isLoading} />
              </DialogContent>
            </Dialog>

            <div className="flex gap-2">
              <Input
                placeholder="Filter by teacher..."
                value={filters.teacher || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFilters((prev: GetLessonsQuery) => ({ ...prev, teacher: e.target.value || undefined }))
                }
                className="w-48"
              />
              <Input
                placeholder="Filter by classroom..."
                value={filters.classroom || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFilters((prev: GetLessonsQuery) => ({ ...prev, classroom: e.target.value || undefined }))
                }
                className="w-48"
              />
              <Input
                type="date"
                value={filters.date ? filters.date.toISOString().split('T')[0] : ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFilters((prev: GetLessonsQuery) => ({ 
                    ...prev, 
                    date: e.target.value ? new Date(e.target.value) : undefined 
                  }))
                }
                className="w-48"
              />
              <Button 
                variant="outline" 
                onClick={() => setFilters({})}
                className="border-gray-200"
              >
                <Filter className="h-4 w-4 mr-2" />
                Clear
              </Button>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="all">All Lessons</TabsTrigger>
            <TabsTrigger value="today">Today</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {lessons.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">No lessons scheduled yet</p>
                  <p className="text-gray-400">Create your first lesson to get started! 🎓</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {lessons.map((lesson: Lesson) => (
                  <Card key={lesson.id} className="hover:shadow-md transition-shadow border-l-4 border-l-indigo-400">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <Badge className={getSubjectColor(lesson.subject)}>
                              {lesson.subject}
                            </Badge>
                            <span className="text-sm text-gray-500">
                              {lesson.duration_minutes} minutes
                            </span>
                          </div>
                          <CardTitle className="text-xl">{lesson.subject}</CardTitle>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setEditingLesson(lesson)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Lesson</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this lesson? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleDeleteLesson(lesson.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-500" />
                          <span className="text-sm font-medium">{lesson.teacher}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">{lesson.classroom}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">{formatDate(lesson.scheduled_time)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">{formatTime(lesson.scheduled_time)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="today" className="space-y-4">
            {todayLessons.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">No lessons scheduled for today</p>
                  <p className="text-gray-400">Enjoy your free day! 🌟</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {todayLessons.map((lesson: Lesson) => (
                  <Card key={lesson.id} className="hover:shadow-md transition-shadow border-l-4 border-l-green-400">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                          <Badge className={getSubjectColor(lesson.subject)}>
                            {lesson.subject}
                          </Badge>
                          <CardTitle className="text-xl">{lesson.subject}</CardTitle>
                        </div>
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          Today
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-500" />
                          <span className="text-sm font-medium">{lesson.teacher}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">{lesson.classroom}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-500" />
                          <span className="text-sm font-medium">{formatTime(lesson.scheduled_time)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="upcoming" className="space-y-4">
            {upcomingLessons.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">No upcoming lessons</p>
                  <p className="text-gray-400">Schedule some lessons for the future! 📅</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {upcomingLessons.map((lesson: Lesson) => (
                  <Card key={lesson.id} className="hover:shadow-md transition-shadow border-l-4 border-l-blue-400">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                          <Badge className={getSubjectColor(lesson.subject)}>
                            {lesson.subject}
                          </Badge>
                          <CardTitle className="text-xl">{lesson.subject}</CardTitle>
                        </div>
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                          Upcoming
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-500" />
                          <span className="text-sm font-medium">{lesson.teacher}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">{lesson.classroom}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">{formatDate(lesson.scheduled_time)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">{formatTime(lesson.scheduled_time)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Edit Dialog */}
        {editingLesson && (
          <Dialog open={!!editingLesson} onOpenChange={() => setEditingLesson(null)}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Edit Lesson</DialogTitle>
                <DialogDescription>
                  Update the lesson details
                </DialogDescription>
              </DialogHeader>
              <EditLessonForm 
                lesson={editingLesson} 
                onSubmit={handleUpdateLesson}
                onCancel={() => setEditingLesson(null)}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}

export default App;
