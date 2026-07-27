import React, { useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { X } from 'lucide-react';

const CameraScannerModal = ({ isOpen, onClose, onScan }) => {
  useEffect(() => {
    if (isOpen) {
      const scanner = new Html5QrcodeScanner(
        "reader",
        { fps: 10, qrbox: { width: 250, height: 100 } },
        /* verbose= */ false
      );

      scanner.render(
        (decodedText) => {
          scanner.clear();
          onScan(decodedText);
          onClose();
        },
        (errorMessage) => {
          // ignore scan errors (they happen constantly when no barcode is in view)
        }
      );

      return () => {
        scanner.clear().catch(error => {
          console.error("Failed to clear html5QrcodeScanner. ", error);
        });
      };
    }
  }, [isOpen, onClose, onScan]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-gray-900 font-bold text-lg">Scan Barcode</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition">
            <X size={20} />
          </button>
        </div>
        <div className="p-4">
          <div id="reader" className="w-full"></div>
          <p className="text-xs text-center text-gray-500 mt-4">Point your camera at the product barcode</p>
        </div>
      </div>
    </div>
  );
};

export default CameraScannerModal;
