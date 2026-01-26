import { ImageResponse } from 'next/og'

// Route segment config
export const runtime = 'edge'

// Image metadata
export const size = {
  width: 32,
  height: 32,
}

export const contentType = 'image/png'

// Image generation
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        {/* RGB offset layers */}
        <div
          style={{
            position: 'absolute',
            width: '24px',
            height: '24px',
            left: '6px',
            top: '6px',
            background: '#E63946',
          }}
        />
        <div
          style={{
            position: 'absolute',
            width: '24px',
            height: '24px',
            left: '5px',
            top: '5px',
            background: '#2E86AB',
          }}
        />
        <div
          style={{
            position: 'absolute',
            width: '24px',
            height: '24px',
            left: '4px',
            top: '4px',
            background: '#FFD600',
          }}
        />

        {/* Main square with V */}
        <div
          style={{
            position: 'absolute',
            width: '24px',
            height: '24px',
            left: '4px',
            top: '4px',
            background: 'white',
            border: '2px solid black',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
            fontWeight: 900,
            fontFamily: 'serif',
          }}
        >
          V
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
