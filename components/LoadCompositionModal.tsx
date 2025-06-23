import React from 'react';
import { SavedCompositionItem } from '../types';

interface LoadCompositionModalProps {
  savedCompositions: SavedCompositionItem[];
  onLoad: (compositionId: string) => void;
  onDelete: (compositionId: string) => void;
  onClose: () => void;
}

const LoadCompositionModal: React.FC<LoadCompositionModalProps> = ({ savedCompositions, onLoad, onDelete, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 p-6 rounded-lg shadow-xl max-w-lg w-full">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-sky-400">Load Composition</h2>
            <button
                onClick={onClose}
                className="text-slate-400 hover:text-slate-200 text-2xl font-bold"
                aria-label="Close"
            >
                &times;
            </button>
        </div>
        {savedCompositions.length === 0 ? (
          <p className="text-slate-300 text-center py-4">No saved compositions yet.</p>
        ) : (
          <div className="max-h-[60vh] overflow-y-auto pr-2">
            <ul className="space-y-3">
              {savedCompositions.map(comp => (
                <li key={comp.id} className="bg-slate-700 p-3 rounded-md shadow flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-slate-100">{comp.name}</p>
                    <p className="text-xs text-slate-400">
                      Saved: {new Date(comp.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <div className="space-x-2 flex-shrink-0">
                    <button
                      onClick={() => {
                        // window.confirm removed
                        onLoad(comp.id);
                        onClose();
                      }}
                      className="bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold py-1.5 px-3 rounded-md transition-colors duration-150"
                    >
                      Load
                    </button>
                    <button
                      onClick={() => {
                        // window.confirm removed
                        onDelete(comp.id);
                        // Do not close modal on delete, to allow user to see the item removed or delete more.
                      }}
                      className="bg-red-600 hover:bg-red-700 text-white text-sm font-semibold py-1.5 px-3 rounded-md transition-colors duration-150"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
         <div className="mt-6 text-right">
            <button
                onClick={onClose}
                className="bg-slate-600 hover:bg-slate-500 text-slate-100 font-semibold py-2 px-4 rounded-lg transition-colors duration-150"
            >
                Close
            </button>
        </div>
      </div>
    </div>
  );
};

export default LoadCompositionModal;