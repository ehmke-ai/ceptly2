"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionResultEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

interface SpeechRecognitionResultEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  length: number;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

function getSpeechRecognitionConstructor():
  | SpeechRecognitionConstructor
  | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }

  return window.SpeechRecognition ?? window.webkitSpeechRecognition;
}

function getTranscriptFromResults(
  results: SpeechRecognitionResultList,
  fromIndex: number,
): { committed: string; interim: string } {
  let committed = "";
  let interim = "";

  for (let index = fromIndex; index < results.length; index += 1) {
    const result = results[index];
    const text = result?.[0]?.transcript ?? "";
    if (result?.isFinal) {
      committed += text;
    } else {
      interim += text;
    }
  }

  return { committed, interim };
}

interface UseSpeechDictationOptions {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  lang?: string;
}

export function useSpeechDictation({
  value,
  onChange,
  disabled = false,
  lang = "en-US",
}: UseSpeechDictationOptions) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const prefixRef = useRef("");
  const committedRef = useRef("");
  const listeningRef = useRef(false);

  useEffect(() => {
    setSupported(!!getSpeechRecognitionConstructor());
  }, []);

  const stop = useCallback(() => {
    listeningRef.current = false;
    setListening(false);
    recognitionRef.current?.stop();
  }, []);

  const start = useCallback(() => {
    const SpeechRecognitionAPI = getSpeechRecognitionConstructor();
    if (!SpeechRecognitionAPI || disabled) {
      return;
    }

    setError(null);
    prefixRef.current = value;
    committedRef.current = "";

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = lang;

    recognition.onresult = (event) => {
      const { committed, interim } = getTranscriptFromResults(
        event.results,
        event.resultIndex,
      );
      if (committed) {
        committedRef.current += committed;
      }
      const spacer =
        prefixRef.current.length > 0 &&
        !prefixRef.current.endsWith(" ") &&
        (committedRef.current.length > 0 || interim.length > 0)
          ? " "
          : "";
      onChange(prefixRef.current + spacer + committedRef.current + interim);
    };

    recognition.onerror = (event) => {
      if (event.error === "aborted") {
        return;
      }
      setError(
        event.error === "not-allowed"
          ? "Microphone access was denied."
          : "Dictation failed. Try again.",
      );
      stop();
    };

    recognition.onend = () => {
      if (!listeningRef.current) {
        return;
      }
      try {
        recognition.start();
      } catch {
        listeningRef.current = false;
        setListening(false);
      }
    };

    recognitionRef.current = recognition;
    listeningRef.current = true;
    setListening(true);

    try {
      recognition.start();
    } catch {
      listeningRef.current = false;
      setListening(false);
      setError("Could not start dictation. Try again.");
    }
  }, [disabled, lang, onChange, stop, value]);

  const toggle = useCallback(() => {
    if (listening) {
      stop();
      return;
    }
    start();
  }, [listening, start, stop]);

  useEffect(() => {
    return () => {
      listeningRef.current = false;
      recognitionRef.current?.abort();
      recognitionRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (disabled && listening) {
      stop();
    }
  }, [disabled, listening, stop]);

  return {
    supported,
    listening,
    error,
    toggle,
    stop,
    clearError: () => setError(null),
  };
}
