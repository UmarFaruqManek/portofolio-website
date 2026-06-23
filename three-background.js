(function initThreeScene() {
    const container = document.getElementById('particles-canvas');
    if (!container || typeof THREE === 'undefined') return;

    const isMobile = window.innerWidth < 768;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (isMobile && prefersReduced) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(isMobile ? 55 : 50, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: !isMobile,
        powerPreference: 'high-performance',
    });

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1 : 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.domElement.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%';
    container.appendChild(renderer.domElement);

    camera.position.z = 14;

    const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    document.addEventListener('mousemove', (e) => {
        mouse.targetX = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.targetY = -(e.clientY / window.innerHeight) * 2 + 1;
    });

    // ===== MAIN TORUS KNOT =====
    const knotGeo = new THREE.TorusKnotGeometry(1.8, 0.6, 200, 32);
    const knotMat = new THREE.MeshPhysicalMaterial({
        color: 0x7c5cfc,
        metalness: 0.3,
        roughness: 0.1,
        transparent: true,
        opacity: 0.7,
        clearcoat: 1,
        clearcoatRoughness: 0.2,
        emissive: 0x5c3cdc,
        emissiveIntensity: 0.2,
    });
    const knot = new THREE.Mesh(knotGeo, knotMat);
    knot.position.z = -3;
    scene.add(knot);

    // Wireframe overlay
    const wireframeMat = new THREE.MeshPhysicalMaterial({
        color: 0xd4a25a,
        wireframe: true,
        transparent: true,
        opacity: 0.15,
    });
    const wireframe = new THREE.Mesh(knotGeo.clone(), wireframeMat);
    wireframe.position.z = -3;
    wireframe.scale.set(1.02, 1.02, 1.02);
    scene.add(wireframe);

    // ===== ORBITING SHAPES =====
    const orbitingShapes = [];
    const orbitData = [
        { geo: new THREE.IcosahedronGeometry(0.5, 0), color: 0xd4a25a, radius: 4.5, speed: 0.4, offset: 0 },
        { geo: new THREE.OctahedronGeometry(0.4, 0), color: 0xf09a7a, radius: 5.5, speed: -0.3, offset: 1.2 },
        { geo: new THREE.DodecahedronGeometry(0.35, 0), color: 0x7c5cfc, radius: 3.8, speed: 0.5, offset: 2.8 },
        { geo: new THREE.TetrahedronGeometry(0.45, 0), color: 0x9a7cfc, radius: 6.2, speed: -0.25, offset: 0.7 },
    ];

    orbitData.forEach((data) => {
        const mat = new THREE.MeshPhysicalMaterial({
            color: data.color,
            metalness: 0.2,
            roughness: 0.3,
            transparent: true,
            opacity: 0.6,
            emissive: data.color,
            emissiveIntensity: 0.1,
        });
        const mesh = new THREE.Mesh(data.geo, mat);
        scene.add(mesh);

        const wfMat = new THREE.MeshPhysicalMaterial({
            color: data.color,
            wireframe: true,
            transparent: true,
            opacity: 0.2,
        });
        const wf = new THREE.Mesh(data.geo.clone(), wfMat);
        wf.scale.set(1.15, 1.15, 1.15);
        scene.add(wf);

        orbitingShapes.push({ mesh, wf, ...data });
    });

    // ===== SECONDARY FLOATING SHAPES =====
    const floaters = [];
    const floaterCount = isMobile ? 10 : 30;
    for (let i = 0; i < floaterCount; i++) {
        const size = 0.05 + Math.random() * 0.15;
        const geo = new THREE.SphereGeometry(size, 8, 8);
        const mat = new THREE.MeshPhysicalMaterial({
            color: Math.random() > 0.5 ? 0x7c5cfc : 0xd4a25a,
            transparent: true,
            opacity: 0.2 + Math.random() * 0.3,
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(
            (Math.random() - 0.5) * 20,
            (Math.random() - 0.5) * 20,
            (Math.random() - 0.5) * 10 - 5
        );
        scene.add(mesh);
        floaters.push({
            mesh,
            ox: mesh.position.x,
            oy: mesh.position.y,
            oz: mesh.position.z,
            phase: Math.random() * Math.PI * 2,
            speed: 0.2 + Math.random() * 0.4,
        });
    }

    // ===== STARFIELD =====
    const starCount = isMobile ? 150 : 500;
    const starPos = new Float32Array(starCount * 3);
    const starSizes = new Float32Array(starCount);
    for (let i = 0; i < starCount; i++) {
        starPos[i * 3] = (Math.random() - 0.5) * 60;
        starPos[i * 3 + 1] = (Math.random() - 0.5) * 60;
        starPos[i * 3 + 2] = (Math.random() - 0.5) * 40 - 20;
        starSizes[i] = 0.02 + Math.random() * 0.06;
    }

    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    starGeo.setAttribute('size', new THREE.BufferAttribute(starSizes, 1));

    const starMat = new THREE.PointsMaterial({
        color: 0xd4a25a,
        size: 0.04,
        transparent: true,
        opacity: 0.4,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        sizeAttenuation: true,
    });
    const stars = new THREE.Points(starGeo, starMat);
    scene.add(stars);

    // ===== AMBIENT CONNECTION LINES =====
    const lineCount = isMobile ? 15 : 40;
    const linePoints = [];
    for (let i = 0; i < lineCount; i++) {
        linePoints.push(
            (Math.random() - 0.5) * 12,
            (Math.random() - 0.5) * 12,
            (Math.random() - 0.5) * 8 - 4
        );
    }
    const lineGeo2 = new THREE.BufferGeometry();
    lineGeo2.setAttribute('position', new THREE.Float32BufferAttribute(linePoints, 3));
    const lineMat2 = new THREE.LineBasicMaterial({
        color: 0x7c5cfc,
        transparent: true,
        opacity: 0.04,
        blending: THREE.AdditiveBlending,
    });
    const lineSystem = new THREE.Line(lineGeo2, lineMat2);
    scene.add(lineSystem);

    // ===== ANIMATION LOOP =====
    function animate(time) {
        const t = time * 0.001;

        mouse.x += (mouse.targetX - mouse.x) * 0.03;
        mouse.y += (mouse.targetY - mouse.y) * 0.03;

        // Main knot rotation
        knot.rotation.x = t * 0.15;
        knot.rotation.y = t * 0.2 + mouse.x * 0.5;
        knot.rotation.z = t * 0.05;
        wireframe.rotation.copy(knot.rotation);

        // Knot float
        knot.position.y = Math.sin(t * 0.3) * 0.3;
        knot.position.x = Math.sin(t * 0.2) * 0.2;
        wireframe.position.copy(knot.position);

        // Shapes orbit
        orbitingShapes.forEach((s) => {
            const angle = t * s.speed + s.offset;
            const x = Math.cos(angle) * s.radius;
            const z = Math.sin(angle) * s.radius * 0.5;
            const y = Math.sin(angle * 1.5) * 1.5;

            s.mesh.position.set(x, y, z - 4);
            s.mesh.rotation.x = t * 0.5 + s.offset;
            s.mesh.rotation.y = t * 0.7 + s.offset;
            s.mesh.rotation.z = t * 0.3;

            s.wf.position.copy(s.mesh.position);
            s.wf.rotation.copy(s.mesh.rotation);
        });

        // Floaters gentle motion
        floaters.forEach((f) => {
            f.mesh.position.x = f.ox + Math.sin(t * f.speed + f.phase) * 1.5;
            f.mesh.position.y = f.oy + Math.cos(t * f.speed * 0.7 + f.phase) * 1.5;
            f.mesh.position.z = f.oz + Math.sin(t * f.speed * 0.5 + f.phase) * 0.5;
        });

        // Stars slow rotation
        stars.rotation.y = t * 0.01;
        stars.rotation.x = t * 0.005;

        // Lines slow rotation
        lineSystem.rotation.y = t * 0.02;
        lineSystem.rotation.x = t * 0.01;

        // Camera subtle movement
        camera.position.x += (mouse.x * 0.3 - camera.position.x) * 0.01;
        camera.position.y += (mouse.y * 0.2 - camera.position.y) * 0.01;
        camera.lookAt(0, 0, -2);

        renderer.render(scene, camera);
        requestAnimationFrame(animate);
    }

    // ===== RESIZE =====
    function onResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }
    window.addEventListener('resize', onResize);

    animate(0);
})();
