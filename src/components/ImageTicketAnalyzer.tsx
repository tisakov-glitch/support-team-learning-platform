import React, { useState, useRef } from 'react';
import { Image, Loader2, AlertCircle, Check, Trash2, UploadCloud, Sparkles } from 'lucide-react';

interface ImageTicketAnalyzerProps {
  onRecognized: (
    data: {
      requesterName?: string;
      client?: string;
      storeId?: string;
      subject?: string;
      description?: string;
      system?: string;
      module?: string;
      type?: string;
      action?: string;
      kind?: string;
    },
    isAppend?: boolean
  ) => void;
}

export const ImageTicketAnalyzer: React.FC<ImageTicketAnalyzerProps> = ({ onRecognized }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAppendMode, setIsAppendMode] = useState(true);
  const [dragActive, setDragActive] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Пожалуйста, выберите файл изображения (скриншот)');
      return;
    }

    setError(null);
    setSuccess(false);

    // Create preview
    const objectUrl = URL.createObjectURL(file);
    setImagePreview(objectUrl);

    // Analyze image
    setIsAnalyzing(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = async () => {
        try {
          const base64data = reader.result as string;
          const token = localStorage.getItem('support_learning_token');
          
          const response = await fetch('/api/tickets/image-analyze', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              image: base64data,
              mimeType: file.type
            })
          });

          if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error || 'Ошибка анализа скриншота');
          }

          const data = await response.json();
          onRecognized(data, isAppendMode);
          setSuccess(true);
          setTimeout(() => setSuccess(false), 3000);
        } catch (innerErr: any) {
          console.error(innerErr);
          setError(innerErr.message || 'Ошибка обработки ответа сервера');
        } finally {
          setIsAnalyzing(false);
        }
      };
    } catch (err: any) {
      console.error(err);
      setError('Не удалось прочитать файл изображения');
      setIsAnalyzing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const clearImage = () => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
    }
    setError(null);
    setSuccess(false);
  };

  return (
    <div className="flex flex-col items-end gap-2 w-full sm:w-auto">
      <div className="flex items-center gap-2 flex-wrap justify-end">
        {error && (
          <span className="text-[10px] bg-red-50 text-red-600 px-2 py-1 rounded-lg font-medium border border-red-100 flex items-center gap-1 max-w-[200px] sm:max-w-xs animate-fade-in">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{error}</span>
          </span>
        )}

        {success && (
          <span className="text-[10px] bg-emerald-50 text-emerald-600 px-2 py-1 rounded-lg font-medium border border-emerald-100 flex items-center gap-1 animate-fade-in">
            <Check className="w-3.5 h-3.5 text-emerald-500" />
            <span>Скриншот успешно распознан!</span>
          </span>
        )}

        {/* Append/Overwrite mode switcher */}
        <div className="flex items-center bg-slate-100/90 p-0.5 rounded-lg border border-slate-200/50 text-[10px] font-bold shadow-sm">
          <button
            type="button"
            onClick={() => setIsAppendMode(false)}
            className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
              !isAppendMode ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
            title="Заменять существующие поля новыми данными с изображения"
          >
            Перезапись
          </button>
          <button
            type="button"
            onClick={() => setIsAppendMode(true)}
            className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
              isAppendMode ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
            title="Добавлять данные к уже заполненным полям"
          >
            Дополнение
          </button>
        </div>

        {/* Upload and Analyze Button */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />

        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          className={`relative flex items-center gap-1.5 transition-all rounded-xl border ${
            dragActive 
              ? 'border-indigo-500 bg-indigo-50/50 scale-102' 
              : 'border-slate-200 hover:border-indigo-400 bg-slate-50/50 hover:bg-white'
          }`}
        >
          <button
            type="button"
            onClick={handleButtonClick}
            disabled={isAnalyzing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-slate-700 hover:text-indigo-600 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {isAnalyzing ? (
              <Loader2 className="w-3.5 h-3.5 text-indigo-500 animate-spin" />
            ) : (
              <UploadCloud className="w-3.5 h-3.5 text-slate-500 hover:text-indigo-500" />
            )}
            <span>{isAnalyzing ? 'ИИ сканирует...' : 'Сканировать скриншот'}</span>
          </button>
        </div>
      </div>

      {/* Screen Preview Thumbnail */}
      {imagePreview && (
        <div className="flex items-center gap-2 mt-1.5 bg-slate-50 border border-slate-200 hover:border-indigo-200 rounded-lg p-1 text-xs shadow-sm animate-fade-in">
          <div className="relative w-8 h-8 rounded overflow-hidden border border-slate-300">
            <img src={imagePreview} alt="Screenshot preview" className="w-full h-full object-cover" />
          </div>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Скриншот загружен</span>
          <button
            type="button"
            onClick={clearImage}
            className="p-1 hover:bg-slate-200 text-slate-400 hover:text-red-500 rounded-full transition-colors cursor-pointer"
            title="Удалить скриншот"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
