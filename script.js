// 后端 API 调用适配器 (Cloudflare 安全版)
async function callAIAdapter(prompt, systemPrompt) {
    try {
        // 使用您在 Cloudflare Pages 部署好的后端接口，而非在前端暴露 Key
        const response = await fetch("/api/chat", {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt, system: systemPrompt })
        });
        if (!response.ok) throw new Error("API Error");
        const data = await response.json();
        return data.result;
    } catch (error) {
        console.error("AI Error:", error);
        return "赛博信号穿越太平洋时丢包了...请重试！📡";
    }
}

// 3D 背景: 赛博赤兔 + 万马归宗
const initThreeBackground = () => {
    const container = document.getElementById('canvas-container');
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x02040a, 0.005);
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 30, 90); camera.lookAt(0, 0, 0);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    container.appendChild(renderer.domElement);

    // 星空
    const starGeo = new THREE.BufferGeometry();
    const starCount = 3000; const starPos = new Float32Array(starCount * 3);
    for(let i=0; i<starCount*3; i++) starPos[i] = (Math.random() - 0.5) * 1000;
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({ color: 0xffd700, size: 0.5, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending });
    scene.add(new THREE.Points(starGeo, starMat));
    scene.add(new THREE.AmbientLight(0x4a0404, 1.5));

    // 马的形状
    const createHorseShape = () => {
        const shape = new THREE.Shape();
        shape.moveTo(2, 2.5); shape.lineTo(1.5, 3.0); shape.lineTo(1.8, 3.8); 
        shape.lineTo(1.2, 3.5); shape.lineTo(0.5, 4.0); shape.lineTo(0.8, 3.0); 
        shape.lineTo(-0.5, 2.8); shape.lineTo(-1.5, 1.5); shape.lineTo(-2.5, 1.8); 
        shape.lineTo(-3.5, 1.0); shape.lineTo(-2.0, 0.5); shape.lineTo(-2.2, -1.0); 
        shape.lineTo(-1.5, -0.5); shape.lineTo(-0.5, -1.2); shape.lineTo(0.5, -0.5);  
        shape.lineTo(1.5, 1.0); shape.lineTo(2, 2.5); return shape;
    };
    const horseShape = createHorseShape();

    // 中央赤兔
    const heroGeo = new THREE.ExtrudeGeometry(horseShape, { steps: 2, depth: 1.5, bevelEnabled: true, bevelThickness: 0.3, bevelSize: 0.2, bevelSegments: 3 });
    heroGeo.center();
    const heroMat = new THREE.MeshPhysicalMaterial({ color: 0x990000, emissive: 0xff0000, emissiveIntensity: 0.5, metalness: 0.8, roughness: 0.1, transparent: true, opacity: 0.95 });
    const heroHorse = new THREE.Mesh(heroGeo, heroMat);
    heroHorse.scale.set(3, 3, 3); heroHorse.position.set(0, 5, 0); scene.add(heroHorse);
    const light = new THREE.PointLight(0xffaa00, 3, 50); light.position.set(0, 5, 5); scene.add(light);

    // 马群螺旋
    const herdGeo = new THREE.ExtrudeGeometry(horseShape, { steps: 1, depth: 0.4, bevelEnabled: false }); herdGeo.center();
    const herdMat = new THREE.MeshStandardMaterial({ color: 0x330000, emissive: 0xff4400, emissiveIntensity: 0.8, metalness: 0.6, roughness: 0.4, transparent: true, opacity: 0.8 });
    const herdGroup = new THREE.Group(); scene.add(herdGroup);
    const herd = [];
    for(let arm=0; arm<3; arm++) {
        for(let i=0; i<40; i++) {
            const mesh = new THREE.Mesh(herdGeo, herdMat);
            const angle = (i/40)*Math.PI*4 + (arm*2*Math.PI)/3;
            const radius = 20 + (i/40)*90;
            mesh.position.set(Math.cos(angle)*radius+(Math.random()-0.5)*5, (Math.random()-0.5)*30, Math.sin(angle)*radius+(Math.random()-0.5)*5);
            mesh.rotation.y = -angle + Math.PI;
            mesh.scale.setScalar(Math.random()*0.5+0.5);
            mesh.userData = { baseY: mesh.position.y, floatSpeed: Math.random()*0.5+0.5 };
            herdGroup.add(mesh); herd.push(mesh);
        }
    }

    // 动画
    let mx=0, my=0;
    const handleMove = (x,y) => { mx=(x-window.innerWidth/2)*0.02; my=(y-window.innerHeight/2)*0.02; };
    document.addEventListener('mousemove', e=>handleMove(e.clientX, e.clientY));
    document.addEventListener('touchmove', e=>{if(e.touches.length>0)handleMove(e.touches[0].clientX,e.touches[0].clientY)},{passive:true});

    const clock = new THREE.Clock();
    const animate = () => {
        requestAnimationFrame(animate);
        const t = clock.getElapsedTime();
        heroHorse.rotation.y = Math.sin(t*0.5)*0.3; heroHorse.position.y = 5+Math.sin(t)*1;
        herdGroup.rotation.y = -t*0.15;
        const waveFront = (t*30)%150;
        herd.forEach(h => {
            h.position.y = h.userData.baseY + Math.sin(t*3+h.userData.floatSpeed)*1.5;
            const dist = Math.abs(Math.sqrt(h.position.x**2+h.position.z**2) - waveFront);
            h.scale.setScalar(dist<20 ? 0.5+(1-dist/20)*0.3 : 0.5);
        });
        camera.position.x += (mx-camera.position.x)*0.03; camera.position.y += (-my+40-camera.position.y)*0.03; camera.lookAt(0,5,0);
        renderer.render(scene, camera);
    };
    animate();
    window.addEventListener('resize', () => { camera.aspect=window.innerWidth/window.innerHeight; camera.updateProjectionMatrix(); renderer.setSize(window.innerWidth,window.innerHeight); });
};

