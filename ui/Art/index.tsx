import React, { useRef, useEffect } from 'react'

export default function Canvas () {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  useEffect(() => {
    const canvas = canvasRef.current!
    const context = canvas.getContext('webgl')
    let frameCount = 0
    let animationFrameId: number
    
    const render = () => {
      frameCount++
      animationFrameId = window.requestAnimationFrame(render)
    }
    render()
    
    return () => {
      window.cancelAnimationFrame(animationFrameId)
    }
  }, [])
  
  return <canvas ref={canvasRef} />
}