precision mediump float;

varying vec2 v_texture;
uniform sampler2D u_texture;

float T(vec2 uv){
  return abs(texture2D(u_texture,uv).b);
}

void main()
{
  vec4 frame=texture2D(u_texture,v_texture);
  
  // tints
  vec3 tint=.5+.5*cos(vec3(9,3,5)*9.+length(v_texture-.5)*5.);
  gl_FragColor=vec4(frame.r*tint,1);
  tint=.5+.5*cos(vec3(1,2,3)*5.+length(v_texture-.5)*2.+3.);
  gl_FragColor.rgb+=frame.g*tint;
}