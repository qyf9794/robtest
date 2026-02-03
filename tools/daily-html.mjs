import fs from 'node:fs/promises';
import path from 'node:path';

const owner = process.env.ROBTEST_OWNER || 'qyf9794';
const repo = process.env.ROBTEST_REPO || 'robtest';
const baseUrl = `https://${owner}.github.io/${repo}`;

const now = new Date();
const yyyy = now.getFullYear();
const mm = String(now.getMonth()+1).padStart(2,'0');
const dd = String(now.getDate()).padStart(2,'0');
const date = `${yyyy}-${mm}-${dd}`;

const themes = [
  {
    slug: 'kinetic-typography',
    title: '动效排版诗',
    desc: '一个会呼吸的文字海报：鼠标移动改变节奏，点击切换句子。'
  },
  {
    slug: 'moire-garden',
    title: '莫尔纹花园',
    desc: '参数化曲线叠加出莫尔纹幻觉：拖动改变频率，按 R 随机重生。'
  },
  {
    slug: 'metaballs',
    title: '流体泡泡',
    desc: '一堆会互相吸引的“泡泡”，在屏幕里软绵绵地融合。'
  },
  {
    slug: 'audio-visualizer',
    title: '麦克风光谱',
    desc: '允许麦克风后，实时做一个极简的音频频谱可视化。'
  },
  {
    slug: 'weather-poster',
    title: '今日天气海报',
    desc: '输入城市，生成一张带渐变与图形元素的“天气海报”。'
  },
  {
    slug: 'constellation-notes',
    title: '星座便签',
    desc: '把你的短句变成一张可拖拽的“星座连线便签”。'
  }
];

// Deterministic pick per-day
let h = 2166136261;
for (const ch of date) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
const theme = themes[Math.abs(h) % themes.length];

const folder = `daily/${date}-${theme.slug}`;
const outDir = path.resolve(process.cwd(), folder);
await fs.mkdir(outDir, { recursive: true });

const html = `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${theme.title} · ${date}</title>
  <style>
    :root{ --bg:#070A12; --fg:#EAF2FF; --mut:rgba(234,242,255,.66); --a:#6BE3FF; --b:#A7FF83; --c:#FF6BCB; }
    html,body{height:100%;margin:0;overflow:hidden;background:radial-gradient(1200px 800px at 20% 10%, rgba(107,227,255,.15), transparent 55%),
                                 radial-gradient(900px 700px at 85% 75%, rgba(255,107,203,.12), transparent 55%),
                                 linear-gradient(180deg, #05060B, var(--bg));
      color:var(--fg); font-family: system-ui,-apple-system,Segoe UI,Roboto,PingFang SC,Microsoft YaHei,sans-serif; }
    canvas{display:block;}
    .hud{position:fixed; inset:0; pointer-events:none; display:grid; place-items:center;}
    .card{pointer-events:none; width:min(820px, 92vw); padding:22px 22px 18px;
      border-radius:22px; background: rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.10);
      box-shadow: 0 30px 80px rgba(0,0,0,.45); backdrop-filter: blur(10px); }
    .top{display:flex; justify-content:space-between; gap:12px; align-items:flex-start;}
    .title{font-weight:900; letter-spacing:.08em; font-size:12px; color:rgba(234,242,255,.75)}
    .big{font-weight:950; font-size: clamp(26px, 4.4vw, 44px); margin-top:6px; line-height:1.05;}
    .desc{margin-top:10px; color:var(--mut); font-size:13px; line-height:1.5}
    .hint{margin-top:10px; color:rgba(147,164,191,.95); font-size:12px}
    .kbd{font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      border:1px solid rgba(255,255,255,.14); padding:2px 6px; border-radius:8px; background: rgba(0,0,0,.18); color: rgba(234,242,255,.88)}
    a{color:rgba(107,227,255,.95); text-decoration:none}
  </style>
</head>
<body>
  <canvas id="c"></canvas>
  <div class="hud">
    <div class="card">
      <div class="top">
        <div>
          <div class="title">Daily HTML · ${date}</div>
          <div class="big">${theme.title}</div>
          <div class="desc">${theme.desc}</div>
          <div class="hint">操作：移动鼠标/手指改变节奏 · 点击换句子 · <span class="kbd">R</span> 随机重生</div>
        </div>
        <div style="text-align:right">
          <div class="title">目录</div>
          <div class="desc"><a href="${baseUrl}/">robtest</a> · <a href="${baseUrl}/daily/">daily</a></div>
        </div>
      </div>
    </div>
  </div>

<script>
  const cv = document.getElementById('c');
  const ctx = cv.getContext('2d');
  let W=0,H=0,dpr=1;
  function resize(){
    dpr = Math.max(1, devicePixelRatio||1);
    W = innerWidth; H = innerHeight;
    cv.width = W*dpr; cv.height = H*dpr;
    cv.style.width=W+'px'; cv.style.height=H+'px';
    ctx.setTransform(dpr,0,0,dpr,0,0);
  }
  addEventListener('resize', resize); resize();

  const lines = [
    '把一天切成小片，照亮其中一片。',
    '先动起来，再谈完美。',
    '今天的你，已经在路上。',
    '给注意力一张椅子。',
    '慢一点也没关系，只要不停。'
  ];
  let li = 0;

  function rand(n){ return Math.random()*n; }
  let seed = Math.random()*9999;
  let mx = 0.5, my = 0.5;
  addEventListener('pointermove', e=>{ mx = e.clientX/W; my = e.clientY/H; });
  addEventListener('click', ()=>{ li=(li+1)%lines.length; });
  addEventListener('keydown', e=>{ if(e.key.toLowerCase()==='r') { seed = Math.random()*9999; } });

  function draw(t){
    const tt = t*0.001;
    ctx.clearRect(0,0,W,H);

    // soft background grain
    ctx.fillStyle='rgba(0,0,0,.12)';
    for(let i=0;i<120;i++){
      const x = (Math.sin(i*12.23+seed)*0.5+0.5)*W;
      const y = (Math.cos(i*7.77+seed)*0.5+0.5)*H;
      const r = 8 + 28*(0.5+0.5*Math.sin(tt*0.7+i));
      const g = ctx.createRadialGradient(x,y,0,x,y,r);
      g.addColorStop(0, 'rgba(107,227,255,' + (0.02+0.04*mx) + ')');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle=g;
      ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill();
    }

    // kinetic typography
    const text = lines[li];
    const base = Math.min(W,H);
    const size = Math.max(22, Math.min(64, base*0.07 + mx*18));
    ctx.font = '900 ' + size + 'px system-ui, -apple-system, Segoe UI, Roboto, PingFang SC, Microsoft YaHei, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const wave = 10 + 28*my;
    const amp = 6 + 24*mx;

    // Split by characters for Chinese-friendly effect
    const chars = Array.from(text);
    const totalW = chars.length * size * 0.82;
    let x0 = W/2 - totalW/2;
    for(let i=0;i<chars.length;i++){
      const x = x0 + i*size*0.82;
      const y = H/2 + Math.sin(tt*wave + i*0.55)*amp;
      const glow = 0.35 + 0.35*Math.sin(tt*1.2 + i);
      ctx.shadowColor = 'rgba(107,227,255,.45)';
      ctx.shadowBlur = 18*glow;
      const g = ctx.createLinearGradient(x, y-size, x, y+size);
      g.addColorStop(0, 'rgba(234,242,255,' + (0.95) + ')');
      g.addColorStop(1, 'rgba(167,255,131,' + (0.80) + ')');
      ctx.fillStyle = g;
      ctx.fillText(chars[i], x, y);
    }

    requestAnimationFrame(draw);
  }
  requestAnimationFrame(draw);
</script>
</body>
</html>
`;

