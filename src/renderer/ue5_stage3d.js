// ==========================================================================
// UNREAL ENGINE 5 STYLE 3D WEBGL ENGINE — NIAGARA PARTICLES & CYBER HORIZON
// Hardware-accelerated native WebGL, zero external dependencies, 100% file:// compatible
// ==========================================================================

class UE5Stage3D {
  constructor(canvasId = 'ue5Canvas') {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;

    this.gl = this.canvas.getContext('webgl', { alpha: true, antialias: true }) ||
              this.canvas.getContext('experimental-webgl', { alpha: true, antialias: true });

    if (!this.gl) {
      console.warn('[UE5 Stage 3D] WebGL not available, fallback to 2D canvas');
      return;
    }

    this.currentMode = 'standby';
    this.mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    this.time = 0;
    this.shockwave = 0;
    this.boostTarget = 0.0;
    this.boostCurrent = 0.0;
    this.audioPulse = 0.0;

    // Mode Color Schemes (RGB 0.0 - 1.0)
    this.palettes = {
      standby: { r: 0.22, g: 0.74, b: 0.97, altR: 0.98, altG: 0.75, altB: 0.14 }, // Cyan & Gold
      song: { r: 0.0, g: 0.94, b: 1.0, altR: 0.85, altG: 0.2, altB: 0.95 },        // Electric Blue / Cyber Magenta
      hitster: { r: 0.78, g: 0.52, b: 1.0, altR: 0.98, altG: 0.75, altB: 0.14 },  // Ultraviolet / Warm Gold
      wallpaper: { r: 0.98, g: 0.75, b: 0.14, altR: 0.95, altG: 0.35, altB: 0.1 },// Cinematic Amber / Film Warmth
      boost: { r: 1.0, g: 0.32, b: 0.0, altR: 1.0, altG: 0.88, altB: 0.15 }       // Blazing Solar Fire & Incandescent Gold
    };

    this.activeColor = { ...this.palettes.standby };

    this.initShaders();
    this.initGeometry();
    this.onResize();

    window.addEventListener('resize', () => this.onResize());
    window.addEventListener('mousemove', (e) => {
      this.mouse.targetX = (e.clientX / window.innerWidth - 0.5) * 2;
      this.mouse.targetY = (e.clientY / window.innerHeight - 0.5) * 2;
    });

    this.lastTimestamp = performance.now();
    this.render = this.render.bind(this);
    requestAnimationFrame(this.render);
  }

