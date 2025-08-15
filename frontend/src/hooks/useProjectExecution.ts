import { useState, useCallback, useEffect } from 'react';
import { projectApi, StatusResponse } from '../services/projectApi';

export function useProjectExecution(projectId: string) {
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  const generatePlan = useCallback(async (workflowId: string, nodes: any[], edges: any[]) => {
    setLoading(true);
    try {
      await projectApi.generatePlan(projectId, { workflowId, nodes, edges });
    } catch (err: any) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const execute = useCallback(async () => {
    setRunning(true);
    setLoading(true);
    try {
      await projectApi.execute(projectId);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message);
      setRunning(false);
      setLoading(false);
    }
  }, [projectId]);

  // Poll status while running
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (running) {
      const poll = async () => {
        try {
          const resp = await projectApi.getStatus(projectId);
          setStatus(resp.data);
          if (resp.data.status !== 'running') {
            setRunning(false);
            setLoading(false);
          }
        } catch (err: any) {
          setError(err.response?.data?.error || err.message);
          setRunning(false);
          setLoading(false);
        }
      };
      poll();
      timer = setInterval(poll, 2000);
    }
    return () => clearInterval(timer);
  }, [projectId, running]);

  return { status, loading, error, running, generatePlan, execute };
}
