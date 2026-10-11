/* F4: distance haze on each world's surface, revealed by the page's scroll progress. */
Effects.register({
  id:'atmosphere',prefix:'a_',title:'Atmosphere',
  defaults:{enabled:1,start:.03,end:.002,amount:1},
  controls:[
    {key:'start',label:'Near start',min:0,max:.08,step:.001},
    {key:'end',label:'At end',min:0,max:.08,step:.001},
    {key:'amount',label:'Amount',min:0,max:1,step:.01}
  ],
  attach(w){w.U.uKyFog={value:0};},
  update(w){const t=w.tune,p=clamp((window.__cerebra?.scroll?.smooth||0)/12,0,1);w.U.uKyFog.value=t.a_enabled?lerp(t.a_start,t.a_end,p)*t.a_amount:0;},
  PARS:'uniform float uKyFog;',
  TAIL:`float kyFogDistance=length(cameraPosition-vKyWP);float kyFog=1.0-exp(-uKyFog*uKyFog*kyFogDistance*kyFogDistance);gl_FragColor.rgb=mix(gl_FragColor.rgb,vec3(0.002,0.0025,0.004),clamp(kyFog,0.0,1.0));`
});