// 新增 3D 趋势图
const init3DChart = () => {
    const container = document.getElementById('chart-3d-canvas');
    if(!container) return;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, container.clientWidth/container.clientHeight, 0.1, 100);
    camera.position.set(15,10,20); camera.lookAt(5,5,0);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const pLight = new THREE.PointLight(0xffaa00, 1, 50); pLight.position.set(10,10,10); scene.add(pLight);
    scene.add(new THREE.GridHelper(20, 20, 0x444444, 0x222222));

    const points = [];
    for(let i=0; i<=20; i++) {
        const t=i/20; points.push(new THREE.Vector3((t*15)-7.5, t*t*10, Math.sin(t*Math.PI*2)*3));
    }
    const curve = new THREE.CatmullRomCurve3(points);
    scene.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 64, 0.2, 8, false), new THREE.MeshStandardMaterial({color: 0xff0055, emissive: 0xffaa00, emissiveIntensity: 0.8, roughness: 0.2, metalness: 0.8})));

    const arrows = [];
    const arrowGeo = new THREE.ConeGeometry(0.2, 0.6, 8); arrowGeo.rotateX(Math.PI/2);
    const arrowMat = new THREE.MeshBasicMaterial({color: 0x00ffff});
    for(let i=0; i<20; i++) { const a = new THREE.Mesh(arrowGeo, arrowMat); scene.add(a); arrows.push(a); }

    let isDragging = false, prevMouse = {x:0, y:0}, rotTarget = 0;
    container.addEventListener('mousedown', e=>{isDragging=true; prevMouse={x:e.clientX,y:e.clientY}});
    window.addEventListener('mouseup', ()=>isDragging=false);
    container.addEventListener('mousemove', e=>{ if(isDragging){ rotTarget+=(e.clientX-prevMouse.x)*0.01; prevMouse={x:e.clientX,y:e.clientY} } });
    container.addEventListener('touchstart', e=>{isDragging=true; prevMouse={x:e.touches[0].clientX,y:e.touches[0].clientY}},{passive:false});
    container.addEventListener('touchend', ()=>isDragging=false);
    container.addEventListener('touchmove', e=>{ if(isDragging){ rotTarget+=(e.touches[0].clientX-prevMouse.x)*0.01; prevMouse={x:e.touches[0].clientX,y:e.touches[0].clientY}; e.preventDefault(); } },{passive:false});

    const clock = new THREE.Clock();
    const animateChart = () => {
        requestAnimationFrame(animateChart);
        const t = clock.getElapsedTime();
        scene.rotation.y += (rotTarget - scene.rotation.y)*0.1;
        arrows.forEach((a, i) => {
            const timeT = ((t + i * (5/20)) % 5) / 5;
            const pos = curve.getPointAt(timeT);
            a.position.copy(pos); a.lookAt(pos.clone().add(curve.getTangentAt(timeT)));
        });
        renderer.render(scene, camera);
    };
    animateChart();
    window.addEventListener('resize', () => { camera.aspect=container.clientWidth/container.clientHeight; camera.updateProjectionMatrix(); renderer.setSize(container.clientWidth, container.clientHeight); });
};

