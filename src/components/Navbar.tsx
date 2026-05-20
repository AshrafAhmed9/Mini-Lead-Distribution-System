'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  { href: '/request-service', label: 'Submit Request' },
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/test-tools', label: 'Test Tools' },
]

export default function Navbar() {
  const pathname = usePathname()

  return (
    <nav className="border-b bg-white sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <span className="font-bold text-xl text-slate-800">Prowider</span>
        <div className="flex gap-6">
          {links.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-medium transition-colors ${
                pathname === link.href
                  ? 'text-slate-900 border-b-2 border-slate-900 pb-1'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  )
}
