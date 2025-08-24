import { Container } from 'typedi';
import { WorkflowService } from './implementations/WorkflowService';
import { UserService } from './implementations/UserService';
import { FileService } from './implementations/FileService';
import { ProjectService } from './projectService';
import { CheckpointService } from './checkpoint.service';

// Register service implementations
Container.set('workflow.service', new WorkflowService());
Container.set('user.service', new UserService());
Container.set('file.service', new FileService());
Container.set('project.service', new ProjectService());
Container.set('checkpoint.service', new CheckpointService());

// Export factory functions
export const getWorkflowService = () => Container.get<WorkflowService>('workflow.service');
export const getUserService = () => Container.get<UserService>('user.service');
export const getFileService = () => Container.get<FileService>('file.service');
export const getProjectService = () => Container.get<ProjectService>('project.service');
export const getCheckpointService = () => Container.get<CheckpointService>('checkpoint.service');
