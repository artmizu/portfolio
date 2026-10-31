'use client';

import { useEffect, useRef } from 'react';
import fragmentShaderSource from './fragment.frag';
import fragmentColorShaderSource from './fragment-color.frag';
import {
  type BufferInfo,
  bindFramebufferInfo,
  createBufferInfoFromArrays,
  createFramebufferInfo,
  createProgramInfo,
  createTextures,
  drawBufferInfo,
  type FramebufferInfo,
  type ProgramInfo,
  resizeCanvasToDisplaySize,
  setBuffersAndAttributes,
  setUniforms,
} from './gl';
import st from './index.module.scss';
import { plane, texture } from './shape';
import vertexShaderSource from './vertex.vert';

type Uniform = {
  u_texture: WebGLTexture | null;
  u_time: number;
  u_timedelta: null | number;
  u_frame: number;
  u_resolution: [number, number];
};

type Programs = {
  programInfo: ProgramInfo;
  programInfoSecond: ProgramInfo;
  bufferInfo: BufferInfo;
};

type Targets = {
  textures: Record<string, WebGLTexture>;
  fb: FramebufferInfo;
  fb2: FramebufferInfo;
};

const NARROW_VIEWPORT_MAX_WIDTH = 900;
const NARROW_VIEWPORT_FPS = 30;
const WIDE_VIEWPORT_FPS = 60;
const RESIZE_DEBOUNCE_MS = 250;
const MAX_FRAME_DELTA_S = 0.1;
const IDLE_SETUP_TIMEOUT_MS = 200;

type IdleWindow = Window & {
  requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
  cancelIdleCallback?: (handle: number) => void;
};

