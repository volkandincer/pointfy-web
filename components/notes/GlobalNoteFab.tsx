"use client";

import { memo, useState } from "react";
import { FileText } from "lucide-react";
import NoteModal from "./NoteModal";
import { useNotes } from "@/hooks/useNotes";
import { useToastContext } from "@/contexts/ToastContext";

const GlobalNoteFab = memo(function GlobalNoteFab() {
  const { addNote } = useNotes();
  const { showToast } = useToastContext();
  const [showModal, setShowModal] = useState<boolean>(false);

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="group fixed bottom-4 right-4 z-40 flex min-h-[56px] items-center gap-2 rounded-lg border-2 border-purple-600 bg-purple-600 px-4 py-3 text-white shadow-md transition-all sm:bottom-6 sm:right-6 sm:gap-3 sm:px-5 hover:border-purple-700 hover:bg-purple-700 hover:shadow-md"
        aria-label="Not ekle"
      >
        <FileText className="h-5 w-5 sm:h-6 sm:w-6" />
        <span className="hidden font-semibold sm:inline-block">Not Ekle</span>
        <span className="sm:hidden font-semibold">Not</span>
      </button>

      <NoteModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={async (input) => {
          try {
            await addNote(input);
            // Eğer custom kategori "general" olarak kaydedildiyse kullanıcıyı bilgilendir
            const validCategories = ["general", "work", "personal", "ideas", "todo", "important"];
            if (!validCategories.includes(input.category)) {
              showToast(
                "Not kaydedildi, ancak özel kategori 'Genel' olarak kaydedildi (veritabanı kısıtlaması).",
                "info",
                5000
              );
            } else {
              showToast("Not başarıyla kaydedildi!", "success");
            }
            setShowModal(false);
          } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : "Bilinmeyen hata";
            showToast(
              `Not kaydedilemedi: ${errorMessage}`,
              "error"
            );
          }
        }}
      />
    </>
  );
});

export default GlobalNoteFab;

