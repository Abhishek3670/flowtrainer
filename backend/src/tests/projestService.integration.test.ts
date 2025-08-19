import { ProjectService } from '../services/projectService';
import { EventEmitter } from 'events';

// Mock child_process.spawn
jest.mock('child_process', () => ({
  spawn: jest.fn()
}));

describe('ProjectService Docker Integration', () => {
  let projectService: ProjectService;
  let emitter: EventEmitter;
  let mockSpawn: any;

  beforeEach(() => {
    projectService = new ProjectService();
    emitter = new EventEmitter();
    mockSpawn = require('child_process').spawn;
  });

  test('should execute workflow with Docker commands', async () => {
    const projectId = 'test-project';
    const nodes = [
      { id: 'node1', type: 'data-upload', data: { file: 'test.csv' } },
      { id: 'node2', type: 'data-preprocessing', data: { scale: true } }
    ];
    const edges = [{ source: 'node1', target: 'node2' }];

    // Mock successful Docker execution
    const mockProcess = {
      stdout: { on: jest.fn() },
      stderr: { on: jest.fn() },
      on: jest.fn((event, callback) => {
        if (event === 'exit') {
          setTimeout(() => callback(0), 100);
        }
        return mockProcess;
      })
    };

    mockSpawn.mockReturnValue(mockProcess);

    // Listen to events
    const logs: string[] = [];
    const results: any[] = [];
    
    emitter.on('log', (message) => logs.push(message));
    emitter.on('done', (result) => results.push(result));

    // Execute
    await projectService.executeMLWorkflowLegacy(projectId, nodes, edges, emitter);

    // Verify Docker was called correctly
    expect(mockSpawn).toHaveBeenCalledWith('docker', expect.arrayContaining([
      'run', '--rm',
      '-v', expect.stringContaining('/workflows/test-project:/app/data'),
      '-v', expect.stringContaining('/results/test-project:/app/results'),
      'flowcraft-ml-engine'
    ]));

    // Verify logs were emitted
    expect(logs.some(log => log.includes('Starting ML workflow execution'))).toBe(true);
    expect(logs.some(log => log.includes('Node node1 completed successfully'))).toBe(true);
    
    // Verify completion event
    expect(results).toHaveLength(1);
    expect(results[0].status).toBe('success');
  });
});