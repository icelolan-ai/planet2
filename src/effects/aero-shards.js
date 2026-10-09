/* Actual React Bits Aero Shards procedural shard geometry, lighting, bloom, dither/ASCII styles and finishing.
 * DavidHDev/react-bits/src/content/Backgrounds/AeroShards/AeroShards.jsx (WebGPU/WGSL via vgpu).
 * Ported line by line to GLSL ES 3.00 so it runs on the shared Three/WebGL stage renderer (no WebGPU, vgpu, new renderer, RAF or dependency).
 * MIT + Commons Clause, copyright 2026 David Haz; full notice in template.html.
 * Studio differences (documented in docs/AI-WORK-LOG.md): no pointer/ripple/hold interaction (static Kit), placement/flow changes snap instead of
 * easing, deterministic Kit clock replaces the source's accumulated frame time, and the `flat, first` provoking-vertex output is evaluated per vertex.
 */
(() => {
  if(window.CerebraAeroShards)return;
  const PLACEMENTS={right:0,left:1,center:2,full:3},MATERIALS={pearl:0,chrome:1,satin:2},EFFECTS={none:0,dither:1,ascii:2},FLOWS={stream:0,vortex:1,ribbon:2};
  const RIPPLE_SPEED=4.2,RIPPLE_TAIL=1.8;
  const MATERIAL_PRESETS={pearl:{roughness:.46,brightness:.92,glow:.54,highlightMix:.78},chrome:{roughness:.1,brightness:1.12,glow:.38,highlightMix:.9},satin:{roughness:.74,brightness:.84,glow:.42,highlightMix:.66}};
  const DETAIL_PRESETS={bold:{count:.58,size:1.32},balanced:{count:1,size:.96},fine:{count:1.15,size:.7}};
  const QUALITY_PRESETS={low:{count:1900},medium:{count:3200},high:{count:4600}};
  const coarse=matchMedia('(pointer:coarse)').matches;
  const defaults={backgroundColor:'#120F17',shardColor:'#896ABD',accentColor:'#A855F7',placement:'full',flow:'stream',material:'pearl',detail:'balanced',effect:'none',scale:1,spread:1,depth:1,speed:1,spin:1,density:1.5,shardSize:1.1,stretch:1,turbulence:1,glow:1,edgeSoftness:2,bloom:.5,grain:.05,chromaticAberration:.0075,quality:coarse?'low':'medium'};
  const clamp=(v,a,b)=>Math.min(b,Math.max(a,Number.isFinite(+v)?+v:a));
  const parseColor=(value,fallback)=>{const m=/^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(value)||/^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(fallback);return [parseInt(m[1],16)/255,parseInt(m[2],16)/255,parseInt(m[3],16)/255,1];};
  const mixColor=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t,1];
  const layoutVector=i=>[0,1,2,3].map(k=>k===i?1:0);
  const resolvePathLength=(aspect,w)=>{const side=2.65+.61*aspect+.09*aspect*aspect,center=2.3+2*aspect+.35*aspect*aspect,full=Math.hypot(2.44*aspect,Math.sqrt(5)),mobile=Math.hypot(2.56*aspect,1);return aspect<.82?mobile*(w[0]+w[1]+w[2])+full*w[3]:side*(w[0]+w[1])+center*w[2]+full*w[3];};
  // ---- ASCII glyph tables (verbatim from the source) ----
  const ASCII_GLYPHS=[[0,0,0,0,0,0,0],[0,0,0,0,0,12,12],[0,12,12,0,12,12,0],[0,0,0,31,0,0,0],[0,0,31,0,31,0,0],[4,4,4,4,4,4,4],[1,2,2,4,8,8,16],[16,8,8,4,2,2,1],[0,4,4,31,4,4,0],[0,21,14,31,14,21,0],[0,17,10,4,10,17,0],[2,4,8,16,8,4,2],[8,4,2,1,2,4,8],[3,4,8,8,8,4,3],[24,4,2,2,2,4,24],[0,0,14,17,17,14,0],[14,17,17,17,17,17,14],[10,10,31,10,31,10,10],[14,17,23,21,23,16,14],[17,27,21,21,17,17,17],[17,17,17,21,21,27,17],[14,17,17,31,17,17,17]];
  const ASCII_SAMPLES=[[.28,.26],[.72,.14],[.28,.56],[.72,.44],[.28,.86],[.72,.74]];
  const ASCII_SHAPES=ASCII_GLYPHS.map(rows=>ASCII_SAMPLES.map(([cx,cy])=>{let sum=0,count=0;for(let y=0;y<28;y+=1)for(let x=0;x<20;x+=1){if(((x+.5)/20-cx)**2*.36+((y+.5)/28-cy)**2>.26**2)continue;sum+=(rows[Math.floor(y/4)]>>(4-Math.floor(x/4)))&1;count+=1;}return sum/Math.max(count,1);}));
  for(let sample=0;sample<6;sample+=1){const peak=Math.max(...ASCII_SHAPES.map(s=>s[sample]));for(const s of ASCII_SHAPES)s[sample]/=Math.max(peak,.001);}
  const NG=ASCII_GLYPHS.length;
  // ---- shaders ----
  const VIEW=['viewport','shape','effects','composition','transport','formation','gather','pointer','shock','shockB','shockC','shockD','material','light','environment','baseColor','highlightColor','accentColor'];
  const POST=['viewport','bloomInfo','finishing','background','temporal','tint'];
  const STYLE=['viewport','background','mode'];
  const decl=(p,names)=>names.map(n=>`uniform vec4 u${p}_${n};`).join('\n');
  const bind=(src)=>src.replace(/\bview\.(\w+)/g,'uView_$1').replace(/\bpost\.(\w+)/g,'uPost_$1').replace(/\bstyle\.(\w+)/g,'uStyle_$1');
  const OUT='layout(location=0) out highp vec4 fragColor;\n',frag=src=>OUT+bind(src).replace(/gl_FragColor/g,'fragColor');
  const VERT_SHARD=bind(`precision highp float;precision highp int;\n${decl('View',VIEW)}\nstruct PathSample{vec3 position;vec3 tangent;float phase;};
flat out vec4 vBaseAlpha;
flat out vec3 vCrease;
out vec2 vLocal;
uint hashU32(uint value){uint state=value*747796405u+2891336453u;uint word=((state>>((state>>28u)+4u))^state)*277803737u;return (word>>22u)^word;}
float unitFloat(uint value){return float(hashU32(value))*(1.0/4294967296.0);}
vec3 safeNormalize(vec3 v){return v/max(length(v),0.0001);}
vec2 safeNormalize2(vec2 v){return v/max(length(v),0.0001);}
float cubic(float p0,float p1,float p2,float p3,float t){float o=1.0-t;return o*o*o*p0+3.0*o*o*t*p1+3.0*o*t*t*p2+t*t*t*p3;}
float cubicDerivative(float p0,float p1,float p2,float p3,float t){float o=1.0-t;return 3.0*o*o*(p1-p0)+6.0*o*t*(p2-p1)+3.0*t*t*(p3-p2);}
const float sideArc_T[32]=float[32](0.000000,0.052475,0.097829,0.135121,0.166845,0.195164,0.221458,0.246639,0.271368,0.296184,0.321577,0.348019,0.375973,0.405832,0.437746,0.471327,0.505474,0.538781,0.570323,0.599945,0.628000,0.655048,0.681734,0.708795,0.737169,0.768244,0.804295,0.848010,0.894805,0.935083,0.969270,1.000000);
float sideArc(float phase){float scaled=clamp(phase,0.0,0.999999)*31.0;int index=min(int(floor(scaled)),30);return mix(sideArc_T[index],sideArc_T[index+1],fract(scaled));}
const float fullArc_T[32]=float[32](0.000000,0.028092,0.055939,0.083892,0.112291,0.141449,0.171637,0.203033,0.235650,0.269282,0.303537,0.337982,0.372308,0.406392,0.440263,0.474026,0.507794,0.541636,0.575553,0.609470,0.643257,0.676761,0.709855,0.742465,0.774594,0.806319,0.837790,0.869218,0.900862,0.933020,0.965991,1.000000);
float fullArc(float phase){float scaled=clamp(phase,0.0,0.999999)*31.0;int index=min(int(floor(scaled)),30);return mix(fullArc_T[index],fullArc_T[index+1],fract(scaled));}
const float centerArc_T[32]=float[32](0.000000,0.028692,0.059794,0.096620,0.140315,0.179839,0.212476,0.241834,0.270282,0.299332,0.329968,0.362347,0.395341,0.427241,0.457283,0.485900,0.514192,0.543773,0.577230,0.618093,0.661144,0.696770,0.727388,0.756064,0.784657,0.814415,0.845979,0.878880,0.911508,0.942489,0.971712,1.000000);
float centerArc(float phase){float scaled=clamp(phase,0.0,0.999999)*31.0;int index=min(int(floor(scaled)),30);return mix(centerArc_T[index],centerArc_T[index+1],fract(scaled));}
const float mobileArc_T[32]=float[32](0.000000,0.028885,0.057970,0.087431,0.117400,0.147935,0.179017,0.210560,0.242467,0.274689,0.307272,0.340367,0.374193,0.408970,0.444794,0.481483,0.518517,0.555206,0.591030,0.625807,0.659633,0.692728,0.725311,0.757533,0.789440,0.820983,0.852065,0.882600,0.912569,0.942030,0.971115,1.000000);
float mobileArc(float phase){float scaled=clamp(phase,0.0,0.999999)*31.0;int index=min(int(floor(scaled)),30);return mix(mobileArc_T[index],mobileArc_T[index+1],fract(scaled));}

PathSample sidePath(float seedPhase,float dist,float aspect,float mirror){
  float pi=3.14159265359;
  float pathLength=2.65+0.61*aspect+0.09*aspect*aspect;
  float phase=fract(seedPhase+dist/pathLength);
  float t=sideArc(phase);
  float x=cubic(1.24,1.02,-0.28,0.12,t)+sin(t*pi*4.0+0.34)*0.055;
  float y=cubic(1.38,0.72,-0.56,-1.38,t)+sin(t*pi*2.0-0.6)*0.04;
  float z=sin(t*pi*3.0)*0.18;
  vec3 derivative=vec3(
    mirror*aspect*(cubicDerivative(1.24,1.02,-0.28,0.12,t)+cos(t*pi*4.0+0.34)*pi*4.0*0.055),
    cubicDerivative(1.38,0.72,-0.56,-1.38,t)+cos(t*pi*2.0-0.6)*pi*2.0*0.04,
    cos(t*pi*3.0)*pi*3.0*0.18);
  PathSample s;s.position=vec3(mirror*aspect*x,y,z);s.tangent=safeNormalize(derivative);s.phase=phase;return s;
}
PathSample centerPath(float seedPhase,float dist,float aspect){
  float pi=3.14159265359;
  float pathLength=2.3+2.0*aspect+0.35*aspect*aspect;
  float phase=fract(seedPhase+dist/pathLength);
  float t=centerArc(phase);
  float angle=mix(-0.25*pi,1.75*pi,t);
  float angleDerivative=2.0*pi;
  float radius=0.72+sin(t*pi*4.0)*0.12;
  float radiusDerivative=cos(t*pi*4.0)*pi*4.0*0.12;
  vec3 derivative=vec3(
    aspect*(-sin(angle)*angleDerivative*radius+cos(angle)*radiusDerivative),
    cos(angle)*angleDerivative*radius+sin(angle)*radiusDerivative,
    cos(t*pi*2.0)*pi*2.0*0.16);
  PathSample s;s.position=vec3(cos(angle)*radius*aspect,sin(angle)*radius,sin(t*pi*2.0)*0.16);s.tangent=safeNormalize(derivative);s.phase=phase;return s;
}
PathSample fullPath(float seedPhase,float dist,float aspect){
  float pi=3.14159265359;
  float pathWidth=2.44*aspect;
  float pathLength=sqrt(pathWidth*pathWidth+5.0);
  float phase=fract(seedPhase+dist/pathLength);
  float t=fullArc(phase);
  vec3 derivative=vec3(
    aspect*2.44,
    cos((t*1.72-0.2)*pi)*1.72*pi*0.54+cos(t*pi*3.0)*pi*3.0*0.12,
    -sin(t*pi*2.0-0.7)*pi*2.0*0.22);
  PathSample s;
  s.position=vec3(mix(-aspect*1.22,aspect*1.22,t),sin((t*1.72-0.2)*pi)*0.54+sin(t*pi*3.0)*0.12,cos(t*pi*2.0-0.7)*0.22);
  s.tangent=safeNormalize(derivative);s.phase=phase;return s;
}
PathSample mobilePath(float seedPhase,float dist,float aspect){
  float pi=3.14159265359;
  float pathWidth=2.56*aspect;
  float pathLength=sqrt(pathWidth*pathWidth+1.0);
  float phase=fract(seedPhase+dist/pathLength);
  float t=mobileArc(phase);
  vec3 derivative=vec3(
    aspect*2.56,
    cos(t*pi)*pi*0.28+cos(t*pi*3.0)*pi*3.0*0.06,
    -sin(t*pi*2.0)*pi*2.0*0.16);
  PathSample s;
  s.position=vec3(mix(-aspect*1.28,aspect*1.28,t),-0.86+sin(t*pi)*0.28+sin(t*pi*3.0)*0.06,cos(t*pi*2.0)*0.16);
  s.tangent=safeNormalize(derivative);s.phase=phase;return s;
}
PathSample weightedPath(float seedPhase,float phaseOffset,float aspect,vec4 weights){
  float phase=fract(seedPhase+phaseOffset);
  PathSample result;result.position=vec3(0.0);result.tangent=vec3(0.0);result.phase=phase;
  if(aspect<0.82){
    float compactWeight=weights.x+weights.y+weights.z;
    if(compactWeight>0.0001){PathSample compact=mobilePath(phase,0.0,aspect);result.position+=compact.position*compactWeight;result.tangent+=compact.tangent*compactWeight;}
    if(weights.w>0.0001){PathSample wide=fullPath(phase,0.0,aspect);result.position+=wide.position*weights.w;result.tangent+=wide.tangent*weights.w;}
  }else{
    if(weights.x>0.0001){PathSample right=sidePath(phase,0.0,aspect,1.0);result.position+=right.position*weights.x;result.tangent+=right.tangent*weights.x;}
    if(weights.y>0.0001){PathSample left=sidePath(phase,0.0,aspect,-1.0);result.position+=left.position*weights.y;result.tangent+=left.tangent*weights.y;}
    if(weights.z>0.0001){PathSample center=centerPath(phase,0.0,aspect);result.position+=center.position*weights.z;result.tangent+=center.tangent*weights.z;}
    if(weights.w>0.0001){PathSample wide=fullPath(phase,0.0,aspect);result.position+=wide.position*weights.w;result.tangent+=wide.tangent*weights.w;}
  }
  result.tangent=safeNormalize(result.tangent+vec3(0.0001,0.0,0.0));
  return result;
}
vec2 pointerField(vec2 delta,float radius,vec2 flow,float depth){
  vec2 offset=delta/max(radius,0.001);
  float along=dot(offset,flow);
  float across=dot(offset,vec2(-flow.y,flow.x));
  float alongSquared=along*along;
  float layer=depth*inversesqrt(1.0+depth*depth);
  float bend=(0.22*alongSquared+0.12*layer*along)/(1.0+alongSquared);
  float curvedAcross=(across+bend)/(1.0+layer*0.18);
  float falloff=exp(-0.28*alongSquared-1.2*curvedAcross*curvedAcross);
  return offset*falloff;
}
float rippleWave(float age){
  if(age<=0.0||age>=1.8)return 0.0;
  float attack=smoothstep(0.0,0.14,age);
  float release=1.0-smoothstep(1.4,1.8,age);
  return sin(age*10.0)*exp(-age*3.2)*attack*release;
}
vec4 rippleDisplacement(vec3 position,vec4 pulse){
  if(pulse.w<=0.0001)return vec4(0.0);
  float perspective=1.0/max(0.62,1.0-position.z*0.34);
  vec2 delta=(position.xy*perspective-pulse.xy)*view.viewport.z;
  float dist=sqrt(dot(delta,delta)+0.0016)-0.04;
  float wave=rippleWave(pulse.z-dist/4.2)*pulse.w;
  vec2 radial=delta/(dist+0.12);
  return vec4(radial*wave*0.28,wave*0.12,abs(wave));
}
vec3 shardVertex(uint index){
  float fold=0.34;
  vec3 vertices[6]=vec3[6](vec3(0.0,1.0,fold),vec3(-0.72,0.0,0.0),vec3(0.0,-1.0,fold),vec3(0.0,1.0,fold),vec3(0.0,-1.0,fold),vec3(0.72,0.0,0.0));
  return vertices[index%6u];
}
float softbox(vec3 direction,vec2 center,vec2 size){vec2 q=abs((direction.xy-center)/size);vec2 q2=q*q;vec2 q4=q2*q2;return exp(-(q4.x+q4.y));}
vec3 aces(vec3 color){float a=2.51;float b=0.03;float c=2.43;float d=0.59;float e=0.14;return clamp((color*(a*color+b))/(color*(c*color+d)+e),vec3(0.0),vec3(1.0));}
void main(){
  uint vertexIndex=uint(gl_VertexID);
  uint instanceIndex=uint(gl_InstanceID);
  float seedPhase=unitFloat(instanceIndex*1664525u+1013904223u);
  float seedLane=unitFloat(instanceIndex*2246822519u+3266489917u);
  float seedDepth=unitFloat(instanceIndex*668265263u+374761393u);
  float seedScale=unitFloat(instanceIndex*1597334677u+3812015801u);
  float aspect=view.viewport.x;
  PathSample path=weightedPath(seedPhase,view.transport.x,aspect,view.composition);
  vec3 direction=path.tangent;
  vec2 planarNormal=safeNormalize2(vec2(-direction.y,direction.x));
  float signedLane=seedLane*2.0-1.0;
  float lane=sign(signedLane)*pow(abs(signedLane),0.72);
  float widthProfile=0.46+pow(max(sin(path.phase*3.14159265359),0.0),0.72)*0.54;
  float looseSeed=unitFloat(instanceIndex*3266489917u+668265263u);
  float loose=smoothstep(0.92,1.0,looseSeed);
  float flowWave=sin(path.phase*37.6991118431+seedDepth*12.0);
  float laneWidth=(lane*0.56+flowWave*0.055*view.shape.z)*view.shape.x*widthProfile*(1.0+loose*0.72);
  float depthLane=(seedDepth*2.0-1.0)*view.shape.y+cos(path.phase*31.4159265359+seedLane*8.0)*0.06*view.shape.z;
  vec3 renderPosition=path.position+vec3(planarNormal*laneWidth,depthLane);

  if(view.formation.y+view.formation.z>0.00001){
    vec2 center=vec2((view.composition.x-view.composition.y)*aspect*0.56,0.0);
    vec3 formedPosition=renderPosition*view.formation.x;
    vec3 formedDirection=direction*view.formation.x;
    if(view.formation.y>0.00001){
      float radius=0.16+sqrt(seedLane)*0.74*(0.45+view.shape.x*0.55);
      float angle=seedPhase*6.28318530718+view.viewport.w/radius;
      vec2 radial=vec2(cos(angle),sin(angle));
      vec3 position=vec3(center+radial*radius,(seedDepth-0.5)*view.shape.y*0.65+radial.y*0.2);
      formedPosition+=position*view.formation.y;
      formedDirection+=safeNormalize(vec3(-radial.y,radial.x,radial.x*0.2))*view.formation.y;
    }
    if(view.formation.z>0.00001){
      float phase=fract(seedPhase+view.viewport.w/(aspect*3.0+2.0));
      float angle=phase*6.28318530718;
      float ribbonWidth=(seedLane-0.5)*0.54*view.shape.x;
      vec3 position=vec3(
        mix(-aspect*1.35,aspect*1.35,phase)+center.x*0.5,
        sin(angle)*0.42+cos(angle*2.0)*ribbonWidth,
        (cos(angle)*0.35+sin(angle*2.0)*ribbonWidth+(seedDepth-0.5)*0.12)*view.shape.y);
      vec3 tangent=safeNormalize(vec3(aspect*2.7,cos(angle)*2.638938,-sin(angle)*2.199115*view.shape.y));
      formedPosition+=position*view.formation.z;
      formedDirection+=tangent*view.formation.z;
    }
    renderPosition=formedPosition;
    direction=safeNormalize(formedDirection+vec3(0.0,0.0,0.02*view.formation.x*(1.0-view.formation.x)));
    planarNormal=safeNormalize2(vec2(-direction.y,direction.x));
  }

  if(abs(view.pointer.w)>0.0001){
    vec2 field=pointerField(view.pointer.xy-renderPosition.xy,view.pointer.z,vec2(planarNormal.y,-planarNormal.x),renderPosition.z);
    vec2 lateral=field-direction.xy*dot(field,direction.xy);
    renderPosition+=vec3(lateral*view.pointer.w*0.36,0.0);
    direction=safeNormalize(vec3(direction.xy+lateral*view.pointer.w*0.65,direction.z));
  }

  if(view.gather.z>0.00001){
    vec2 relative=(renderPosition.xy-view.gather.xy)*view.viewport.z;
    float reach=length(relative);
    float radius=sqrt(-2.0*log(max(seedLane,0.0001)));
    float angle=seedPhase*6.28318530718+view.gather.w*(0.3+seedDepth*0.18);
    vec2 orbit=vec2(cos(angle),sin(angle));
    float layer=seedDepth*6.28318530718;
    vec2 drift=vec2(sin(layer+view.gather.w*0.22),cos(layer*1.7-view.gather.w*0.18))*0.055;
    vec2 cloud=orbit*radius*vec2(0.2,0.16)+drift;
    vec3 cluster=vec3(view.gather.xy+cloud/view.viewport.z,(seedDepth-0.5)*0.42);
    float amount=pow(view.gather.z,1.0+seedDepth*0.65+min(reach,4.0)*0.12);
    vec3 curledDirection=safeNormalize(vec3(-orbit.y,orbit.x,sin(layer)*0.35));
    renderPosition=mix(renderPosition,cluster,amount);
    direction=safeNormalize(mix(direction,curledDirection,amount));
  }

  float rippleLight=0.0;
  if(view.shock.w+view.shockB.w+view.shockC.w+view.shockD.w>0.0001){
    vec4 displacement=rippleDisplacement(renderPosition,view.shock)+rippleDisplacement(renderPosition,view.shockB)+rippleDisplacement(renderPosition,view.shockC)+rippleDisplacement(renderPosition,view.shockD);
    rippleLight=min(displacement.w,1.5);
    if(dot(displacement.xyz,displacement.xyz)>0.0){renderPosition+=displacement.xyz;direction=safeNormalize(direction+displacement.xyz*0.7);}
  }

  vec3 shapeLocal=shardVertex(vertexIndex);
  vec3 local=shapeLocal;
  local.x*=mix(0.72,1.08,seedLane);
  local.y*=mix(0.82,1.12,seedDepth);
  local.x+=(seedDepth-0.5)*(1.0-abs(local.y))*0.16;

  vec3 side=cross(vec3(0.0,0.0,1.0),direction);
  float sideLengthSquared=dot(side,side);
  if(sideLengthSquared>0.0001){side*=inversesqrt(sideLengthSquared);}else{side=vec3(1.0,0.0,0.0);}
  vec3 facing=cross(direction,side);
  float rollDirection=mix(-1.5,1.7,seedDepth);
  float roll=seedLane*6.28318530718+view.viewport.w*rollDirection*view.effects.x*2.4;
  float rollSin=sin(roll);float rollCos=cos(roll);
  vec3 bankedSide=side*rollCos+facing*rollSin;
  vec3 bankedFacing=facing*rollCos-side*rollSin;
  float depthScale=mix(0.56,1.58,clamp(renderPosition.z*0.62+0.5,0.0,1.0));
  float scaleShape=0.46+seedScale*0.58+pow(seedScale,12.0)*1.55;
  float size=view.viewport.y*scaleShape*depthScale*(1.0-view.gather.z*0.3);
  float width=size*0.72;
  float lengthScale=size*1.26*view.effects.z;
  vec3 world=renderPosition+direction*local.y*lengthScale+bankedSide*local.x*width+bankedFacing*local.z*width;

  float perspective=1.0/max(0.62,1.0-world.z*0.34);
  vec2 ndc=world.xy*view.viewport.z/vec2(aspect,1.0)*perspective;
  float depth=clamp(0.56-world.z*0.24,0.03,0.97);
  uint triangle=vertexIndex/3u;
  vec3 mapped=vec3(0.0);vec3 mappedCrease=vec3(0.0);float shardAlpha=0.0;

  // The source computes this once per triangle at its first (provoking) vertex. Every input is per-instance or per-facet,
  // so evaluating it at every vertex gives the same flat value without relying on WebGPU's \`flat, first\` convention.
  {
    float facetSide=(triangle==1u)?1.0:-1.0;
    vec3 localNormal=vec3(facetSide*0.394903,0.0,0.918723);
    vec3 normal=bankedSide*localNormal.x+bankedFacing*localNormal.z;
    vec3 viewDirection=normalize(vec3(-renderPosition.xy*0.08,1.0));
    vec2 pointerShift=vec2(view.light.w,view.shape.w);
    vec3 keyDirection=view.light.xyz;
    vec3 halfDirection=normalize(keyDirection+viewDirection);
    float roughness=clamp(view.material.x,0.04,0.96);
    float materialKind=view.material.y;
    float glow=view.material.w;
    vec3 reflection=reflect(-viewDirection,normal);
    float broad=softbox(reflection,vec2(-0.34,0.28)+pointerShift*0.36,vec2(0.52,0.22)+roughness*0.3);
    float strip=softbox(reflection,vec2(0.48,-0.08)-pointerShift*0.2,vec2(0.12,0.72));
    float diffuse=max(dot(normal,keyDirection),0.0);
    float specularPower=mix(92.0,9.0,roughness);
    float specular=pow(max(dot(normal,halfDirection),0.0),specularPower);
    float fresnelBase=1.0-max(dot(normal,viewDirection),0.0);
    float fresnelSquared=fresnelBase*fresnelBase;
    float fresnel=fresnelSquared*fresnelSquared;
    float facet=mix(0.76,1.0,smoothstep(-0.08,0.08,normal.x));
    float depthFog=smoothstep(-0.68,0.58,renderPosition.z);
    vec3 depthTint=mix(view.accentColor.rgb*0.52,view.baseColor.rgb,depthFog);
    vec3 color=depthTint*(0.1+diffuse*0.3)*facet;
    color+=view.highlightColor.rgb*(broad*mix(0.3,0.86,1.0-roughness))*(1.0+glow*0.14);
    color+=view.accentColor.rgb*strip*(0.12+fresnel*0.42);
    color+=view.highlightColor.rgb*specular*mix(0.82,1.0,seedDepth);
    color+=mix(view.baseColor.rgb,view.accentColor.rgb,seedLane)*fresnel*(0.15+glow*0.16);
    color+=view.accentColor.rgb*(broad*0.045+fresnel*0.075)*glow;
    vec3 creaseColor=color+view.highlightColor.rgb*(0.08+specular*0.22);
    if(materialKind>0.5&&materialKind<1.5){
      vec3 materialLight=view.highlightColor.rgb*(broad+specular)*0.32;
      color=color*1.1+materialLight;creaseColor=creaseColor*1.1+materialLight;
    }else if(materialKind>=1.5){
      vec3 satinColor=view.baseColor.rgb*(0.46+diffuse*0.46);
      color=mix(color,satinColor,0.56);creaseColor=mix(creaseColor,satinColor,0.56);
    }
    vec3 fill=mix(view.accentColor.rgb,view.baseColor.rgb,depthFog)*(0.38+diffuse*0.12)*facet*view.environment.x;
    color+=fill;creaseColor+=fill;
    vec3 pulseColor=mix(view.accentColor.rgb,view.highlightColor.rgb,0.18);
    color+=pulseColor*rippleLight*(0.85+fresnel*0.45);
    creaseColor+=pulseColor*rippleLight*1.35;
    float fog=mix(0.42,1.0,depthFog);
    float exposure=fog*view.material.z*view.effects.w;
    mapped=aces(color*exposure);
    mappedCrease=aces(creaseColor*exposure);
    shardAlpha=mix(0.58,0.97,depthFog);
    float seam=smoothstep(0.0,0.035,path.phase)*(1.0-smoothstep(0.965,1.0,path.phase));
    shardAlpha*=mix(1.0,seam,view.transport.y*view.formation.x*(1.0-view.gather.z));
  }

  gl_Position=vec4(ndc,depth*2.0-1.0,1.0);
  vBaseAlpha=vec4(mapped,shardAlpha);
  vCrease=mappedCrease-mapped;
  vLocal=shapeLocal.xy;
}
`);
  const FRAG_SHARD=frag(`precision highp float;\n${decl('View',VIEW)}\n
flat in vec4 vBaseAlpha;
flat in vec3 vCrease;
in vec2 vLocal;
void main(){
  float crease=(1.0-smoothstep(0.015,0.11,abs(vLocal.x)))*(1.0-smoothstep(0.78,1.0,abs(vLocal.y)));
  float coverage=1.0;
  if(view.effects.y>0.001){
    float diamondDistance=1.0-abs(vLocal.y)-abs(vLocal.x)/0.72;
    float edgeWidth=max(fwidth(diamondDistance)*view.effects.y,0.0001);
    coverage=smoothstep(0.0,edgeWidth,diamondDistance);
  }
  vec3 mapped=vBaseAlpha.rgb+vCrease*crease;
  float coveredAlpha=vBaseAlpha.a*coverage;
  gl_FragColor=vec4(mapped*coveredAlpha,coveredAlpha);
}
`);
  const POST_VERT='void main(){gl_Position=vec4(position.xy,0.0,1.0);}';
  const FRAG_BLOOM=frag(`precision highp float;\n${decl('Post',POST)}\n
uniform sampler2D sceneTexture;
uniform vec2 uRes;
vec4 visibleResidual(vec2 uv){
  vec3 scene=texture(sceneTexture,uv).rgb;
  vec3 residual=scene-post.background.rgb;
  float energy=dot(abs(residual),vec3(0.2126,0.7152,0.0722));
  float threshold=post.bloomInfo.z;
  float knee=post.bloomInfo.w;
  float contribution=smoothstep(threshold-knee,threshold+knee,energy);
  float coverage=energy*contribution;
  return vec4(mix(residual*contribution,post.tint.rgb*coverage,post.finishing.w),coverage);
}
void main(){
  vec2 uv=gl_FragCoord.xy/uRes;
  vec2 offset=post.bloomInfo.xy*0.25;
  vec4 glow=visibleResidual(uv+offset);
  glow+=visibleResidual(uv-offset);
  glow+=visibleResidual(uv+vec2(offset.x,-offset.y));
  glow+=visibleResidual(uv+vec2(-offset.x,offset.y));
  gl_FragColor=glow*0.25;
}
`);
  const FRAG_BLUR=frag(`precision highp float;\n
uniform sampler2D bloomTexture;
uniform vec2 uRes;
uniform vec2 uDirection;
void main(){
  vec2 uv=gl_FragCoord.xy/uRes;
  vec2 nearOffset=uDirection*1.3846153846;
  vec2 farOffset=uDirection*3.2307692308;
  vec4 color=texture(bloomTexture,uv)*0.2270270270;
  color+=texture(bloomTexture,uv+nearOffset)*0.3162162162;
  color+=texture(bloomTexture,uv-nearOffset)*0.3162162162;
  color+=texture(bloomTexture,uv+farOffset)*0.0702702703;
  color+=texture(bloomTexture,uv-farOffset)*0.0702702703;
  gl_FragColor=color;
}
`);
  const FRAG_FINISH=frag(`precision highp float;\n${decl('Post',POST)}\n
uniform sampler2D sceneTexture;
uniform sampler2D bloomTexture;
uniform vec2 uRes;
float hash12(vec2 value){
  vec2 p=fract(value*vec2(0.1031,0.1030));
  vec2 mixedP=p+dot(p,p.yx+33.33);
  return fract((mixedP.x+mixedP.y)*mixedP.x);
}
void main(){
  vec2 uv=gl_FragCoord.xy/uRes;
  vec3 background=post.background.rgb;
  vec3 scene=texelFetch(sceneTexture,ivec2(gl_FragCoord.xy),0).rgb;
  if(post.finishing.z>0.000001){
    float aspect=post.viewport.x/max(post.viewport.y,1.0);
    vec2 centered=(uv-vec2(0.5))*vec2(aspect,1.0);
    float radius=clamp(length(centered)/0.78,0.0,1.0);
    vec2 radialDirection=centered/max(length(centered),0.0001);
    float minResolution=min(post.viewport.x,post.viewport.y);
    vec2 pixelOffset=radialDirection*(post.finishing.z*minResolution*radius*radius);
    vec2 uvOffset=pixelOffset*post.viewport.zw;
    vec3 positive=texture(sceneTexture,uv+uvOffset).rgb;
    vec3 negative=texture(sceneTexture,uv-uvOffset).rgb;
    scene=vec3(positive.r,scene.g,negative.b);
  }
  vec3 foreground=scene-background;
  if(post.finishing.x>0.0001){
    vec4 bloom=texture(bloomTexture,uv);
    float haloMask=1.0-smoothstep(0.04,0.4,length(foreground));
    float haloOpacity=min(bloom.a*post.finishing.x*1.8,0.65)*haloMask;
    vec3 haloColor=bloom.rgb/max(bloom.a,0.00001);
    vec3 lightForeground=mix(foreground,haloColor-background,haloOpacity);
    foreground=mix(foreground+bloom.rgb*post.finishing.x,lightForeground,post.finishing.w);
  }
  float signal=smoothstep(0.008,0.18,length(foreground));
  if(post.finishing.y>0.0001){
    float grainSeed=floor(post.temporal.x*60.0);
    float noise=hash12(floor(gl_FragCoord.xy)+vec2(grainSeed,grainSeed*1.6180339))-0.5;
    foreground+=vec3(noise*post.finishing.y*signal);
  }
  gl_FragColor=vec4(clamp(background+foreground,vec3(0.0),vec3(1.0)),1.0);
}
`);
  const STYLE_COMMON=`
uniform sampler2D sourceTexture;
uniform vec2 uRes;
vec3 sampleSource(vec2 pixel){
  if(any(lessThan(pixel,vec2(0.0)))||any(greaterThanEqual(pixel,style.viewport.xy))){return style.background.rgb;}
  vec2 uv=pixel/style.viewport.xy;
  return textureLod(sourceTexture,vec2(uv.x,1.0-uv.y),0.0).rgb;
}
float inkLevel(vec3 color){
  return clamp(dot(abs(color-style.background.rgb),vec3(0.2126,0.7152,0.0722))*2.4,0.0,1.0);
}
vec2 topLeft(){return vec2(gl_FragCoord.x,uRes.y-gl_FragCoord.y);}
`;
  const FRAG_ASCII=frag(`precision highp float;precision highp int;\n${decl('Style',STYLE)}\n${STYLE_COMMON}\n
const vec2 INNER[6]=vec2[6](@@INNER@@);
const vec2 OUTER[10]=vec2[10](
  vec2(0.28,-0.2),vec2(0.72,-0.2),vec2(-0.22,0.25),vec2(1.22,0.25),
  vec2(-0.22,0.5),vec2(1.22,0.5),vec2(-0.22,0.75),vec2(1.22,0.75),
  vec2(0.28,1.2),vec2(0.72,1.2));
const vec2 RING[6]=vec2[6](vec2(1.0,0.0),vec2(0.5,0.8660254),vec2(-0.5,0.8660254),vec2(-1.0,0.0),vec2(-0.5,-0.8660254),vec2(0.5,-0.8660254));
const vec3 SHAPES[@@NSHAPES@@]=vec3[@@NSHAPES@@](@@SHAPES@@);
float edgeContrast(float value,float outside){float peak=max(max(value,outside),0.0001);return value*value/peak;}
void main(){
  vec2 pixel=topLeft();
  vec2 base=floor(pixel)*style.viewport.zw;
  float values[6];
  vec3 colorSum=vec3(0.0);
  float weightSum=0.0;
  for(int i=0;i<6;i++){
    vec2 center=base+INNER[i]*style.viewport.zw;
    vec3 color=sampleSource(center);
    for(int tap=0;tap<6;tap++){color+=sampleSource(center+RING[tap]*style.viewport.w*0.161);}
    color/=7.0;
    values[i]=inkLevel(color);
    colorSum+=color*values[i];
    weightSum+=values[i];
  }
  if(weightSum<0.025){gl_FragColor=vec4(style.background.rgb,0.0);return;}
  float edges[10];
  for(int i=0;i<10;i++){edges[i]=inkLevel(sampleSource(base+OUTER[i]*style.viewport.zw));}
  values[0]=edgeContrast(values[0],max(max(edges[0],edges[1]),max(edges[2],edges[4])));
  values[1]=edgeContrast(values[1],max(max(edges[0],edges[1]),max(edges[3],edges[5])));
  values[2]=edgeContrast(values[2],max(edges[2],max(edges[4],edges[6])));
  values[3]=edgeContrast(values[3],max(edges[3],max(edges[5],edges[7])));
  values[4]=edgeContrast(values[4],max(max(edges[4],edges[6]),max(edges[8],edges[9])));
  values[5]=edgeContrast(values[5],max(max(edges[5],edges[7]),max(edges[8],edges[9])));
  float peak=max(max(max(values[0],values[1]),max(values[2],values[3])),max(values[4],values[5]));
  float gain=1.0/max(peak,0.001);
  vec3 a=vec3(values[0],values[1],values[2]);
  vec3 b=vec3(values[3],values[4],values[5]);
  vec3 shapeA=a*sqrt(a*gain)*gain;
  vec3 shapeB=b*sqrt(b*gain)*gain;
  int best=0;
  float bestDistance=100.0;
  for(int glyph=0;glyph<@@NGLYPHS@@;glyph++){
    vec3 da=shapeA-SHAPES[glyph*2];
    vec3 db=shapeB-SHAPES[glyph*2+1];
    float dist=dot(da,da)+dot(db,db);
    if(dist<bestDistance){best=glyph;bestDistance=dist;}
  }
  vec3 ink=style.background.rgb+(colorSum/weightSum-style.background.rgb)*2.2;
  gl_FragColor=vec4(clamp(ink,vec3(0.0),vec3(1.0)),float(best)/255.0);
}
`.replace('@@INNER@@',ASCII_SAMPLES.map(p=>`vec2(${p.join(',')})`).join(',')).replaceAll('@@NSHAPES@@',NG*2).replace('@@SHAPES@@',ASCII_SHAPES.flatMap(s=>[s.slice(0,3),s.slice(3)]).map(p=>`vec3(${p.map(v=>v.toFixed(6)).join(',')})`).join(',')).replace('@@NGLYPHS@@',NG));
  const FRAG_STYLE=frag(`precision highp float;precision highp int;\n${decl('Style',STYLE)}\n${STYLE_COMMON}\n
uniform sampler2D asciiCells;
const uvec2 GLYPHS[@@NGLYPHS@@]=uvec2[@@NGLYPHS@@](@@GLYPHS@@);
const float THRESHOLDS[16]=float[16](0.03125,0.53125,0.15625,0.65625,0.78125,0.28125,0.90625,0.40625,0.21875,0.71875,0.09375,0.59375,0.96875,0.46875,0.84375,0.34375);
float glyphBit(uint glyph,ivec2 point){
  if(any(lessThan(point,ivec2(0)))||point.x>=5||point.y>=7){return 0.0;}
  uint row=uint(point.y);
  uint bits=(row>=4u)?GLYPHS[glyph].y:GLYPHS[glyph].x;
  uint shift=(row%4u)*5u+4u-uint(point.x);
  return float((bits>>shift)&1u);
}
vec3 orderedDither(vec3 color,vec3 background,float threshold){
  vec3 residual=color-background;
  vec3 levels=abs(residual)*3.0;
  vec3 quantized=(floor(levels)+step(vec3(threshold),fract(levels)))/3.0;
  return clamp(background+sign(residual)*quantized,vec3(0.0),vec3(1.0));
}
void main(){
  vec2 pixel=topLeft();
  vec2 cellPosition=pixel/style.viewport.zw;
  ivec2 cell=ivec2(floor(cellPosition));
  if(style.mode.x<1.5){
    vec3 color=sampleSource((vec2(cell)+0.5)*style.viewport.zw);
    uint index=uint(cell.x%4)*4u+uint(cell.y%4);
    gl_FragColor=vec4(orderedDither(color,style.background.rgb,THRESHOLDS[index]),1.0);
    return;
  }
  ivec2 dims=textureSize(asciiCells,0);
  ivec2 cc=clamp(cell,ivec2(0),dims-1);
  vec4 info=texelFetch(asciiCells,ivec2(cc.x,dims.y-1-cc.y),0);
  uint glyph=min(uint(round(info.a*255.0)),@@LASTGLYPH@@u);
  vec2 local=fract(cellPosition)*vec2(6.0,10.0)-vec2(0.5,1.5);
  vec2 footprint=vec2(6.0,10.0)/style.viewport.zw;
  vec2 low=local-footprint*0.5;
  vec2 high=local+footprint*0.5;
  ivec2 origin=ivec2(floor(low));
  float coverage=0.0;
  for(int y=0;y<3;y++){for(int x=0;x<3;x++){
    ivec2 point=origin+ivec2(x,y);
    vec2 overlap=max(vec2(0.0),min(high,vec2(point+1))-max(low,vec2(point)));
    coverage+=glyphBit(glyph,point)*overlap.x*overlap.y;
  }}
  coverage/=footprint.x*footprint.y;
  gl_FragColor=vec4(mix(style.background.rgb,info.rgb,clamp(coverage,0.0,1.0)),1.0);
}
`.replaceAll('@@NGLYPHS@@',NG).replace('@@LASTGLYPH@@',NG-1).replace('@@GLYPHS@@',ASCII_GLYPHS.map(rows=>`uvec2(${rows.slice(0,4).reduce((s,r,i)=>s+r*2**(i*5),0)}u,${rows.slice(4).reduce((s,r,i)=>s+r*2**(i*5),0)}u)`).join(',')));
  // ---- GPU resources (shared renderer) ----
  const cache=new WeakMap();let gpu;
  const v4=()=>new THREE.Vector4();
  const uni=(p,names)=>Object.fromEntries(names.map(n=>[`u${p}_${n}`,{value:v4()}]));
  function pass(vertexShader,fragmentShader,uniforms,opts={}){return new THREE.ShaderMaterial({glslVersion:THREE.GLSL3,vertexShader,fragmentShader,uniforms,depthTest:false,depthWrite:false,transparent:false,blending:THREE.NoBlending,...opts});}
  function rt(w,h,type,filter){const t=new THREE.WebGLRenderTarget(w,h,{depthBuffer:false,stencilBuffer:false,type,minFilter:filter,magFilter:filter,generateMipmaps:false});t.texture.colorSpace=THREE.NoColorSpace;return t;}
  function init(){
    const renderer=window.__cerebra?.stage.renderer;if(!renderer)return;
    const view=uni('View',VIEW),post=uni('Post',POST),style=uni('Style',STYLE);
    const shardGeometry=new THREE.InstancedBufferGeometry();shardGeometry.setAttribute('position',new THREE.BufferAttribute(new Float32Array(18),3));shardGeometry.instanceCount=1;
    const shardMesh=new THREE.Mesh(shardGeometry,pass(VERT_SHARD,FRAG_SHARD,view,{transparent:true,blending:THREE.CustomBlending,blendEquation:THREE.AddEquation,blendSrc:THREE.OneFactor,blendDst:THREE.OneMinusSrcAlphaFactor,side:THREE.DoubleSide}));shardMesh.frustumCulled=false;
    const shardScene=new THREE.Scene();shardScene.add(shardMesh);
    const quad=new THREE.PlaneGeometry(2,2),camera=new THREE.OrthographicCamera(-1,1,1,-1,0,1);
    const mk=(frag,uniforms)=>{const m=new THREE.Mesh(quad,pass(POST_VERT,frag,uniforms));m.frustumCulled=false;const s=new THREE.Scene();s.add(m);return {scene:s,material:m.material};};
    const targets={scene:rt(1,1,THREE.UnsignedByteType,THREE.LinearFilter),bloom:rt(1,1,THREE.HalfFloatType,THREE.LinearFilter),scratch:rt(1,1,THREE.HalfFloatType,THREE.LinearFilter),style:rt(1,1,THREE.UnsignedByteType,THREE.LinearFilter),ascii:rt(1,1,THREE.UnsignedByteType,THREE.NearestFilter),out:rt(1,1,THREE.UnsignedByteType,THREE.NearestFilter)};
    const passes={
      bloom:mk(FRAG_BLOOM,{...post,sceneTexture:{value:null},uRes:{value:new THREE.Vector2()}}),
      blur:mk(FRAG_BLUR,{bloomTexture:{value:null},uRes:{value:new THREE.Vector2()},uDirection:{value:new THREE.Vector2()}}),
      finish:mk(FRAG_FINISH,{...post,sceneTexture:{value:null},bloomTexture:{value:null},uRes:{value:new THREE.Vector2()}}),
      ascii:mk(FRAG_ASCII,{...style,sourceTexture:{value:null},uRes:{value:new THREE.Vector2()}}),
      style:mk(FRAG_STYLE,{...style,sourceTexture:{value:null},asciiCells:{value:null},uRes:{value:new THREE.Vector2()}})
    };
    gpu={renderer,view,post,style,shardGeometry,shardScene,camera,quad,targets,passes,bytes:new Uint8Array(4),key:''};
    addEventListener('pagehide',()=>{Object.values(targets).forEach(t=>t.dispose());shardGeometry.dispose();quad.dispose();shardMesh.material.dispose();Object.values(passes).forEach(p=>p.material.dispose());gpu=null;},{once:true});
    return gpu;
  }
  const sizeTarget=(t,w,h)=>{if(t.width!==w||t.height!==h)t.setSize(w,h);};
  // ---- settings (formulas from the component body) ----
  function settingsOf(p){
    const material=MATERIAL_PRESETS[p.material]||MATERIAL_PRESETS.pearl,detail=DETAIL_PRESETS[p.detail]||DETAIL_PRESETS.balanced,effect=EFFECTS[p.effect]??0;
    const effectDetail=effect===0?1:.4,effectSize=effect===0?1:1.75;
    const background=parseColor(p.backgroundColor,defaults.backgroundColor),shard=parseColor(p.shardColor,defaults.shardColor),accent=parseColor(p.accentColor,defaults.accentColor);
    const speed=clamp(p.speed,0,2),density=clamp(p.density,.5,1.5),stretch=clamp(p.stretch,.6,1.8);
    const luma=background[0]*.2126+background[1]*.7152+background[2]*.0722,light=clamp((luma-.58)/.24,0,1),lightSurface=light*light*(3-2*light);
    return {background,shard,accent,highlight:mixColor(accent,[1,1,1,1],material.highlightMix),composition:PLACEMENTS[p.placement]??3,flow:FLOWS[p.flow]??0,material:MATERIALS[p.material]??0,effect,
      detailCount:detail.count*density*effectDetail,shardSize:detail.size*clamp(p.shardSize,.5,1.5)*effectSize,scale:clamp(p.scale,.5,2.5),stretch:stretch*(1+Math.min(speed*.34,1.2)*.1),speed,spin:clamp(p.spin,0,2),
      turbulence:.36*clamp(p.turbulence,0,2),spread:clamp(p.spread,.15,1.1),depth:clamp(p.depth,0,1.25),roughness:material.roughness,brightness:material.brightness,glow:material.glow*clamp(p.glow,0,2),
      edgeSoftness:clamp(p.edgeSoftness,0,2),bloom:clamp(p.bloom,0,3),grain:clamp(p.grain,0,.12),chromaticAberration:clamp(p.chromaticAberration,0,.01)*(effect===0?1:.2),
      exposure:1.12+(.96-1.12)*lightSurface,lightSurface,count:(QUALITY_PRESETS[p.quality]||QUALITY_PRESETS.medium).count};
  }
  const set4=(u,v)=>u.value.set(v[0],v[1],v[2],v[3]);
  function draw(g,w,h,t,options,mode={}){
    const p={...defaults,...options},cssW=Math.max(1,w/(mode.k||1)),cssH=Math.max(1,h/(mode.k||1));
    const limit=mode.preview?(mode.background?640:mode.selected?1024:640):4096;
    const scale=Math.min(limit/Math.max(w,h),Math.sqrt((mode.preview?1.2e6:8e6)/Math.max(1,w*h)),1),W=Math.max(16,Math.round(w*scale)),H=Math.max(16,Math.round(h*scale));
    const time=Math.floor(Math.max(0,t)*30)/30;
    const key=JSON.stringify([p,W,H,time]);let c=cache.get(g);
    if((!c||c.key!==key)&&!(mode.preview&&c?.pending)){
      const a=gpu||init();if(!a)return;
      if(!c){const canvas=document.createElement('canvas');c={canvas,ctx:canvas.getContext('2d')};cache.set(g,c);}if(!c.ctx)return;
      const S=settingsOf(p),aspect=W/H,weights=layoutVector(S.composition),flowW=layoutVector(S.flow);
      const flowDistance=time*S.speed*.34,travel=(time*S.speed*.34/resolvePathLength(aspect,weights))%1;
      const shardWorld=.0125*S.shardSize,count=Math.max(700,Math.round(S.count*S.detailCount));
      const lx=-.38,ly=.58,ll=Math.hypot(lx,ly,1),inv=1/S.scale;
      const V=a.view,P=a.post,ST=a.style;
      set4(V.uView_viewport,[aspect,shardWorld,S.scale,flowDistance]);set4(V.uView_shape,[S.spread,S.depth,S.turbulence,0]);set4(V.uView_effects,[S.spin,S.edgeSoftness,S.stretch,S.exposure]);
      set4(V.uView_composition,weights);set4(V.uView_transport,[travel,Math.min(1,(1-Math.max(...weights))*12),0,0]);set4(V.uView_formation,flowW);
      set4(V.uView_gather,[0,0,0,0]);set4(V.uView_pointer,[0,0,S.interactionRadius||.54,0]);['shock','shockB','shockC','shockD'].forEach(n=>set4(V['uView_'+n],[0,0,4,0]));
      set4(V.uView_material,[S.roughness,S.material,S.brightness,S.glow]);set4(V.uView_light,[lx/ll,ly/ll,1/ll,0]);set4(V.uView_environment,[S.lightSurface,0,0,0]);
      set4(V.uView_baseColor,S.shard);set4(V.uView_highlightColor,S.highlight);set4(V.uView_accentColor,S.accent);
      const bloomW=Math.max(1,Math.round(W*.25)),bloomH=Math.max(1,Math.round(H*.25));
      set4(P.uPost_viewport,[W,H,1/W,1/H]);set4(P.uPost_bloomInfo,[1/bloomW,1/bloomH,.2,.12]);set4(P.uPost_finishing,[S.bloom,S.grain,S.chromaticAberration,S.lightSurface]);
      set4(P.uPost_background,S.background);set4(P.uPost_tint,mixColor(S.shard,S.accent,.4));set4(P.uPost_temporal,[time,0,0,0]);
      const cellW=(S.effect===2?3.6:1)*W/cssW,cellH=(S.effect===2?6:1)*H/cssH;
      set4(ST.uStyle_viewport,[W,H,cellW,cellH]);set4(ST.uStyle_background,S.background);set4(ST.uStyle_mode,[S.effect,0,0,0]);
      a.shardGeometry.instanceCount=count;
      const T=a.targets,pa=a.passes;sizeTarget(T.scene,W,H);sizeTarget(T.out,W,H);
      const r=a.renderer,old=r.getRenderTarget(),vp=r.getViewport(new THREE.Vector4()),sc=r.getScissor(new THREE.Vector4()),test=r.getScissorTest(),auto=r.autoClear,clear=r.getClearColor(new THREE.Color()),alpha=r.getClearAlpha();
      const run=(target,scene,color,alphaValue)=>{r.setRenderTarget(target);r.setViewport(0,0,target.width,target.height);r.setScissorTest(false);r.setClearColor(new THREE.Color(color[0],color[1],color[2]),alphaValue);r.clear(true,false,false);r.render(scene,a.camera);};
      const full=(pass,target,tex)=>{pass.material.uniforms.uRes.value.set(target.width,target.height);Object.entries(tex||{}).forEach(([k,v])=>{pass.material.uniforms[k].value=v;});};
      const ticket=c.ticket=(c.ticket||0)+1;
      const present=bytes=>{
        if(c.ticket!==ticket||gpu!==a)return;
        if(c.canvas.width!==W||c.canvas.height!==H){c.canvas.width=W;c.canvas.height=H;c.image=null;}const image=c.image||(c.image=c.ctx.createImageData(W,H));
        for(let row=0;row<H;row++)image.data.set(bytes.subarray((H-1-row)*W*4,(H-row)*W*4),row*W*4);
        c.ctx.putImageData(image,0,0);c.key=key;
      };
      try{
        r.autoClear=false;
        const post=S.effect!==0||S.bloom>.0001||S.grain>.0001||S.chromaticAberration>.000001;
        const bg=S.background;
        if(!post){run(T.out,a.shardScene,bg,1);}
        else{
          run(T.scene,a.shardScene,bg,1);
          let source=T.scene;
          if(S.effect===2){const cw=Math.max(1,Math.ceil(W/cellW)),ch=Math.max(1,Math.ceil(H/cellH));sizeTarget(T.ascii,cw,ch);full(pa.ascii,T.ascii,{sourceTexture:T.scene.texture});run(T.ascii,pa.ascii.scene,[0,0,0],0);}
          if(S.effect!==0){sizeTarget(T.style,W,H);full(pa.style,T.style,{sourceTexture:T.scene.texture,asciiCells:S.effect===2?T.ascii.texture:T.scene.texture});run(T.style,pa.style.scene,bg,1);source=T.style;}
          if(S.bloom>.0001){
            sizeTarget(T.bloom,bloomW,bloomH);sizeTarget(T.scratch,bloomW,bloomH);
            full(pa.bloom,T.bloom,{sceneTexture:source.texture});run(T.bloom,pa.bloom.scene,[0,0,0],1);
            pa.blur.material.uniforms.uDirection.value.set(1/bloomW,0);full(pa.blur,T.scratch,{bloomTexture:T.bloom.texture});run(T.scratch,pa.blur.scene,[0,0,0],1);
            pa.blur.material.uniforms.uDirection.value.set(0,1/bloomH);full(pa.blur,T.bloom,{bloomTexture:T.scratch.texture});run(T.bloom,pa.blur.scene,[0,0,0],1);
          }
          full(pa.finish,T.out,{sceneTexture:source.texture,bloomTexture:T.bloom.texture});run(T.out,pa.finish.scene,bg,1);
        }
        if(mode.preview&&r.readRenderTargetPixelsAsync&&!c.asyncFailed){if(c.bytes?.length!==W*H*4)c.bytes=new Uint8Array(W*H*4);c.pending=true;r.readRenderTargetPixelsAsync(T.out,0,0,W,H,c.bytes).then(present).catch(()=>{c.asyncFailed=true;}).finally(()=>{c.pending=false;});}
        else{if(a.bytes.length!==W*H*4)a.bytes=new Uint8Array(W*H*4);r.readRenderTargetPixels(T.out,0,0,W,H,a.bytes);present(a.bytes);}
      }finally{r.setRenderTarget(old);r.setViewport(vp);r.setScissor(sc);r.setScissorTest(test);r.autoClear=auto;r.setClearColor(clear,alpha);}
    }
    if(c?.key&&c.canvas.width){g.save();g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';g.drawImage(c.canvas,0,0,w,h);g.restore();}
  }
  const range=(k,label,min,max,step)=>({k,t:'range',label,min,max,step}),select=(k,label,opts)=>({k,t:'select',label,opts}),color=(k,label)=>({k,t:'color',label});
  const kit={label:'Aero Shards',size:[.9,.6],cover:true,background:true,noShuffle:true,
    bgGroups:{colour:['backgroundColor','shardColor','accentColor'],look:['placement','flow','material','detail','effect','scale','spread','depth','density','shardSize','stretch','turbulence','glow','edgeSoftness','bloom','grain','chromaticAberration'],motion:['speed','spin'],interaction:[],quality:['quality']},anim:true,motionOnAdd:true,defaults,
    ui:[color('backgroundColor','Background colour'),color('shardColor','Shard colour'),color('accentColor','Accent colour'),
      select('placement','Placement',[['full','Full'],['right','Right'],['left','Left'],['center','Centre']]),select('flow','Flow',[['stream','Stream'],['vortex','Vortex'],['ribbon','Ribbon']]),
      select('material','Material',[['pearl','Pearl'],['chrome','Chrome'],['satin','Satin']]),select('detail','Detail',[['balanced','Balanced'],['bold','Bold'],['fine','Fine']]),
      select('effect','Effect',[['none','None'],['dither','Dither'],['ascii','ASCII']]),
      range('scale','Scale',.5,2.5,.05),range('spread','Spread',.15,1.1,.05),range('depth','Depth',0,1.25,.05),range('speed','Flow speed',0,2,.05),range('spin','Spin',0,2,.05),
      range('density','Density',.5,1.5,.05),range('shardSize','Shard size',.5,1.5,.05),range('stretch','Stretch',.6,1.8,.05),range('turbulence','Turbulence',0,2,.05),
      range('glow','Glow',0,2,.05),range('edgeSoftness','Edge softness',0,2,.05),range('bloom','Bloom',0,3,.05),range('grain','Grain',0,.12,.005),range('chromaticAberration','Chromatic aberration',0,.01,.0005),
      select('quality','Quality',[['low','Low'],['medium','Medium'],['high','High']])],
    draw(g,it,x,y,w,h,k){const M=kitM(it),p={...defaults,...it.p};g.save();g.translate(x,y);try{draw(g,w,h,M.a?M.t*M.a/.6:0,p,{k:k||1,preview:typeof KIT_PREVIEW!=='undefined'&&KIT_PREVIEW,selected:it===window.__cerebra?.studio?.sel&&!it.bg&&!window.__cerebra.studio.lite,background:!!it.bg});}finally{g.restore();}}
  };
  window.CerebraAeroShards={draw,defaults,kit,reference:'DavidHDev/react-bits/AeroShards',renderer:'shared-webgl',preview:'async-readback'};
})();
