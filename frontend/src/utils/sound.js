export const playCartSound = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    
    // Create a pop sound
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.type = 'sine';
    
    // Frequency sweep for a nice pop/drop effect
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.1);
    
    // Volume envelope
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
    
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.1);
  } catch (e) {
    console.error("Audio play failed", e);
  }
};

export const playSuccessSound = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    
    // Happy chime chord
    const playNote = (freq, startTime, duration) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = 'triangle';
      osc.frequency.value = freq;
      
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.2, startTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
      
      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    const now = ctx.currentTime;
    playNote(523.25, now, 0.4);       // C5
    playNote(659.25, now + 0.1, 0.4); // E5
    playNote(783.99, now + 0.2, 0.6); // G5
    playNote(1046.50, now + 0.3, 0.8);// C6
    
  } catch (e) {
    console.error("Audio play failed", e);
  }
};

export const playThankYouVoice = () => {
  try {
    if ('speechSynthesis' in window) {
      // Small delay so it doesn't overlap with the success chime completely
      setTimeout(() => {
        const msg = new SpeechSynthesisUtterance();
        msg.text = "Humari website par shopping karne ke liye aapka bahut bahut aabhar";
        msg.lang = "hi-IN"; 
        
        // Lower rate and pitch to make it sound soft, mature, and relaxed (not like a kid)
        msg.rate = 0.82; 
        msg.pitch = 0.85; 
        
        // Find a female Hindi voice if possible
        const voices = window.speechSynthesis.getVoices();
        
        // Look for common female Hindi voices (Google, Microsoft Kalpana, etc.)
        let femaleHindiVoice = voices.find(v => 
          (v.lang.includes('hi') || v.lang.includes('IN')) && 
          (v.name.includes('Female') || v.name.includes('Kalpana') || v.name.includes('Lekha') || v.name.includes('Google'))
        );

        // Fallback to any Hindi voice
        if (!femaleHindiVoice) {
           femaleHindiVoice = voices.find(v => v.lang.includes('hi') || v.lang.includes('IN'));
        }

        if (femaleHindiVoice) {
          msg.voice = femaleHindiVoice;
        }

        window.speechSynthesis.speak(msg);
      }, 500);
    }
  } catch (e) {
    console.error("Speech synthesis failed", e);
  }
};
