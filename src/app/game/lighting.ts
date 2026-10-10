import * as THREE from 'three';

/** Sky dome plus the day/night colour tables. The render loop eases `CUR` toward `LT`. */
export function createLighting(scene: THREE.Scene) {
  // sky dome: vertical gradient, colours driven by the clock
  const skyU = {
    top: { value: new THREE.Color('#3f8bd8') },
    bot: { value: new THREE.Color('#d9ecf2') },
    sunDir: { value: new THREE.Vector3(0.4, 0.8, 0.3).normalize() },
    sunCol: { value: new THREE.Color('#fff1d6') },
  };
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(600, 32, 16),
    new THREE.ShaderMaterial({
      uniforms: skyU,
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
      vertexShader:
        'varying vec3 vP;void main(){vP=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
      // gradient from horizon to zenith, a warm haze near the horizon on the sun's side, and a soft glow round the sun
      fragmentShader: `uniform vec3 top;uniform vec3 bot;uniform vec3 sunDir;uniform vec3 sunCol;varying vec3 vP;
void main(){
  float h=clamp(vP.y*1.8+0.12,0.0,1.0);
  vec3 c=mix(bot,top,pow(h,0.7));
  float s=max(dot(normalize(vP),normalize(sunDir)),0.0);
  float low=1.0-clamp(vP.y*3.0,0.0,1.0);
  c+=sunCol*(pow(s,6.0)*0.18*low+pow(s,180.0)*0.55);
  gl_FragColor=vec4(c,1.0);
}`,
    }),
  );
  sky.renderOrder = -1;
  scene.add(sky);
  // hour, sky top, horizon, ambient, sun intensity, sun colour
  const SKY: [number, string, string, number, number, string][] = [
    [0, '#070d1f', '#18243f', 0.22, 0.15, '#9fb4ff'],
    [5, '#141d40', '#3b3a5c', 0.3, 0.2, '#9fb4ff'],
    [6, '#5d7fc0', '#f5b27c', 0.55, 0.7, '#ffb070'],
    [8, '#4a90d9', '#d6ecf3', 0.75, 1.35, '#fff1d6'],
    [16, '#3f8bd8', '#d9ecf2', 0.75, 1.4, '#fff1d6'],
    [18, '#4b5c9c', '#f39255', 0.55, 0.8, '#ff9a55'],
    [19, '#26305e', '#9a5a62', 0.38, 0.35, '#ff8a60'],
    [20, '#0f1834', '#1d2846', 0.25, 0.15, '#9fb4ff'],
    [24, '#070d1f', '#18243f', 0.22, 0.15, '#9fb4ff'],
  ];
  const mkLight = () => ({
    top: new THREE.Color(),
    bot: new THREE.Color(),
    amb: 0.75,
    sunI: 1.4,
    sunC: new THREE.Color(),
    sunP: new THREE.Vector3(40, 80, 30),
    night: 0,
  });
  const LT = mkLight();
  const CUR = mkLight();
  CUR.top.set('#3f8bd8');
  CUR.bot.set('#d9ecf2');
  CUR.sunC.set('#fff1d6');
  function setTimeTarget(h: number) {
    let i = 0;
    while (i < SKY.length - 1 && SKY[i + 1][0] <= h) i++;
    const a = SKY[i],
      b = SKY[Math.min(i + 1, SKY.length - 1)];
    const t = b[0] === a[0] ? 0 : (h - a[0]) / (b[0] - a[0]);
    LT.top.set(a[1]).lerp(new THREE.Color(b[1]), t);
    LT.bot.set(a[2]).lerp(new THREE.Color(b[2]), t);
    LT.amb = a[3] + (b[3] - a[3]) * t;
    LT.sunI = a[4] + (b[4] - a[4]) * t;
    LT.sunC.set(a[5]).lerp(new THREE.Color(b[5]), t);
    const day = h >= 6 && h <= 18;
    if (day) {
      const ang = ((h - 6) / 12) * Math.PI;
      LT.sunP.set(-Math.cos(ang) * 75, Math.max(18, Math.sin(ang) * 95), 38);
    } else LT.sunP.set(-30, 85, 25);
    LT.night = Math.max(0, Math.min(1, (1.0 - LT.sunI) / 0.8));
  }
  function snapLight() {
    CUR.top.copy(LT.top);
    CUR.bot.copy(LT.bot);
    CUR.amb = LT.amb;
    CUR.sunI = LT.sunI;
    CUR.sunC.copy(LT.sunC);
    CUR.sunP.copy(LT.sunP);
    CUR.night = LT.night;
  }
  return { skyU, sky, LT, CUR, setTimeTarget, snapLight };
}
