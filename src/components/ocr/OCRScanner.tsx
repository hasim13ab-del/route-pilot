import { useState, useCallback, ChangeEvent } from 'react';
import { Camera, Upload, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ImageProcessor } from '@/services/ocr/image-processor';
import { OCRResult } from '@/services/ocr/ocr.service';
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
    } catch { setProgress('Error processing image'); }
    finally { setIsProcessing(false); setProgress(''); }
  }, [onResult]);
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Button variant="outline" className="h-24 flex flex-col gap-2" onClick={() => document.getElementById('camera-input')?.click()}>
          <Camera className="w-8 h-8" /><span>Camera</span>
        </Button>
        <Button variant="outline" className="h-24 flex flex-col gap-2" onClick={() => document.getElementById('file-input')?.click()}>
          <Upload className="w-8 h-8" /><span>Upload</span>
        </Button>
      </div>
      <input id="camera-input" type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileUpload} />
      <input id="file-input" type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
      {isProcessing && (
        <div className="flex items-center justify-center p-8 bg-white rounded-lg border border-primary/20 animate-pulse">
          <Loader2 className="w-10 h-10 text-primary animate-spin mr-3" />
          <p className="font-medium text-primary">{progress || 'Processing...'}</p>
        </div>
      )}
    </div>
  );
}
export function OCRResultReview({ result, onConfirm, onCancel }: { result: OCRResult, onConfirm: (text: string) => void, onCancel: () => void }) {
  const [editedText, setEditedText] = useState(result.text);
  return (
    <div className="space-y-4 bg-white p-4 rounded-lg border shadow-sm">
      <h3 className="font-bold flex items-center justify-between">Review Results <span>{Math.round(result.confidence)}%</span></h3>
      <textarea className="w-full h-64 p-3 text-sm border rounded-md font-mono" value={editedText} onChange={(e) => setEditedText(e.target.value)} />
      <div className="flex gap-3">
        <Button variant="outline" className="flex-1" onClick={onCancel}><AlertCircle className="w-4 h-4 mr-2" />Discard</Button>
        <Button className="flex-1" onClick={() => onConfirm(editedText)}><CheckCircle2 className="w-4 h-4 mr-2" />Confirm</Button>
      </div>
    </div>
  );
}