// 数据
const wishes = {
    'study': { title: '🎓 学神附体 (GPA 4.0)', intro: '未来的行业大佬，Paper 必中，Offer 必拿！', points: [{title:'Curve Wrecker',text:'考试全 A。'},{title:'Due 不再可怕',text:'代码一次跑通。'},{title:'Smooth Graduation',text:'抽签一把过。'}], activity: 'Mission: 保持优秀，带我飞！' },
    'life': { title: '🍔 顶级玩家', intro: '照顾好那个“中国胃”，Work Hard Play Hard。', points: [{title:'中餐自由',text:'告别 Panda Express。'},{title:'发际线守恒',text:'发际线必须守住！'},{title:'安全第一',text:'随时 Call 我。'}], activity: 'Mission: 下次回国，请我吃顿大的。' },
    'rich': { title: '💰 资本大鳄', intro: '既然自带“有钱”Buff，那就祝你更进一步。', points: [{title:'美股大亨',text:'全仓翻倍，睡后收入比学费还高。'},{title:'随便刷卡',text:'我不介意你对我挥金如土。'},{title:'钞能力',text:'愿你的钱包厚度永远追不上你的颜值高度。'}], activity: 'Mission: 苟富贵，勿相忘。' }
};
const moments = [
    { id: 1, title: 'Final Week 朋友圈...', do: '依然健身做饭，拿了 A+。', dont: '我是真的快死了。' },
    { id: 2, title: '关于汇率飙升...', do: '表面吐槽，实际买了新球鞋。', dont: '真的吃土。' },
    { id: 3, title: '隔着时差聊天...', do: '吐槽傻X脑回路同步。', dont: '断联。' }
];

