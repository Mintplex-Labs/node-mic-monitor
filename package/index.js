const EventEmitter = require('events');
const path = require('path');
const fs = require('fs');
const { platform, arch } = require('os');

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
    this.platform_utils = this.#tryRequirePlatformUtils();
  }

  #tryRequirePlatformUtils() {
    const targetAddon = `${platform}_${arch}_utils.node`;
    try {
      return require("bindings")(targetAddon);
    } catch (error) {
      // Try to require the addon from root directory
      let addonPath = path.join(__dirname, targetAddon)
      // If the addon is not found in the root directory, try to require it from the lib directory
      if (!fs.existsSync(addonPath)) addonPath = path.join(__dirname, 'lib', targetAddon)
      // If the addon is not found in the lib directory, throw an error
      if (!fs.existsSync(addonPath)) throw new Error(`Addon ${targetAddon} not found`);
      return require(addonPath);
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