await fs.writeFile(path.join(outDir, 'index.html'), html, 'utf8');

// Ensure daily index
const dailyIndexPath = path.resolve(process.cwd(), 'daily/index.html');
await fs.mkdir(path.dirname(dailyIndexPath), { recursive: true });

let existing = '';
try { existing = await fs.readFile(dailyIndexPath, 'utf8'); } catch {}

const entry = { date, folder, title: theme.title, desc: theme.desc };

// Naive rebuild: scan daily/*/index.html
const dailyDir = path.resolve(process.cwd(), 'daily');
const dirs = await fs.readdir(dailyDir, { withFileTypes: true });
const items = [];
for (const d of dirs) {
  if (!d.isDirectory()) continue;
  const m = d.name.match(/^(\d{4}-\d{2}-\d{2})-(.+)$/);
  if (!m) continue;
  const f = `daily/${d.name}`;
  // title fallback
  items.push({ date: m[1], folder: f });
}
items.sort((a,b)=> b.date.localeCompare(a.date));

const listHtml = items.map(it=>{
  const url = `${baseUrl}/${it.folder}/`;
  return `<li><a href="${url}">${it.date}</a> · <code>${it.folder.split('/').pop()}</code></li>`;
}).join('\n');

const dailyIndex = `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Daily HTML</title>
<style>
  body{margin:0;background:#060b14;color:#eaf2ff;font-family:system-ui,-apple-system,Segoe UI,Roboto,PingFang SC,Microsoft YaHei,sans-serif;}
  .wrap{max-width:860px;margin:0 auto;padding:22px;}
  h1{font-size:20px;letter-spacing:.08em}
  a{color:#6be3ff;text-decoration:none}
  li{margin:10px 0;color:rgba(234,242,255,.8)}
  code{color:rgba(167,255,131,.9)}
  .mut{color:rgba(234,242,255,.6);font-size:12px}
</style>
<div class="wrap">
  <h1>Daily HTML</h1>
  <div class="mut">每个早上 6 点自动更新一个小作品。返回 <a href="${baseUrl}/">robtest</a></div>
  <ol>
    ${listHtml || '<li>尚无内容</li>'}
  </ol>
</div>`;

await fs.writeFile(dailyIndexPath, dailyIndex, 'utf8');

console.log(JSON.stringify({ date, folder, url: `${baseUrl}/${folder}/` }));
