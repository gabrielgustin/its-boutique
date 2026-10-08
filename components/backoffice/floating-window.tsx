"use client"

import { X } from "lucide-react"

interface FloatingWindowProps {
  url: string
  isOpen: boolean
  onClose: () => void
}

export default function FloatingWindow({ url, isOpen, onClose }: FloatingWindowProps) {
  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm"
      style={{
        animation: "fadeIn 0.3s ease-out",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="bg-white rounded-lg shadow-2xl w-[90%] max-w-4xl h-[80vh] flex flex-col overflow-hidden border border-gray-200 relative"
        style={{
          animation: "windowAppear 0.4s cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        <button
          onClick={onClose}
          aria-label="Cerrar vista previa"
          className="absolute top-0 right-14 md:right-[4.5rem] h-16 md:h-20 z-10 flex items-center"
        >
          <span className="flex items-center justify-center w-8 h-8 md:w-9 md:h-9 mb-[10px] rounded-full bg-white/90 text-gray-700 shadow-md hover:bg-white hover:text-gray-900 transition-colors">
            <X size={18} strokeWidth={2.5} className="md:w-5 md:h-5" />
          </span>
        </button>

        <div className="flex-1 bg-white overflow-hidden">
          <iframe
            src={url}
            className="w-full h-full border-0"
            title="Vista previa de la tienda"
            style={{
              animation: "contentFadeIn 0.6s ease-out",
            }}
          />
        </div>

        <style jsx>{`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          
          @keyframes windowAppear {
            0% { 
              opacity: 0; 
              transform: scale(0.95) translateY(20px);
            }
            100% { 
              opacity: 1; 
              transform: scale(1) translateY(0);
            }
          }
          
          @keyframes contentFadeIn {
            0% {
              opacity: 0;
            }
            30% {
              opacity: 0.3;
            }
            100% {
              opacity: 1;
            }
          }
        `}</style>
      </div>
    </div>
  )
}
