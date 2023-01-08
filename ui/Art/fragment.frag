precision mediump float;

const float speed=1.5;
const float turbulences=1.;
const float attraction=3.;

varying vec2 v_texture;
uniform sampler2D u_texture;
uniform vec2 u_resolution;
uniform float u_time;
uniform float u_timedelta;
uniform int u_frame;

vec2 hash23(vec3 p3)
{
  p3=fract(p3*vec3(.1031,.1030,.0973));
  p3+=dot(p3,p3.yzx+33.33);
  return fract((p3.xx+p3.yz)*p3.zy);
}

float gyroid(vec3 seed)
{
  return dot(sin(seed),cos(seed.yzx));
}

float fbm(vec3 seed)
{
  float result=0.;
  float a=.5;
  for(int i=0;i<3;++i){
    seed+=result/2.;
    result+=gyroid(seed/a)*a;
    a/=2.;
  }
  return result;
}

void main(){
  vec2 cords=v_texture*u_resolution;
  
  // if(u_frame<1)
  // {
    //   gl_FragColor=vec4(hash23(vec3(cords,0.)),0,0.);
    //   return;
  // }
  
  // coordinates
  vec2 p=(cords.xy-u_resolution.xy/2.)/u_resolution.y;
  vec2 offset=vec2(0);
  float dist=length(p);
  
  // turbulences
  float noise=fbm(vec3(p*3.,dist-u_time*.1*speed));
  noise=pow(abs(noise),.5);
  float angle=noise*6.28;
  offset+=turbulences*vec2(cos(angle),sin(angle));
  
  // attraction
  offset+=attraction*normalize(p)*sin(dist*9.+u_time);
  
  float dt=30.*u_timedelta;
  
  // displace frame buffer
  vec4 frame=texture2D(u_texture,v_texture+dt*offset*speed/u_resolution);
  
  // edge spawn
  bool spawn=cords.x<1.||cords.x>u_resolution.x-1.||cords.y<1.||cords.y>u_resolution.y-1.;
  
  // spawn from noise
  vec2 rng=hash23(vec3(cords,u_frame));
  if(spawn)frame=vec4(step(.5,rng.x),step(.5,rng.y),0,0);
  
  // neighbor values
  vec2 neighbors=vec2(0);
  for(float x=-1.;x<=1.;++x)
  {
    for(float y=-1.;y<=1.;++y)
    {
      if(x==0.&&y==0.)continue;
      neighbors+=texture2D(u_texture,v_texture+vec2(x,y)/u_resolution).rg;
    }
  }
  
  // animation fade
  frame.r+=4.*(neighbors.r>4.?1.:-1.)*u_timedelta;
  frame.g+=4.*(neighbors.g>4.?1.:-1.)*u_timedelta;
  
  gl_FragColor=vec4(clamp(frame.rg,0.,1.),1.,1.);
}