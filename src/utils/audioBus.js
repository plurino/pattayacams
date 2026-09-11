/**
 * Global Audio Focus Bus for PattayaCams
 * Enforces a single active audio playback channel across the site.
 * When any player begins playing or unmuting audio, it requests focus,
 * notifying all other active players to mute or pause.
 */

class AudioFocusBus {
  constructor() {
    this.activePlayerId = null;
    this.listeners = new Set();
  }

  requestAudioFocus(playerId) {
    if (this.activePlayerId === playerId) return;
    this.activePlayerId = playerId;
    this.notify(playerId);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('pattayacams_audio_focus', {
          detail: { activePlayerId: playerId },
        })
      );
    }
  }

  releaseAudioFocus(playerId) {
    if (this.activePlayerId === playerId) {
      this.activePlayerId = null;
      this.notify(null);
    }
  }

  subscribe(callback) {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  notify(activePlayerId) {
    this.listeners.forEach((callback) => {
      try {
        callback(activePlayerId);
      } catch (err) {
        console.warn('Error in audio focus subscriber:', err);
      }
    });
  }
}

export const audioBus = new AudioFocusBus();
export default audioBus;
