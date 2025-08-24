import { IWorkflow, INode, IEdge } from '../../types';
import { WorkflowDocument } from '../../models/workflow.model';

/**
 * Interface for the Workflow Service layer.
 * Handles all business logic related to workflows including CRUD operations,
 * collaboration, node management, and version control.
 */
export interface IWorkflowService {
  /**
   * Retrieves all workflows accessible by a user
   * This includes workflows they own, collaborate on, or are public
   * @param userId - The ID of the user requesting workflows
   * @returns Promise resolving to an array of workflow documents
   */
  getWorkflows(userId: string): Promise<WorkflowDocument[]>;

  /**
   * Retrieves a specific workflow by ID if the user has access
   * @param id - The workflow ID
   * @param userId - The ID of the requesting user
   * @returns Promise resolving to the workflow document or null if not found/no access
   */
  getWorkflowById(id: string, userId: string): Promise<WorkflowDocument | null>;

  /**
   * Creates a new workflow owned by the specified user
   * @param data - Partial workflow data to create
   * @param userId - The ID of the user creating the workflow
   * @returns Promise resolving to the created workflow document
   */
  createWorkflow(data: Partial<IWorkflow>, userId: string): Promise<WorkflowDocument>;

  /**
   * Updates an existing workflow if the user has appropriate permissions
   * @param id - The workflow ID to update
   * @param data - The workflow data to update
   * @param userId - The ID of the user making the update
   * @returns Promise resolving to the updated workflow or null if not found/no access
   */
  updateWorkflow(id: string, data: Partial<IWorkflow>, userId: string): Promise<WorkflowDocument | null>;

  /**
   * Deletes (or archives) a workflow if the user has appropriate permissions
   * @param id - The workflow ID to delete
   * @param userId - The ID of the user requesting deletion
   * @returns Promise resolving to true if deleted, false if not found/no access
   */
  deleteWorkflow(id: string, userId: string): Promise<boolean>;
  
  /**
   * Adds a collaborator to a workflow
   * @param workflowId - The ID of the workflow
   * @param collaboratorId - The ID of the user to add as collaborator
   * @param ownerId - The ID of the workflow owner making the request
   * @returns Promise resolving to the updated workflow or null if not found/no access
   */
  addCollaborator(workflowId: string, collaboratorId: string, ownerId: string): Promise<WorkflowDocument | null>;

  /**
   * Removes a collaborator from a workflow
   * @param workflowId - The ID of the workflow
   * @param collaboratorId - The ID of the collaborator to remove
   * @param ownerId - The ID of the workflow owner making the request
   * @returns Promise resolving to the updated workflow or null if not found/no access
   */
  removeCollaborator(workflowId: string, collaboratorId: string, ownerId: string): Promise<WorkflowDocument | null>;
  
  /**
   * Updates a specific node within a workflow
   * @param workflowId - The ID of the workflow containing the node
   * @param nodeId - The ID of the node to update
   * @param data - The node data to update
   * @param userId - The ID of the user making the update
   * @returns Promise resolving to the updated workflow or null if not found/no access
   */
  updateNode(workflowId: string, nodeId: string, data: Partial<INode>, userId: string): Promise<WorkflowDocument | null>;

  /**
   * Updates the execution result of a specific node
   * @param workflowId - The ID of the workflow containing the node
   * @param nodeId - The ID of the node to update
   * @param result - The execution result data
   * @returns Promise resolving when the update is complete
   */
  updateNodeResult(workflowId: string, nodeId: string, result: any): Promise<void>;
  
  /**
   * Retrieves the version history of a workflow
   * @param workflowId - The ID of the workflow
   * @returns Promise resolving to an array of workflow revisions
   */
  getWorkflowHistory(workflowId: string): Promise<any[]>;

  /**
   * Creates a new revision/version of a workflow
   * @param workflowId - The ID of the workflow
   * @param userId - The ID of the user creating the revision
   * @param changeDescription - Description of the changes made
   * @returns Promise resolving to the created revision
   */
  createRevision(workflowId: string, userId: string, changeDescription: string): Promise<any>;
}