export default function Canvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrapper = wrapperRef.current;
    if (!(canvas && wrapper)) return;

    const context = canvas.getContext('webgl');
    if (!context) return;
    const gl: WebGLRenderingContext = context;

    const uniforms: Uniform = {
      u_texture: null,
      u_time: 0,
      u_timedelta: null,
      u_frame: -1,
      u_resolution: [0, 0],
    };

    let programs: Programs | null = null;
    let targets: Targets | null = null;
    let animationFrameId: number | null = null;
    let idleSetupId: number | null = null;
    let timeoutSetupId: ReturnType<typeof setTimeout> | null = null;
    let resizeTimeoutId: ReturnType<typeof setTimeout> | null = null;
    let previousWindowWidth = window.innerWidth;
    let visible = false;
    let lastFrameTime: number | null = null;
    let elapsedTime = 0;

    function createTargets(): Targets {
      resizeCanvasToDisplaySize(gl.canvas as HTMLCanvasElement, Math.min(1, window.devicePixelRatio));

      const textures = createTextures(gl, {
        u_framebuffer: {
          width: gl.canvas.width,
          height: gl.canvas.height,
        },
        u_framebuffersecond: {
          width: gl.canvas.width,
          height: gl.canvas.height,
        },
      });

      uniforms.u_texture = null;
      uniforms.u_resolution = [gl.canvas.width, gl.canvas.height];

      return {
        textures,
        fb: createFramebufferInfo(gl, [textures.u_framebuffer]),
        fb2: createFramebufferInfo(gl, [textures.u_framebuffersecond]),
      };
    }

    function destroyTargets(target: Targets) {
      for (const tex of Object.values(target.textures)) {
        gl.deleteTexture(tex);
      }
      gl.deleteFramebuffer(target.fb.framebuffer);
      gl.deleteFramebuffer(target.fb2.framebuffer);
    }

    function createPrograms(): Programs {
      return {
        programInfo: createProgramInfo(gl, [vertexShaderSource, fragmentShaderSource]),
        programInfoSecond: createProgramInfo(gl, [vertexShaderSource, fragmentColorShaderSource]),
        bufferInfo: createBufferInfoFromArrays(gl, {
          a_position: { data: plane, numComponents: 3 },
          a_texture: { data: texture, numComponents: 2 },
        }),
      };
    }

    function destroyPrograms(created: Programs) {
      gl.deleteProgram(created.programInfo.program);
      gl.deleteProgram(created.programInfoSecond.program);
      for (const attrib of Object.values(created.bufferInfo.attribs ?? {})) {
        gl.deleteBuffer(attrib.buffer);
      }
    }

    function isRunnable() {
      return visible && !document.hidden;
    }

    function frameInterval() {
      const fps = window.innerWidth <= NARROW_VIEWPORT_MAX_WIDTH ? NARROW_VIEWPORT_FPS : WIDE_VIEWPORT_FPS;

      return 1000 / fps;
    }

    function schedule() {
      if (animationFrameId !== null || !(programs && targets && isRunnable())) return;

      animationFrameId = window.requestAnimationFrame(render);
    }

    function stop() {
      if (animationFrameId !== null) {
        window.cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
      lastFrameTime = null;
    }

    function draw(time: number) {
      if (!(programs && targets)) return;

      const delta = lastFrameTime === null ? 0 : Math.min((time - lastFrameTime) / 1000, MAX_FRAME_DELTA_S);
      lastFrameTime = time;
      elapsedTime += delta;

      uniforms.u_timedelta = delta;
      uniforms.u_time = elapsedTime;
      uniforms.u_frame = uniforms.u_frame + 1;
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      if (uniforms.u_frame % 2 === 0) {
        bindFramebufferInfo(gl, targets.fb);
        uniforms.u_texture = targets.textures.u_framebuffersecond;
      } else {
        bindFramebufferInfo(gl, targets.fb2);
        uniforms.u_texture = targets.textures.u_framebuffer;
      }

      // biome-ignore lint/correctness/useHookAtTopLevel: gl.useProgram is the WebGL API, not a React hook
      gl.useProgram(programs.programInfo.program);
      setBuffersAndAttributes(gl, programs.programInfo, programs.bufferInfo);
      setUniforms(gl, programs.programInfo, uniforms);
      drawBufferInfo(gl, programs.bufferInfo);

      bindFramebufferInfo(gl, null);
      // biome-ignore lint/correctness/useHookAtTopLevel: gl.useProgram is the WebGL API, not a React hook
      gl.useProgram(programs.programInfoSecond.program);
      setBuffersAndAttributes(gl, programs.programInfoSecond, programs.bufferInfo);
      setUniforms(gl, programs.programInfoSecond, uniforms);
      drawBufferInfo(gl, programs.bufferInfo);
    }

    function render(time: number) {
      animationFrameId = null;
      if (!isRunnable()) return;

      if (lastFrameTime === null || time - lastFrameTime >= frameInterval() - 1) {
        draw(time);
      }

      schedule();
    }

    const idleWindow = window as IdleWindow;

    function onVisibilityChange() {
      if (document.hidden) {
        stop();
      } else {
        schedule();
      }
    }

    const observer = new IntersectionObserver((entries) => {
      visible = entries.some((entry) => entry.isIntersecting);
      if (visible) {
        schedule();
      } else {
        stop();
      }
    });

    observer.observe(wrapper);

    const bounds = wrapper.getBoundingClientRect();
    visible =
      bounds.bottom > 0 &&
      bounds.top < (window.innerHeight || 0) &&
      bounds.right > 0 &&
      bounds.left < (window.innerWidth || 0);

    document.addEventListener('visibilitychange', onVisibilityChange);

    function initScene() {
      idleSetupId = null;
      timeoutSetupId = null;
      stop();
      programs = createPrograms();
      targets = createTargets();
      lastFrameTime = null;
      schedule();
    }

    function onResize() {
      // workaround to prevent ios page resize events when scrolling the page
      if (previousWindowWidth === window.innerWidth) return;

      previousWindowWidth = window.innerWidth;
      if (resizeTimeoutId !== null) clearTimeout(resizeTimeoutId);
      resizeTimeoutId = setTimeout(() => {
        resizeTimeoutId = null;
        if (!programs) return;

        stop();
        if (targets) destroyTargets(targets);
        targets = createTargets();
        schedule();
      }, RESIZE_DEBOUNCE_MS);
    }

    window.addEventListener('resize', onResize);

    if (idleWindow.requestIdleCallback) {
      idleSetupId = idleWindow.requestIdleCallback(initScene, { timeout: IDLE_SETUP_TIMEOUT_MS });
    } else {
      timeoutSetupId = setTimeout(initScene, 0);
    }

    return () => {
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      observer.disconnect();
      stop();
      if (resizeTimeoutId !== null) clearTimeout(resizeTimeoutId);
      if (idleSetupId !== null) {
        idleWindow.cancelIdleCallback?.(idleSetupId);
        idleSetupId = null;
      }
      if (timeoutSetupId !== null) {
        clearTimeout(timeoutSetupId);
        timeoutSetupId = null;
      }
      if (targets) {
        destroyTargets(targets);
        targets = null;
      }
      if (programs) {
        destroyPrograms(programs);
        programs = null;
      }
    };
  }, []);

  return (
    <div className={st.art}>
      <div className={st.art__wrapper} ref={wrapperRef}>
        <canvas className={st.art__canvas} ref={canvasRef} />
      </div>
    </div>
  );
}
