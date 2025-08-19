import { ProjectService } from '../services/projectService';
import { EventEmitter } from 'events';

describe('ProjectService Docker Invocation', () => {
  let projectService: ProjectService;
  let emitter: EventEmitter;

  beforeEach(() => {
    projectService = new ProjectService();
    emitter = new EventEmitter();
  });

  test('should calculate execution order correctly', () => {
    const nodes = [
      { id: 'node1', type: 'data-source' },
      { id: 'node2', type: 'processor' },
      { id: 'node3', type: 'output' }
    ];
    
    const edges = [
      { source: 'node1', target: 'node2' },
      { source: 'node2', target: 'node3' }
    ];

    // Access private method using bracket notation
    const order = (projectService as any).calculateExecutionOrder(nodes, edges);
    expect(order).toEqual(['node1', 'node2', 'node3']);
  });

  test('should create execution directories', async () => {
    const projectId = 'test-project-123';
    
    // Access private method using bracket notation
    await (projectService as any).ensureExecutionDirectories(projectId);
    
    // Check if directories were created
    const fs = require('fs');
    const path = require('path');
    
    const projectPath = path.join(process.cwd(), 'workflows', projectId);
    const resultsPath = path.join(process.cwd(), 'results', projectId);
    
    expect(fs.existsSync(projectPath)).toBe(true);
    expect(fs.existsSync(resultsPath)).toBe(true);
  });
});