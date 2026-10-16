import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import { useReportsStore } from '../../stores/reportsStore'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import confetti from 'canvas-confetti'

const CATEGORIES = [
  { id: 'pothole', label: 'Pothole/Road damage', icon: '🕳️', color: 'orange' },
  { id: 'flooding', label: 'Flooding/Waterlogging', icon: '💧', color: 'blue' },
  { id: 'drainage', label: 'Drainage', icon: '🚰', color: 'cyan' },
  { id: 'streetlight', label: 'Streetlight', icon: '💡', color: 'yellow' },
  { id: 'traffic', label: 'Traffic/Signal', icon: '🚦', color: 'red' },
  { id: 'pedestrian', label: 'Pedestrian safety', icon: '🚶', color: 'green' },
  { id: 'garbage', label: 'Garbage', icon: '🗑️', color: 'gray' },
  { id: 'other', label: 'Other', icon: '📋', color: 'purple' },
]

export default function ReportNew() {
  const [step, setStep] = useState(1)
  const [photos, setPhotos] = useState<string[]>([])
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [locationName, setLocationName] = useState('')
  const [loading, setLoading] = useState(false)
  const [suggestedCategory, setSuggestedCategory] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<L.Map | null>(null)
  const markerRef = useRef<L.Marker | null>(null)

  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const createReport = useReportsStore((state) => state.createReport)

  // Auto-capture GPS or read location param from QR scan
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const locId = params.get('location')
    if (locId) {
      const knownLocations: Record<string, { lat: number; lng: number; name: string }> = {
        L0362: { lat: 16.516403, lng: 80.46389, name: 'MG Road Junction (L0362)' },
        L0521: { lat: 16.527, lng: 80.472, name: 'Park Street Crossing (L0521)' },
        L0734: { lat: 16.505, lng: 80.488, name: 'College Road (L0734)' },
      }
      if (knownLocations[locId]) {
        setLocation({ lat: knownLocations[locId].lat, lng: knownLocations[locId].lng })
        setLocationName(knownLocations[locId].name)
        return
      }
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          }
          setLocation(coords)
          // Reverse geocode using Nominatim
          fetch(`https://nominatim.openstreetmap.org/reverse?lat=${coords.lat}&lon=${coords.lng}&format=json`)
            .then(r => r.json())
            .then(data => {
              if (data.display_name) {
                const parts = data.display_name.split(',')
                setLocationName(parts.slice(0, 3).join(',').trim())
              }
            })
            .catch(() => {
              setLocationName(`Near ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`)
            })
        },
        () => {
          // GPS failed, use default (Vijayawada)
          setLocation({ lat: 16.516, lng: 80.464 })
          setLocationName('Vijayawada City Center')
        },
        { enableHighAccuracy: true, timeout: 5000 }
      )
    } else {
      setLocation({ lat: 16.516, lng: 80.464 })
      setLocationName('Vijayawada City Center')
    }
  }, [])

  // Initialize Leaflet map on step 3
  useEffect(() => {
    if (step !== 3 || !mapRef.current || !location) return

    // Destroy previous map if it exists
    if (mapInstance.current) {
      mapInstance.current.remove()
      mapInstance.current = null
      markerRef.current = null
    }

    const map = L.map(mapRef.current, { zoomControl: false }).setView(
      [location.lat, location.lng],
      16
    )

    L.control.zoom({ position: 'topright' }).addTo(map)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
      maxZoom: 19,
    }).addTo(map)

    // Draggable marker
    const markerIcon = L.divIcon({
      className: 'custom-location-marker',
      html: `
        <div style="
          width: 48px; height: 48px;
          background: #3b82f6;
          border: 4px solid white;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 4px 12px rgba(0,0,0,0.4);
          animation: bounce 0.5s ease;
        ">
          <span style="transform: rotate(45deg); font-size: 22px;">📍</span>
        </div>
      `,
      iconSize: [48, 48],
      iconAnchor: [24, 48],
    })

    const marker = L.marker([location.lat, location.lng], {
      icon: markerIcon,
      draggable: true,
    }).addTo(map)

    marker.on('dragend', () => {
      const pos = marker.getLatLng()
      setLocation({ lat: pos.lat, lng: pos.lng })
      // Reverse geocode new position
      fetch(`https://nominatim.openstreetmap.org/reverse?lat=${pos.lat}&lon=${pos.lng}&format=json`)
        .then(r => r.json())
        .then(data => {
          if (data.display_name) {
            const parts = data.display_name.split(',')
            setLocationName(parts.slice(0, 3).join(',').trim())
          }
        })
        .catch(() => {
          setLocationName(`Near ${pos.lat.toFixed(4)}, ${pos.lng.toFixed(4)}`)
        })
    })

    // Click on map to move marker
    map.on('click', (e: L.LeafletMouseEvent) => {
      marker.setLatLng(e.latlng)
      setLocation({ lat: e.latlng.lat, lng: e.latlng.lng })
      fetch(`https://nominatim.openstreetmap.org/reverse?lat=${e.latlng.lat}&lon=${e.latlng.lng}&format=json`)
        .then(r => r.json())
        .then(data => {
          if (data.display_name) {
            const parts = data.display_name.split(',')
            setLocationName(parts.slice(0, 3).join(',').trim())
          }
        })
        .catch(() => {})
    })

    markerRef.current = marker
    mapInstance.current = map

    // Invalidate size after render
    setTimeout(() => map.invalidateSize(), 100)

    return () => {
      map.remove()
      mapInstance.current = null
      markerRef.current = null
    }
  }, [step, location?.lat, location?.lng])

  // ML category suggestion
  useEffect(() => {
    if (description.length > 20) {
      const keywords: Record<string, string[]> = {
        pothole: ['hole', 'crack', 'damage', 'road', 'pothole', 'bump'],
        flooding: ['water', 'flood', 'rain', 'waterlog'],
        streetlight: ['light', 'dark', 'lamp', 'streetlight'],
        drainage: ['drain', 'sewer', 'block', 'pipe'],
        traffic: ['traffic', 'signal', 'jam'],
        garbage: ['garbage', 'waste', 'trash', 'dump'],
        pedestrian: ['walk', 'pedestrian', 'footpath', 'sidewalk'],
      }

      for (const [cat, words] of Object.entries(keywords)) {
        if (words.some(word => description.toLowerCase().includes(word))) {
          setSuggestedCategory(cat)
          break
        }
      }
    }
  }, [description])

