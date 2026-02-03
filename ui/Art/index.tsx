'use client'

import React, { useRef, useEffect, useState } from 'react'
import * as twgl from "twgl.js/dist/7.x/twgl.js";
import vertexShaderSource from "./vertex.vert";
import fragmentShaderSource from "./fragment.frag";
import fragmentColorShaderSource from "./fragment-color.frag";
import { plane, texture } from "./shape";
import st from './index.module.scss'

type Uniform = {
  u_texture: WebGLTexture | null;
  u_time: number;
  u_timedelta: null | number;
  u_frame: number;
  u_resolution: [number, number];
}

export default function Canvas () {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [canvasDisabled, setDisabledCanvas] = useState(false)
  const [wasResized, setWasResized] = useState(false)

  useEffect(() => {
    let previousWindowWidth = window.innerWidth

    function onResize() {
      // workaround to prevent ios page resize events when scrolling the page
      if (previousWindowWidth !== window.innerWidth) {
        setWasResized(true)
        previousWindowWidth = window.innerWidth
      }

      if (window.innerWidth <= 900) {
        setDisabledCanvas(true)
      } else {
        setDisabledCanvas(false)
      }
    }

    onResize()
    window.addEventListener('resize', onResize)

    return () => {
      window.removeEventListener('resize', onResize)
    }
  }, [])
  
  useEffect(() => {
    if (canvasDisabled) return

    const canvas = canvasRef.current!
    const gl = canvas.getContext('webgl')
    if (!gl) throw Error("Canvas context not found");

    /**
     * limit multiplayer to 2, because a larger value generates too much overhead
     */
    twgl.resizeCanvasToDisplaySize(gl.canvas as HTMLCanvasElement, Math.min(2, window.devicePixelRatio));
    let animationFrameId: number

    const programInfo = twgl.createProgramInfo(gl, [
      vertexShaderSource,
      fragmentShaderSource,
    ]);
    
    const programInfoSecond = twgl.createProgramInfo(gl, [
      vertexShaderSource,
      fragmentColorShaderSource,
    ]);
    
    const bufferInfo = twgl.createBufferInfoFromArrays(gl, {
      a_position: plane,
      a_texture: texture,
    });
    
    const textures = twgl.createTextures(gl, {
      u_framebuffer: {
        width: canvas.width,
        height: canvas.height,
      },
      u_framebuffersecond: {
        width: canvas.width,
        height: canvas.height,
      }
    })
    
    const fbAttachments = [{
      attachment: textures.u_framebuffer
    }]
    const fb = twgl.createFramebufferInfo(gl, fbAttachments);
    
    const fb2Attachments = [{
      attachment: textures.u_framebuffersecond
    }];
    const fb2 = twgl.createFramebufferInfo(gl, fb2Attachments);

    const uniforms: Uniform = {
      u_texture: null,
      u_time: 0,
      u_timedelta: null,
      u_frame: -1,
      u_resolution: [gl.canvas.width, gl.canvas.height],
    };

    const render = (time: number) => {    
      uniforms.u_timedelta = uniforms.u_time ? time / 1000 - uniforms.u_time : 0
      uniforms.u_time = time / 1000
      uniforms.u_frame = (uniforms.u_frame + 1)
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
      if (uniforms.u_frame % 2 === 0) {
        twgl.bindFramebufferInfo(gl, fb)
        uniforms.u_texture = textures.u_framebuffersecond
      } else {
        twgl.bindFramebufferInfo(gl, fb2)
        uniforms.u_texture = textures.u_framebuffer
      }
    
      gl.useProgram(programInfo.program);
      twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
      twgl.setUniforms(programInfo, uniforms);
      twgl.drawBufferInfo(gl, bufferInfo);
    
      twgl.bindFramebufferInfo(gl, null)
      gl.useProgram(programInfoSecond.program);
      twgl.setBuffersAndAttributes(gl, programInfoSecond, bufferInfo);
      twgl.setUniforms(programInfoSecond, uniforms);
      twgl.drawBufferInfo(gl, bufferInfo);
    
      animationFrameId = window.requestAnimationFrame(render)
    }
    render(0)
    
    return () => {
      window.cancelAnimationFrame(animationFrameId)
    }
  }, [wasResized, canvasDisabled])
  
  return (
    <div className={st["art"]}>
      {
        canvasDisabled ?
          (
            <div className={st['art__fallback-wrapper']}>
              <video loop muted autoPlay playsInline src="/videos/art/fallback.mp4" className={st['art__fallback']} fetchpriority="high" />
            </div>
          ) : 
          (
            <div className={st["art__wrapper"]}>
              <canvas className={st["art__canvas"]} ref={canvasRef} />
            </div>
          )
      }
    </div>
  )
}