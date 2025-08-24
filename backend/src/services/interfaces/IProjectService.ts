export interface IProjectService {
    /**
     * Queue a workflow for execution
     * @param workflowId The ID of the workflow to execute
     */
    queueExecution(workflowId: string): Promise<void>;
}
