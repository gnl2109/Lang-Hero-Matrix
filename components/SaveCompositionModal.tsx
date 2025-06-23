import React, { useState } from 'react';

interface SaveCompositionModalProps {
  onSave: (name: string) => void;
  onClose: () => void;
}

const SaveCompositionModal: React.FC<SaveCompositionModalProps> = ({ onSave, onClose }) => {
  const [name, setName] = useState('');

  const handleSave = () => {
    if (name.trim()) {
      onSave(name.trim());
      onClose();
    } else {
      alert("Please enter a name for your composition.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 p-6 rounded-lg shadow-xl max-w-md w-full">
        <h2 className="text-2xl font-bold text-sky-400 mb-4">Save Composition</h2>
        <p className="text-slate-300 mb-2">Enter a name for this team composition:</p>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Week 1 Polarity"
          className="w-full bg-slate-700 text-slate-100 border border-slate-600 rounded p-2 mb-6 focus:ring-sky-500 focus:border-sky-500"
          aria-label="Composition name"
        />
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="bg-slate-600 hover:bg-slate-500 text-slate-100 font-semibold py-2 px-4 rounded-lg transition-colors duration-150"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-150"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default SaveCompositionModal;