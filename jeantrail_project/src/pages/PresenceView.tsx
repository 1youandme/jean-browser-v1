import React, { useEffect, useRef, useState } from 'react';
import { JeanAvatar3D } from '../components/JeanAvatar3D';
import { JeanPresenceState } from '../jean-runtime/state/JeanPresenceStateMachine';

export const PresenceView: React.FC = () => {
  const [presence, setPresence] = useState<JeanPresenceState>(JeanPresenceState.IDLE);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    let reactingUntil = 0;
    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioCtxRef.current = ctx;
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      analyserRef.current = analyser;
      src.connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);
      const loop = () => {
        if (!analyserRef.current || !audioCtxRef.current) return;
        analyserRef.current.getByteFrequencyData(data);
        let energy = 0;
        for (let i = 0; i < data.length; i++) energy += data[i];
        const level = energy / (data.length * 255);
        const now = performance.now();
        if (level > 0.35) {
          setPresence(JeanPresenceState.RESPONDING);
          reactingUntil = now + 250;
        } else if (level > 0.12) {
          if (now > reactingUntil) setPresence(JeanPresenceState.OBSERVING);
        } else {
          if (now > reactingUntil) setPresence(JeanPresenceState.IDLE);
        }
        rafRef.current = requestAnimationFrame(loop);
      };
      loop();
    }).catch(() => {
      setPresence(JeanPresenceState.IDLE);
    });
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (audioCtxRef.current) audioCtxRef.current.close().catch(() => {});
    };
  }, []);

  return (
    <div className="w-screen h-screen bg-black flex items-center justify-center">
      <JeanAvatar3D isActive hideUI fill presenceState={presence} className="" />
    </div>
  );
}
