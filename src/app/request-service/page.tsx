'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'

type Assignment = {
  provider: { name: string }
  is_mandatory: boolean
}

type Lead = {
  id: number
  phone: string
  service: { name: string }
  assignments: Assignment[]
}

export default function RequestServicePage() {
  const [phone, setPhone] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [serviceId, setServiceId] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState<Lead | null>(null)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(null)

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone,
          service_id: Number(serviceId),
          customer_name: customerName,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Something went wrong')
      } else {
        setSuccess(data)
        setPhone('')
        setCustomerName('')
        setServiceId('')
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Submit a Service Request</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="name">Your Name (optional)</Label>
              <Input
                id="name"
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                placeholder="John Doe"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+1 234 567 8900"
                required
              />
            </div>
            <div className="space-y-1">
              <Label>Service Type *</Label>
              <Select value={serviceId} onValueChange={setServiceId} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select a service" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Moving Service</SelectItem>
                  <SelectItem value="2">Packing Service</SelectItem>
                  <SelectItem value="3">Storage Service</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" disabled={loading || !phone || !serviceId} className="w-full">
              {loading ? 'Submitting...' : 'Submit Request'}
            </Button>
          </form>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded">
              <p className="text-green-800 font-medium mb-3">
                Request submitted! Assigned to {success.assignments.length} providers:
              </p>
              <div className="space-y-2">
                {success.assignments.map((a, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-sm text-slate-700">{a.provider.name}</span>
                    <Badge variant={a.is_mandatory ? 'default' : 'secondary'}>
                      {a.is_mandatory ? 'Mandatory' : 'Round-Robin'}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
