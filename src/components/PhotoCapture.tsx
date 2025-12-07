import React, { useState, useRef } from 'react';

interface PhotoCaptureProps {
  workOrderId: string;
  category?: 'diagnostic' | 'before' | 'progress' | 'after' | 'issue';
  onPhotoTaken: (photoData: { url: string; category: string; caption?: string }) => void;
  className?: string;
}

const PhotoCapture: React.FC<PhotoCaptureProps> = ({
  workOrderId: _workOrderId,
  category = 'diagnostic',
  onPhotoTaken,
  className = '',
}) => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(category);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const categories = [
    { value: 'diagnostic', label: 'Diagnostic', icon: '🔍' },
    { value: 'before', label: 'Before', icon: '📷' },
    { value: 'progress', label: 'Progress', icon: '⚙️' },
    { value: 'after', label: 'After', icon: '✅' },
    { value: 'issue', label: 'Issue', icon: '⚠️' },
  ];

  const startCamera = async () => {
    try {
      setIsCapturing(true);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }, // Use back camera on mobile
        audio: false,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Cannot access camera. Please check permissions or use file upload instead.');
      setIsCapturing(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCapturing(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw the video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to data URL
    const photoDataUrl = canvas.toDataURL('image/jpeg', 0.8);
    setCapturedPhoto(photoDataUrl);
    stopCamera();
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file.');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('Image file is too large. Please select a file under 10MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setCapturedPhoto(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const savePhoto = () => {
    if (!capturedPhoto) return;

    onPhotoTaken({
      url: capturedPhoto,
      category: selectedCategory,
      caption: caption.trim() || undefined,
    });

    // Reset state
    setCapturedPhoto(null);
    setCaption('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const discardPhoto = () => {
    setCapturedPhoto(null);
    setCaption('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      <div className="p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          📷 Photo Documentation
        </h3>

        {/* Category Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Photo Category
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {categories.map((cat) => (
              <button
                key={cat.value}
                type="button"
                onClick={() => setSelectedCategory(cat.value as any)}
                className={`flex items-center justify-center space-x-1 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  selectedCategory === cat.value
                    ? 'bg-blue-100 text-blue-700 border-blue-200'
                    : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                }`}
              >
                <span>{cat.icon}</span>
                <span className="hidden sm:block">{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        {!capturedPhoto && !isCapturing && (
          <div className="space-y-3">
            {/* Camera Button */}
            <button
              type="button"
              onClick={startCamera}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              <span>📷</span>
              <span>Take Photo</span>
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">or</span>
              </div>
            </div>

            {/* File Upload Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              <span>📁</span>
              <span>Choose from Gallery</span>
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        )}

        {/* Camera View */}
        {isCapturing && (
          <div className="space-y-4">
            <div className="relative bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-64 object-cover"
              />
              <canvas ref={canvasRef} className="hidden" />
            </div>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={capturePhoto}
                className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors"
              >
                📸 Capture
              </button>
              <button
                type="button"
                onClick={stopCamera}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg font-medium hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Photo Preview */}
        {capturedPhoto && (
          <div className="space-y-4">
            <div className="relative">
              <img
                src={capturedPhoto}
                alt="Captured"
                className="w-full h-64 object-cover rounded-lg border"
              />
              <div className="absolute top-2 right-2">
                <span className={`px-2 py-1 rounded text-xs font-medium text-white ${
                  selectedCategory === 'diagnostic' ? 'bg-blue-500' :
                  selectedCategory === 'before' ? 'bg-gray-500' :
                  selectedCategory === 'progress' ? 'bg-yellow-500' :
                  selectedCategory === 'after' ? 'bg-green-500' :
                  'bg-red-500'
                }`}>
                  {categories.find(c => c.value === selectedCategory)?.label}
                </span>
              </div>
            </div>

            {/* Caption Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Caption (Optional)
              </label>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Add a description of what this photo shows..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                rows={2}
                maxLength={200}
              />
              <div className="text-xs text-gray-500 mt-1">
                {caption.length}/200 characters
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={savePhoto}
                className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors"
              >
                ✅ Save Photo
              </button>
              <button
                type="button"
                onClick={discardPhoto}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg font-medium hover:bg-gray-600 transition-colors"
              >
                🗑️ Discard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PhotoCapture;