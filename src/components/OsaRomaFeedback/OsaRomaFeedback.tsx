import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useEventStore } from '@/stores/event-store';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Feedback {
  id: string;
  event_id: string;
  user_name: string;
  user_email: string;
  rating: number;
  comment: string;
  created_at: string;
}

const satisfactionLevels = [
  { 
    value: 1, 
    label: "Pessimo", 
    color: "bg-red-600 hover:bg-red-700", 
    emoji: "😞",
    animation: "animate-shake"
  },
  { 
    value: 2, 
    label: "Medio", 
    color: "bg-orange-500 hover:bg-orange-600", 
    emoji: "😐",
    animation: "animate-wobble"
  },
  { 
    value: 3, 
    label: "Buono", 
    color: "bg-green-600 hover:bg-green-700", 
    emoji: "😊",
    animation: "animate-gentle-bounce"
  },
  { 
    value: 4, 
    label: "Molto Buono", 
    color: "bg-blue-600 hover:bg-blue-700", 
    emoji: "😄",
    animation: "animate-heart-beat"
  },
  { 
    value: 5, 
    label: "Eccellente", 
    color: "bg-purple-600 hover:bg-purple-700", 
    emoji: "🎉",
    animation: "animate-celebration"
  }
];

export const OsaRomaFeedback: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [clickedButton, setClickedButton] = useState<number | null>(null);
  const { selectedEventId } = useEventStore();

  const totalSteps = 3;

  const steps = [
    {
      id: 1,
      title: "Chi sei?",
      subtitle: "Inserisci i tuoi dati per procedere",
      type: "user-info"
    },
    {
      id: 2,
      title: "La tua Valutazione",
      subtitle: "Come valuti la tua esperienza?",
      type: "rating"
    },
    {
      id: 3,
      title: "Il tuo Feedback",
      subtitle: "Condividi con noi i tuoi suggerimenti",
      type: "comment"
    }
  ];

  useEffect(() => {
    if (selectedEventId) {
      fetchFeedbacks();
    }
  }, [selectedEventId]);

  const fetchFeedbacks = async () => {
    try {
      const { data, error } = await supabase
        .from('osa_roma_feedback')
        .select('*')
        .eq('event_id', selectedEventId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFeedbacks(data || []);
    } catch (error) {
      console.error('Error fetching feedbacks:', error);
      toast.error('Errore durante il caricamento dei feedback');
    }
  };

  const handleRatingSelect = (value: number) => {
    setClickedButton(value);
    setTimeout(() => {
      setRating(value);
      setCurrentStep(3);
    }, 600);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEventId) {
      toast.error('Nessun evento selezionato');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('osa_roma_feedback')
        .insert({
          event_id: selectedEventId,
          user_name: userName,
          user_email: userEmail,
          rating,
          comment
        });

      if (error) throw error;

      toast.success('Feedback inviato con successo!');
      setUserName('');
      setUserEmail('');
      setRating(0);
      setComment('');
      setCurrentStep(1);
      fetchFeedbacks();
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast.error('Errore durante l\'invio del feedback');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentStepData = steps[currentStep - 1];

  const getClickAnimation = (level: typeof satisfactionLevels[0]) => {
    switch (level.value) {
      case 1: return "animate-shake";
      case 2: return "animate-wobble";
      case 3: return "animate-gentle-bounce";
      case 4: return "animate-heart-beat";
      case 5: return "animate-celebration";
      default: return "";
    }
  };

  const getEmojiClickAnimation = (level: typeof satisfactionLevels[0]) => {
    switch (level.value) {
      case 1: return "animate-pulse scale-90";
      case 2: return "animate-swing";
      case 3: return "animate-heart-beat";
      case 4: return "animate-bounce";
      case 5: return "animate-sparkle";
      default: return "";
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2.5 mb-8">
        <div 
          className="bg-gradient-to-r from-green-600 via-orange-500 to-red-600 h-2.5 rounded-full transition-all duration-300"
          style={{ width: `${(currentStep / totalSteps) * 100}%` }}
        />
      </div>

      {/* Main Form Card */}
      <Card className="shadow-2xl border-0 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-green-600 via-orange-500 to-red-600 text-white relative">
          <div className="absolute inset-0 bg-black/10" />
          <div className="relative z-10">
            <CardTitle className="text-2xl lg:text-3xl text-center mb-2">
              {currentStepData.title}
            </CardTitle>
            <p className="text-orange-100 text-center text-sm lg:text-base">
              {currentStepData.subtitle}
            </p>
          </div>
        </CardHeader>

        <CardContent className="p-8 lg:p-12">
          <div className="space-y-8">
            {currentStepData.type === "user-info" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="userName">Nome</Label>
                  <Input
                    id="userName"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="userEmail">Email</Label>
                  <Input
                    id="userEmail"
                    type="email"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    required
                  />
                </div>
                <div className="flex justify-center pt-4">
                  <Button
                    onClick={() => setCurrentStep(2)}
                    disabled={!userName || !userEmail}
                    className="px-8 py-2 bg-gradient-to-r from-green-600 to-orange-500 text-white rounded-full hover:from-green-700 hover:to-orange-600 transition-all duration-300 transform hover:scale-105"
                  >
                    Continua
                  </Button>
                </div>
              </div>
            )}

            {currentStepData.type === "rating" && (
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
                {satisfactionLevels.map((level) => {
                  const isClicked = clickedButton === level.value;
                  const isSelected = rating === level.value;
                  
                  return (
                    <button
                      key={level.value}
                      onClick={() => handleRatingSelect(level.value)}
                      className={cn(
                        "relative flex flex-col items-center justify-center p-6 rounded-xl border-2 transition-all duration-300 transform overflow-hidden",
                        "hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-orange-300",
                        isSelected
                          ? `${level.color} text-white border-transparent shadow-lg scale-105`
                          : "bg-white border-gray-200 text-gray-700 hover:border-gray-300",
                        isClicked && getClickAnimation(level)
                      )}
                    >
                      {isClicked && (
                        <div className={cn(
                          "absolute inset-0 rounded-xl",
                          level.value === 1 && "bg-red-200 opacity-40 animate-fade-pulse",
                          level.value === 2 && "bg-orange-200 opacity-40 animate-gentle-ripple",
                          level.value === 3 && "bg-green-200 opacity-40 animate-soft-glow",
                          level.value === 4 && "bg-blue-200 opacity-40 animate-soft-glow",
                          level.value === 5 && "bg-gradient-to-r from-purple-200 to-pink-200 opacity-50 animate-gradient-shift"
                        )} />
                      )}
                      
                      <span className={cn(
                        "text-3xl mb-2 transition-transform duration-300 relative z-10",
                        isClicked && getEmojiClickAnimation(level)
                      )}>
                        {level.emoji}
                      </span>
                      
                      <span className="font-medium text-sm lg:text-base relative z-10">
                        {level.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {currentStepData.type === "comment" && (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="comment">Il tuo commento</Label>
                  <Textarea
                    id="comment"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Scrivi qui il tuo feedback, suggerimenti o commenti..."
                    className="min-h-[150px] resize-none"
                  />
                </div>
                <div className="flex justify-center">
                  <Button
                    type="submit"
                    disabled={isSubmitting || !rating}
                    className="px-12 py-2 bg-gradient-to-r from-green-600 to-orange-500 text-white rounded-full hover:from-green-700 hover:to-orange-600 transition-all duration-300 transform hover:scale-105"
                  >
                    {isSubmitting ? "Invio in corso..." : "Invia Feedback"}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Feedback List */}
      <div className="mt-12 space-y-4">
        <h3 className="text-xl font-semibold mb-6">Feedback Ricevuti</h3>
        {feedbacks.map((feedback) => (
          <Card key={feedback.id} className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {[...Array(5)].map((_, i) => (
                  <span
                    key={i}
                    className={cn(
                      "text-2xl",
                      i < feedback.rating ? "text-yellow-400" : "text-gray-300"
                    )}
                  >
                    {i < feedback.rating ? "★" : "☆"}
                  </span>
                ))}
              </div>
              <span className="text-sm text-gray-500">
                {new Date(feedback.created_at).toLocaleDateString()}
              </span>
            </div>
            <div className="mb-2">
              <p className="font-medium">{feedback.user_name}</p>
              <p className="text-sm text-gray-500">{feedback.user_email}</p>
            </div>
            {feedback.comment && (
              <p className="text-gray-600">{feedback.comment}</p>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}; 