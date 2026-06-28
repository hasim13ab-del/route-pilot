import { useState, useMemo } from 'react'
import { Package, MapPin, Navigation, BarChart3, Settings, Plus, Search, Trash2, Zap } from 'lucide-react'
import { OCRScanner, OCRResultReview } from '@/components/ocr/OCRScanner'
import { ShipmentService } from '@/services/shipment.service'
import { RouteOptimizer } from '@/services/route-optimizer'
import { ShipmentList } from '@/components/shipments/ShipmentList'
import { MapView } from '@/components/map/MapView'
import { StatsDashboard } from '@/components/stats/StatsDashboard'
import { SettingsView } from '@/components/settings/SettingsView'
import { Button } from '@/components/ui/button'
import { useLiveQuery } from 'dexie-react-hooks'
import { Shipment } from '@/types/shipment'
import { OCRResult } from '@/services/ocr/ocr.service'

function App() {
  const [activeTab, setActiveTab] = useState('shipments')
  const [showScanner, setShowScanner] = useState(false)
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null)
  const [search, setSearch] = useState('')

  const liveShipments = useLiveQuery(() => ShipmentService.getAll())
  const shipments = useMemo(() => liveShipments || [], [liveShipments])
  const filtered = useMemo(() => shipments.filter(s =>
    s.customerName.toLowerCase().includes(search.toLowerCase()) ||
    (s.awb && s.awb.toLowerCase().includes(search.toLowerCase())) ||
    s.phone.includes(search)
  ), [shipments, search])

  const handleOptimize = async () => {
    const optimized = await RouteOptimizer.optimize(shipments)
    await ShipmentService.updateOrder(optimized.map(s => s.id!))
  }

  const handleConfirmOCR = async (extractedShipments: Shipment[]) => {
    // Offset order index by current length
    const shipmentsWithIndices = extractedShipments.map((s, i) => ({
      ...s,
      orderIndex: shipments.length + i
    }))
    await ShipmentService.addMany(shipmentsWithIndices)
    setOcrResult(null)
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-16">
      <header className="bg-white border-b px-4 py-3 sticky top-0 z-10 flex justify-between items-center">
        <h1 className="text-xl font-bold text-primary flex items-center gap-2">
          <Navigation className="w-6 h-6" />
          RoutePilot
        </h1>
        <div className="flex gap-2">
          {activeTab === 'shipments' && shipments.length > 0 && (
            <>
              <Button variant="outline" size="sm" onClick={handleOptimize}>
                <Zap className="w-4 h-4 mr-1" />
                Optimize
              </Button>
              <Button variant="ghost" size="icon" onClick={() => ShipmentService.deleteAll()}>
                <Trash2 className="w-5 h-5" />
              </Button>
            </>
          )}
          {activeTab === 'shipments' && !showScanner && !ocrResult && (
            <Button size="sm" onClick={() => setShowScanner(true)}>
              <Plus className="w-4 h-4 mr-1" />
              Add
            </Button>
          )}
        </div>
      </header>

      <main className="flex-1 p-4">
        {activeTab === 'shipments' && (
          <div className="space-y-4">
            {showScanner ? (
              <OCRScanner onResult={(res) => { setOcrResult(res); setShowScanner(false); }} />
            ) : ocrResult ? (
              <OCRResultReview
                result={ocrResult}
                onConfirm={handleConfirmOCR}
                onCancel={() => setOcrResult(null)}
              />
            ) : (
              <>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search name, AWB, phone..."
                    className="w-full pl-10 pr-4 py-2 border rounded-lg"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>
                <ShipmentList
                  shipments={filtered}
                  onStatusChange={(id: number, s: Shipment['status']) => ShipmentService.update(id, {status:s})}
                  onDelete={(id: number) => ShipmentService.delete(id)}
                  onReorder={(ids: number[]) => ShipmentService.updateOrder(ids)}
                />
              </>
            )}
          </div>
        )}
        {activeTab === 'map' && <MapView shipments={shipments} />}
        {activeTab === 'stats' && <StatsDashboard shipments={shipments} />}
        {activeTab === 'settings' && <SettingsView />}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around items-center h-16">
        <button onClick={() => setActiveTab('shipments')} className={activeTab === 'shipments' ? 'text-primary' : 'text-slate-400'}><Package /></button>
        <button onClick={() => setActiveTab('map')} className={activeTab === 'map' ? 'text-primary' : 'text-slate-400'}><MapPin /></button>
        <button onClick={() => setActiveTab('stats')} className={activeTab === 'stats' ? 'text-primary' : 'text-slate-400'}><BarChart3 /></button>
        <button onClick={() => setActiveTab('settings')} className={activeTab === 'settings' ? 'text-primary' : 'text-slate-400'}><Settings /></button>
      </nav>
    </div>
  )
}

export default App
