import { useState } from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, description: string) => void;
}

export default function CheckpointModal({ isOpen, onClose, onCreate }: Props) {
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded p-4 w-96">
        <h2 className="text-lg font-semibold mb-2">Create Checkpoint</h2>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Name" className="w-full mb-2 p-2 border" />
        <textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="Description" className="w-full mb-4 p-2 border" />
        <div className="flex justify-end space-x-2">
          <button onClick={onClose} className="btn btn-outline">Cancel</button>
          <button onClick={() => { onCreate(name, desc); onClose(); }} className="btn btn-primary">Save</button>
        </div>
      </div>
    </div>
  );
}
