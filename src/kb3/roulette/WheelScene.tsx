"use client";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { pocketsFor, colorOf, makeRng } from "./engine";
import type { RouletteVariant } from "./engine";
import { makePlan, ballAt, wheelRotAt } from "./spinPlan";
import type { SpinPlan } from "./spinPlan";
import { rlSfx } from "./sfx";
import WheelFallback from "./WheelFallback";

export interface WheelSceneProps {
  variant: RouletteVariant;
  accent: string;
  accent2: string;
  spinId: number;
  targetIndex: number;
  idleAfter?: boolean;
  skipSignal?: number;
  onSettled?: () => void;
}

function pocketTexture(pockets: string[]): THREE.CanvasTexture {
  const S = 2048;
  const cv = document.createElement("canvas");
  cv.width = S; cv.height = S;
  const ctx = cv.getContext("2d")!;
  const c = S / 2;
  ctx.fillStyle = "#0a0d12";
  ctx.fillRect(0, 0, S, S);
  ctx.translate(c, c);
  ctx.scale(1, -1);
  const step = (Math.PI * 2) / pockets.length;
  const rOut = 1000, rIn = 640;
  pockets.forEach(function (n, i) {
    const a = i * step;
    const col = colorOf(n);
    ctx.save();
    ctx.rotate(a);
    ctx.beginPath();
    ctx.arc(0, 0, rOut, -step / 2, step / 2);
    ctx.arc(0, 0, rIn, step / 2, -step / 2, true);
    ctx.closePath();
    ctx.fillStyle = col === "red" ? "#c22733" : col === "black" ? "#14181f" : "#0d8a52";
    ctx.fill();
    ctx.strokeStyle = "#d9b45a";
    ctx.lineWidth = 5;
    ctx.stroke();
    ctx.translate((rOut + rIn) / 2, 0);
    ctx.rotate(Math.PI / 2);
    ctx.fillStyle = "#ffffff";
    ctx.font = "900 76px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(n, 0, 0);
    ctx.restore();
  });
  const tex = new THREE.CanvasTexture(cv);
  tex.anisotropy = 8;
  return tex;
}

