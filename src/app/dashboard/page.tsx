'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { maskPhone, formatRelativeTime } from '@/lib/utils'

type Provider = {
  id: number
  name: string
  email: string
  monthly_quota: number
  used_this_month: number
  remaining: number
}

type Lead = {
  id: number
  phone: string
  created_at: string
  service: { name: string }
  assignments: { provider: { name: string }; is_mandatory: boolean }[]
}

export default function DashboardPage() {
  const [providers, setProviders] = useState<Provider[]>([])
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState(0)

  async function fetchData() {
    const [pRes, lRes] = await Promise.all([
      fetch('/api/providers'),
      fetch('/api/leads'),
    ])
    const [p, l] = await Promise.all([pRes.json(), lRes.json()])
    setProviders(p)
    setLeads(l)
    setLoading(false)
    setLastUpdated(0)
  }

  useEffect(() => {
    fetchData()
    const dataInterval = setInterval(fetchData, 5000)
    const counterInterval = setInterval(() => setLastUpdated(s => s + 1), 1000)
    return () => {
      clearInterval(dataInterval)
      clearInterval(counterInterval)
    }
  }, [])

  const atQuota = providers.filter(p => p.remaining === 0).length
  const totalLeads = leads.length
  const totalAssignments = leads.reduce((sum, l) => sum + l.assignments.length, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Provider Dashboard</h1>
        <span className="text-sm text-slate-400">
          Last updated {lastUpdated}s ago
        </span>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Leads', value: totalLeads },
          { label: 'Total Assignments', value: totalAssignments },
          { label: 'Providers at Quota', value: atQuota },
        ].map(stat => (
          <Card key={stat.label}>
            <CardContent className="pt-6">
              <p className="text-3xl font-bold text-slate-800">{stat.value}</p>
              <p className="text-sm text-slate-500 mt-1">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Providers Table */}
      <Card>
        <CardHeader><CardTitle>Provider Quota Status</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b">
                  <th className="pb-2">Provider</th>
                  <th className="pb-2">Email</th>
                  <th className="pb-2">Used</th>
                  <th className="pb-2">Progress</th>
                  <th className="pb-2">Remaining</th>
                </tr>
              </thead>
              <tbody>
                {providers.map(p => {
                  const pct = (p.used_this_month / p.monthly_quota) * 100
                  const color = pct >= 100 ? 'bg-red-500' : pct >= 70 ? 'bg-yellow-400' : 'bg-green-500'
                  return (
                    <tr key={p.id} className="border-b last:border-0">
                      <td className="py-3 font-medium">{p.name}</td>
                      <td className="py-3 text-slate-500">{p.email}</td>
                      <td className="py-3">{p.used_this_month} / {p.monthly_quota}</td>
                      <td className="py-3 w-32">
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full ${color} rounded-full`} style={{ width: `${Math.min(pct, 100)}%` }} />
                        </div>
                      </td>
                      <td className="py-3">
                        {p.remaining === 0
                          ? <Badge variant="destructive">Full</Badge>
                          : <Badge variant="secondary">{p.remaining} left</Badge>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Recent Leads */}
      <Card>
        <CardHeader><CardTitle>Recent Leads</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : leads.length === 0 ? (
            <p className="text-slate-400 text-center py-8">No leads submitted yet — go to Submit Request to get started</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b">
                  <th className="pb-2">Phone</th>
                  <th className="pb-2">Service</th>
                  <th className="pb-2">Assigned Providers</th>
                  <th className="pb-2">Time</th>
                </tr>
              </thead>
              <tbody>
                {leads.slice(0, 20).map(lead => (
                  <tr key={lead.id} className="border-b last:border-0">
                    <td className="py-3 font-mono">{maskPhone(lead.phone)}</td>
                    <td className="py-3"><Badge variant="outline">{lead.service.name}</Badge></td>
                    <td className="py-3">
                      <div className="flex flex-wrap gap-1">
                        {lead.assignments.map((a, i) => (
                          <Badge key={i} variant={a.is_mandatory ? 'default' : 'secondary'}>
                            {a.provider.name}
                          </Badge>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 text-slate-400">{formatRelativeTime(lead.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
