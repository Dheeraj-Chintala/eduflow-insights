import { useEffect, useState, useRef } from 'react';
import { MessageCircle, Send, X, Minimize2, Maximize2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { fromTable } from '@/lib/supabase-helpers';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import type { MentorChatSession, MentorChatMessage, Profile } from '@/types/database';

interface ChatSessionWithDetails extends MentorChatSession {
  mentor?: Profile;
  messages: MentorChatMessage[];
  unreadCount: number;
}

interface MentorChatProps {
  courseId?: string;
}

export function MentorChat({ courseId }: MentorChatProps) {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [sessions, setSessions] = useState<ChatSessionWithDetails[]>([]);
  const [activeSession, setActiveSession] = useState<ChatSessionWithDetails | null>(null);
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user && isOpen) {
      fetchSessions();

      // Subscribe to new messages
      const channel = supabase
        .channel('mentor-chat')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'mentor_chat_messages',
          },
          (payload) => {
            const newMessage = payload.new as MentorChatMessage;
            setActiveSession(prev => {
              if (prev && prev.id === newMessage.session_id) {
                return {
                  ...prev,
                  messages: [...prev.messages, newMessage],
                };
              }
              return prev;
            });
            scrollToBottom();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [activeSession?.messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchSessions = async () => {
    try {
      const { data: sessionsData } = await fromTable('mentor_chat_sessions')
        .select('*')
        .eq('student_id', user!.id)
        .order('created_at', { ascending: false });

      if (!sessionsData || sessionsData.length === 0) {
        setSessions([]);
        return;
      }

      const sessionsList = sessionsData as MentorChatSession[];
      const mentorIds = [...new Set(sessionsList.map(s => s.mentor_id))];

      // Fetch mentors
      const { data: mentors } = await fromTable('profiles')
        .select('*')
        .in('user_id', mentorIds);

      const mentorMap = new Map((mentors as Profile[] || []).map(m => [m.user_id, m]));

      // Fetch messages for each session
      const sessionsWithDetails: ChatSessionWithDetails[] = await Promise.all(
        sessionsList.map(async (session) => {
          const { data: messages } = await fromTable('mentor_chat_messages')
            .select('*')
            .eq('session_id', session.id)
            .order('created_at', { ascending: true });

          const msgList = (messages as MentorChatMessage[]) || [];
          const unreadCount = msgList.filter(m => !m.is_read && m.sender_id !== user!.id).length;

          return {
            ...session,
            mentor: mentorMap.get(session.mentor_id),
            messages: msgList,
            unreadCount,
          };
        })
      );

      setSessions(sessionsWithDetails);

      // Set active session if we only have one
      if (sessionsWithDetails.length === 1) {
        setActiveSession(sessionsWithDetails[0]);
      }
    } catch (error) {
      console.error('Error fetching chat sessions:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !activeSession || !user) return;

    setIsSending(true);
    try {
      const { error } = await fromTable('mentor_chat_messages')
        .insert({
          session_id: activeSession.id,
          sender_id: user.id,
          message: message.trim(),
        });

      if (error) throw error;

      setMessage('');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send message. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  const totalUnread = sessions.reduce((sum, s) => sum + s.unreadCount, 0);

  if (!user) return null;

  return (
    <>
      {/* Chat Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg bg-gradient-primary hover:opacity-90 z-50"
      >
        <MessageCircle className="h-6 w-6" />
        {totalUnread > 0 && (
          <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-destructive">
            {totalUnread > 9 ? '9+' : totalUnread}
          </Badge>
        )}
      </Button>

      {/* Chat Window */}
      {isOpen && (
        <div 
          className={`fixed z-50 bg-background border rounded-lg shadow-2xl overflow-hidden transition-all ${
            isMinimized 
              ? 'bottom-24 right-6 w-72 h-14' 
              : 'bottom-24 right-6 w-96 h-[500px]'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 bg-gradient-primary text-primary-foreground">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              <span className="font-semibold">Mentor Chat</span>
            </div>
            <div className="flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsMinimized(!isMinimized)}
                className="h-8 w-8 text-primary-foreground hover:bg-white/20"
              >
                {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 text-primary-foreground hover:bg-white/20"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Chat Content */}
              <div className="flex-1 h-[380px]">
                {sessions.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center p-6 text-center">
                    <MessageCircle className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-4">
                      No active chat sessions. Your mentor will start a conversation with you.
                    </p>
                  </div>
                ) : !activeSession ? (
                  <ScrollArea className="h-full p-4">
                    <div className="space-y-2">
                      {sessions.map((session) => (
                        <button
                          key={session.id}
                          onClick={() => setActiveSession(session)}
                          className="w-full p-3 rounded-lg border hover:bg-muted/50 transition-colors text-left"
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={session.mentor?.avatar_url || ''} />
                              <AvatarFallback>
                                <User className="h-5 w-5" />
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">
                                {session.mentor?.full_name || 'Mentor'}
                              </p>
                              <p className="text-sm text-muted-foreground truncate">
                                {session.messages[session.messages.length - 1]?.message || 'No messages yet'}
                              </p>
                            </div>
                            {session.unreadCount > 0 && (
                              <Badge className="bg-primary">{session.unreadCount}</Badge>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="flex flex-col h-full">
                    {/* Active Session Header */}
                    <div className="flex items-center gap-3 p-3 border-b">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setActiveSession(null)}
                        className="mr-2"
                      >
                        ←
                      </Button>
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={activeSession.mentor?.avatar_url || ''} />
                        <AvatarFallback>
                          <User className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">
                        {activeSession.mentor?.full_name || 'Mentor'}
                      </span>
                    </div>

                    {/* Messages */}
                    <ScrollArea className="flex-1 p-4">
                      <div className="space-y-4">
                        {activeSession.messages.map((msg) => {
                          const isOwnMessage = msg.sender_id === user.id;

                          return (
                            <div
                              key={msg.id}
                              className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                            >
                              <div
                                className={`max-w-[80%] rounded-lg p-3 ${
                                  isOwnMessage
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted'
                                }`}
                              >
                                <p className="text-sm">{msg.message}</p>
                                <p className={`text-xs mt-1 ${isOwnMessage ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                                  {format(new Date(msg.created_at), 'HH:mm')}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                        <div ref={messagesEndRef} />
                      </div>
                    </ScrollArea>

                    {/* Input */}
                    <div className="p-4 border-t">
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          handleSendMessage();
                        }}
                        className="flex items-center gap-2"
                      >
                        <Input
                          placeholder="Type a message..."
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          disabled={isSending}
                        />
                        <Button type="submit" size="icon" disabled={isSending || !message.trim()}>
                          <Send className="h-4 w-4" />
                        </Button>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
