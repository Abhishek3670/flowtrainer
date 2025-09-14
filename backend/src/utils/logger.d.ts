import { Logger } from 'winston';

declare const logger: Logger & {
  stream: {
    write: (message: string) => void;
  };
};

export default logger;
