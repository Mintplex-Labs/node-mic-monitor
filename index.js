const EventEmitter = require('events');
const path = require('path');

class MicrophoneMonitor {
  emitter;
  timeout;
  interval;
  platform_utils;
  isMicrophoneActive;

  constructor(timeout = 5_000, pFilterFunc = (micOccupantName) => { return micOccupantName }) {
    this.timeout = timeout;
    this.interval = null;
    this.emitter = new EventEmitter();
    this.isMicrophoneActive = false;
    this.filterProcessNameFunc = pFilterFunc;

    if (!['darwin', 'win32'].includes(process.platform)) throw new Error('Microphone monitoring is only supported on macOS and Windows');
    try {
      this.platform_utils = process.platform === 'darwin'
        ? require("bindings")("mac_utils.node")
        : require("bindings")("win_utils.node");
    } catch (error) {
      // Fallback to direct require if bindings fails or is not available
      const addonPath = process.platform === 'darwin'
        ? path.join(__dirname, 'mac_utils.node')
        : path.join(__dirname, 'win_utils.node');
      this.platform_utils = require(addonPath);
    }
  }

  watchForMicrophoneActive() {
    this.interval = setInterval(() => {
      const inputAudioProcesses = this.platform_utils.getRunningInputAudioProcesses();

      if (inputAudioProcesses.length === 0 && this.isMicrophoneActive) return this.stopWatchingForMicrophoneActive(); // If the processes are empty and the microphone is active, stop watching for microphone active
      else if (inputAudioProcesses.length > 0 && this.isMicrophoneActive) return; // If the processes are not empty and the microphone is active, do nothing as we are already watching for microphone active
      else if (inputAudioProcesses.length === 0) return; // If the processes are empty, do nothing

      // Otherwise, emit the microphone-newly-active event as microphone is newly active
      const audioProcessNames = inputAudioProcesses.map(this.#parseProcessName).filter(this.filterProcessNameFunc);
      this.emitter.emit('microphone-newly-active', audioProcessNames);
      this.isMicrophoneActive = true;
    }, this.timeout);
  }

  stopWatchingForMicrophoneActive() {
    if (this.interval) clearInterval(this.interval);
    this.interval = null;
    if (!this.isMicrophoneActive) return;
    this.emitter.emit('microphone-newly-inactive');
    this.emitter.removeAllListeners();
    this.emitter = null;
    this.isMicrophoneActive = false;
  }

  /**
   * Filters the process name from its path eg: /Applications/Google Chrome.app/Contents/MacOS/Google Chrome -> google chrome
   * @param inputAudioProcessesPath - The path to the input audio process
   * @returns The filtered process name (always lowercase)
   */
  #parseProcessName(inputAudioProcessesPath) {
    return path.basename(inputAudioProcessesPath).replace(path.extname(inputAudioProcessesPath), '').toLowerCase(); // Get the process program name only
  }
}

module.exports = MicrophoneMonitor;