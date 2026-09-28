/* F3: per-world camera offsets, applied by Orrery.frame without per-frame allocations. */
const CAMERA_RIG = Effects.register({
  id:'camera', prefix:'c_', title:'Camera',
  defaults:{enabled:1,yaw:0,pitch:0,distance:1,height:0,fov:34},
  controls:[
    {key:'yaw',label:'Yaw',min:-180,max:180,step:1},
    {key:'pitch',label:'Pitch',min:-60,max:60,step:1},
    {key:'distance',label:'Distance',min:.6,max:2,step:.01},
    {key:'height',label:'Look height',min:-1,max:1,step:.01},
    {key:'fov',label:'Field of view',min:24,max:60,step:1}
  ],
  pose(w,out){
    const t=w.tune;if(!t.c_enabled)return out;
    const p=w.group.position,dx=out.pos.x-p.x,dy=out.pos.y-p.y,dz=out.pos.z-p.z;
    const d=Math.hypot(dx,dy,dz)*t.c_distance;
    const yaw=Math.atan2(dx,dz)+t.c_yaw*Math.PI/180;
    const pitch=clamp(Math.atan2(dy,Math.hypot(dx,dz))+t.c_pitch*Math.PI/180,-1.4,1.4);
    out.pos.set(p.x+d*Math.cos(pitch)*Math.sin(yaw),p.y+d*Math.sin(pitch),p.z+d*Math.cos(pitch)*Math.cos(yaw));
    out.look.y+=w.def.radius*t.c_height;return out;
  }
});
