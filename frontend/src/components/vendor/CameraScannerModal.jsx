import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { X, Camera, SwitchCamera, AlertCircle, Loader2 } from 'lucide-react';

const READER_ID = 'vendor-barcode-reader';

const BARCODE_FORMATS = [
  Html5QrcodeSupportedFormats.EAN_13,
  Html5QrcodeSupportedFormats.EAN_8,
  Html5QrcodeSupportedFormats.UPC_A,
  Html5QrcodeSupportedFormats.UPC_E,
  Html5QrcodeSupportedFormats.CODE_128,
  Html5QrcodeSupportedFormats.CODE_39,
  Html5QrcodeSupportedFormats.CODE_93,
  Html5QrcodeSupportedFormats.ITF,
  Html5QrcodeSupportedFormats.CODABAR,
  Html5QrcodeSupportedFormats.QR_CODE,
];

/**
 * Camera barcode scanner for vendor product add.
 * Works with phone back camera and laptop webcam — hold barcode in front of lens.
 */
const CameraScannerModal = ({ isOpen, onClose, onScan }) => {
  const scannerRef = useRef(null);
  const onScanRef = useRef(onScan);
  const onCloseRef = useRef(onClose);
  const scannedRef = useRef(false);
  const [status, setStatus] = useState('idle'); // idle | starting | scanning | error
  const [errorMsg, setErrorMsg] = useState('');
  const [cameras, setCameras] = useState([]);
  const [cameraId, setCameraId] = useState(null);

  useEffect(() => {
    onScanRef.current = onScan;
    onCloseRef.current = onClose;
  }, [onScan, onClose]);

  const stopScanner = useCallback(async () => {
    const scanner = scannerRef.current;
    if (!scanner) return;
    try {
      if (scanner.isScanning) {
        await scanner.stop();
      }
      scanner.clear();
    } catch {
      // already stopped
    }
    scannerRef.current = null;
  }, []);

  const startScanner = useCallback(
    async (deviceId) => {
      setStatus('starting');
      setErrorMsg('');
      scannedRef.current = false;

      await stopScanner();

      // Wait one frame so #reader is mounted
      await new Promise((r) => requestAnimationFrame(r));

      const el = document.getElementById(READER_ID);
      if (!el) {
        setStatus('error');
        setErrorMsg('Scanner UI load nahi hua. Phir se try karein.');
        return;
      }

      const scanner = new Html5Qrcode(READER_ID, {
        formatsToSupport: BARCODE_FORMATS,
        verbose: false,
      });
      scannerRef.current = scanner;

      const config = {
        fps: 12,
        // Wide box suits 1D product barcodes better than a square QR box
        qrbox: (viewfinderWidth, viewfinderHeight) => {
          const w = Math.min(Math.floor(viewfinderWidth * 0.9), 360);
          const h = Math.min(Math.floor(viewfinderHeight * 0.28), 140);
          return { width: w, height: Math.max(h, 80) };
        },
        aspectRatio: 1.333,
        disableFlip: false,
      };

      const onSuccess = (decodedText) => {
        if (scannedRef.current) return;
        scannedRef.current = true;
        const code = String(decodedText || '').replace(/\s+/g, '').trim();
        if (!code) {
          scannedRef.current = false;
          return;
        }
        // Haptic feedback on mobile when available
        try {
          if (navigator.vibrate) navigator.vibrate(40);
        } catch {
          /* ignore */
        }
        stopScanner().finally(() => {
          onScanRef.current?.(code);
          onCloseRef.current?.();
        });
      };

      try {
        if (deviceId) {
          await scanner.start(deviceId, config, onSuccess, () => {});
        } else {
          // Prefer rear camera on phones; laptop uses default webcam
          await scanner.start(
            { facingMode: 'environment' },
            config,
            onSuccess,
            () => {}
          );
        }
        setStatus('scanning');
      } catch (err) {
        // Fallback: try any available camera (laptop front cam, etc.)
        try {
          const devices = await Html5Qrcode.getCameras();
          setCameras(devices || []);
          if (devices?.length) {
            const preferred =
              devices.find((d) =>
                /back|rear|environment|hindi|world/i.test(d.label || '')
              ) || devices[0];
            setCameraId(preferred.id);
            await scanner.start(preferred.id, config, onSuccess, () => {});
            setStatus('scanning');
            return;
          }
        } catch {
          /* fall through to error */
        }

        console.error('Camera start failed:', err);
        setStatus('error');
        const name = err?.name || '';
        const msg = String(err?.message || err || '');
        if (
          name === 'NotAllowedError' ||
          /permission|denied|notallowed/i.test(msg)
        ) {
          setErrorMsg(
            'Camera permission band hai. Browser settings me camera allow karein, phir dobara try karein.'
          );
        } else if (
          name === 'NotFoundError' ||
          /not found|no camera|no device/i.test(msg)
        ) {
          setErrorMsg(
            'Koi camera nahi mila. Mobile/laptop me camera connect karke phir try karein.'
          );
        } else if (/https|secure|insecure/i.test(msg)) {
          setErrorMsg(
            'Camera ke liye HTTPS (ya localhost) chahiye. App ko secure URL se kholen.'
          );
        } else {
          setErrorMsg(
            'Camera start nahi ho paya. Permission check karein ya page refresh karke try karein.'
          );
        }
      }
    },
    [stopScanner]
  );

  useEffect(() => {
    if (!isOpen) return undefined;

    let cancelled = false;

    (async () => {
      try {
        const devices = await Html5Qrcode.getCameras();
        if (cancelled) return;
        setCameras(devices || []);
        const preferred =
          devices?.find((d) =>
            /back|rear|environment|world/i.test(d.label || '')
          ) || devices?.[0];
        if (preferred) setCameraId(preferred.id);
        await startScanner(preferred?.id || null);
      } catch {
        if (!cancelled) await startScanner(null);
      }
    })();

    return () => {
      cancelled = true;
      stopScanner();
    };
    // Only re-run when modal opens/closes — not on every parent re-render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleSwitchCamera = async () => {
    if (cameras.length < 2) return;
    const idx = cameras.findIndex((c) => c.id === cameraId);
    const next = cameras[(idx + 1) % cameras.length];
    setCameraId(next.id);
    await startScanner(next.id);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4 bg-black/70"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <Camera size={16} className="text-blue-600" />
            </div>
            <div>
              <h2 className="text-gray-900 font-bold text-base leading-tight">
                Camera se barcode scan
              </h2>
              <p className="text-[11px] text-gray-500">
                Mobile ya laptop camera ke saamne barcode rakhein
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {cameras.length > 1 && status === 'scanning' && (
              <button
                type="button"
                onClick={handleSwitchCamera}
                className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 transition"
                title="Switch camera"
              >
                <SwitchCamera size={18} />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-3 sm:p-4 flex-1 overflow-y-auto">
          {status === 'error' ? (
            <div className="rounded-xl border border-red-100 bg-red-50 p-4 space-y-3">
              <div className="flex items-start gap-2 text-red-700">
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                <p className="text-sm">{errorMsg}</p>
              </div>
              <button
                type="button"
                onClick={() => startScanner(cameraId)}
                className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold"
              >
                Phir se try karein
              </button>
            </div>
          ) : (
            <>
              <div className="relative w-full min-h-[260px] rounded-xl overflow-hidden bg-black">
                {(status === 'idle' || status === 'starting') && (
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-white/90 gap-2 bg-black">
                    <Loader2 size={28} className="animate-spin text-blue-400" />
                    <p className="text-sm">Camera open ho raha hai...</p>
                  </div>
                )}
                <div id={READER_ID} className="w-full min-h-[260px] [&_video]:w-full [&_video]:rounded-xl" />
              </div>

              {status === 'scanning' && (
                <div className="mt-3 space-y-2">
                  <p className="text-xs text-center text-gray-600 leading-relaxed">
                    Product ka barcode line ke beech me rakhein — camera khud padh lega.
                    <br />
                    <span className="text-gray-400">
                      Acchi roshni me barcode seedha aur clear rakhein.
                    </span>
                  </p>
                  <div className="flex items-center justify-center gap-2 text-[11px] text-emerald-700 bg-emerald-50 rounded-lg py-1.5 px-2">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Scanning active — barcode dikhayein
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CameraScannerModal;
