
import { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

export const useSpeechRecognition = (onResult: (text: string) => void, onError: (msg: string) => void) => {
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef<any>(null);
    const { language } = useLanguage();

    useEffect(() => {
        if (typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition)) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false; // Stop after one sentence
            recognitionRef.current.interimResults = true;
            recognitionRef.current.lang = language === 'en' ? 'en-US' : 'ja-JP';

            recognitionRef.current.onresult = (event: any) => {
                let finalTranscript = '';

                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript;
                    }
                }
                
                if (finalTranscript) {
                    onResult(finalTranscript);
                    setIsListening(false);
                }
            };

            recognitionRef.current.onerror = (event: any) => {
                console.error('Speech recognition error', event.error);
                setIsListening(false);
                
                if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
                    onError(language === 'en' 
                            ? "Microphone access denied." 
                            : "マイクのアクセスが拒否されました。");
                } else if (event.error !== 'no-speech') {
                     onError(language === 'en' 
                            ? `Speech recognition error: ${event.error}` 
                            : `音声認識エラー: ${event.error}`);
                }
            };
            
            recognitionRef.current.onend = () => {
                setIsListening(false);
            };
        }
    }, [language, onResult, onError]);

    const toggleListening = () => {
        if (isListening) {
            recognitionRef.current?.stop();
        } else {
            try {
                recognitionRef.current?.start();
                setIsListening(true);
            } catch (e) {
                console.error("Failed to start recognition", e);
                setIsListening(false);
            }
        }
    };

    return { isListening, toggleListening, recognitionSupported: !!recognitionRef.current };
};
