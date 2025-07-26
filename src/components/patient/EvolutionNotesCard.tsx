// src/components/patient/EvolutionNotesCard.tsx
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Patient } from "@/lib/firebase/db";
import { FileText, Plus, Calendar, User } from "lucide-react";
import { Timestamp } from "firebase/firestore";
import { toast } from "sonner";

interface EvolutionNote {
  id: string;
  note: string;
  date: Timestamp;
  doctorId: string;
  doctorName: string;
}

interface EvolutionNotesCardProps {
  patient: Patient;
  canEdit: boolean;
  doctors: Array<{ uid: string; displayName?: string; email: string }>;
  userProfile: { uid: string; displayName?: string; email: string } | null;
  onAddNote: (note: string) => Promise<void>;
}

export const EvolutionNotesCard: React.FC<EvolutionNotesCardProps> = ({
  patient,
  canEdit,
  doctors,
  userProfile,
  onAddNote,
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get evolution notes from patient data (we'll store them in dentalHistory.evolutionNotes)
  const evolutionNotes: EvolutionNote[] =
    (patient.dentalHistory as any)?.evolutionNotes || [];

  const handleAddNote = async () => {
    if (!newNote.trim()) {
      toast.error("La nota no puede estar vacía");
      return;
    }

    try {
      setIsSubmitting(true);
      await onAddNote(newNote.trim());

      setNewNote("");
      setIsDialogOpen(false);
      toast.success("Nota de evolución agregada exitosamente");
    } catch (error) {
      console.error("Error adding evolution note:", error);
      toast.error("Error al agregar la nota de evolución");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getDoctorName = (doctorId: string): string => {
    const doctor = doctors.find((d) => d.uid === doctorId);
    return doctor?.displayName || doctor?.email || "Doctor";
  };

  const formatDate = (timestamp: Timestamp): string => {
    const date = timestamp.toDate();
    return new Intl.DateTimeFormat("es-MX", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const formatRelativeDate = (timestamp: Timestamp): string => {
    const date = timestamp.toDate();
    const now = new Date();
    const diffInDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffInDays === 0) return "Hoy";
    if (diffInDays === 1) return "Ayer";
    if (diffInDays < 7) return `Hace ${diffInDays} días`;
    if (diffInDays < 30) return `Hace ${Math.floor(diffInDays / 7)} semanas`;
    return `Hace ${Math.floor(diffInDays / 30)} meses`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center">
            <FileText className="mr-2 h-5 w-5 text-blue-500" />
            Notas de Evolución ({evolutionNotes.length})
          </span>
          {canEdit && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Nueva Nota de Evolución</DialogTitle>
                  <DialogDescription>
                    Agregar una nueva nota de evolución para {patient.fullName}
                  </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                  <Textarea
                    placeholder="Escribir la nota de evolución..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    rows={6}
                    className="min-h-[120px]"
                  />
                  <div className="mt-2 text-sm text-gray-500">
                    Nota será registrada por:{" "}
                    {userProfile?.displayName ||
                      userProfile?.email ||
                      "Usuario actual"}
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsDialogOpen(false);
                      setNewNote("");
                    }}
                    disabled={isSubmitting}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleAddNote}
                    disabled={!newNote.trim() || isSubmitting}
                  >
                    {isSubmitting ? "Guardando..." : "Agregar Nota"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {evolutionNotes.length > 0 ? (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {evolutionNotes
              .sort(
                (a, b) => b.date.toDate().getTime() - a.date.toDate().getTime()
              )
              .map((note, index) => (
                <div
                  key={note.id}
                  className="border rounded-lg p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center space-x-2">
                      <Badge
                        variant="outline"
                        className="bg-blue-100 text-blue-800 border-blue-300"
                      >
                        <Calendar className="w-3 h-3 mr-1" />
                        {formatRelativeDate(note.date)}
                      </Badge>
                      <Badge
                        variant="outline"
                        className="bg-green-100 text-green-800 border-green-300"
                      >
                        <User className="w-3 h-3 mr-1" />
                        Dr. {getDoctorName(note.doctorId)}
                      </Badge>
                    </div>
                    <span className="text-xs text-gray-500">
                      {formatDate(note.date)}
                    </span>
                  </div>

                  <div className="prose prose-sm max-w-none">
                    <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                      {note.note}
                    </p>
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hay notas de evolución
            </h3>
            <p className="text-gray-500 mb-4">
              Aún no se han registrado notas de evolución para este paciente.
            </p>
            {canEdit && (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Agregar Primera Nota
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px]">
                  <DialogHeader>
                    <DialogTitle>Nueva Nota de Evolución</DialogTitle>
                    <DialogDescription>
                      Agregar una nueva nota de evolución para{" "}
                      {patient.fullName}
                    </DialogDescription>
                  </DialogHeader>

                  <div className="py-4">
                    <Textarea
                      placeholder="Escribir la nota de evolución..."
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      rows={6}
                      className="min-h-[120px]"
                    />
                    <div className="mt-2 text-sm text-gray-500">
                      Nota será registrada por:{" "}
                      {userProfile?.displayName ||
                        userProfile?.email ||
                        "Usuario actual"}
                    </div>
                  </div>

                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsDialogOpen(false);
                        setNewNote("");
                      }}
                      disabled={isSubmitting}
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleAddNote}
                      disabled={!newNote.trim() || isSubmitting}
                    >
                      {isSubmitting ? "Guardando..." : "Agregar Nota"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
