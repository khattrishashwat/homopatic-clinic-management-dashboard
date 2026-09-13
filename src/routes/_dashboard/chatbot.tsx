import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Bot,
  Plus,
  Search,
  Edit2,
  Trash2,
  Settings2,
  MessageSquare,
  Sparkles,
  Tag,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  chatbotQuestionsApi,
  settingsApi,
  type ChatbotQuestionDto,
  type ChatbotSettingsDto,
} from "@/services/adminApi";

export const Route = createFileRoute("/_dashboard/chatbot")({
  component: ChatbotPage,
});

interface QuestionFormData {
  question: string;
  answer: string;
  keywords: string;
  order: number;
  active: boolean;
}

const DEFAULT_QUESTION_FORM: QuestionFormData = {
  question: "",
  answer: "",
  keywords: "",
  order: 0,
  active: true,
};

function ChatbotPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("questions");
  const [searchTerm, setSearchTerm] = useState("");
  const [showQuestionDialog, setShowQuestionDialog] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<ChatbotQuestionDto | null>(null);
  const [formData, setFormData] = useState<QuestionFormData>(DEFAULT_QUESTION_FORM);

  // Fetch Questions
  const { data: questionsData, isLoading: loadingQuestions } = useQuery({
    queryKey: ["admin-chatbot-questions", searchTerm],
    queryFn: () => chatbotQuestionsApi.list({ search: searchTerm || undefined }),
  });
  const questions = questionsData?.data || [];

  // Fetch Chatbot Settings
  const { data: settingsData, isLoading: loadingSettings } = useQuery({
    queryKey: ["admin-chatbot-settings"],
    queryFn: () => settingsApi.getChatbot(),
  });
  const chatbotSettings = settingsData || {
    enabled: true,
    welcome_message: "Hi! 👋 Welcome to MD's Homoeopathy. How can I assist your health journey today?",
    suggested_questions: [],
  };

  // State for Settings Form
  const [settingsForm, setSettingsForm] = useState<ChatbotSettingsDto | null>(null);

  // Sync settings when loaded
  const currentSettings: ChatbotSettingsDto = settingsForm || {
    enabled: chatbotSettings.enabled ?? true,
    welcome_message:
      chatbotSettings.welcome_message ||
      "Hi! 👋 Welcome to MD's Homoeopathy. How can I assist your health journey today?",
    suggested_questions: chatbotSettings.suggested_questions || [],
  };

  // Question CRUD Mutations
  const saveQuestionMutation = useMutation({
    mutationFn: async (payload: QuestionFormData) => {
      const keywordsArray = payload.keywords
        .split(/[,;\n]/)
        .map((k) => k.trim())
        .filter(Boolean);

      const body = {
        question: payload.question.trim(),
        answer: payload.answer.trim(),
        keywords: keywordsArray,
        order: payload.order,
        active: payload.active,
      };

      if (editingQuestion) {
        return chatbotQuestionsApi.update(editingQuestion._id, body);
      } else {
        return chatbotQuestionsApi.create(body);
      }
    },
    onSuccess: () => {
      toast.success(
        editingQuestion
          ? "Chatbot Question updated successfully"
          : "Chatbot Question added successfully"
      );
      setShowQuestionDialog(false);
      setEditingQuestion(null);
      setFormData(DEFAULT_QUESTION_FORM);
      queryClient.invalidateQueries({ queryKey: ["admin-chatbot-questions"] });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to save Chatbot Question");
    },
  });

  const deleteQuestionMutation = useMutation({
    mutationFn: async (id: string) => chatbotQuestionsApi.delete(id),
    onSuccess: () => {
      toast.success("Chatbot Question deleted");
      queryClient.invalidateQueries({ queryKey: ["admin-chatbot-questions"] });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to delete question");
    },
  });

  const toggleQuestionStatusMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) =>
      chatbotQuestionsApi.toggleStatus(id, active),
    onSuccess: () => {
      toast.success("Question status updated");
      queryClient.invalidateQueries({ queryKey: ["admin-chatbot-questions"] });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to update status");
    },
  });

  // Settings Mutation
  const saveSettingsMutation = useMutation({
    mutationFn: async (payload: Partial<ChatbotSettingsDto>) => {
      return settingsApi.updateChatbot(payload);
    },
    onSuccess: () => {
      toast.success("Chatbot settings saved successfully");
      queryClient.invalidateQueries({ queryKey: ["admin-chatbot-settings"] });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to save settings");
    },
  });

  const openAddQuestionDialog = () => {
    setEditingQuestion(null);
    setFormData(DEFAULT_QUESTION_FORM);
    setShowQuestionDialog(true);
  };

  const openEditQuestionDialog = (q: ChatbotQuestionDto) => {
    setEditingQuestion(q);
    setFormData({
      question: q.question,
      answer: q.answer,
      keywords: Array.isArray(q.keywords) ? q.keywords.join(", ") : "",
      order: q.order || 0,
      active: q.active,
    });
    setShowQuestionDialog(true);
  };

  const handleQuestionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.question.trim() || !formData.answer.trim()) {
      toast.error("Please enter both a question and an answer");
      return;
    }
    saveQuestionMutation.mutate(formData);
  };

  const handleSettingsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveSettingsMutation.mutate(currentSettings);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bot className="h-6 w-6 text-primary" />
            Chatbot Management
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage dynamic Chatbot Questions & Answers, keyword triggers, welcome greeting, and suggested questions.
          </p>
        </div>
        {activeTab === "questions" && (
          <Button onClick={openAddQuestionDialog} className="gap-2 self-start sm:self-auto">
            <Plus className="h-4 w-4" />
            Add Chatbot Q&A
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Total Q&A Records</p>
              <h3 className="text-2xl font-bold mt-1">{questions.length}</h3>
            </div>
            <MessageSquare className="h-8 w-8 text-muted-foreground/30" />
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Active in Chatbot</p>
              <h3 className="text-2xl font-bold mt-1 text-emerald-600">
                {questions.filter((q) => q.active).length}
              </h3>
            </div>
            <CheckCircle2 className="h-8 w-8 text-emerald-500/30" />
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Website Assistant Status</p>
              <h3 className="text-base font-bold mt-1 flex items-center gap-1.5">
                {currentSettings.enabled ? (
                  <>
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                    <span className="text-emerald-600">Enabled</span>
                  </>
                ) : (
                  <>
                    <span className="h-2.5 w-2.5 rounded-full bg-zinc-400" />
                    <span className="text-muted-foreground">Disabled</span>
                  </>
                )}
              </h3>
            </div>
            <Sparkles className="h-8 w-8 text-muted-foreground/30" />
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full sm:w-[400px] grid-cols-2">
          <TabsTrigger value="questions" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            Questions & Answers ({questions.length})
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-2">
            <Settings2 className="h-4 w-4" />
            Chatbot Settings
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Questions & Answers */}
        <TabsContent value="questions" className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search Chatbot Q&A by question, answer, or keywords..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                <span>Knowledge Base Questions ({questions.length})</span>
                {loadingQuestions && <span className="text-xs text-muted-foreground">Loading...</span>}
              </CardTitle>
              <CardDescription>
                The website chatbot matches user questions against these active database records deterministically. Add unlimited records.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 sm:p-4">
              {questions.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <Bot className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                  <h4 className="text-base font-semibold">No Chatbot Q&A Records</h4>
                  <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
                    {searchTerm
                      ? "No records match your search query."
                      : "No questions added yet. Click 'Add Chatbot Q&A' to create your first dynamic response."}
                  </p>
                  {!searchTerm && (
                    <Button onClick={openAddQuestionDialog} variant="outline" className="mt-4 gap-2">
                      <Plus className="h-4 w-4" />
                      Add First Q&A
                    </Button>
                  )}
                </div>
              ) : (
                <div className="divide-y divide-border rounded-lg border border-border">
                  {questions.map((q) => (
                    <div
                      key={q._id}
                      className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4 hover:bg-muted/40 transition"
                    >
                      <div className="flex-1 space-y-2.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs text-muted-foreground">Order: #{q.order || 0}</span>
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                              q.active
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                            }`}
                          >
                            {q.active ? "Active" : "Inactive"}
                          </span>
                        </div>

                        <h3 className="font-semibold text-base text-foreground leading-snug">
                          {q.question}
                        </h3>

                        <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                          {q.answer}
                        </p>

                        {q.keywords && q.keywords.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1.5 pt-1">
                            <Tag className="h-3.5 w-3.5 text-muted-foreground mr-1" />
                            {q.keywords.map((kw, i) => (
                              <span
                                key={i}
                                className="inline-flex items-center rounded-md bg-secondary px-2 py-0.5 text-[11px] font-medium text-secondary-foreground"
                              >
                                {kw}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-start pt-2 sm:pt-0">
                        <div className="flex items-center gap-2 mr-2">
                          <Label htmlFor={`status-${q._id}`} className="text-xs text-muted-foreground cursor-pointer">
                            {q.active ? "Active" : "Disabled"}
                          </Label>
                          <Switch
                            id={`status-${q._id}`}
                            checked={q.active}
                            onCheckedChange={(checked) =>
                              toggleQuestionStatusMutation.mutate({ id: q._id, active: checked })
                            }
                          />
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditQuestionDialog(q)}
                          title="Edit Q&A"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (confirm("Are you sure you want to delete this chatbot question?")) {
                              deleteQuestionMutation.mutate(q._id);
                            }
                          }}
                          title="Delete Q&A"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Settings & Suggestions */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Chatbot General Settings & Suggestions</CardTitle>
              <CardDescription>
                Configure the chatbot visibility on the public website, default greeting, and suggested question prompts.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSettingsSubmit} className="space-y-6">
                <div className="flex items-center justify-between border-b border-border pb-4">
                  <div className="space-y-0.5">
                    <Label htmlFor="enable-chatbot-switch" className="text-sm font-semibold">
                      Enable Website Assistant
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Controls whether the floating chat widget appears on the public website.
                    </p>
                  </div>
                  <Switch
                    id="enable-chatbot-switch"
                    checked={currentSettings.enabled}
                    onCheckedChange={(checked) =>
                      setSettingsForm({ ...currentSettings, enabled: checked })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="chatbot-welcome-message" className="font-semibold">
                    Welcome Message
                  </Label>
                  <Textarea
                    id="chatbot-welcome-message"
                    rows={3}
                    value={currentSettings.welcome_message}
                    onChange={(e) =>
                      setSettingsForm({ ...currentSettings, welcome_message: e.target.value })
                    }
                    placeholder="Enter welcome message displayed when a user opens the chat assistant..."
                  />
                  <p className="text-xs text-muted-foreground">
                    This message is displayed automatically in the chat dialog when a visitor opens the widget.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="chatbot-suggested-questions" className="font-semibold">
                    Suggested Questions (one per line)
                  </Label>
                  <Textarea
                    id="chatbot-suggested-questions"
                    rows={6}
                    value={(currentSettings.suggested_questions || []).join("\n")}
                    onChange={(e) =>
                      setSettingsForm({
                        ...currentSettings,
                        suggested_questions: e.target.value
                          .split("\n")
                          .map((q) => q.trim())
                          .filter(Boolean),
                      })
                    }
                    placeholder="How long does homeopathic treatment take?&#10;What conditions do you treat?&#10;How do I book an appointment?"
                  />
                  <p className="text-xs text-muted-foreground">
                    These questions appear as clickable prompt chips in the chatbot to guide website visitors.
                  </p>
                </div>

                <Button type="submit" disabled={saveSettingsMutation.isPending} className="gap-2">
                  {saveSettingsMutation.isPending ? "Saving Settings..." : "Save Chatbot Settings"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add / Edit Question Dialog */}
      <Dialog open={showQuestionDialog} onOpenChange={setShowQuestionDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingQuestion ? "Edit Chatbot Question" : "Add Chatbot Question"}
            </DialogTitle>
            <DialogDescription>
              {editingQuestion
                ? "Update question, answer, and trigger keywords for chatbot matching."
                : "Create a new database-backed answer record for the website chatbot assistant."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleQuestionSubmit} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="q-question">User Question *</Label>
              <Input
                id="q-question"
                placeholder="e.g. How long does homeopathic treatment take?"
                value={formData.question}
                onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="q-answer">Chatbot Answer *</Label>
              <Textarea
                id="q-answer"
                rows={4}
                placeholder="Enter detailed answer here..."
                value={formData.answer}
                onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="q-keywords">Keywords (Optional, comma-separated)</Label>
              <Input
                id="q-keywords"
                placeholder="e.g. duration, timeline, how much time, course"
                value={formData.keywords}
                onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
              />
              <p className="text-[11px] text-muted-foreground">
                Additional trigger words that help the matching engine identify this response when visitors phrase questions differently.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="q-order">Display / Priority Order</Label>
              <Input
                id="q-order"
                type="number"
                placeholder="0"
                value={formData.order}
                onChange={(e) =>
                  setFormData({ ...formData, order: Number(e.target.value) || 0 })
                }
              />
            </div>

            <div className="flex items-center justify-between border-t border-border pt-4">
              <div className="flex items-center gap-2">
                <Switch
                  id="q-active"
                  checked={formData.active}
                  onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                />
                <Label htmlFor="q-active">Active (Available for chatbot to answer)</Label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowQuestionDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saveQuestionMutation.isPending}>
                {saveQuestionMutation.isPending
                  ? "Saving..."
                  : editingQuestion
                  ? "Save Changes"
                  : "Add Question"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
