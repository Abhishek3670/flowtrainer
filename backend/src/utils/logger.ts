import { injectable } from 'inversify';

@injectable()
export class Logger {
    info(...args: any[]) {
        console.log(...args);
    }

    error(...args: any[]) {
        console.error(...args);
    }

    warn(...args: any[]) {
        console.warn(...args);
    }

    debug(...args: any[]) {
        console.debug(...args);
    }
}
