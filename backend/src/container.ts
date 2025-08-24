import { Container } from 'inversify';
import { TYPES } from './types';
import { FileController } from './controllers/file.controller';
import { FileService } from './services/implementations/FileService';
import { IFileService } from './services/interfaces/IFileService';

const container = new Container();

// Services
container.bind<IFileService>(TYPES.FileService).to(FileService);

// Controllers
container.bind<FileController>(TYPES.FileController).to(FileController);

export { container };