// 初始化
const initApp = () => { 
    if (typeof THREE === 'undefined') { setTimeout(initApp, 100); return; }
    initThreeBackground(); init3DChart(); showWish('study'); renderMoments(); 
};
const showWish = g => { 
    ['study','life','rich'].forEach(k => document.getElementById(`tab-${k}`).className = k===g ? "horseshoe-card p-3 sm:p-4 text-center font-bold border border-cyan-500 bg-cyan-900/30 text-cyan-300 cursor-pointer" : "horseshoe-card p-3 sm:p-4 text-center font-bold border border-slate-700 hover:border-cyan-500 text-slate-400 cursor-pointer"); 
    document.getElementById('wish-area').innerHTML = `<h3 class="text-2xl sm:text-3xl font-black text-cyan-300 mb-4 sm:mb-6 festive-font">${wishes[g].title}</h3><p class="text-slate-200 text-lg sm:text-xl leading-relaxed">${wishes[g].intro}</p><div class="grid gap-3 sm:gap-4 mt-4 sm:mt-6">${wishes[g].points.map(p=>`<div class="p-3 sm:p-4 bg-white/5 rounded-xl border border-cyan-500/20"><h4 class="font-bold text-blue-300">${p.title}</h4><p class="text-xs sm:text-sm text-slate-300">${p.text}</p></div>`).join('')}</div><div class="mt-4 sm:mt-6 text-purple-300 font-bold text-sm sm:text-base">${wishes[g].activity}</div>`; 
};
const renderMoments = () => { 
    document.getElementById('moment-grid').innerHTML = moments.map(m => `<div class="horseshoe-card p-0 overflow-hidden shadow-2xl"><div class="p-6 sm:p-8 flex justify-between items-center cursor-pointer hover:bg-white/5 transition" onclick="toggleMoment(${m.id})"><h3 class="font-bold text-lg sm:text-xl text-cyan-100 leading-snug w-[85%]">${m.title}</h3><span id="icon-${m.id}" class="text-2xl sm:text-4xl">🌎</span></div><div id="moment-${m.id}" class="hidden p-6 sm:p-8 bg-black/50 border-t border-cyan-500/20 animate-fade-in"><div class="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8"><div class="p-4 sm:p-5 bg-blue-900/30 border border-blue-500/40 rounded-2xl text-blue-100 text-sm sm:text-base"><strong>你的操作：</strong> ${m.do}</div><div class="p-4 sm:p-5 bg-purple-900/30 border border-purple-500/40 rounded-2xl text-purple-200 text-sm sm:text-base"><strong>普通人：</strong> ${m.dont}</div></div><div class="pt-4 sm:pt-6 border-t border-cyan-500/20 flex flex-col sm:flex-row gap-3 sm:gap-4"><input type="text" id="moment-input-${m.id}" placeholder="神回复..." class="flex-1 px-4 sm:px-6 py-3 sm:py-4 rounded-xl bg-black/60 border border-cyan-500/30 text-white font-bold outline-none text-sm sm:text-base"><button onclick="analyzeMoment(${m.id}, '${m.title}')" class="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-black transition hover:scale-105 text-sm sm:text-base">AI 点评</button></div><div id="ai-feedback-${m.id}" class="hidden mt-4 sm:mt-6 p-4 sm:p-6 bg-blue-900/40 rounded-2xl text-xs sm:text-sm text-cyan-100 border border-blue-500/40"></div></div></div>`).join(''); 
};
const toggleMoment = id => { document.getElementById(`moment-${id}`).classList.toggle('hidden'); };
const toggleChat = () => { const w = document.getElementById('chat-win'); w.style.display = w.style.display === 'flex' ? 'none' : 'flex'; if(w.style.display === 'flex') w.classList.add('open'); };
async function sendMsg() { const i = document.getElementById('chat-in'), m = document.getElementById('chat-msgs'), t = i.value.trim(); if(!t) return; m.innerHTML += `<div class="p-3 bg-blue-600 rounded-2xl text-sm self-end ml-auto text-white font-bold shadow-md">${t}</div>`; i.value=''; m.scrollTop = m.scrollHeight; const r = await callAIAdapter(t, "赛博留学护航员，说话酷炫，夸用户。"); m.innerHTML += `<div class="p-4 bg-white/10 rounded-2xl text-sm shadow-xl border border-cyan-500/20">${marked.parse(r)}</div>`; m.scrollTop = m.scrollHeight; }
async function createCouplet() { const k = document.getElementById('couplet-key').value; if(!k) return; const r = document.getElementById('couplet-result'), l = document.getElementById('couplet-load'); r.classList.add('hidden'); l.classList.remove('hidden'); const rep = await callAIAdapter(`关键词: ${k}. 对象: 留学生. 赛博对联(7字)横批(4字). JSON: {"up":"","down":"","batch":""}`, "仅返回 JSON。"); l.classList.add('hidden'); r.classList.remove('hidden'); try { const j = JSON.parse(rep.replace(/```json/g, "").replace(/```/g, "").trim()); r.innerHTML = `<div class="couplet-horizontal mx-auto w-max mb-6 sm:mb-8 text-xl sm:text-2xl">${j.batch}</div><div class="flex justify-center gap-6 sm:gap-24"><div class="couplet-scroll text-lg sm:text-2xl">${j.up}</div><div class="couplet-scroll text-lg sm:text-2xl">${j.down}</div></div>`; r.style.display = 'flex'; } catch(e) { r.innerHTML = "AI 正在学习中文，请重试！"; } }
async function analyzeMoment(id, t) { const v = document.getElementById(`moment-input-${id}`).value; if(!v) return; const box = document.getElementById(`ai-feedback-${id}`); box.classList.remove('hidden'); box.innerHTML = "AI 正在分析..."; const rep = await callAIAdapter(`情境: ${t}. 回答: "${v}". 毒舌点评.`, "幽默赛博判官"); box.innerHTML = `<strong>判官裁决：</strong><br>${marked.parse(rep)}`; }
async function getFortuneBag() { const v = document.getElementById('wish-input').value; if(!v) return; const box = document.getElementById('fortune-result'); box.classList.remove('hidden'); const rep = await callAIAdapter(`愿望: ${v}. 赛博装备.`, "酷炫语气"); box.innerHTML = `<div class="flex items-start gap-4 sm:gap-5"><div class="text-4xl sm:text-5xl mt-2 animate-bounce">🎁</div><div class="text-white text-base sm:text-lg leading-relaxed font-bold">${marked.parse(rep)}</div></div>`; }
function scrollToSection(id) { const el = document.getElementById(id); if(el) el.scrollIntoView({ behavior: 'smooth' }); }
function toggleMobileMenu() { document.getElementById('mobile-menu').classList.toggle('hidden'); }

document.addEventListener('DOMContentLoaded', initApp);