  initShaders() {
    const gl = this.gl;

    // --- Niagara Particle Shaders ---
    const vsSource = `
      attribute vec3 aPosition;
      attribute vec2 aParams; // x: phase, y: size
      uniform mat4 uMatrix;
      uniform float uTime;
      uniform float uShockwave;
      uniform float uBoost;
      uniform float uAudioPulse;
      varying vec3 vColor;
      varying float vAlpha;
      uniform vec3 uBaseColor;
      uniform vec3 uAltColor;

      void main() {
        vec3 pos = aPosition;
        float phase = aParams.x;
        
        // Organic sinusoidal turbulence motion
        pos.y += sin(uTime * 0.85 + phase) * 2.8;
        pos.x += cos(uTime * 0.55 + phase * 1.5) * 2.0;
        pos.z += sin(uTime * 0.65 + phase * 2.0) * 2.0;

        // Boost mode upward turbulent fiery vortex
        if (uBoost > 0.01) {
          float upwardSpeed = uTime * 22.0 + phase * 18.0;
          pos.y = mod(upwardSpeed, 160.0) - 80.0;
          pos.x += sin(uTime * 2.2 + phase * 3.0) * 4.5 * uBoost;
          pos.z += cos(uTime * 2.2 + phase * 3.0) * 4.5 * uBoost;
        }

        // Audio reactive pulse expansion
        if (uAudioPulse > 0.01) {
          pos.xyz *= (1.0 + sin(uTime * 8.0 + phase) * 0.16 * uAudioPulse);
        }

        // Shockwave displacement with radial expansion
        if (uShockwave > 0.01) {
          float dist = length(pos.xz);
          float wave = sin(dist * 0.22 - uShockwave * 14.0) * exp(-uShockwave * 2.6);
          pos.y += wave * 12.0;
          pos.xz += normalize(pos.xz + 0.001) * wave * 5.0;
        }

        gl_Position = uMatrix * vec4(pos, 1.0);
        
        // Perspective point attenuation
        float pSize = aParams.y * (155.0 / max(gl_Position.w, 1.0));
        if (uBoost > 0.01) pSize *= (1.0 + 0.45 * uBoost);
        gl_PointSize = clamp(pSize, 1.5, 60.0);

        // Color mix
        float mixVal = 0.5 + 0.5 * sin(phase + uTime * 0.6);
        vColor = mix(uBaseColor, uAltColor, mixVal);
        vAlpha = clamp(1.0 - (gl_Position.z / 230.0), 0.2, 0.98);
        if (uBoost > 0.01) vAlpha = min(1.0, vAlpha * 1.3);
      }
    `;

    const fsSource = `
      precision mediump float;
      varying vec3 vColor;
      varying float vAlpha;

      void main() {
        // High quality radial glowing sphere with hot specular core
        vec2 coord = gl_PointCoord - vec2(0.5);
        float dist = length(coord);
        if (dist > 0.5) discard;

        float core = 1.0 - smoothstep(0.0, 0.18, dist);
        float halo = 1.0 - smoothstep(0.12, 0.5, dist);
        float glow = core * 0.7 + halo * 0.55;

        gl_FragColor = vec4(vColor + vec3(core * 0.45), glow * vAlpha);
      }
    `;

    this.particleProgram = this.createProgram(vsSource, fsSource);

    // Get Uniform / Attribute locations
    this.pAttribPosition = gl.getAttribLocation(this.particleProgram, 'aPosition');
    this.pAttribParams = gl.getAttribLocation(this.particleProgram, 'aParams');
    this.pUniMatrix = gl.getUniformLocation(this.particleProgram, 'uMatrix');
    this.pUniTime = gl.getUniformLocation(this.particleProgram, 'uTime');
    this.pUniShockwave = gl.getUniformLocation(this.particleProgram, 'uShockwave');
    this.pUniBoost = gl.getUniformLocation(this.particleProgram, 'uBoost');
    this.pUniAudioPulse = gl.getUniformLocation(this.particleProgram, 'uAudioPulse');
    this.pUniBaseColor = gl.getUniformLocation(this.particleProgram, 'uBaseColor');
    this.pUniAltColor = gl.getUniformLocation(this.particleProgram, 'uAltColor');

    // --- Horizon Grid Shaders ---
    const gridVs = `
      attribute vec3 aPosition;
      uniform mat4 uMatrix;
      uniform float uTime;
      uniform float uBoost;
      varying float vFog;

      void main() {
        vec3 pos = aPosition;
        // Undulating ground waves with speed boost
        float waveSpeed = uBoost > 0.01 ? 2.2 : 1.2;
        pos.y += sin(pos.x * 0.075 + uTime * waveSpeed) * cos(pos.z * 0.075 + uTime * (waveSpeed * 0.9)) * 1.4;
        gl_Position = uMatrix * vec4(pos, 1.0);
        vFog = clamp(1.0 - (gl_Position.z / 190.0), 0.0, 0.88);
      }
    `;

    const gridFs = `
      precision mediump float;
      uniform vec3 uGridColor;
      varying float vFog;

      void main() {
        gl_FragColor = vec4(uGridColor, vFog * 0.32);
      }
    `;

    this.gridProgram = this.createProgram(gridVs, gridFs);
    this.gAttribPosition = gl.getAttribLocation(this.gridProgram, 'aPosition');
    this.gUniMatrix = gl.getUniformLocation(this.gridProgram, 'uMatrix');
    this.gUniTime = gl.getUniformLocation(this.gridProgram, 'uTime');
    this.gUniBoost = gl.getUniformLocation(this.gridProgram, 'uBoost');
    this.gUniGridColor = gl.getUniformLocation(this.gridProgram, 'uGridColor');
  }

  createProgram(vsSrc, fsSrc) {
    const gl = this.gl;
    const vs = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vs, vsSrc);
    gl.compileShader(vs);

