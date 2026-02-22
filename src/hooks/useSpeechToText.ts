import { useCallback, useEffect, useRef, useState } from 'react';

type SpeechRecognitionEvent = {
  results: { [index: number]: { [index: number]: { transcript: string } }; length: number };
  resultIndex: number;
};

type SpeechRecognitionErrorEvent = {
  error: string;
  message?: string;
};

type SpeechRecognitionInstance = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
};

function getSpeechRecognition(): (new () => SpeechRecognitionInstance) | null {
  const w = window as unknown as Record<string, unknown>;
  return (w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null) as
    | (new () => SpeechRecognitionInstance)
    | null;
}

export type UseSpeechToTextReturn = {
  /** Whether the browser supports the Web Speech API */
  isSupported: boolean;
  /** Whether the mic is currently listening */
  isListening: boolean;
  /** The transcript captured so far (interim + final) */
  transcript: string;
  /** Start listening */
  startListening: () => void;
  /** Stop listening and return final transcript */
  stopListening: () => void;
  /** Toggle start/stop */
  toggle: () => void;
  /** Any error message */
  error: string | null;
};

type Options = {
  /** BCP-47 language code, default 'en-US' */
  lang?: string;
  /** Whether to keep listening after a pause. default false */
  continuous?: boolean;
  /** Called whenever transcript updates (interim or final) */
  onTranscript?: (text: string) => void;
  /** Called when listening ends (final transcript) */
  onEnd?: (finalText: string) => void;
};

export function useSpeechToText(options: Options = {}): UseSpeechToTextReturn {
  const { lang = 'en-US', continuous = false, onTranscript, onEnd } = options;

  const [isSupported] = useState(() => getSpeechRecognition() !== null);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const transcriptRef = useRef('');

  // Callbacks ref to avoid stale closures
  const cbRef = useRef({ onTranscript, onEnd });
  cbRef.current = { onTranscript, onEnd };

  const startListening = useCallback(() => {
    const SpeechRecognition = getSpeechRecognition();
    if (!SpeechRecognition) {
      setError('Speech recognition not supported in this browser.');
      return;
    }

    // Stop any existing instance
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch { /* ok */ }
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = continuous;
    recognition.interimResults = true;
    recognition.lang = lang;

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
      setTranscript('');
      transcriptRef.current = '';
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result && result[0]) {
          const text = result[0].transcript;
          // Check if this result is final by accessing .isFinal
          const isFinal = (result as unknown as { isFinal: boolean }).isFinal;
          if (isFinal) {
            finalTranscript += text;
          } else {
            interimTranscript += text;
          }
        }
      }

      const combined = (transcriptRef.current + finalTranscript + interimTranscript).trim();
      if (finalTranscript) {
        transcriptRef.current = (transcriptRef.current + finalTranscript).trim();
      }

      setTranscript(combined);
      cbRef.current.onTranscript?.(combined);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === 'no-speech') {
        setError('No speech detected. Try again.');
      } else if (event.error === 'not-allowed') {
        setError('Microphone access denied. Please allow microphone permissions.');
      } else if (event.error !== 'aborted') {
        setError(`Speech error: ${event.error}`);
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      const final = transcriptRef.current.trim();
      if (final) {
        cbRef.current.onEnd?.(final);
      }
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch (e) {
      setError('Could not start speech recognition.');
      setIsListening(false);
    }
  }, [continuous, lang]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch { /* ok */ }
    }
  }, []);

  const toggle = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch { /* ok */ }
      }
    };
  }, []);

  return {
    isSupported,
    isListening,
    transcript,
    startListening,
    stopListening,
    toggle,
    error,
  };
}
