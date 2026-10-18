import React from 'react'

export default function CreateTournamentLoading() {
  return (
    <div className="create-tournament-page">
      <div className="create-tournament-container animate-pulse">
        <div style={{ width: '120px', height: '20px', background: '#222', borderRadius: '4px', marginBottom: '16px' }} />
        <div style={{ width: '340px', height: '36px', background: '#222', borderRadius: '6px', marginBottom: '10px' }} />
        <div style={{ width: '500px', height: '18px', background: '#1c1c1c', borderRadius: '4px', marginBottom: '32px' }} />

        <div className="form-card-section" style={{ height: '220px', background: '#141414', borderColor: '#222' }} />
        <div className="form-card-section" style={{ height: '280px', background: '#141414', borderColor: '#222' }} />
        <div className="form-card-section" style={{ height: '200px', background: '#141414', borderColor: '#222' }} />
      </div>
    </div>
  )
}
