import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Scan() {
  const navigate = useNavigate()
  const [isScanning, setIsScanning] = useState(false)
  const [scannedAsset, setScannedAsset] = useState<string | null>(null)

  const demoAssets = [
    { id: 'L0362', name: 'MG Road Junction', zone: 'ZONE_05', type: 'Pothole & Road Sensor Tag' },
    { id: 'L0521', name: 'Park Street Crossing', zone: 'ZONE_15', type: 'Streetlight Pole #42' },
    { id: 'L0734', name: 'College Road Stormwater', zone: 'ZONE_18', type: 'Drainage Grate #12' },
  ]

  const handleSimulateScan = (assetId: string) => {
    setIsScanning(true)
    setScannedAsset(assetId)
    setTimeout(() => {
      setIsScanning(false)
      navigate(`/report?location=${assetId}`)
    }, 1200)
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-4 pb-24 text-white">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-6">
          <span className="text-5xl mb-2 block">📷</span>
          <h2 className="text-2xl font-bold mb-1">Smart Asset QR Scanner</h2>
          <p className="text-gray-400 text-xs">
            Point your camera at QR codes on streetlights, manholes, or bus stops
          </p>
        </div>

        {/* Camera Viewfinder View */}
        <div className="relative aspect-square bg-gray-900 rounded-3xl border-2 border-gray-700 overflow-hidden shadow-2xl flex items-center justify-center mb-6">
          {/* Target reticle corners */}
          <div className="absolute top-6 left-6 w-8 h-8 border-t-4 border-l-4 border-blue-500 rounded-tl-lg" />
          <div className="absolute top-6 right-6 w-8 h-8 border-t-4 border-r-4 border-blue-500 rounded-tr-lg" />
          <div className="absolute bottom-6 left-6 w-8 h-8 border-b-4 border-l-4 border-blue-500 rounded-bl-lg" />
          <div className="absolute bottom-6 right-6 w-8 h-8 border-b-4 border-r-4 border-blue-500 rounded-br-lg" />

          {/* Animated Laser line */}
          <div className="absolute inset-x-8 top-1/2 h-0.5 bg-gradient-to-r from-transparent via-red-500 to-transparent shadow-[0_0_12px_#ef4444] animate-pulse" />

          <div className="text-center z-10 px-6">
            {isScanning ? (
              <div className="space-y-2">
                <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-blue-400 text-sm font-semibold">Decoded asset: {scannedAsset}...</p>
                <p className="text-gray-500 text-xs">Opening report with geolocation prefilled</p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-gray-300 font-semibold text-sm">Align QR code within frame</p>
                <p className="text-gray-500 text-xs">
                  Camera automatically detects city infrastructure asset tags
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Demo Asset QR Codes */}
        <div className="bg-gray-900 rounded-2xl p-5 mb-6 border border-gray-800">
          <p className="text-xs uppercase tracking-wider text-gray-400 font-semibold mb-3">
            Quick Test: Scan Demo Smart Asset Tags
          </p>
          <div className="space-y-2">
            {demoAssets.map((asset) => (
              <button
                key={asset.id}
                onClick={() => handleSimulateScan(asset.id)}
                disabled={isScanning}
                className="w-full flex items-center justify-between p-3 bg-gray-800 hover:bg-gray-700/80 active:scale-98 text-left rounded-xl transition border border-gray-700"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded">
                      {asset.id}
                    </span>
                    <span className="font-semibold text-sm text-gray-200">{asset.name}</span>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-0.5">{asset.type} • {asset.zone}</p>
                </div>
                <span className="text-xs text-blue-400 font-semibold flex items-center gap-1">
                  Scan →
                </span>
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => navigate('/')}
          className="w-full py-3.5 bg-gray-800 hover:bg-gray-700 text-gray-200 font-semibold rounded-2xl transition text-sm"
        >
          Back to Home
        </button>
      </div>
    </div>
  )
}
