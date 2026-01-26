import { ImageResponse } from 'next/og'

// Route segment config
export const runtime = 'edge'

// Image metadata
export const size = {
  width: 180,
  height: 180,
}

export const contentType = 'image/png'

// Image generation
export default function AppleIcon() {
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
          background: 'white',
        }}
      >
        {/* RGB offset layers */}
        <div
          style={{
            position: 'absolute',
            width: '108px',
            height: '108px',
            left: '46px',
            top: '46px',
            background: '#E63946',
          }}
        />
        <div
          style={{
            position: 'absolute',
            width: '108px',
            height: '108px',
            left: '43px',
            top: '43px',
            background: '#2E86AB',
          }}
        />
        <div
          style={{
            position: 'absolute',
            width: '108px',
            height: '108px',
            left: '40px',
            top: '40px',
            background: '#FFD600',
          }}
        />

        {/* Main square with V */}
        <div
          style={{
            position: 'absolute',
            width: '108px',
            height: '108px',
            left: '37px',
            top: '37px',
            background: 'white',
            border: '5px solid black',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '72px',
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
