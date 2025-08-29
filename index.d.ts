import { EventEmitter } from 'events';

declare class MicrophoneMonitor {
    /**
     * Creates a new MicrophoneMonitor instance
     * @param timeout - The timeout in milliseconds to wait before checking if the microphone is active. Defaults to 5 seconds.
     */
    constructor(timeout?: number);

    /**
     * Starts watching for microphone activity
     */
    watchForMicrophoneActive(): void;

    /**
     * Stops watching for microphone activity
     */
    stopWatchingForMicrophoneActive(): void;

    /**
     * The EventEmitter instance
     */
    emitter: EventEmitter;

    /**
     * Whether the microphone is active
     */
    isMicrophoneActive: boolean;
}

export = MicrophoneMonitor;