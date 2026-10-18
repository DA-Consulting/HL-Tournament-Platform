import React from 'react'

export default function TournamentsLoading() {
  return (
    <div className="tournaments-page">
      <div className="tournaments-container">
        {/* Header Skeleton */}
        <div className="tournaments-header animate-pulse">
          <div>
            <div
              style={{
                width: '140px',
                height: '24px',
                background: '#222',
                borderRadius: '4px',
                marginBottom: '10px',
              }}
            />
            <div
              style={{
                width: '320px',
                height: '40px',
                background: '#222',
                borderRadius: '6px',
                marginBottom: '10px',
              }}
            />
            <div
              style={{
                width: '480px',
                height: '18px',
                background: '#1a1a1a',
                borderRadius: '4px',
              }}
            />
          </div>
          <div
            style={{
              width: '180px',
              height: '46px',
              background: '#2a2a2a',
              borderRadius: '6px',
            }}
          />
        </div>

        {/* Filter Box Skeleton */}
        <div
          className="tournaments-filter-box animate-pulse"
          style={{ height: '140px', background: '#141414', border: '1px solid #222' }}
        />

        {/* List Items Skeleton */}
        <div className="tournaments-list-wrapper">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="tournament-row-item animate-pulse"
              style={{
                background: '#141414',
                borderColor: '#1f1f1f',
                minHeight: '104px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flex: 1 }}>
                <div
                  style={{
                    width: '120px',
                    height: '80px',
                    borderRadius: '6px',
                    background: '#222',
                    flexShrink: 0,
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '8px' }}>
                    <div style={{ width: '80px', height: '20px', background: '#252525', borderRadius: '4px' }} />
                    <div style={{ width: '100px', height: '20px', background: '#252525', borderRadius: '4px' }} />
                  </div>
                  <div style={{ width: '60%', height: '24px', background: '#252525', borderRadius: '4px', marginBottom: '8px' }} />
                  <div style={{ width: '40%', height: '16px', background: '#1c1c1c', borderRadius: '4px' }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                <div style={{ width: '100px', height: '36px', background: '#222', borderRadius: '4px' }} />
                <div style={{ width: '120px', height: '36px', background: '#222', borderRadius: '4px' }} />
                <div style={{ width: '120px', height: '40px', background: '#252525', borderRadius: '6px' }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
