'use client'

import React, { useRef, useEffect } from 'react'
import * as twgl from "twgl.js/dist/5.x/twgl.js";
import vertexShaderSource from "./vertex.vert";
import fragmentShaderSource from "./fragment.frag";
import fragmentColorShaderSource from "./fragment-color.frag";
import { plane, texture } from "./shape";
import st from './index.module.scss'

export default function Canvas () {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  useEffect(() => {
    const canvas = canvasRef.current!
    const gl = canvas.getContext('webgl')
    if (!gl) throw Error("Canvas context not found");

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
      attachment: textures.u_framebuffer,
      attachmentPoint: gl.COLOR_ATTACHMENT0,
      level: 0
    }]
    const fb = twgl.createFramebufferInfo(gl, fbAttachments);
    
    const fb2Attachments = [{
      attachment: textures.u_framebuffersecond,
      attachmentPoint: gl.COLOR_ATTACHMENT0,
      level: 0
    }];
    const fb2 = twgl.createFramebufferInfo(gl, fb2Attachments);

    const uniforms: { [key: string]: any } = {
      u_texture: null,
      u_time: 0,
      u_timedelta: null,
      u_frame: -1,
      u_resolution: null,
    };

    let wasResized = true
    let currentWindowWidth = 0

    function onResize() {
      // workaround to prevent ios page resize events when scrolling the page
      if (currentWindowWidth !== window.innerWidth) {
        wasResized = true
        currentWindowWidth = window.innerWidth
      }
    }

    window.addEventListener('resize', onResize)
    
    const render = (time: number) => {
      if (wasResized) {
        twgl.resizeCanvasToDisplaySize(gl.canvas as HTMLCanvasElement, window.devicePixelRatio); // TODO ??
        twgl.resizeFramebufferInfo(gl, fb, fbAttachments);
        twgl.resizeFramebufferInfo(gl, fb2, fb2Attachments);
        uniforms.u_resolution = [gl.canvas.width, gl.canvas.height]
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        wasResized = false
      }
    
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
      window.removeEventListener('resize', onResize)
    }
  }, [])
  
  return (
    <div className={st["art"]}>
      <div className={st["art__wrapper"]}>
        <canvas className={st["art__canvas"]} ref={canvasRef} />
      </div>
    </div>
  )
}