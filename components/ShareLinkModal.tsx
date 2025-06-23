
import React, { useState, useEffect } from 'react';

interface ShareLinkModalProps {
  shareUrl: string;
  onClose: () => void;
}

const ShareLinkModal: React.FC<ShareLinkModalProps> = ({ shareUrl, onClose }) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
    }).catch(err => {
      console.error('Failed to copy: ', err);
      // Fallback for older browsers or if navigator.clipboard is not available
      try {
        const textArea = document.createElement("textarea");
        textArea.value = shareUrl;
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        setCopied(true);
        document.body.removeChild(textArea);
      } catch (e) {
        alert("Failed to copy URL. Please copy it manually.");
      }
    });
  };

  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 p-6 rounded-lg shadow-xl max-w-md w-full">
        <h2 className="text-2xl font-bold text-sky-400 mb-4">Share Your Composition</h2>
        <p className="text-slate-300 mb-2">Copy this link to share your team plan:</p>
        <input
          type="text"
          value={shareUrl}
          readOnly
          className="w-full bg-slate-700 text-slate-100 border border-slate-600 rounded p-2 mb-4 break-all"
          onClick={(e) => (e.target as HTMLInputElement).select()}
        />
        <div className="flex justify-end space-x-3">
          <button
            onClick={copyToClipboard}
            className={`py-2 px-4 rounded-lg font-semibold transition-colors duration-150
              ${copied ? 'bg-green-500 hover:bg-green-600' : 'bg-sky-600 hover:bg-sky-700'} text-white`}
          >
            {copied ? 'Copied!' : 'Copy URL'}
          </button>
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

export default ShareLinkModal;
    