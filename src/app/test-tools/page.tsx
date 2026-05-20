'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'

function uuid() { return crypto.randomUUID() }
function randomPhone() { return '+1' + Math.floor(1000000000 + Math.random() * 9000000000) }

export default function TestToolsPage() {
  const [eventId, setEventId] = useState(uuid())
  const [webhookPhone, setWebhookPhone] = useState('')
  const [webhookService, setWebhookService] = useState('')
  const [webhookResult, setWebhookResult] = useState<object | null>(null)
  const [webhookLoading, setWebhookLoading] = useState(false)

  const [idemResults, setIdemResults] = useState<object[]>([])
  const [idemLoading, setIdemLoading] = useState(false)

  const [concurrentResults, setConcurrentResults] = useState<object[]>([])
  const [concurrentLoading, setConcurrentLoading] = useState(false)

  const [resetProviderId, setResetProviderId] = useState('')
  const [resetResult, setResetResult] = useState<object | null>(null)
  const [resetLoading, setResetLoading] = useState(false)

  const [rrStates, setRrStates] = useState<{ service_id: number; pointer: number; updated_at: string }[]>([])

  useEffect(() => {
    const fetchRR = () => fetch('/api/rr-state').then(r => r.json()).then(setRrStates)
    fetchRR()
    const id = setInterval(fetchRR, 2000)
    return () => clearInterval(id)
  }, [])

  async function fireWebhook(eid: string, phone: string, serviceId: string) {
    const res = await fetch('/api/webhooks/lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event_id: eid, phone, service_id: Number(serviceId) }),
    })
    return res.json()
  }

  async function handleWebhook(e: React.FormEvent) {
    e.preventDefault()
    setWebhookLoading(true)
    const result = await fireWebhook(eventId, webhookPhone, webhookService)
    setWebhookResult(result)
    setWebhookLoading(false)
  }

  async function handleIdempotency() {
    setIdemLoading(true)
    setIdemResults([])
    const eid = uuid()
    const phone = randomPhone()
    const first = await fireWebhook(eid, phone, '1')
    const second = await fireWebhook(eid, phone, '1')
    setIdemResults([first, second])
    setIdemLoading(false)
  }

  async function handleConcurrent() {
    setConcurrentLoading(true)
    setConcurrentResults([])
    const requests = Array.from({ length: 10 }, () =>
      fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: randomPhone(), service_id: 1 }),
      }).then(r => r.json())
    )
    const results = await Promise.all(requests)
    setConcurrentResults(results)
    setConcurrentLoading(false)
  }

  async function handleResetQuota() {
    setResetLoading(true)
    setResetResult(null)
    const res = await fetch('/api/webhooks/reset-quota', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_id: uuid(),
        ...(resetProviderId ? { provider_id: Number(resetProviderId) } : {}),
      }),
    })
    setResetResult(await res.json())
    setResetLoading(false)
  }

  const serviceNames: Record<number, string> = { 1: 'Moving', 2: 'Packing', 3: 'Storage' }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Test Tools</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Panel 1 - Fire Webhook */}
        <Card>
          <CardHeader><CardTitle>Fire Webhook</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleWebhook} className="space-y-3">
              <div className="space-y-1">
                <Label>Event ID</Label>
                <div className="flex gap-2">
                  <Input value={eventId} onChange={e => setEventId(e.target.value)} className="font-mono text-xs" />
                  <Button type="button" variant="outline" onClick={() => setEventId(uuid())}>New</Button>
                </div>
              </div>
              <div className="space-y-1">
                <Label>Phone</Label>
                <div className="flex gap-2">
                  <Input value={webhookPhone} onChange={e => setWebhookPhone(e.target.value)} placeholder="+1234567890" />
                  <Button type="button" variant="outline" onClick={() => setWebhookPhone(randomPhone())}>Random</Button>
                </div>
              </div>
              <div className="space-y-1">
                <Label>Service</Label>
                <Select value={webhookService} onValueChange={setWebhookService}>
                  <SelectTrigger><SelectValue placeholder="Select service" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Moving</SelectItem>
                    <SelectItem value="2">Packing</SelectItem>
                    <SelectItem value="3">Storage</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" disabled={webhookLoading || !webhookPhone || !webhookService} className="w-full">
                {webhookLoading ? 'Firing...' : 'Fire Webhook'}
              </Button>
            </form>
            {webhookResult && (
              <pre className="mt-3 p-3 bg-slate-100 rounded text-xs overflow-auto max-h-40">
                {JSON.stringify(webhookResult, null, 2)}
              </pre>
            )}
          </CardContent>
        </Card>

        {/* Panel 2 - Idempotency Test */}
        <Card>
          <CardHeader><CardTitle>Test Idempotency</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-slate-500">Fires same event_id twice. Second call returns 200 &quot;already processed&quot;.</p>
            <Button onClick={handleIdempotency} disabled={idemLoading} className="w-full">
              {idemLoading ? 'Running...' : 'Run Idempotency Test'}
            </Button>
            {idemResults.map((r, i) => (
              <div key={i}>
                <p className="text-xs font-medium text-slate-500 mb-1">Call {i + 1}:</p>
                <pre className="p-3 bg-slate-100 rounded text-xs overflow-auto max-h-32">
                  {JSON.stringify(r, null, 2)}
                </pre>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Panel 3 - Concurrent Simulation */}
        <Card>
          <CardHeader><CardTitle>Concurrent Lead Simulation</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-slate-500">Fires 10 simultaneous lead requests. Verifies no quota violations.</p>
            <Button onClick={handleConcurrent} disabled={concurrentLoading} className="w-full">
              {concurrentLoading ? 'Running...' : 'Fire 10 Concurrent Requests'}
            </Button>
            {concurrentResults.length > 0 && (
              <div className="space-y-2">
                {concurrentResults.map((r: any, i) => (
                  <div key={i} className="p-2 bg-slate-100 rounded text-xs">
                    <span className="font-medium">Lead {i + 1}: </span>
                    {r.assignments?.map((a: any) => (
                      <Badge key={a.provider.id} variant={a.is_mandatory ? 'default' : 'secondary'} className="mr-1 text-xs">
                        {a.provider.name}
                      </Badge>
                    )) ?? <span className="text-red-500">{r.error}</span>}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Panel 4 - Reset Quota */}
        <Card>
          <CardHeader><CardTitle>Reset Provider Quota</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-slate-500">Simulates payment webhook resetting a provider&apos;s monthly quota back to 10.</p>
            <div className="space-y-1">
              <Label>Provider (leave empty to reset all)</Label>
              <Select value={resetProviderId} onValueChange={setResetProviderId}>
                <SelectTrigger><SelectValue placeholder="All providers" /></SelectTrigger>
                <SelectContent>
                  {[1,2,3,4,5,6,7,8].map(id => (
                    <SelectItem key={id} value={String(id)}>Provider {id}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleResetQuota} disabled={resetLoading} className="w-full">
              {resetLoading ? 'Resetting...' : 'Reset Quota (via Webhook)'}
            </Button>
            {resetResult && (
              <pre className="p-3 bg-slate-100 rounded text-xs overflow-auto">
                {JSON.stringify(resetResult, null, 2)}
              </pre>
            )}
          </CardContent>
        </Card>

        {/* Panel 5 - Round Robin State */}
        <Card className="md:col-span-2">
          <CardHeader><CardTitle>Round-Robin State (Live)</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-slate-500 mb-3">Persisted pointer per service — updates every 2 seconds.</p>
            <div className="grid grid-cols-3 gap-4">
              {rrStates.map(s => (
                <div key={s.service_id} className="p-4 bg-slate-100 rounded space-y-2">
                  <p className="font-medium text-sm">{serviceNames[s.service_id]} (Service {s.service_id})</p>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Pointer</span>
                    <span className="font-bold">{s.pointer}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Updated</span>
                    <span className="text-xs text-slate-400">{new Date(s.updated_at).toLocaleTimeString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