function compressImage(file: File, maxWidth = 1200, quality = 0.75): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width)
          width = maxWidth
        }
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx?.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      img.onerror = () => resolve((e.target?.result as string) || '')
      img.src = (e.target?.result as string) || ''
    }
    reader.onerror = () => resolve('')
    reader.readAsDataURL(file)
  })
}

  const handlePhotoCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    for (const file of files) {
      const compressed = await compressImage(file)
      if (compressed) {
        setPhotos((prev) => (prev.length < 4 ? [...prev, compressed] : prev))
      }
    }
  }

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    if (!category || photos.length === 0) {
      alert('Please add at least one photo and select a category')
      return
    }

    setLoading(true)
    try {
      await createReport({
        category,
        description,
        photos,
        latitude: location?.lat || 16.5,
        longitude: location?.lng || 80.5,
        location_name: locationName,
        zone: 'ZONE_05',
        citizen_id: user?.id || 'U001',
        citizen_name: user?.name || 'Demo Citizen',
        citizen_trust_score: user?.trust_score || 85,
        severity: 'Medium',
        ml_score: 75 + Math.random() * 20,
        ml_confidence: 85 + Math.random() * 10,
        ml_suggested_category: suggestedCategory || category,
      })

      // Confetti animation!
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      })

      // Update user coins
      useAuthStore.getState().updateUser({
        civic_coins: (user?.civic_coins || 0) + 10,
        reports_count: (user?.reports_count || 0) + 1,
      })

      // Show success screen
      setStep(4)

      // Navigate after delay
      setTimeout(() => {
        navigate('/reports')
      }, 3000)
    } catch (error) {
      alert('Failed to submit report')
    } finally {
      setLoading(false)
    }
  }

  if (step === 4) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center animate-slide-up">
          <div className="text-8xl mb-6 animate-bounce-subtle">🎉</div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Report Submitted!
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Your contribution makes the city better
          </p>
          <div className="inline-block px-6 py-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-full mb-6">
            <span className="text-2xl mr-2">🪙</span>
            <span className="text-xl font-bold text-yellow-700 dark:text-yellow-400">
              +10 CivicCoins
            </span>
          </div>
          <p className="text-sm text-gray-500">
            Redirecting to your reports...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 pb-24">
      <div className="max-w-2xl mx-auto">
        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-6 gap-2">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div className={`
                w-10 h-10 rounded-full flex items-center justify-center font-bold transition
                ${step >= s
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                }
              `}>
                {s}
              </div>
              {s < 3 && (
                <div className={`w-12 h-1 ${step > s ? 'bg-blue-500' : 'bg-gray-200 dark:bg-gray-700'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Photos */}
        {step === 1 && (
          <div className="animate-slide-up">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              📸 Capture the Issue
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Take clear photos showing the problem (up to 4)
            </p>

            {/* Photo Grid */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              {photos.map((photo, index) => (
                <div key={index} className="relative aspect-square rounded-xl overflow-hidden group">
                  <img src={photo} alt={`Photo ${index + 1}`} className="w-full h-full object-cover" />
                  <button
                    onClick={() => removePhoto(index)}
                    className="absolute top-2 right-2 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition flex items-center justify-center"
                  >
                    ✕
                  </button>
                </div>
              ))}

              {photos.length < 4 && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-square border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl flex flex-col items-center justify-center hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition"
                >
                  <span className="text-4xl mb-2">📷</span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Add Photo</span>
                </button>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              multiple
              onChange={handlePhotoCapture}
              className="hidden"
            />

            <button
              onClick={() => setStep(2)}
              disabled={photos.length === 0}
              className="w-full py-4 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              Next: Select Category
            </button>
          </div>
        )}

        {/* Step 2: Category & Description */}
        {step === 2 && (
          <div className="animate-slide-up">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              📋 What's the Issue?
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Help us understand the problem better
            </p>

            {/* Category Chips */}
            <div className="mb-6">
              <label className="block font-semibold text-gray-900 dark:text-white mb-3">
                Category {suggestedCategory && (
                  <span className="ml-2 text-sm font-normal text-blue-500">
                    (AI suggests: {CATEGORIES.find(c => c.id === suggestedCategory)?.label})
                  </span>
                )}
              </label>
              <div className="grid grid-cols-2 gap-3">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setCategory(cat.id)}
                    className={`
                      p-4 rounded-xl border-2 transition text-left
                      ${category === cat.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                      }
                      ${suggestedCategory === cat.id && category !== cat.id
                        ? 'ring-2 ring-blue-300 dark:ring-blue-700 animate-pulse'
                        : ''
                      }
                    `}
                  >
                    <span className="text-2xl mb-1 block">{cat.icon}</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {cat.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="mb-6">
              <label className="block font-semibold text-gray-900 dark:text-white mb-2">
                Description (optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tell us more about the issue..."
                rows={4}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 py-4 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!category}
                className="flex-1 py-4 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                Next: Location
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Location & Submit */}
        {step === 3 && (
          <div className="animate-slide-up">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              📍 Location
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Drag the marker or tap the map to set exact location
            </p>

            {/* Location Info */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-4">
              {location ? (
                <div>
                  <div className="flex items-start gap-3 mb-3">
                    <span className="text-3xl">📍</span>
                    <div className="flex-1">
                      <input
                        type="text"
                        value={locationName}
                        onChange={(e) => setLocationName(e.target.value)}
                        placeholder="Location name..."
                        className="w-full font-semibold text-gray-900 dark:text-white bg-transparent border-b border-gray-200 dark:border-gray-700 focus:border-blue-500 outline-none pb-1 mb-1"
                      />
                      <p className="text-sm text-gray-500">
                        {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                      </p>
                    </div>
                    <span className="text-green-500 text-xl">✓</span>
                  </div>
                  {/* Map */}
                  <div
                    ref={mapRef}
                    className="h-56 rounded-lg overflow-hidden"
                    style={{ zIndex: 0 }}
                  />
                  <p className="text-xs text-gray-400 mt-2 text-center">
                    💡 Tap or drag the pin to adjust location
                  </p>
                </div>
              ) : (
                <div className="text-center py-8">
                  <span className="text-4xl mb-2 block animate-pulse">📡</span>
                  <p className="text-gray-500">Getting your location...</p>
                </div>
              )}
            </div>

            {/* Summary */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 mb-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Photos:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{photos.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Category:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {CATEGORIES.find(c => c.id === category)?.label}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Location:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {location ? '✓ Captured' : 'Getting...'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Reward:</span>
                  <span className="font-medium text-yellow-600 dark:text-yellow-400">
                    🪙 +10 CivicCoins
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(2)}
                className="flex-1 py-4 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading || !location}
                className="flex-1 py-4 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Submitting...
                  </>
                ) : (
                  <>
                    <span>🚀</span>
                    Submit Report
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
