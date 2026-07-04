import { useState, useCallback, ChangeEvent, useEffect } from 'react';
import { Camera, Upload, Loader2, CheckCircle2, AlertCircle, AlertTriangle, Package, MapPin, Star, Cpu, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ImageProcessor } from '@/services/ocr/image-processor';
import { OCRResult } from '@/services/ocr/ocr.service';
import { ShipmentExtractor, ExtractionStrategy } from '@/services/ocr/shipment-extractor';
import { Validator } from '@/services/ocr/validator';
import { Shipment } from '@/types/shipment';

export function OCRScanner({ onResult }: { onResult: (result: OCRResult) => void }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState('');

  const handleFileUpload = useCallback(async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setProgress('Initializing OCR...');

    try {
      const result = await ImageProcessor.processTiledImage(file);
      onResult(result);
    } catch {
      setProgress('Error processing image');
    } finally {
      setIsProcessing(false);
      setProgress('');
    }
  }, [onResult]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Button
          variant="outline"
          className="h-28 flex flex-col gap-2 border-2 border-dashed"
          onClick={() => document.getElementById('camera-input')?.click()}
          disabled={isProcessing}
        >
          <Camera className="w-10 h-10 text-primary" />
          <span className="font-bold">Camera</span>
        </Button>
        <Button
          variant="outline"
          className="h-28 flex flex-col gap-2 border-2 border-dashed"
          onClick={() => document.getElementById('file-input')?.click()}
          disabled={isProcessing}
        >
          <Upload className="w-10 h-10 text-primary" />
          <span className="font-bold">Gallery</span>
        </Button>
      </div>

      <input id="camera-input" type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileUpload} />
      <input id="file-input" type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />

      {isProcessing && (
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border-2 border-primary/10 shadow-xl animate-pulse">
          <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
          <p className="font-bold text-lg text-primary">{progress || 'Analyzing Screenshot...'}</p>
          <p className="text-sm text-slate-500 mt-2">This may take a few seconds for long images</p>
        </div>
      )}
    </div>
  );
}

export function OCRResultReview({ result, onConfirm, onCancel }: { result: OCRResult, onConfirm: (shipments: Shipment[]) => void, onCancel: () => void }) {
  const [extractedShipments, setExtractedShipments] = useState<Shipment[]>([]);
  const [strategy, setStrategy] = useState<ExtractionStrategy | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const runExtraction = async () => {
      const { shipments, strategy: s } = await ShipmentExtractor.extractFromOCR(result);
      setExtractedShipments(shipments);
      setStrategy(s);
      setIsLoading(false);
    };
    runExtraction();
  }, [result]);

  const updateShipment = (index: number, changes: Partial<Shipment>) => {
    const next = [...extractedShipments];
    next[index] = { ...next[index], ...changes } as Shipment;
    setExtractedShipments(next);
  };

  const removeShipment = (index: number) => {
    setExtractedShipments(extractedShipments.filter((_, i) => i !== index));
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border">
        <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
        <p className="font-bold">Structuring Data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col gap-2 sticky top-0 bg-slate-50 py-2 z-10">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg text-slate-800">Review Data</h3>
          <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold">
            {extractedShipments.length} shipments
          </span>
        </div>

        <div className={`flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 rounded border w-fit ${
          strategy === 'Gemini-AI' ? 'text-green-600 bg-green-50 border-green-100' : 'text-slate-600 bg-slate-100 border-slate-200'
        }`}>
          {strategy === 'Gemini-AI' ? <Cpu className="w-3 h-3" /> : <ShieldCheck className="w-3 h-3" />}
          {strategy === 'Gemini-AI' ? 'Gemini 1.5 Flash Active' : 'Offline OCR Mode'}
        </div>
      </div>

      {extractedShipments.length === 0 ? (
        <div className="bg-white p-12 rounded-xl border text-center space-y-4">
          <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto" />
          <p className="font-medium">No shipments could be automatically extracted.</p>
          <Button variant="outline" onClick={onCancel}>Try Another Image</Button>
        </div>
      ) : (
        <div className="space-y-4">
          {extractedShipments.map((s, i) => {
            const { isValid, warnings } = Validator.validate(s);
            return (
              <div key={i} className={`bg-white rounded-xl border-2 p-4 space-y-4 shadow-sm transition-colors ${!isValid ? 'border-yellow-200' : 'border-slate-100'}`}>
                <div className="flex justify-between items-start">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-slate-400" />
                      <input
                        className="font-bold text-lg w-full bg-transparent outline-none focus:border-b border-primary/20"
                        value={s.customerName}
                        onChange={(e) => updateShipment(i, { customerName: e.target.value })}
                      />
                      {s.priority === 'High' && (
                        <span className="bg-red-50 text-red-600 text-[10px] px-1.5 py-0.5 rounded font-black uppercase tracking-tighter flex items-center gap-0.5">
                          <Star className="w-2 h-2 fill-red-600" /> Priority
                        </span>
                      )}
                    </div>

                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-slate-400 mt-1 shrink-0" />
                      <div className="flex-1 space-y-2">
                        <textarea
                          className="text-sm text-slate-600 w-full bg-transparent outline-none focus:border-b border-primary/20 resize-none"
                          value={s.address}
                          onChange={(e) => updateShipment(i, { address: e.target.value })}
                          rows={2}
                          placeholder="Address"
                        />
                        {s.landmark && (
                          <div className="flex items-center gap-1 text-[11px] text-slate-500 bg-slate-50 p-1 rounded border">
                            <span className="font-bold shrink-0">LANDMARK:</span>
                            <input
                              className="bg-transparent outline-none w-full"
                              value={s.landmark}
                              onChange={(e) => updateShipment(i, { landmark: e.target.value })}
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    {s.awb && (
                      <div className="flex items-center gap-2">
                         <span className="text-[10px] font-mono text-slate-400">AWB:</span>
                        <input
                          className="text-sm font-mono w-full bg-transparent outline-none focus:border-b border-primary/20"
                          value={s.awb}
                          onChange={(e) => updateShipment(i, { awb: e.target.value })}
                        />
                      </div>
                    )}
                  </div>
                  <Button variant="ghost" size="icon" className="text-slate-300 hover:text-red-500" onClick={() => removeShipment(i)}>
                    <AlertCircle className="w-5 h-5" />
                  </Button>
                </div>

                {warnings.length > 0 && (
                  <div className="bg-yellow-50 p-2 rounded-lg space-y-1">
                    {warnings.map((w, wi) => (
                      <p key={wi} className="text-[10px] text-yellow-700 flex items-center gap-1 font-medium">
                        <AlertTriangle className="w-3 h-3" /> {w}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="fixed bottom-20 left-4 right-4 flex gap-3">
        <Button variant="outline" className="flex-1 bg-white h-12 shadow-lg" onClick={onCancel}>
          Discard All
        </Button>
        <Button className="flex-2 h-12 shadow-lg px-8" onClick={() => onConfirm(extractedShipments)}>
          <CheckCircle2 className="w-5 h-5 mr-2" />
          Confirm & Import
        </Button>
      </div>
    </div>
  );
}
