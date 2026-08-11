import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Loader2, AlertCircle, Check, Trash2 } from 'lucide-react';

interface VoiceTicketRecorderProps {
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

interface RecordedAudio {
  id: string;
  url: string;
  time: string;
}

export const VoiceTicketRecorder: React.FC<VoiceTicketRecorderProps> = ({ onRecognized }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [recordings, setRecordings] = useState<RecordedAudio[]>([]);
  const [isAppendMode, setIsAppendMode] = useState(true);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const recordingsRef = useRef<RecordedAudio[]>([]);
  useEffect(() => {
    recordingsRef.current = recordings;
  }, [recordings]);

  useEffect(() => {
    return () => {
      // Clean up audio tracks on unmount
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      // Clean up all object URLs on unmount
      recordingsRef.current.forEach(rec => {
        URL.revokeObjectURL(rec.url);
      });
    };
  }, []);

  const startRecording = async () => {
    setError(null);
    setSuccess(false);
    audioChunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      let options = {};
      let mimeTypeFallback = 'audio/webm';
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        options = { mimeType: 'audio/webm;codecs=opus' };
        mimeTypeFallback = 'audio/webm;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) {
        options = { mimeType: 'audio/ogg;codecs=opus' };
        mimeTypeFallback = 'audio/ogg;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/webm')) {
        options = { mimeType: 'audio/webm' };
        mimeTypeFallback = 'audio/webm';
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        options = { mimeType: 'audio/mp4' };
        mimeTypeFallback = 'audio/mp4';
      }

      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const finalMime = mediaRecorder.mimeType || mimeTypeFallback;
        const audioBlob = new Blob(audioChunksRef.current, { type: finalMime });
        if (audioBlob.size > 1000) { // Ensure there is actual recorded sound
          const url = URL.createObjectURL(audioBlob);
          const newRecording: RecordedAudio = {
            id: Math.random().toString(36).substring(2, 11),
            url,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
          };
          setRecordings(prev => [...prev, newRecording]);
          await handleAudioAnalyze(audioBlob, finalMime);
        } else {
          setError('Запись слишком короткая или пустая');
        }
        
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
      };

      mediaRecorder.start(); // Start recording without continuous timeslice intervals
      setIsRecording(true);
    } catch (err: any) {
      console.error('Ошибка доступа к микрофону:', err);
      setError('Не удалось получить доступ к микрофону. Проверьте разрешения в браузере.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const handleAudioAnalyze = async (blob: Blob, mimeType: string) => {
    setIsAnalyzing(true);
    setError(null);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
        try {
          const base64data = reader.result as string;
          const token = localStorage.getItem('support_learning_token');
          
          const response = await fetch('/api/tickets/voice-analyze', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              audio: base64data,
              mimeType: mimeType
            })
          });

          if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error || 'Ошибка распознавания голосового сообщения');
          }

          const data = await response.json();
          onRecognized(data, isAppendMode);
          setSuccess(true);
          setTimeout(() => setSuccess(false), 3000);
        } catch (innerErr: any) {
          console.error(innerErr);
          setError(innerErr.message || 'Ошибка связи с сервером при распознавании');
        } finally {
          setIsAnalyzing(false);
        }
      };
    } catch (err: any) {
      console.error('Ошибка анализа голоса:', err);
      setError(err.message || 'Ошибка чтения аудиофайла');
      setIsAnalyzing(false);
    }
  };

  // Click handler to toggle
  const handleToggleClick = () => {
    if (isRecording) {
      stopRecording();
    } else if (!isAnalyzing) {
      startRecording();
    }
  };

  return (
    <div className="flex flex-col items-end gap-2 w-full sm:w-auto">
      <div className="flex items-center gap-2 flex-wrap justify-end">
        {error && (
          <span className="text-[10px] bg-red-50 text-red-600 px-2 py-1 rounded-lg font-medium border border-red-100 flex items-center gap-1 max-w-[200px] sm:max-w-xs animate-fade-in">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            {error}
          </span>
        )}

        {isRecording && (
          <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest animate-pulse flex items-center gap-1.5 bg-red-50 border border-red-100 px-2.5 py-1 rounded-full">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
            Запись...
          </span>
        )}

        {isAnalyzing && (
          <span className="text-[10px] font-semibold text-slate-500 flex items-center gap-1.5 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-full">
            <Loader2 className="w-3 h-3 text-indigo-600 animate-spin" />
            Распознавание ИИ...
          </span>
        )}

        {success && (
          <span className="text-[10px] font-semibold text-emerald-600 flex items-center gap-1.5 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full animate-bounce">
            <Check className="w-3.5 h-3.5" />
            Поля заполнены!
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
            title="Заменять существующие поля новыми данными при каждой записи"
          >
            Перезапись
          </button>
          <button
            type="button"
            onClick={() => setIsAppendMode(true)}
            className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
              isAppendMode ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
            title="Добавлять описание и тему к уже заполненным полям"
          >
            Дополнение
          </button>
        </div>

        <button
          type="button"
          onClick={handleToggleClick}
          disabled={isAnalyzing}
          className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer relative group ${
            isRecording
              ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/30 scale-110'
              : isAnalyzing
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
              : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-600 hover:scale-105 active:scale-95 shadow-sm'
          }`}
          title={isRecording ? "Остановить запись" : "Заполнить тикет голосом (нажмите для записи)"}
        >
          {isAnalyzing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : isRecording ? (
            <Square className="w-3.5 h-3.5 fill-current" />
          ) : (
            <Mic className="w-4 h-4" />
          )}

          {/* Hover tooltip */}
          <span className="absolute bottom-full mb-2 hidden group-hover:block bg-slate-800 text-white text-[9px] py-1 px-2 rounded whitespace-nowrap z-50 shadow-md">
            {isRecording ? "Остановить и распознать" : "Записать голос"}
          </span>
        </button>
      </div>

      {/* Beautiful list of multiple recordings */}
      {recordings.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mt-1.5 max-w-xl justify-end">
          <button
            type="button"
            onClick={() => {
              recordings.forEach(r => URL.revokeObjectURL(r.url));
              setRecordings([]);
            }}
            className="text-[9px] text-red-500 hover:text-red-700 hover:underline cursor-pointer font-bold uppercase tracking-wider mr-1"
          >
            Очистить все ({recordings.length})
          </button>
          <div className="flex flex-wrap items-center gap-1.5">
            {recordings.map((rec, idx) => (
              <div
                key={rec.id}
                className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 hover:border-indigo-200 rounded-full px-2.5 py-1 text-xs shadow-sm animate-fade-in"
                title={`Записано в ${rec.time}`}
              >
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Запись #{idx + 1}</span>
                <audio src={rec.url} controls className="h-5 w-24 outline-none text-xs bg-transparent" />
                <button
                  type="button"
                  onClick={() => {
                    URL.revokeObjectURL(rec.url);
                    setRecordings(prev => prev.filter(r => r.id !== rec.id));
                  }}
                  className="p-0.5 hover:bg-slate-200 text-slate-400 hover:text-red-500 rounded-full transition-colors cursor-pointer"
                  title="Удалить запись"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