    const fs = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fs, fsSrc);
    gl.compileShader(fs);

    const prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    return prog;
  }

  initGeometry() {
    const gl = this.gl;

    // 1. Niagara Particles (2,000 high-fidelity particles)
    const count = 2000;
    const positions = [];
    const params = [];

    for (let i = 0; i < count; i++) {
      positions.push(
        (Math.random() - 0.5) * 260,
        (Math.random() - 0.22) * 150,
        (Math.random() - 0.5) * 260
      );
      params.push(
        Math.random() * Math.PI * 2, // phase
        Math.random() * 3.2 + 1.2    // size
      );
    }

    this.particleCount = count;
    this.particlePosBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.particlePosBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    this.particleParamBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.particleParamBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(params), gl.STATIC_DRAW);

    // 2. Horizon 3D Grid Lines
    const gridLines = [];
    const size = 180;
    const step = 8;
    const y = -16;

    for (let x = -size; x <= size; x += step) {
      gridLines.push(x, y, -size, x, y, size);
    }
    for (let z = -size; z <= size; z += step) {
      gridLines.push(-size, y, z, size, y, z);
    }

    this.gridVertexCount = gridLines.length / 3;
    this.gridBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.gridBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(gridLines), gl.STATIC_DRAW);
  }

  onResize() {
    if (!this.canvas || !this.gl) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = window.innerWidth * dpr;
    this.canvas.height = window.innerHeight * dpr;
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
  }

  setGameMode(mode, isBoost = false) {
    this.currentMode = mode || 'standby';
    this.boostTarget = isBoost ? 1.0 : 0.0;
  }

  setBoostActive(active) {
    this.boostTarget = active ? 1.0 : 0.0;
  }

  setAudioPulse(amount = 1.0) {
    this.audioPulse = amount;
  }

  triggerBuzzerShockwave() {
    this.shockwave = 0.01;
  }

  triggerBoostSupercharge() {
    this.shockwave = 0.01;
    this.audioPulse = 3.5;
    this.boostTarget = 1.0;
    this.boostCurrent = 1.0;
    
    if (typeof document !== 'undefined' && document.body) {
      document.body.classList.remove('screen-shake-boost');
      void document.body.offsetWidth; // trigger reflow
      document.body.classList.add('screen-shake-boost');
      setTimeout(() => {
        document.body.classList.remove('screen-shake-boost');
      }, 800);

      const flash = document.getElementById('screenFlashLayer');
      if (flash) {
        flash.classList.remove('flash-boost-supercharge');
        void flash.offsetWidth;
        flash.classList.add('flash-boost-supercharge');
        setTimeout(() => {
          flash.classList.remove('flash-boost-supercharge');
        }, 1000);
      }
    }
  }

  render(timestamp) {
    requestAnimationFrame(this.render);

    const dt = (timestamp - this.lastTimestamp) / 1000;
    this.lastTimestamp = timestamp;
    this.time += dt;

    if (this.shockwave > 0) {
      this.shockwave += dt * 2.0;
      if (this.shockwave > 1.3) this.shockwave = 0;
    }

    // Smooth boost transition
    this.boostCurrent += (this.boostTarget - this.boostCurrent) * 0.1;
    // Audio pulse decay
    this.audioPulse = Math.max(0, this.audioPulse - dt * 2.5);

    // Smooth camera mouse parallax
    this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.05;
    this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.05;

    // Smooth Color Interpolation towards target mode palette
    const targetPal = this.boostCurrent > 0.5 ? this.palettes.boost : (this.palettes[this.currentMode] || this.palettes.standby);
    this.activeColor.r += (targetPal.r - this.activeColor.r) * 0.08;
    this.activeColor.g += (targetPal.g - this.activeColor.g) * 0.08;
    this.activeColor.b += (targetPal.b - this.activeColor.b) * 0.08;
    this.activeColor.altR += (targetPal.altR - this.activeColor.altR) * 0.08;
    this.activeColor.altG += (targetPal.altG - this.activeColor.altG) * 0.08;
    this.activeColor.altB += (targetPal.altB - this.activeColor.altB) * 0.08;

    const gl = this.gl;
    gl.clearColor(0.0, 0.0, 0.0, 0.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE); // Additive cyberpunk luminescence

    // Compute Perspective & View Matrix
    const aspect = this.canvas.width / this.canvas.height;
    const fov = 60 * (Math.PI / 180);
    const near = 0.5;
    const far = 500.0;
    const f = 1.0 / Math.tan(fov / 2);

    const pMatrix = [
      f / aspect, 0, 0, 0,
      0, f, 0, 0,
      0, 0, (far + near) / (near - far), -1,
      0, 0, (2 * far * near) / (near - far), 0
    ];

    // Camera LookAt
    const camX = this.mouse.x * 14;
    const camY = 16 - this.mouse.y * 9;
    const camZ = 55;

    const vMatrix = this.createLookAtMatrix(camX, camY, camZ, 0, 2, 0, 0, 1, 0);
    const mvp = this.multiplyMatrices(pMatrix, vMatrix);

    // 1. Draw Horizon Grid
    gl.useProgram(this.gridProgram);
    gl.uniformMatrix4fv(this.gUniMatrix, false, new Float32Array(mvp));
    gl.uniform1f(this.gUniTime, this.time);
    gl.uniform1f(this.gUniBoost, this.boostCurrent);
    gl.uniform3f(this.gUniGridColor, this.activeColor.r, this.activeColor.g, this.activeColor.b);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.gridBuffer);
    gl.enableVertexAttribArray(this.gAttribPosition);
    gl.vertexAttribPointer(this.gAttribPosition, 3, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.LINES, 0, this.gridVertexCount);

    // 2. Draw 2,000 Niagara Particles
    gl.useProgram(this.particleProgram);
    gl.uniformMatrix4fv(this.pUniMatrix, false, new Float32Array(mvp));
    gl.uniform1f(this.pUniTime, this.time);
    gl.uniform1f(this.pUniShockwave, this.shockwave);
    gl.uniform1f(this.pUniBoost, this.boostCurrent);
    gl.uniform1f(this.pUniAudioPulse, this.audioPulse);
    gl.uniform3f(this.pUniBaseColor, this.activeColor.r, this.activeColor.g, this.activeColor.b);
    gl.uniform3f(this.pUniAltColor, this.activeColor.altR, this.activeColor.altG, this.activeColor.altB);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.particlePosBuffer);
    gl.enableVertexAttribArray(this.pAttribPosition);
    gl.vertexAttribPointer(this.pAttribPosition, 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.particleParamBuffer);
    gl.enableVertexAttribArray(this.pAttribParams);
    gl.vertexAttribPointer(this.pAttribParams, 2, gl.FLOAT, false, 0, 0);

    gl.drawArrays(gl.POINTS, 0, this.particleCount);
  }

  createLookAtMatrix(eyeX, eyeY, eyeZ, targetX, targetY, targetZ, upX, upY, upZ) {
    let z0 = eyeX - targetX, z1 = eyeY - targetY, z2 = eyeZ - targetZ;
    let len = Math.hypot(z0, z1, z2);
    if (len > 0) { z0 /= len; z1 /= len; z2 /= len; }

    let x0 = upY * z2 - upZ * z1, x1 = upZ * z0 - upX * z2, x2 = upX * z1 - upY * z0;
    len = Math.hypot(x0, x1, x2);
    if (len > 0) { x0 /= len; x1 /= len; x2 /= len; }

    let y0 = z1 * x2 - z2 * x1, y1 = z2 * x0 - z0 * x2, y2 = z0 * x1 - z1 * x0;

    return [
      x0, y0, z0, 0,
      x1, y1, z1, 0,
      x2, y2, z2, 0,
      -(x0 * eyeX + x1 * eyeY + x2 * eyeZ),
      -(y0 * eyeX + y1 * eyeY + y2 * eyeZ),
      -(z0 * eyeX + z1 * eyeY + z2 * eyeZ),
      1
    ];
  }

  multiplyMatrices(a, b) {
    const out = new Array(16);
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        out[j * 4 + i] = 
          a[0 * 4 + i] * b[j * 4 + 0] +
          a[1 * 4 + i] * b[j * 4 + 1] +
          a[2 * 4 + i] * b[j * 4 + 2] +
          a[3 * 4 + i] * b[j * 4 + 3];
      }
    }
    return out;
  }
}

window.UE5Stage3D = UE5Stage3D;

