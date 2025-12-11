'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface LogoProps {
  className?: string
  showText?: boolean
}

export function Logo({ className, showText = false }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <svg
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        {/* Círculo principal completo */}
        <circle
          cx="60"
          cy="60"
          r="50"
          stroke="currentColor"
          strokeWidth="8"
          fill="none"
        />
        
        {/* Linha de pulso/heartbeat - maior e mais visível */}
        <path
          d="M 25 55 L 35 55 L 42 35 L 50 75 L 58 45 L 65 55 L 80 55"
          stroke="currentColor"
          strokeWidth="7"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Carrinho de compras - bem maior */}
        <g>
          {/* Cesto/base do carrinho */}
          <path
            d="M 35 70 L 42 70 L 48 90 L 75 90 L 69 70 Z"
            stroke="currentColor"
            strokeWidth="6"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Rodas do carrinho - maiores */}
          <circle cx="50" cy="100" r="5" fill="currentColor" />
          <circle cx="70" cy="100" r="5" fill="currentColor" />
        </g>
        
        {/* Badge de alerta no canto superior direito - maior */}
        <g>
          <circle cx="95" cy="25" r="20" fill="currentColor" />
          <circle cx="95" cy="25" r="17" fill="white" />
          <circle cx="95" cy="25" r="14" fill="currentColor" />
          {/* Exclamação - maior e mais visível */}
          <line x1="95" y1="17" x2="95" y2="27" stroke="white" strokeWidth="4" strokeLinecap="round" />
          <circle cx="95" cy="31" r="2" fill="white" />
        </g>
      </svg>
      
      {showText && (
        <span className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
          PulseWatch
        </span>
      )}
    </div>
  )
}

export function LogoIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("w-6 h-6", className)}
    >
      {/* Círculo principal completo */}
      <circle
        cx="60"
        cy="60"
        r="50"
        stroke="currentColor"
        strokeWidth="8"
        fill="none"
      />
      
      {/* Linha de pulso/heartbeat - maior e mais visível */}
      <path
        d="M 25 55 L 35 55 L 42 35 L 50 75 L 58 45 L 65 55 L 80 55"
        stroke="currentColor"
        strokeWidth="7"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      {/* Carrinho de compras - bem maior */}
      <g>
        {/* Cesto/base do carrinho */}
        <path
          d="M 35 70 L 42 70 L 48 90 L 75 90 L 69 70 Z"
          stroke="currentColor"
          strokeWidth="6"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Rodas do carrinho - maiores */}
        <circle cx="50" cy="100" r="5" fill="currentColor" />
        <circle cx="70" cy="100" r="5" fill="currentColor" />
      </g>
      
      {/* Badge de alerta no canto superior direito - maior */}
      <g>
        <circle cx="95" cy="25" r="20" fill="currentColor" />
        <circle cx="95" cy="25" r="17" fill="white" />
        <circle cx="95" cy="25" r="14" fill="currentColor" />
        {/* Exclamação - maior e mais visível */}
        <line x1="95" y1="17" x2="95" y2="27" stroke="white" strokeWidth="4" strokeLinecap="round" />
        <circle cx="95" cy="31" r="2" fill="white" />
      </g>
    </svg>
  )
}