function woodTexture(): THREE.CanvasTexture {
  const S = 512;
  const cv = document.createElement("canvas");
  cv.width = S; cv.height = S;
  const ctx = cv.getContext("2d")!;
  const g = ctx.createLinearGradient(0, 0, S, S);
  g.addColorStop(0, "#7a4a22"); g.addColorStop(0.5, "#5a3416"); g.addColorStop(1, "#3a2008");
  ctx.fillStyle = g; ctx.fillRect(0, 0, S, S);
  for (let i = 0; i < 90; i++) {
    ctx.strokeStyle = "rgba(30,15,4," + (0.05 + Math.random() * 0.12) + ")";
    ctx.lineWidth = 1 + Math.random() * 3;
    ctx.beginPath();
    const y = Math.random() * S;
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(S * 0.3, y + (Math.random() - 0.5) * 40, S * 0.7, y + (Math.random() - 0.5) * 40, S, y);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.wrapS = THREE.RepeatWrapping; tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function blobTexture(): THREE.CanvasTexture {
  const S = 128;
  const cv = document.createElement("canvas");
  cv.width = S; cv.height = S;
  const ctx = cv.getContext("2d")!;
  const g = ctx.createRadialGradient(S / 2, S / 2, 4, S / 2, S / 2, S / 2);
  g.addColorStop(0, "rgba(0,0,0,0.5)"); g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g; ctx.fillRect(0, 0, S, S);
  return new THREE.CanvasTexture(cv);
}

export default function WheelScene(props: WheelSceneProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  const planRef = useRef<SpinPlan | null>(null);
  const t0Ref = useRef(0);
  const offRef = useRef(0);
  const firedRef = useRef(false);
  const rotRef = useRef(0);
  const idleT0Ref = useRef(0);
  const propsRef = useRef(props);
  propsRef.current = props;
  const readyRef = useRef(false);

  useEffect(function () {
    const host = hostRef.current;
    if (!host) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      if (!renderer.getContext()) throw new Error("no webgl");
    } catch (e) { setFailed(true); return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.shadowMap.autoUpdate = false;
    host.appendChild(renderer.domElement);
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.display = "block";

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x05080c, 0.02);
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;

    const pockets = pocketsFor(propsRef.current.variant);
    const accent = new THREE.Color(propsRef.current.accent);
    const accent2 = new THREE.Color(propsRef.current.accent2);
    const wheel = new THREE.Group();
    scene.add(wheel);

    const woodMat = new THREE.MeshStandardMaterial({ map: woodTexture(), color: accent.clone().lerp(new THREE.Color("#8a5a2a"), 0.72), roughness: 0.5, metalness: 0.12 });
    const metalMat = new THREE.MeshStandardMaterial({ color: 0xd8dee6, roughness: 0.22, metalness: 0.95 });
    const goldMat = new THREE.MeshStandardMaterial({ color: accent2.clone().lerp(new THREE.Color("#d9b45a"), 0.5), roughness: 0.25, metalness: 0.9 });
    const coneMat = new THREE.MeshStandardMaterial({ color: accent.clone().lerp(new THREE.Color("#ffffff"), 0.25), roughness: 0.16, metalness: 0.9 });

    const profile: THREE.Vector2[] = [
      new THREE.Vector2(3.55, 0.5), new THREE.Vector2(3.6, 0.28), new THREE.Vector2(3.45, 0.12),
      new THREE.Vector2(3.05, 0.06), new THREE.Vector2(2.6, -0.06), new THREE.Vector2(2.45, -0.2),
      new THREE.Vector2(1.55, -0.24), new THREE.Vector2(1.2, -0.05), new THREE.Vector2(0.9, 0.15),
      new THREE.Vector2(0.55, 0.5), new THREE.Vector2(0.3, 0.75), new THREE.Vector2(0.001, 0.8)
    ];
    const bowl = new THREE.Mesh(new THREE.LatheGeometry(profile, 96), woodMat);
    bowl.receiveShadow = true;
    wheel.add(bowl);

    const track = new THREE.Mesh(new THREE.TorusGeometry(2.95, 0.05, 12, 96), metalMat);
    track.rotation.x = Math.PI / 2; track.position.y = 0.06;
    wheel.add(track);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(3.55, 0.07, 12, 96), goldMat);
    rim.rotation.x = Math.PI / 2; rim.position.y = 0.5;
    wheel.add(rim);

    const ringTex = pocketTexture(pockets);
    const ring = new THREE.Mesh(new THREE.RingGeometry(1.55, 2.45, 96, 1), new THREE.MeshStandardMaterial({ map: ringTex, roughness: 0.6, metalness: 0.15, side: THREE.DoubleSide }));
    ring.rotation.x = Math.PI / 2; ring.position.y = -0.22;
    wheel.add(ring);

    const step = (Math.PI * 2) / pockets.length;
    const fretGeo = new THREE.BoxGeometry(0.035, 0.07, 0.9);
    const frets = new THREE.InstancedMesh(fretGeo, metalMat, pockets.length);
    const m4 = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const eu = new THREE.Euler();
    for (let i = 0; i < pockets.length; i++) {
      const a = i * step + step / 2;
      eu.set(0, Math.PI / 2 - a, 0);
      q.setFromEuler(eu);
      m4.compose(new THREE.Vector3(Math.cos(a) * 2.0, -0.18, Math.sin(a) * 2.0), q, new THREE.Vector3(1, 1, 1));
      frets.setMatrixAt(i, m4);
    }
    wheel.add(frets);

    const cone = new THREE.Mesh(new THREE.LatheGeometry([
      new THREE.Vector2(1.15, -0.05), new THREE.Vector2(0.9, 0.12), new THREE.Vector2(0.5, 0.42),
      new THREE.Vector2(0.22, 0.62), new THREE.Vector2(0.001, 0.7)
    ], 64), coneMat);
    wheel.add(cone);
    const collar = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.06, 10, 48), goldMat);
    collar.rotation.x = Math.PI / 2; collar.position.y = 0.42;
    wheel.add(collar);
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.12, 20, 16), goldMat);
    cap.position.y = 0.74;
    wheel.add(cap);

    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.085, 24, 18), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.12, metalness: 0.05 }));
    scene.add(ball);
    const blob = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.34), new THREE.MeshBasicMaterial({ map: blobTexture(), transparent: true, depthWrite: false }));
    blob.rotation.x = -Math.PI / 2;
    scene.add(blob);

    scene.add(new THREE.AmbientLight(0xffffff, 0.45));
    const key = new THREE.DirectionalLight(0xfff2dd, 1.4);
    key.position.set(5, 9, 4);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.left = -5; key.shadow.camera.right = 5;
    key.shadow.camera.top = 5; key.shadow.camera.bottom = -5;
    scene.add(key);
    bowl.castShadow = true; cone.castShadow = true;
    const glow = new THREE.PointLight(accent.getHex(), 2.2, 12);
    glow.position.set(0, 3.2, 0);
    scene.add(glow);
    const rimLight = new THREE.PointLight(0x66aaff, 1.2, 14);
    rimLight.position.set(-6, 4, -5);
    scene.add(rimLight);

    const pGeo = new THREE.BufferGeometry();
    const pCount = 70;
    const pPos = new Float32Array(pCount * 3);
    for (let i = 0; i < pCount; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 1 + Math.random() * 3.4;
      pPos[i * 3] = Math.cos(a) * r;
      pPos[i * 3 + 1] = Math.random() * 3;
      pPos[i * 3 + 2] = Math.sin(a) * r;
    }
    pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
    const particles = new THREE.Points(pGeo, new THREE.PointsMaterial({ color: accent.getHex(), size: 0.06, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false }));
    scene.add(particles);

    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 60);
    let azim = -0.5, polar = 1.01, tAzim = -0.5, tPolar = 1.01;
    function placeCam() {
      const d = 7.4;
      camera.position.set(d * Math.sin(polar) * Math.cos(azim), d * Math.cos(polar), d * Math.sin(polar) * Math.sin(azim));
      camera.lookAt(0, 0.1, 0);
    }
    function onMove(ev: PointerEvent) {
      const r = host!.getBoundingClientRect();
      const nx = ((ev.clientX - r.left) / r.width) * 2 - 1;
      const ny = ((ev.clientY - r.top) / r.height) * 2 - 1;
      tAzim = -0.5 + nx * 0.14;
      tPolar = 1.01 + ny * 0.07;
    }
    host.addEventListener("pointermove", onMove);

    function resize() {
      const w = host!.clientWidth || 600;
      const h = host!.clientHeight || 400;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(host);
    renderer.shadowMap.needsUpdate = true;

    let raf = 0;
    let hiddenAt = 0;
    let lastPass = -1;
    let hopPrev = 0;
    const idleOmega = -0.45;
    idleT0Ref.current = performance.now();
    readyRef.current = true;

    function loop() {
      raf = requestAnimationFrame(loop);
      const now = performance.now();
      const pr = propsRef.current;
      const p = planRef.current;
      let rot: number;
      let ang = 0.6;
      let r01 = 0;
      let hop = 0;
      let speed = 0;
      if (p) {
        const t = (now - t0Ref.current) / 1000 + offRef.current;
        rot = wheelRotAt(p, t, !!pr.idleAfter);
        if (t >= p.duration) {
          ang = p.pocketAngle - rot; r01 = 0; hop = 0; speed = 0;
        } else {
          const b = ballAt(p, t);
          ang = b.angle; r01 = b.r01; hop = b.hop; speed = b.speed01;
        }
        const pass = Math.floor(ang / step);
        if (pass !== lastPass && r01 > 0.4 && speed > 0.06) { rlSfx.tick(speed); }
        lastPass = pass;
        if (hopPrev <= 0.001 && hop > 0.001) rlSfx.bounce();
        hopPrev = hop;
        if (t >= p.duration && !firedRef.current) {
          firedRef.current = true;
          rlSfx.spinStop();
          rlSfx.settle();
          if (pr.onSettled) pr.onSettled();
        }
      } else {
        rot = idleOmega * (now - idleT0Ref.current) / 1000;
        ang = -rot; r01 = 0;
      }
      rotRef.current = rot;
      wheel.rotation.y = rot;
      const r = 2.0 + 0.95 * r01;
      const surfY = -0.16 + 0.28 * r01;
      ball.position.set(Math.cos(ang) * r, surfY + 0.085 + hop, Math.sin(ang) * r);
      blob.position.set(ball.position.x, surfY + 0.012, ball.position.z);
      const sc = 1 + hop * 2;
      blob.scale.set(sc, sc, sc);
      const pos = pGeo.getAttribute("position") as THREE.BufferAttribute;
      for (let i = 0; i < pCount; i++) {
        let y = pos.getY(i) + 0.0035;
        if (y > 3.2) y = 0;
        pos.setY(i, y);
      }
      pos.needsUpdate = true;
      azim += (tAzim - azim) * 0.06;
      polar += (tPolar - polar) * 0.06;
      placeCam();
      renderer.render(scene, camera);
    }
    raf = requestAnimationFrame(loop);

    function onVis() {
      if (document.hidden) {
        hiddenAt = performance.now();
        cancelAnimationFrame(raf);
        rlSfx.spinStop();
      } else {
        const dt = performance.now() - hiddenAt;
        t0Ref.current += dt;
        idleT0Ref.current += dt;
        raf = requestAnimationFrame(loop);
      }
    }
    document.addEventListener("visibilitychange", onVis);

    const loader = new THREE.TextureLoader();
    loader.load("/assets/roulette/wheel-wood.jpg", function (t) { t.wrapS = THREE.RepeatWrapping; t.wrapT = THREE.RepeatWrapping; woodMat.map = t; woodMat.needsUpdate = true; }, undefined, function () { /* procedural stays */ });
    loader.load("/assets/roulette/wheel-metal.jpg", function (t) { metalMat.map = t; metalMat.needsUpdate = true; }, undefined, function () { /* plain metal stays */ });

    return function () {
      readyRef.current = false;
      cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", onVis);
      host!.removeEventListener("pointermove", onMove);
      ro.disconnect();
      rlSfx.spinStop();
      scene.traverse(function (obj) {
        const m = obj as THREE.Mesh;
        if (m.geometry) m.geometry.dispose();
        const mat = m.material as THREE.Material | THREE.Material[] | undefined;
        if (Array.isArray(mat)) mat.forEach(function (x) { x.dispose(); });
        else if (mat) mat.dispose();
      });
      ringTex.dispose();
      envTex.dispose();
      pmrem.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === host) host!.removeChild(renderer.domElement);
    };
  }, []);

  useEffect(function () {
    if (props.spinId <= 0 || !readyRef.current) return;
    const pockets = pocketsFor(props.variant);
    planRef.current = makePlan(pockets.length, props.targetIndex, makeRng(props.spinId * 7919 + 13), rotRef.current);
    t0Ref.current = performance.now();
    offRef.current = 0;
    firedRef.current = false;
    rlSfx.spinStart();
  }, [props.spinId, props.targetIndex, props.variant]);

  useEffect(function () {
    if (!props.skipSignal || !planRef.current) return;
    const t = (performance.now() - t0Ref.current) / 1000 + offRef.current;
    offRef.current += Math.max(0, planRef.current.duration - 0.2 - t);
  }, [props.skipSignal]);

  return (
    <div className="rl3-host" ref={hostRef}>
      {failed && (
        <WheelFallback variant={props.variant} accent={props.accent} spinId={props.spinId} targetIndex={props.targetIndex} idleAfter={props.idleAfter} skipSignal={props.skipSignal} onSettled={props.onSettled}/>
      )}
    </div>
  );
}
