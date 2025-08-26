import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0a0a0b] text-[#fafafa]">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-6">
            Pre-DD Intelligence Platform
          </h1>
          <p className="text-xl text-[#a1a1aa] mb-8">
            Advanced datacenter site analysis and geospatial intelligence
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <Link 
              href="/demo" 
              className="p-6 bg-[#131316] border border-[#27272a] rounded-lg hover:bg-[#1a1a1f] transition-colors"
            >
              <h2 className="text-xl font-semibold mb-3">Site Analysis Demo</h2>
              <p className="text-[#a1a1aa]">
                Explore comprehensive site assessment for Pori datacenter location
              </p>
            </Link>
            
            <Link 
              href="/geospatial-demo" 
              className="p-6 bg-[#131316] border border-[#27272a] rounded-lg hover:bg-[#1a1a1f] transition-colors"
            >
              <h2 className="text-xl font-semibold mb-3">Geospatial Platform</h2>
              <p className="text-[#a1a1aa]">
                Maximum data density mapping with European national services
              </p>
            </Link>
            
            <Link 
              href="/projects" 
              className="p-6 bg-[#131316] border border-[#27272a] rounded-lg hover:bg-[#1a1a1f] transition-colors"
            >
              <h2 className="text-xl font-semibold mb-3">Project Management</h2>
              <p className="text-[#a1a1aa]">
                Full project lifecycle management and reporting
              </p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}