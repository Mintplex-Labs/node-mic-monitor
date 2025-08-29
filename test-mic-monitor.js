const MicrophoneMonitor = require('./index');
const micMonitor = new MicrophoneMonitor();

// Handle process termination
process.on('SIGINT', () => {
  console.log('\nStopping microphone monitoring...');
  micMonitor.stopWatchingForMicrophoneActive();
  process.exit(0);
});

console.log('Starting microphone monitoring...');
console.log('Press Ctrl+C to stop.\n');

micMonitor.watchForMicrophoneActive();

micMonitor.emitter.on('microphone-newly-active', (processes) => {
  console.log('Microphone is newly active for the following processes:', processes);
});

micMonitor.emitter.on('microphone-newly-inactive', () => {
  console.log('Microphone is newly inactive');
  process.exit(0);
});

process.stdin.resume();