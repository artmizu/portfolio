type TextureSize = {
  width: number;
  height: number;
};

type ArraySpec = {
  data: number[];
  numComponents: number;
};

type UniformRef = {
  location: WebGLUniformLocation;
  type: number;
  unit: number;
};

export type ProgramInfo = {
  program: WebGLProgram;
  uniforms: Record<string, UniformRef>;
  attributes: Record<string, number>;
};

export type AttribInfo = {
  buffer: WebGLBuffer;
  numComponents: number;
};

export type BufferInfo = {
  attribs: Record<string, AttribInfo>;
  numElements: number;
};

export type FramebufferInfo = {
  framebuffer: WebGLFramebuffer;
  attachments: WebGLTexture[];
  width: number;
  height: number;
};

export type UniformValue = number | number[] | WebGLTexture | null;

function createShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) throw new Error('could not create shader');

  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(`shader compile failed: ${log}`);
  }

  return shader;
}

function createProgram(gl: WebGLRenderingContext, vertexSource: string, fragmentSource: string): WebGLProgram {
  const program = gl.createProgram();
  if (!program) throw new Error('could not create program');

  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexSource);
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error(`program link failed: ${log}`);
  }

  return program;
}

export function resizeCanvasToDisplaySize(canvas: HTMLCanvasElement, multiplier = 1): boolean {
  const ratio = Math.max(0, multiplier);
  const width = (canvas.clientWidth * ratio) | 0;
  const height = (canvas.clientHeight * ratio) | 0;
  if (canvas.width === width && canvas.height === height) return false;

  canvas.width = width;
  canvas.height = height;
  return true;
}

export function createTextures(
  gl: WebGLRenderingContext,
  sizes: Record<string, TextureSize>,
): Record<string, WebGLTexture> {
  const textures: Record<string, WebGLTexture> = {};

  for (const [name, { width, height }] of Object.entries(sizes)) {
    const texture = gl.createTexture();
    if (!texture) throw new Error(`could not create texture: ${name}`);

    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    textures[name] = texture;
  }

  return textures;
}

export function createFramebufferInfo(gl: WebGLRenderingContext, attachments: WebGLTexture[]): FramebufferInfo {
  const framebuffer = gl.createFramebuffer();
  if (!framebuffer) throw new Error('could not create framebuffer');

  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
  attachments.forEach((attachment, index) => {
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + index, gl.TEXTURE_2D, attachment, 0);
  });

  return { framebuffer, attachments, width: gl.drawingBufferWidth, height: gl.drawingBufferHeight };
}

export function bindFramebufferInfo(gl: WebGLRenderingContext, framebufferInfo: FramebufferInfo | null): void {
  if (!framebufferInfo) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    return;
  }

  gl.bindFramebuffer(gl.FRAMEBUFFER, framebufferInfo.framebuffer);
  gl.viewport(0, 0, framebufferInfo.width, framebufferInfo.height);
}

export function createProgramInfo(
  gl: WebGLRenderingContext,
  [vertexSource, fragmentSource]: [string, string],
): ProgramInfo {
  const program = createProgram(gl, vertexSource, fragmentSource);

  const uniforms: Record<string, UniformRef> = {};
  let unit = 0;
  const uniformCount = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS) as number;
  for (let index = 0; index < uniformCount; index += 1) {
    const info = gl.getActiveUniform(program, index);
    if (!info) continue;

    const location = gl.getUniformLocation(program, info.name);
    if (!location) continue;

    uniforms[info.name] = { location, type: info.type, unit: info.type === gl.SAMPLER_2D ? unit++ : 0 };
  }

  const attributes: Record<string, number> = {};
  const attributeCount = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES) as number;
  for (let index = 0; index < attributeCount; index += 1) {
    const info = gl.getActiveAttrib(program, index);
    if (!info) continue;

    attributes[info.name] = gl.getAttribLocation(program, info.name);
  }

  return { program, uniforms, attributes };
}

export function createBufferInfoFromArrays(gl: WebGLRenderingContext, arrays: Record<string, ArraySpec>): BufferInfo {
  const attribs: Record<string, AttribInfo> = {};
  let numElements = 0;

  for (const [name, { data, numComponents }] of Object.entries(arrays)) {
    const buffer = gl.createBuffer();
    if (!buffer) throw new Error(`could not create buffer: ${name}`);

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
    attribs[name] = { buffer, numComponents };
    numElements = numElements === 0 ? data.length / numComponents : Math.min(numElements, data.length / numComponents);
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, null);
  return { attribs, numElements };
}

export function setBuffersAndAttributes(
  gl: WebGLRenderingContext,
  programInfo: ProgramInfo,
  bufferInfo: BufferInfo,
): void {
  for (const [name, attrib] of Object.entries(bufferInfo.attribs)) {
    const location = programInfo.attributes[name];
    if (location === undefined) continue;

    gl.bindBuffer(gl.ARRAY_BUFFER, attrib.buffer);
    gl.enableVertexAttribArray(location);
    gl.vertexAttribPointer(location, attrib.numComponents, gl.FLOAT, false, 0, 0);
  }
}

export function setUniforms(
  gl: WebGLRenderingContext,
  programInfo: ProgramInfo,
  values: Record<string, UniformValue>,
): void {
  for (const [name, value] of Object.entries(values)) {
    const uniform = programInfo.uniforms[name];
    if (!uniform) continue;

    if (uniform.type === gl.FLOAT && typeof value === 'number') {
      gl.uniform1f(uniform.location, value);
      continue;
    }

    if (uniform.type === gl.INT && typeof value === 'number') {
      gl.uniform1i(uniform.location, value);
      continue;
    }

    if (uniform.type === gl.FLOAT_VEC2 && Array.isArray(value)) {
      gl.uniform2fv(uniform.location, value);
      continue;
    }

    if (uniform.type === gl.SAMPLER_2D && (value === null || value instanceof WebGLTexture)) {
      gl.uniform1i(uniform.location, uniform.unit);
      gl.activeTexture(gl.TEXTURE0 + uniform.unit);
      gl.bindTexture(gl.TEXTURE_2D, value);
    }
  }
}

export function drawBufferInfo(gl: WebGLRenderingContext, bufferInfo: BufferInfo): void {
  gl.drawArrays(gl.TRIANGLES, 0, bufferInfo.numElements);
}
