/**
 * Integration Tests for ProjectService Docker Execution
 * 
 * These tests verify that the ProjectService correctly integrates with
 * Docker execution, file system operations, and event handling.
 */

import { ProjectService } from '../../services/projectService';
import { EventEmitter } from 'events';
import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';

// Mock child_process.spawn
jest.mock('child_process', () => ({
  spawn: jest.fn()
}));

// Mock fs.promises
jest.mock('fs/promises', () => ({
  mkdir: jest.fn(),
  readdir: jest.fn(),
  readFile: jest.fn(),
  writeFile: jest.fn()
}));

describe('ProjectService Docker Integration', () => {
  let projectService: ProjectService;
  let mockEmitter: EventEmitter;
  let mockSpawn: jest.MockedFunction<typeof spawn>;

  beforeEach(() => {
    projectService = new ProjectService();
    mockEmitter = new EventEmitter();
    mockSpawn = spawn as jest.MockedFunction<typeof spawn>;
    
    // Reset all mocks
    jest.clearAllMocks();
    
    // Mock fs.mkdir to succeed
    (fs.mkdir as jest.Mock).mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('executeMLWorkflowLegacy', () => {
    const testProjectId = 'test-project-123';
    const testNodes = [
      {
        id: 'data-upload-1',
        type: 'data-upload',
        data: { file: 'test.csv', format: 'csv' }
      },
      {
        id: 'preprocessing-1',
        type: 'data-preprocessing',
        data: { scale: true, handle_missing: 'drop' }
      }
    ];
    const testEdges = [
      { source: 'data-upload-1', target: 'preprocessing-1' }
    ];

    it('should create execution directories', async () => {
      // Mock spawn to return a mock process
      const mockProcess = {
        stdout: { on: jest.fn(), pipe: jest.fn() },
        stderr: { on: jest.fn(), pipe: jest.fn() },
        on: jest.fn((event, callback) => {
          if (event === 'close') {
            setTimeout(() => callback(0), 10);
          }
          return mockProcess;
        })
      };
      mockSpawn.mockReturnValue(mockProcess as any);

      await projectService.executeMLWorkflowLegacy(testProjectId, testNodes, testEdges, mockEmitter);

      expect(fs.mkdir).toHaveBeenCalledWith(
        path.join(process.cwd(), 'workflows', testProjectId),
        { recursive: true }
      );
      expect(fs.mkdir).toHaveBeenCalledWith(
        path.join(process.cwd(), 'results', testProjectId),
        { recursive: true }
      );
    });

    it('should spawn Docker containers for each node', async () => {
      const mockProcess = {
        stdout: { on: jest.fn(), pipe: jest.fn() },
        stderr: { on: jest.fn(), pipe: jest.fn() },
        on: jest.fn((event, callback) => {
          if (event === 'close') {
            setTimeout(() => callback(0), 10);
          }
          return mockProcess;
        })
      };
      mockSpawn.mockReturnValue(mockProcess as any);

      await projectService.executeMLWorkflowLegacy(testProjectId, testNodes, testEdges, mockEmitter);

      // Should spawn Docker for each node
      expect(mockSpawn).toHaveBeenCalledTimes(2);
      
      // Check first Docker call (data-upload-1)
      expect(mockSpawn).toHaveBeenNthCalledWith(1, 'docker', [
        'run', '--rm',
        '-v', expect.stringContaining('workflows/test-project-123:/app/data'),
        '-v', expect.stringContaining('results/test-project-123:/app/results'),
        'flowcraft-ml-engine',
        'python', '/app/execute_workflow.py',
        '--node_id', 'data-upload-1',
        '--project_id', testProjectId
      ], expect.any(Object));

      // Check second Docker call (preprocessing-1)
      expect(mockSpawn).toHaveBeenNthCalledWith(2, 'docker', [
        'run', '--rm',
        '-v', expect.stringContaining('workflows/test-project-123:/app/data'),
        '-v', expect.stringContaining('results/test-project-123:/app/results'),
        'flowcraft-ml-engine',
        'python', '/app/execute_workflow.py',
        '--node_id', 'preprocessing-1',
        '--project_id', testProjectId
      ], expect.any(Object));
    });

    it('should handle Docker execution errors gracefully', async () => {
      const mockProcess = {
        stdout: { on: jest.fn(), pipe: jest.fn() },
        stderr: { on: jest.fn(), pipe: jest.fn() },
        on: jest.fn((event, callback) => {
          if (event === 'close') {
            setTimeout(() => callback(1), 10); // Exit code 1 (error)
          }
          return mockProcess;
        })
      };
      mockSpawn.mockReturnValue(mockProcess as any);

      // Mock console.log to capture error messages
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await projectService.executeMLWorkflowLegacy(testProjectId, testNodes, testEdges, mockEmitter);

      // Should log error but continue execution
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Docker execution failed for node data-upload-1')
      );

      consoleSpy.mockRestore();
    });

    it('should emit events for monitoring', async () => {
      const mockProcess = {
        stdout: { on: jest.fn(), pipe: jest.fn() },
        stderr: { on: jest.fn(), pipe: jest.fn() },
        on: jest.fn((event, callback) => {
          if (event === 'close') {
            setTimeout(() => callback(0), 10);
          }
          return mockProcess;
        })
      };
      mockSpawn.mockReturnValue(mockProcess as any);

      const eventSpy = jest.fn();
      mockEmitter.on('log', eventSpy);

      await projectService.executeMLWorkflowLegacy(testProjectId, testNodes, testEdges, mockEmitter);

      // Should emit log events
      expect(eventSpy).toHaveBeenCalled();
    });
  });

  describe('ensureExecutionDirectories', () => {
    it('should create workflows and results directories', async () => {
      const testProjectId = 'test-project-456';
      
      await (projectService as any).ensureExecutionDirectories(testProjectId);

      expect(fs.mkdir).toHaveBeenCalledWith(
        path.join(process.cwd(), 'workflows', testProjectId),
        { recursive: true }
      );
      expect(fs.mkdir).toHaveBeenCalledWith(
        path.join(process.cwd(), 'results', testProjectId),
        { recursive: true }
      );
    });

    it('should handle directory creation errors', async () => {
      const testProjectId = 'test-project-789';
      const error = new Error('Permission denied');
      
      (fs.mkdir as jest.Mock).mockRejectedValue(error);

      await expect(
        (projectService as any).ensureExecutionDirectories(testProjectId)
      ).rejects.toThrow('Permission denied');
    });
  });
});
