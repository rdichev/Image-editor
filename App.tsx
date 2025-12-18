
import React, { useState, useRef, useCallback } from 'react';
import { EditStatus, ImageState } from './types';
import { editImageWithGemini } from './services/geminiService';
import { Button } from './components/Button';

const QUICK_ACTIONS = [
  { label: "Remove Background", prompt: "Remove the background and make it perfectly transparent or pure white." },
  { label: "Studio Clean", prompt: "Clean up the image, remove any dust or scratches, and add professional studio lighting." },
  { label: "Add Shadow", prompt: "Add a realistic soft contact shadow under the product." },
  { label: "Retro Filter", prompt: "Apply a subtle retro film filter to the photo." },
  { label: "E-commerce Ready", prompt: "Center the product, remove background, and optimize colors for a web shop." }
];

const App: React.FC = () => {
  const [image, setImage] = useState<ImageState>({ original: null, edited: null, mimeType: null });
  const [status, setStatus] = useState<EditStatus>(EditStatus.IDLE);
  const [prompt, setPrompt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [zoomScale, setZoomScale] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setImage({
          original: reader.result as string,
          edited: null,
          mimeType: file.type
        });
        setStatus(EditStatus.IDLE);
        setError(null);
        setZoomScale(1);
      };
      reader.readAsDataURL(file);
    }
  };

  const processEdit = async (customPrompt?: string) => {
    const activePrompt = customPrompt || prompt;
    if (!image.original || !activePrompt || !image.mimeType) return;

    setStatus(EditStatus.PROCESSING);
    setError(null);

    try {
      const result = await editImageWithGemini({
        image: image.original,
        mimeType: image.mimeType,
        instruction: activePrompt
      });
      setImage(prev => ({ ...prev, edited: result }));
      setStatus(EditStatus.SUCCESS);
    } catch (err: any) {
      setError(err.message);
      setStatus(EditStatus.ERROR);
    }
  };

  const handleDownload = () => {
    if (!image.edited) return;
    const link = document.createElement('a');
    link.href = image.edited;
    link.download = 'polished-product.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleReset = () => {
    setImage({ original: null, edited: null, mimeType: null });
    setPrompt("");
    setStatus(EditStatus.IDLE);
    setError(null);
    setZoomScale(1);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-4 sm:px-6">
      <header className="max-w-4xl w-full text-center mb-12">
        <div className="inline-flex items-center justify-center p-3 bg-indigo-100 rounded-2xl mb-4">
          <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight sm:text-5xl">
          Product<span className="text-indigo-600">Polish</span> AI
        </h1>
        <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
          Turn raw snapshots into studio-quality catalog shots. Just tell us what to fix, remove, or enhance.
        </p>
      </header>

      <main className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sidebar / Controls */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span className="w-6 h-6 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center text-sm">1</span>
              Upload Photo
            </h2>
            <div 
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${image.original ? 'border-indigo-200 bg-indigo-50' : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'}`}
            >
              <input 
                type="file" 
                className="hidden" 
                accept="image/*" 
                ref={fileInputRef}
                onChange={handleFileUpload} 
              />
              {image.original ? (
                <div className="flex flex-col items-center">
                  <span className="text-sm font-medium text-indigo-600 mb-1">Photo Selected</span>
                  <span className="text-xs text-gray-500">Click to change</span>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <svg className="w-10 h-10 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <p className="text-sm font-medium text-gray-600">Drop or click to upload</p>
                  <p className="text-xs text-gray-400 mt-1">PNG, JPG up to 10MB</p>
                </div>
              )}
            </div>
          </section>

          <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span className="w-6 h-6 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center text-sm">2</span>
              Instructions
            </h2>
            <div className="space-y-4">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ex: Remove background and add a clean shadow..."
                className="w-full h-32 p-3 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none transition-all"
                disabled={!image.original || status === EditStatus.PROCESSING}
              />
              <Button 
                onClick={() => processEdit()} 
                className="w-full"
                isLoading={status === EditStatus.PROCESSING}
                disabled={!image.original || !prompt}
              >
                Refine Image
              </Button>
            </div>
            
            <div className="mt-6">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Quick Actions</p>
              <div className="flex flex-wrap gap-2">
                {QUICK_ACTIONS.map((action) => (
                  <button
                    key={action.label}
                    onClick={() => {
                      setPrompt(action.prompt);
                      processEdit(action.prompt);
                    }}
                    disabled={!image.original || status === EditStatus.PROCESSING}
                    className="px-3 py-1.5 text-xs font-medium bg-gray-50 text-gray-600 border border-gray-200 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 disabled:opacity-50 transition-colors"
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {error && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3">
              <svg className="w-5 h-5 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {image.edited && (
            <div className="flex flex-col gap-3">
              <Button onClick={handleDownload} variant="primary" className="w-full">
                Download High Res
              </Button>
              <Button onClick={handleReset} variant="secondary" className="w-full">
                Start Over
              </Button>
            </div>
          )}
        </div>

        {/* Preview Area */}
        <div className="lg:col-span-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden min-h-[500px] flex flex-col">
            <div className="p-4 border-b border-gray-50 flex flex-wrap items-center justify-between gap-4">
              <span className="text-sm font-medium text-gray-500 uppercase tracking-wider">Editor Canvas</span>
              
              <div className="flex items-center gap-6">
                {(image.original || image.edited) && (
                  <div className="flex items-center gap-3 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                    </svg>
                    <input 
                      type="range" 
                      min="1" 
                      max="4" 
                      step="0.1" 
                      value={zoomScale}
                      onChange={(e) => setZoomScale(parseFloat(e.target.value))}
                      className="w-24 accent-indigo-600 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="text-[10px] font-bold text-gray-500 min-w-[35px]">{Math.round(zoomScale * 100)}%</span>
                    {zoomScale !== 1 && (
                      <button 
                        onClick={() => setZoomScale(1)}
                        className="text-[10px] text-indigo-600 font-bold hover:underline"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                )}

                {image.original && (
                   <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium">
                     <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                     Live Session
                   </div>
                )}
              </div>
            </div>
            
            <div className="flex-1 relative overflow-auto bg-gray-50/50 group flex items-center justify-center p-8">
              <div 
                className="transition-transform duration-200 ease-out flex items-center justify-center"
                style={{ 
                  transform: `scale(${zoomScale})`,
                  transformOrigin: 'center center',
                  minWidth: '100%',
                  minHeight: '100%'
                }}
              >
                {!image.original && !image.edited && (
                  <div className="text-center max-w-sm" style={{ transform: `scale(${1/zoomScale})` }}>
                    <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6">
                      <svg className="w-10 h-10 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <h3 className="text-gray-900 font-semibold mb-2">No photo selected</h3>
                    <p className="text-gray-500 text-sm">Upload a product photo to begin the AI cleanup process.</p>
                  </div>
                )}

                {image.original && !image.edited && status !== EditStatus.PROCESSING && (
                  <div className="relative">
                    <img 
                      src={image.original} 
                      alt="Original" 
                      className="max-w-full max-h-[600px] object-contain rounded-lg shadow-xl" 
                    />
                    <div 
                      className="absolute top-4 left-4 px-3 py-1 bg-white/80 backdrop-blur rounded-full text-[10px] font-bold text-gray-600 shadow-sm border border-white/40"
                      style={{ transform: `scale(${1/zoomScale})`, transformOrigin: 'top left' }}
                    >
                      ORIGINAL
                    </div>
                  </div>
                )}

                {status === EditStatus.PROCESSING && (
                  <div className="flex flex-col items-center" style={{ transform: `scale(${1/zoomScale})` }}>
                    <div className="relative mb-6">
                      <div className="w-24 h-24 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <svg className="w-10 h-10 text-indigo-600 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.673.337a4 4 0 01-2.506.326l-2.296-.459a2.25 2.25 0 00-.757 4.394l3.697.739a2.25 2.25 0 011.512 3.033l-.117.294a2.25 2.25 0 004.14 1.656l.117-.294a2.25 2.25 0 013.033-1.512l3.697.739a2.25 2.25 0 002.322-3.177l-.117-.294a2.25 2.25 0 011.512-3.033l.117-.294a2.25 2.25 0 00-1.512-3.033l-.117-.294z" />
                        </svg>
                      </div>
                    </div>
                    <p className="text-indigo-600 font-medium animate-pulse">Gemini is polishing your photo...</p>
                    <p className="text-gray-400 text-sm mt-1">Applying instructions: "{prompt}"</p>
                  </div>
                )}

                {image.edited && (
                  <div className="relative w-full flex flex-col items-center justify-center gap-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full h-full p-4">
                       <div className="relative flex items-center justify-center bg-gray-100 rounded-xl overflow-hidden">
                          <img 
                            src={image.original} 
                            alt="Before" 
                            className="max-w-full max-h-[400px] object-contain" 
                          />
                          <div 
                            className="absolute bottom-2 left-2 px-2 py-1 bg-black/50 text-white text-[10px] font-bold rounded"
                            style={{ transform: `scale(${1/zoomScale})`, transformOrigin: 'bottom left' }}
                          >
                            BEFORE
                          </div>
                       </div>
                       <div className="relative flex items-center justify-center bg-gray-100 rounded-xl overflow-hidden">
                          <img 
                            src={image.edited} 
                            alt="After" 
                            className="max-w-full max-h-[400px] object-contain shadow-2xl" 
                          />
                          <div 
                            className="absolute bottom-2 left-2 px-2 py-1 bg-indigo-600 text-white text-[10px] font-bold rounded"
                            style={{ transform: `scale(${1/zoomScale})`, transformOrigin: 'bottom left' }}
                          >
                            AFTER (AI REFINED)
                          </div>
                       </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <footer className="p-4 bg-gray-50 border-t border-gray-100">
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                    </svg>
                    Ready for 24+ global marketplaces
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-400">
                    <span className="flex items-center gap-1 text-indigo-600 font-bold">
                      Zoom: {Math.round(zoomScale * 100)}%
                    </span>
                    <span className="flex items-center gap-1">
                      <div className="w-1 h-1 bg-gray-400 rounded-full"></div> 1024px
                    </span>
                    <span className="flex items-center gap-1">
                      <div className="w-1 h-1 bg-gray-400 rounded-full"></div> PNG 24-bit
                    </span>
                  </div>
               </div>
            </footer>
          </div>
        </div>
      </main>

      <footer className="mt-20 py-8 border-t border-gray-100 w-full max-w-6xl flex flex-col items-center gap-4">
        <div className="flex gap-8 text-sm text-gray-500 font-medium">
          <a href="#" className="hover:text-indigo-600 transition-colors">Pricing</a>
          <a href="#" className="hover:text-indigo-600 transition-colors">API Docs</a>
          <a href="#" className="hover:text-indigo-600 transition-colors">Privacy</a>
          <a href="#" className="hover:text-indigo-600 transition-colors">Contact</a>
        </div>
        <p className="text-xs text-gray-400">© 2025 ProductPolish AI. Powered by Gemini 2.5 Flash Image.</p>
      </footer>
    </div>
  );
};

export default App;
