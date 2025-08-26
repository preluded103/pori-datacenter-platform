'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, MapPin, Save, ArrowLeft, FileText, Image, Map } from 'lucide-react';

interface UploadedDocument {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadedAt: Date;
}

export default function NewProject() {
  const router = useRouter();
  const [projectName, setProjectName] = useState('');
  const [projectCountry, setProjectCountry] = useState('');
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [polygonPoints, setPolygonPoints] = useState<Array<{lat: number, lng: number}>>([]);
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newDocuments: UploadedDocument[] = Array.from(files).map(file => ({
      id: Math.random().toString(36),
      name: file.name,
      type: file.type,
      size: file.size,
      uploadedAt: new Date()
    }));

    setDocuments(prev => [...prev, ...newDocuments]);
  }, []);

  const removeDocument = useCallback((id: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== id));
  }, []);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type.includes('image')) return <Image className="w-4 h-4" />;
    if (type.includes('pdf')) return <FileText className="w-4 h-4" />;
    return <FileText className="w-4 h-4" />;
  };

  const handleSaveProject = async () => {
    if (!projectName.trim() || !projectCountry.trim()) {
      alert('Please fill in project name and country');
      return;
    }

    // Here you would typically save to your database
    // console.log('Saving project:', { name: projectName, country: projectCountry, documents, polygon: polygonPoints });

    // Redirect to the project summary page (mock ID for now)
    router.push(`/projects/new-project-${Date.now()}`);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-[#fafafa]">
      <div className="max-w-6xl mx-auto px-6 py-8">
        
        {/* Header */}
        <div className="flex items-center mb-8">
          <button 
            onClick={() => router.back()}
            className="mr-4 p-2 hover:bg-[#1a1a1f] rounded-md transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold">New Project Setup</h1>
            <p className="text-[#a1a1aa] mt-1">Upload documents and define site boundaries</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Left Column - Project Info & Document Upload */}
          <div className="space-y-6">
            
            {/* Project Basic Info */}
            <div className="bg-[#131316] border border-[#27272a] rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Project Information</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#a1a1aa] mb-2">
                    Project Name
                  </label>
                  <input
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="e.g., Helsinki Datacenter Site"
                    className="w-full px-4 py-2 bg-[#0a0a0b] border border-[#27272a] rounded-md text-[#fafafa] placeholder-[#71717a] focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-[#a1a1aa] mb-2">
                    Country/Region
                  </label>
                  <select
                    value={projectCountry}
                    onChange={(e) => setProjectCountry(e.target.value)}
                    className="w-full px-4 py-2 bg-[#0a0a0b] border border-[#27272a] rounded-md text-[#fafafa] focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  >
                    <option value="">Select country...</option>
                    <option value="Finland">Finland</option>
                    <option value="Sweden">Sweden</option>
                    <option value="Norway">Norway</option>
                    <option value="Denmark">Denmark</option>
                    <option value="Germany">Germany</option>
                    <option value="Netherlands">Netherlands</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Document Upload */}
            <div className="bg-[#131316] border border-[#27272a] rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Upload Documents</h2>
              
              {/* Upload Area */}
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-[#27272a] rounded-lg p-8 text-center hover:border-blue-600 transition-colors cursor-pointer"
              >
                <Upload className="w-8 h-8 mx-auto mb-4 text-[#71717a]" />
                <p className="text-[#a1a1aa] mb-2">Click to upload or drag and drop</p>
                <p className="text-sm text-[#71717a]">PDF, images, spreadsheets, documents</p>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif"
                />
              </div>

              {/* Uploaded Documents List */}
              {documents.length > 0 && (
                <div className="mt-4 space-y-2">
                  <h3 className="font-medium text-[#a1a1aa]">Uploaded Documents ({documents.length})</h3>
                  {documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-3 bg-[#1a1a1f] rounded-md">
                      <div className="flex items-center flex-1">
                        {getFileIcon(doc.type)}
                        <div className="ml-3">
                          <p className="font-medium text-sm">{doc.name}</p>
                          <p className="text-xs text-[#71717a]">{formatFileSize(doc.size)}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => removeDocument(doc.id)}
                        className="ml-2 text-red-400 hover:text-red-300 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="mt-4 p-3 bg-[#1a1a1f] rounded-md text-sm text-[#a1a1aa]">
                <p><strong>This is where the user can draw a polygon</strong></p>
                <p>needs address search button (via mapping)</p>
                <p>or if location found in the uploaded document</p>
                <p>try to geocode the Location and Show it here</p>
              </div>
            </div>
          </div>

          {/* Right Column - Map Interface */}
          <div className="bg-[#131316] border border-[#27272a] rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Site Location & Boundaries</h2>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsDrawingMode(!isDrawingMode)}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    isDrawingMode 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-[#1a1a1f] text-[#a1a1aa] hover:bg-[#27272a]'
                  }`}
                >
                  <MapPin className="w-4 h-4 mr-1 inline" />
                  Draw Mode
                </button>
              </div>
            </div>

            {/* Map Placeholder */}
            <div className="aspect-[4/3] bg-[#1a1a1f] border border-[#27272a] rounded-md flex flex-col items-center justify-center">
              <Map className="w-16 h-16 text-[#71717a] mb-4" />
              <p className="text-[#a1a1aa] mb-2">Interactive Map Interface</p>
              <p className="text-sm text-[#71717a] text-center max-w-sm">
                Search for address, zoom to location, and draw site boundaries. 
                Click points to create polygon shape.
              </p>
              
              {polygonPoints.length > 0 && (
                <div className="mt-4 text-sm">
                  <p className="text-[#a1a1aa]">Polygon points: {polygonPoints.length}</p>
                </div>
              )}
            </div>

            {/* Map Instructions */}
            <div className="mt-4 p-4 bg-[#1a1a1f] rounded-md">
              <h3 className="font-medium text-[#a1a1aa] mb-2">How to Use:</h3>
              <ul className="text-sm text-[#71717a] space-y-1">
                <li>• Search for location using address bar</li>
                <li>• Enable &quot;Draw Mode&quot; to start creating boundaries</li>
                <li>• Click on map to place polygon points</li>
                <li>• Double-click to complete the polygon</li>
                <li>• Right-click to delete the last point</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center mt-8 pt-6 border-t border-[#27272a]">
          <button
            onClick={() => router.back()}
            className="px-6 py-2 bg-[#1a1a1f] hover:bg-[#27272a] border border-[#27272a] text-[#a1a1aa] rounded-md transition-colors"
          >
            Cancel
          </button>
          
          <button
            onClick={handleSaveProject}
            disabled={!projectName.trim() || !projectCountry.trim()}
            className="flex items-center px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-[#27272a] disabled:text-[#71717a] text-white rounded-md transition-colors"
          >
            <Save className="w-4 h-4 mr-2" />
            Create Project
          </button>
        </div>
      </div>
    </div>
  );
}