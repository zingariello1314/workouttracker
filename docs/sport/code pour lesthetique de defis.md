<title>Défis</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@600;700;800;900&family=Schibsted+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap">
<style>
/* Concept : un tableau d'affichage de stade. Encre bleutée, os chaud, titres condensés type signalétique, filets nets à la place des cartes arrondies. Chaque activité porte sa propre couleur d'accent (Course : orange, Pompes : cobalt), la sidebar reste le sommaire. */
:root{
  --accent:#a46bff; --accent-ink:#13062b;
  --t-ef:#46c8ff; --t-seuil:#b58cff; --t-vit:#ff5c93; --t-fract:#ffc233; --t-cl:#4fe0c8;
  --star:#ffc233;
  --tier-1:#f0955a; --tier-2:#bcd0ff; --tier-3:#ffc933; --tier-4:#5df0ff;
  --f-disp:'Big Shoulders Display','Arial Narrow',Impact,sans-serif;
  --f-body:'Schibsted Grotesk','Segoe UI',system-ui,sans-serif;
  --f-mono:'JetBrains Mono',ui-monospace,Menlo,Consolas,monospace;
  color-scheme:dark;
}
*{box-sizing:border-box}
body{
  --ink:color-mix(in oklab,var(--accent) 9%,#07070c);
  --ink-2:color-mix(in oklab,var(--accent) 13%,#0b0b12);
  --ink-3:color-mix(in oklab,var(--accent) 18%,#0f0f18);
  --ink-4:color-mix(in oklab,var(--accent) 26%,#14141f);
  --rule:color-mix(in oklab,var(--accent) 24%,#101018);
  --rule-2:color-mix(in oklab,var(--accent) 40%,#16161f);
  --bone:color-mix(in oklab,var(--accent) 24%,#ffffff);
  --bone-2:color-mix(in oklab,var(--accent) 62%,#ffffff);
  --bone-3:color-mix(in oklab,var(--accent) 88%,#0b0b12);
  --accent-soft:color-mix(in srgb,var(--accent) 18%,transparent);
  --accent-mid:color-mix(in srgb,var(--accent) 48%,var(--ink-3));
  background-color:var(--ink);
  background-image:radial-gradient(1000px 640px at 88% -8%,color-mix(in srgb,var(--accent) 34%,transparent),transparent 70%),radial-gradient(820px 620px at -8% 46%,color-mix(in srgb,#ff5c93 14%,transparent),transparent 70%),radial-gradient(900px 600px at 70% 112%,color-mix(in srgb,var(--accent) 22%,transparent),transparent 72%);
  background-attachment:fixed;
  color:var(--bone);font:15px/1.5 var(--f-body);padding-inline:16px;padding-block:0}
body::before{content:"";position:fixed;inset:0;pointer-events:none;opacity:.05;mix-blend-mode:overlay;z-index:0;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")}
button,input,select{font:inherit;color:inherit}
button{cursor:pointer}
:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
.num{font-variant-numeric:tabular-nums}
.mono{font-family:var(--f-mono)}
.dim{color:var(--bone-3)}
.lab{font:500 10.5px/1.3 var(--f-mono);letter-spacing:.12em;text-transform:uppercase;color:var(--bone-3)}
.dot{display:inline-block;width:9px;height:9px;border-radius:2px;background:var(--c,var(--accent));flex:none}
.ic{width:18px;height:18px;flex:none;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}
 
.shell{position:relative;z-index:1;max-width:1400px;margin-inline:auto;display:grid;grid-template-columns:268px minmax(0,1fr);gap:44px;padding-block:22px 90px}
.main{min-width:0}
 
/* sidebar */
.side{position:sticky;top:22px;align-self:start;max-height:calc(100vh - 44px);overflow:auto;padding-bottom:12px;scrollbar-width:thin}
.side h2{font:900 64px/.86 var(--f-disp);text-transform:uppercase;margin:0;letter-spacing:.005em}
.side .sub{color:var(--bone-3);font-size:13px;margin:10px 0 26px;max-width:22ch}
.nav{display:flex;flex-direction:column;border-top:1px solid var(--rule-2)}
.nav button{display:flex;align-items:center;gap:13px;padding:11px 12px;background:none;border:0;border-bottom:1px solid var(--rule);border-left:3px solid transparent;color:var(--bone-2);text-align:left;font-weight:500;border-radius:0}
.nav button:hover{color:var(--bone);background:var(--ink-2)}
.nav button[aria-current="page"]{color:var(--bone);background:linear-gradient(90deg,var(--accent-soft),transparent);border-left-color:var(--accent);font-weight:600}
.nav button[aria-current="page"] .ic{color:var(--accent)}
.nav .badge{margin-left:auto;background:var(--accent);color:var(--accent-ink);font:600 11px var(--f-mono);min-width:20px;height:20px;border-radius:4px;display:grid;place-items:center;padding-inline:5px}
.nav .gap{height:18px;border-bottom:1px solid var(--rule-2)}
.btn.menu{display:none}
.pick{margin-top:30px;padding-top:16px;border-top:1px solid var(--rule-2)}
.sw{display:flex;gap:8px;margin-top:12px;flex-wrap:wrap}
.sw button{width:26px;height:26px;border-radius:4px;border:1px solid var(--rule-2);background:var(--c);padding:0}
.sw button[aria-pressed="true"]{outline:2px solid var(--bone);outline-offset:2px}
 
/* en-tête */
.head{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:flex-end;gap:22px;padding-bottom:26px}
.kicker{font:500 11px var(--f-mono);letter-spacing:.16em;text-transform:uppercase;color:var(--accent)}
.head h1{font:900 clamp(76px,12vw,156px)/.8 var(--f-disp);text-transform:uppercase;margin:14px 0 0;letter-spacing:-.005em}
.head p{color:var(--bone-3);margin:14px 0 0}
.hbtn{display:flex;gap:8px;flex-wrap:wrap}
.btn{display:inline-flex;align-items:center;gap:9px;border:1px solid var(--rule-2);background:transparent;border-radius:4px;padding:10px 15px;font-weight:600;font-size:13.5px}
.btn:hover{border-color:var(--bone-2)}
.btn.pri{background:var(--accent);border-color:var(--accent);color:var(--accent-ink)}
.btn.pri:hover{filter:brightness(1.08)}
.btn.sm{padding:7px 12px;font-size:12.5px}
 
.board{display:grid;grid-template-columns:1.5fr 1fr 1fr 1fr;border-block:1px solid var(--rule-2)}
.board>div{padding:20px 24px;border-left:1px solid var(--rule);min-width:0}
.board>div:first-child{border-left:0;padding-left:0}
.board b{display:block;font:800 clamp(42px,5vw,66px)/1 var(--f-disp);margin-top:8px}
.board>div:first-child b{font-size:clamp(60px,7.4vw,100px);color:var(--accent)}
.board b i{font:500 14px var(--f-body);font-style:normal;color:var(--bone-3);margin-left:6px}
.board .s{font-size:12.5px;color:var(--bone-3);margin-top:4px}
 
.tabs{display:flex;margin-top:32px;border-bottom:1px solid var(--rule-2);overflow-x:auto}
.tabs button{flex:none;padding:12px 22px;background:none;border:0;color:var(--bone-3);font:500 12.5px var(--f-mono);letter-spacing:.08em;text-transform:uppercase;border-radius:0}
.tabs button:hover{color:var(--bone)}
.tabs button[aria-selected="true"]{background:var(--accent);color:var(--accent-ink);font-weight:600}
.panel{padding-top:44px;display:flex;flex-direction:column;gap:64px}
 
/* sections */
.sec-h{display:flex;flex-wrap:wrap;gap:10px 20px;justify-content:space-between;align-items:flex-end;border-top:1px solid var(--rule-2);padding-top:14px;margin-bottom:22px}
.sec-h h2{font:800 32px/1 var(--f-disp);text-transform:uppercase;letter-spacing:.02em;margin:0}
.sec-h p{margin:8px 0 0;color:var(--bone-3);font-size:13px;max-width:72ch}
.box{background:linear-gradient(155deg,var(--ink-3),var(--ink-2));border:1px solid var(--rule-2);border-radius:6px;box-shadow:0 18px 40px -26px color-mix(in srgb,var(--accent) 60%,transparent)}
.pad{padding:20px 22px}
.split{display:grid;grid-template-columns:minmax(0,1fr) 330px;gap:44px;align-items:start}
.rail{display:flex;flex-direction:column;gap:20px;position:sticky;top:22px}
 
/* segmented, champs */
.seg{display:inline-flex;border:1px solid var(--rule-2);border-radius:4px;overflow:hidden;flex-wrap:wrap}
.seg button{background:none;border:0;padding:6px 12px;color:var(--bone-3);font:500 12px var(--f-mono);border-right:1px solid var(--rule-2)}
.seg button:last-child{border-right:0}
.seg button[aria-pressed="true"]{background:var(--accent);color:var(--accent-ink)}
.fld{display:flex;flex-direction:column;gap:6px;min-width:0}
.fld input,.fld select{background:var(--ink);border:1px solid var(--rule-2);border-radius:4px;padding:8px 10px;width:100%;min-width:0;font-variant-numeric:tabular-nums}
.fld input::placeholder{color:var(--bone-3)}
.chips{display:flex;flex-wrap:wrap;gap:8px}
.chip{display:inline-flex;align-items:center;gap:8px;border:1px solid var(--rule-2);background:var(--ink-2);border-radius:4px;padding:6px 12px;font-size:13px;color:var(--bone-2)}
button.chip:hover{border-color:var(--accent);color:var(--bone)}
.chips label.chip{cursor:pointer}
.chips label.chip input{position:absolute;opacity:0;pointer-events:none}
.chips label.chip:has(input:checked){background:var(--ink-4);color:var(--bone);border-color:var(--bone-3)}
.chips label.chip:has(input:focus-visible){outline:2px solid var(--accent)}
 
/* à accomplir */
.todo b.big{font:800 54px/1 var(--f-disp);color:var(--accent);display:block;margin:8px 0 6px}
.todo h3{font:700 15px var(--f-body);margin:0 0 6px}
.todo p{margin:0;color:var(--bone-2);font-size:13px}
.empty{border:1px dashed var(--rule-2);border-radius:4px;padding:16px 18px;color:var(--bone-2);font-size:13.5px}
.empty h3{margin:0 0 6px;font:700 15px var(--f-body);color:var(--bone)}
.empty p{margin:0}
.sync .g{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:14px 0}
.sync .b{display:flex;gap:8px;flex-wrap:wrap}
 
/* journal course */
.toolbar{display:flex;flex-direction:column;gap:14px;padding-bottom:22px;border-bottom:1px solid var(--rule)}
.nums{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}
.tiny{font-size:12px;color:var(--bone-3)}
.mh{display:flex;justify-content:space-between;align-items:baseline;padding-block:26px 8px}
.mh h3{font:800 24px/1 var(--f-disp);text-transform:uppercase;letter-spacing:.03em;margin:0}
.log{display:grid;grid-template-columns:78px minmax(0,1fr) auto auto;gap:6px 22px;align-items:center;padding-block:16px;border-top:1px solid var(--rule)}
.log .dt{text-align:left}
.log .dt b{display:block;font:800 40px/.95 var(--f-disp)}
.log .dt span{display:block;font:500 10.5px var(--f-mono);letter-spacing:.05em;text-transform:uppercase;color:var(--bone-3);margin-top:2px}
.log .tl{display:flex;flex-wrap:wrap;align-items:center;gap:8px 10px;font-weight:600}
.zone{font:500 11px var(--f-mono);border:1px solid var(--rule-2);border-radius:3px;padding:1px 7px;color:var(--bone-2);white-space:nowrap}
.log .nt{color:var(--bone-3);font-size:12.5px;margin-top:5px}
.log .nt em{font-style:normal;color:var(--bone-3);text-transform:uppercase;font:500 10px var(--f-mono);letter-spacing:.08em;margin-right:6px}
.dbar{height:3px;background:var(--ink-3);border-radius:2px;margin-top:10px;max-width:340px}
.dbar i{display:block;height:100%;border-radius:2px;background:var(--c)}
.mx{display:grid;grid-template-columns:repeat(4,92px);gap:0;margin:0}
.mx div{padding-inline:12px;border-left:1px solid var(--rule)}
.mx dt{font:500 10px var(--f-mono);letter-spacing:.1em;text-transform:uppercase;color:var(--bone-3)}
.mx dd{margin:3px 0 0;font:600 15px var(--f-body);white-space:nowrap}
.ra{display:flex;gap:6px}
.ib{width:32px;height:32px;border-radius:4px;border:1px solid var(--rule-2);background:transparent;display:grid;place-items:center;color:var(--bone-3)}
.ib:hover{color:var(--bone);border-color:var(--bone-2)}
.ib.del:hover{color:var(--t-vit);border-color:var(--t-vit)}
.more{display:flex;justify-content:center;margin-top:22px;padding-top:22px;border-top:1px solid var(--rule)}
 
/* statistiques */
.subnav{position:sticky;top:0;z-index:5;background:var(--ink);display:flex;gap:4px;overflow-x:auto;padding-block:10px;margin-top:-10px;border-bottom:1px solid var(--rule)}
.subnav a{flex:none;color:var(--bone-3);text-decoration:none;font:500 11.5px var(--f-mono);letter-spacing:.08em;text-transform:uppercase;padding:6px 12px;border:1px solid transparent;border-radius:4px}
.subnav a:hover{color:var(--bone);border-color:var(--rule-2)}
.two{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:0;border-block:1px solid var(--rule)}
.two>div{padding:18px 4px 18px 0}
.two>div+div{padding-left:24px;border-left:1px solid var(--rule)}
.two b{display:block;font:800 52px/1 var(--f-disp);margin-top:6px}
.two .tiny{margin-top:4px}
.key{display:flex;gap:18px;align-items:center;color:var(--bone-3);font-size:12px;margin-bottom:10px}
.key i{display:inline-block;width:22px;height:8px;border-radius:2px;margin-right:7px;vertical-align:middle}
.key i.id{background:repeating-linear-gradient(135deg,var(--bone-3) 0 2px,transparent 2px 5px);height:8px}
.mrow{display:grid;grid-template-columns:170px minmax(0,1fr) 190px 190px;gap:8px 20px;align-items:center;padding-block:15px;border-top:1px solid var(--rule)}
.mrow .nm{display:flex;align-items:center;gap:10px;font-weight:600}
.mb{display:flex;flex-direction:column;gap:5px}
.bar{height:10px;background:var(--ink-3);border-radius:2px;overflow:hidden}
.bar i{display:block;height:100%;background:var(--c);border-radius:2px}
.bar.id{height:6px;background:none;border:1px dashed var(--rule-2)}
.bar.id i{background:repeating-linear-gradient(135deg,var(--bone-3) 0 2px,transparent 2px 5px)}
.mrow .v b{font:800 28px/1 var(--f-disp)}
.mrow .v span{display:block;font-size:12px;color:var(--bone-3);margin-top:2px}
.mrow .d{font-size:12.5px;color:var(--bone-2)}
.mrow .d em{display:block;font:500 12px var(--f-mono);font-style:normal;color:var(--t-fract);margin-top:2px}
.strip{display:flex;height:22px;gap:2px;margin-top:6px}
.strip i{display:block;background:var(--c);border-radius:2px}
.lg{display:flex;flex-direction:column;margin-top:14px}
.lg div{display:grid;grid-template-columns:minmax(0,1fr) 70px 90px 100px;gap:12px;align-items:center;padding-block:9px;border-top:1px solid var(--rule);font-size:14px}
.lg div span:nth-child(n+2){text-align:right;font-variant-numeric:tabular-nums}
.lg b{display:flex;align-items:center;gap:10px;font-weight:600}
.note{border:1px dashed var(--rule-2);border-radius:4px;padding:11px 14px;color:var(--bone-3);font-size:12.5px;margin-top:20px}
.note a{color:var(--accent);text-decoration:none}
 
.read{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));border-block:1px solid var(--rule);margin-top:16px}
.read>div{padding:16px 18px;border-left:1px solid var(--rule);min-width:0}
.read>div:first-child{border-left:0;padding-left:0}
.read b{color:var(--bone);display:block;font:800 40px/1 var(--f-disp);margin-top:6px}
.read b i{font:500 13px var(--f-body);font-style:normal;color:var(--bone-3);margin-left:5px}
.read p{margin:6px 0 0;font-size:12px;color:var(--bone-3)}
.warn{border:1px solid color-mix(in srgb,var(--t-fract) 45%,transparent);color:var(--t-fract);border-radius:4px;padding:10px 14px;font-size:13.5px}
.zr{margin-top:32px}
.ribbon{display:grid;grid-template-columns:repeat(5,1fr);gap:2px}
.ribbon i{display:block;height:16px;background:var(--accent);opacity:var(--o);border-radius:2px}
.zl{display:grid;grid-template-columns:repeat(5,1fr);gap:2px;margin-top:10px}
.zl div{padding-right:8px;border-left:1px solid var(--rule-2);padding-left:10px}
.zl b{display:block;font-size:13.5px;line-height:1.3;margin-top:3px}
.zl p{margin:5px 0 0;font:500 12px var(--f-mono);color:var(--bone-2)}
.chart{width:100%;height:auto;display:block}
.chart text{fill:var(--bone-3);font:11px var(--f-mono)}
.chart .gr{stroke:var(--rule);stroke-width:1}
.chart .ln{fill:none;stroke:var(--accent);stroke-width:2.5;stroke-linejoin:round;stroke-linecap:round}
.chart .ar{fill:var(--accent);opacity:.14}
.chart .pt{fill:var(--accent);stroke:var(--ink-2);stroke-width:2.5}
.chart .vl{fill:var(--bone);font:600 12px var(--f-mono)}
.chart .st{stroke:var(--accent);stroke-width:5;stroke-linecap:butt}
.lgd{display:flex;gap:20px;color:var(--bone-3);font-size:12.5px;margin-top:10px}
.lgd i{display:inline-block;width:20px;border-top:2px solid var(--accent);vertical-align:middle;margin-right:7px}
.lgd i.d{border-top-style:dashed;border-color:var(--bone-2)}
.quote{font:700 clamp(22px,2.6vw,30px)/1.2 var(--f-disp);text-transform:uppercase;letter-spacing:.01em;border-left:4px solid var(--accent);padding-left:18px;margin:0 0 22px}
.tw{overflow-x:auto}
table{width:100%;border-collapse:collapse}
th{font:500 10.5px var(--f-mono);letter-spacing:.1em;text-transform:uppercase;color:var(--bone-3);text-align:left;padding:10px 16px;border-bottom:1px solid var(--rule-2)}
td{padding:12px 16px;border-bottom:1px solid var(--rule);white-space:nowrap;font-variant-numeric:tabular-nums}
tr:last-child td{border-bottom:0}
td.p{font-weight:700;color:var(--accent)}
details summary{cursor:pointer;color:var(--bone-2);list-style:none;display:flex;gap:9px;align-items:center;font-size:13px}
details summary::-webkit-details-marker{display:none}
details summary::before{content:"+";font:500 15px var(--f-mono);color:var(--accent);width:12px}
details[open] summary::before{content:"–"}
details p{margin:10px 0 0;color:var(--bone-3);font-size:12.5px;max-width:70ch}
 
/* records */
.grp{margin-top:44px}
.grp>h3{display:flex;flex-wrap:wrap;gap:4px 14px;align-items:baseline;margin:0 0 6px;font:800 21px var(--f-disp);text-transform:uppercase;letter-spacing:.04em}
.grp>h3 span{font:400 12.5px var(--f-body);text-transform:none;letter-spacing:0;color:var(--bone-3)}
.plq{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));border-top:1px solid var(--rule-2)}
.plq>div{padding:18px 20px 18px 0;border-bottom:1px solid var(--rule);min-width:0}
.plq>div+div{padding-left:20px;border-left:1px solid var(--rule)}
.plq .l{display:flex;gap:8px;align-items:center;color:var(--bone-3);font-size:12.5px}
.plq b{display:block;font:800 44px/1 var(--f-disp);margin-top:8px}
.plq b i{font:500 13px var(--f-body);font-style:normal;color:var(--bone-3);margin-left:5px}
.plq p{margin:7px 0 0;color:var(--bone-3);font-size:12px}
.spec{border-top:1px solid var(--rule-2)}
.spec>div{display:grid;grid-template-columns:minmax(0,1.1fr) 150px minmax(0,1.5fr);gap:6px 20px;align-items:baseline;padding:13px 0;border-bottom:1px solid var(--rule)}
.spec .k{display:flex;gap:9px;align-items:center;font-weight:500}
.spec b{font:800 28px/1 var(--f-disp)}
.spec b i{font:500 12px var(--f-body);font-style:normal;color:var(--bone-3);margin-left:4px}
.spec p{margin:0;color:var(--bone-3);font-size:12.5px}
.big{display:grid;grid-template-columns:minmax(0,300px) minmax(0,1fr);gap:30px;align-items:end;padding-block:20px;border-block:1px solid var(--rule-2)}
.big b{display:block;font:900 clamp(64px,8vw,104px)/.9 var(--f-disp);color:var(--accent);margin-top:8px}
.big b i{font:500 18px var(--f-body);font-style:normal;color:var(--bone-3);margin-left:6px}
.spark{display:flex;align-items:flex-end;gap:10px;height:130px}
.spark div{flex:1;min-width:0;display:flex;flex-direction:column;align-items:center;gap:8px;height:100%;justify-content:flex-end}
.spark i{display:block;width:100%;max-width:44px;background:var(--accent);min-height:3px;border-radius:2px 2px 0 0}
.spark i.z{background:var(--ink-4)}
.spark span{font:400 10.5px var(--f-mono);color:var(--bone-3)}
 
/* trophées */
.thead{display:grid;grid-template-columns:minmax(0,1.3fr) minmax(0,1fr);gap:44px;align-items:start}
.thead h2{font:900 clamp(44px,6vw,76px)/.88 var(--f-disp);text-transform:uppercase;margin:0 0 14px}
.thead h2 span{color:var(--accent)}
.thead p{color:var(--bone-2);font-size:14px;max-width:62ch;margin:0}
.xp{font:900 clamp(60px,9vw,112px)/.85 var(--f-disp);color:var(--accent);margin:8px 0 6px}
.ticks{display:grid;grid-template-columns:repeat(46,1fr);gap:2px;margin:12px 0 6px}
.ticks i{display:block;height:14px;background:var(--ink-4);border-radius:1px}
.ticks i.on{background:var(--accent)}
.meter{height:8px;background:var(--ink-4);border-radius:2px;overflow:hidden;margin:12px 0 6px}
.meter i{display:block;height:100%;background:var(--accent)}
.tstat{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-top:22px}
.tstat b{font:800 44px/1 var(--f-disp);display:block;margin-top:4px}
.tstat b i{font:500 15px var(--f-body);font-style:normal;color:var(--bone-3);margin-left:5px}
.tgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:20px}
.tro{padding:20px;display:flex;flex-direction:column;gap:16px}
.tro .top{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}
.tro h3{font:800 24px/1.05 var(--f-disp);text-transform:uppercase;letter-spacing:.02em;margin:0}
.pill{font:500 10.5px var(--f-mono);letter-spacing:.1em;border:1px solid var(--c);color:var(--c);border-radius:3px;padding:2px 8px;white-space:nowrap}
.cur{border-left:2px solid var(--rule-2);padding-left:12px;font-size:13px;color:var(--bone-2)}
.cur .lab{display:block;margin-bottom:2px}
.stairs{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;align-items:end}
.stc{display:flex;flex-direction:column;min-width:0}
.stb{position:relative;background:var(--ink-3);border-radius:3px 3px 0 0;overflow:hidden;display:flex;align-items:flex-start;justify-content:center;padding-top:7px}
.stb i{position:absolute;inset:auto 0 0 0;background:var(--c);opacity:.9}
.stb.part i{opacity:.4}
.stb span{position:relative;font:600 12px var(--f-mono);color:var(--ink)}
.stb.part span{color:var(--bone)}
.stl{padding-top:8px;border-top:2px solid var(--c)}
.stl b{display:flex;gap:6px;align-items:center;font-size:12.5px;font-weight:600}
.stl .th{font:500 11.5px var(--f-mono);color:var(--bone-2);margin-top:2px;white-space:nowrap}
.stl .xp2{margin-top:6px;font:800 20px/1 var(--f-disp)}
.stl .xp2 small{display:block;font:400 10.5px var(--f-body);color:var(--bone-3);margin-top:2px;letter-spacing:0}
.stl.lock b,.stl.lock .th,.stl.lock .xp2{color:var(--bone-3)}
.tro details{border-top:1px solid var(--rule);padding-top:12px}
 
/* calendrier */
.ptab td:first-child,.ptab th:first-child{padding-left:0}
.ptab td:first-child{color:var(--bone-3)}
.facts{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));border-top:1px solid var(--rule-2)}
.facts>div{padding:16px 0;border-bottom:1px solid var(--rule)}
.facts>div:nth-child(even){padding-left:24px;border-left:1px solid var(--rule)}
.facts b{display:block;font:800 30px/1.05 var(--f-disp);margin-top:5px}
.facts b span{font:400 13px var(--f-body);color:var(--bone-3)}
.perf{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px;margin-top:20px}
.pf{padding:20px;display:flex;flex-direction:column;gap:12px}
.pf .res{font:800 30px/1.05 var(--f-disp);text-transform:uppercase;letter-spacing:.01em}
.pf .res small{display:block;font:400 13px var(--f-body);text-transform:none;letter-spacing:0;color:var(--bone-3);margin-top:6px}
.link{background:none;border:0;padding:0;color:var(--accent);font-weight:600;font-size:13px}
.link:hover{text-decoration:underline}
.heatwrap{overflow-x:auto;padding-bottom:10px}
.heat{display:grid;grid-template-columns:20px repeat(53,16px);grid-template-rows:20px repeat(7,16px);gap:3px;width:max-content}
.hm{grid-row:1;background:none;border:0;padding:0;text-align:left;color:var(--bone-3);font:500 10.5px var(--f-mono);letter-spacing:.08em;text-transform:uppercase;white-space:nowrap}
.hm:hover{color:var(--accent)}
.hw{grid-column:1;font:500 9px var(--f-mono);color:var(--bone-3);display:flex;align-items:center}
.hc{border:0;padding:0;border-radius:3px;background:var(--ink-3)}
.hc.l1{background:var(--accent-mid)}
.hc.l2{background:var(--accent)}
.hc.l3{background:var(--accent);box-shadow:inset 0 0 0 4px color-mix(in srgb,var(--ink) 55%,transparent)}
.hc.today{outline:1.5px solid var(--bone);outline-offset:1px}
.hc.sel{box-shadow:0 0 0 2px var(--ink),0 0 0 3.5px var(--accent)}
.hl{display:flex;flex-wrap:wrap;gap:14px 24px;justify-content:space-between;align-items:center;margin-top:12px;font-size:12.5px;color:var(--bone-3)}
.hl .k{display:flex;align-items:center;gap:6px}
.hl .k i{width:14px;height:14px;border-radius:3px;background:var(--ink-3);display:inline-block}
.yr{display:flex;align-items:center;gap:6px}
.yr b{font:800 26px var(--f-disp);min-width:64px;text-align:center}
 
/* pompes */
.tpl{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:0;border-top:1px solid var(--rule-2)}
.tpl>div{padding:16px 18px 16px 0;border-bottom:1px solid var(--rule)}
.tpl>div+div{padding-left:18px;border-left:1px solid var(--rule)}
.tpl .chips{margin-top:10px;flex-direction:column;align-items:flex-start}
.strip2{display:flex;gap:16px;align-items:center;border:1px solid var(--rule-2);border-radius:4px;padding:16px 20px}
.strip2 b{font:800 30px/1 var(--f-disp);text-transform:uppercase;white-space:nowrap}
.strip2 p{margin:0;color:var(--bone-2);font-size:13.5px}
.ticket{display:grid;grid-template-columns:auto minmax(0,1fr) auto;border:1px solid var(--rule-2);border-radius:4px;background:var(--ink-2)}
.ticket .l{padding:22px 24px;display:grid;place-items:center;color:var(--accent);border-right:2px dashed var(--rule-2)}
.ticket .l .ic{width:34px;height:34px}
.ticket .m{padding:20px 24px;min-width:0}
.ticket h3{font:800 34px/1 var(--f-disp);text-transform:uppercase;letter-spacing:.015em;margin:0 0 12px}
.ticket .row{display:flex;gap:10px;align-items:center;color:var(--bone-2);font-size:14px;margin-top:6px}
.ticket .row .ic{width:16px;height:16px;color:var(--bone-3)}
.ticket .r{padding:20px 22px;display:flex;gap:8px;align-items:flex-start}
.st{display:inline-flex;gap:8px;align-items:center;font:600 11.5px var(--f-mono);letter-spacing:.08em;text-transform:uppercase;color:var(--accent);border:1px solid var(--accent);border-radius:4px;padding:7px 12px;white-space:nowrap}
.ps{display:grid;grid-template-columns:132px minmax(0,1.6fr) minmax(0,1fr) auto;gap:8px 28px;align-items:center;padding-block:20px;border-top:1px solid var(--rule)}
.pd .wd{display:block;font:500 10.5px var(--f-mono);letter-spacing:.1em;text-transform:uppercase;color:var(--bone-3)}
.pd b{display:block;font:900 64px/.9 var(--f-disp);margin:4px 0 2px}
.pd .my{display:block;font-size:13px;color:var(--bone-2)}
.pd .tm{display:block;font:500 12px var(--f-mono);color:var(--bone-3);margin-top:2px}
.pm{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:0}
.pm>div{padding-inline:16px;border-left:1px solid var(--rule)}
.pm>div:first-child{padding-left:0;border-left:0}
.pm small{display:block;font:500 10px var(--f-mono);letter-spacing:.1em;text-transform:uppercase;color:var(--bone-3)}
.pm b{display:block;font:800 36px/1 var(--f-disp);margin-top:5px}
.pm span{display:block;font-size:12px;color:var(--bone-3);margin-top:3px}
.sets{display:flex;gap:3px;margin-top:8px}
.sets i{flex:1;height:6px;background:var(--accent);border-radius:1px}
.rt{display:grid;grid-template-columns:1fr 1fr;gap:10px 22px}
.rt div{display:flex;flex-direction:column;gap:4px}
.rt .t{display:flex;justify-content:space-between;font-size:12.5px;color:var(--bone-2)}
.rt .t b{font:500 11.5px var(--f-mono);color:var(--bone)}
.pips{display:flex;gap:3px}
.pips i{flex:1;height:8px;border-radius:2px;background:var(--ink-4)}
.pips i.on{background:var(--star)}
.pips.avant i.on,.pips.apres i.on{background:var(--accent)}
.pnote{color:var(--bone-3);font-size:12.5px;padding-block:20px;border-top:1px solid var(--rule)}
 
/* grease the groove */
.head h1.long{font-size:clamp(52px,8.4vw,116px)}
.gxp{text-align:right}
.gxp .lab{display:block}
.gxp b{display:block;font:900 clamp(60px,8vw,104px)/.85 var(--f-disp);color:var(--accent);margin:8px 0 6px}
.modes{display:flex;gap:32px;padding-top:6px}
.modes button{background:none;border:0;padding:0 0 6px;font:800 30px/1 var(--f-disp);text-transform:uppercase;letter-spacing:.03em;color:var(--bone-3);border-bottom:3px solid transparent;border-radius:0}
.modes button:hover{color:var(--bone)}
.modes button[aria-pressed="true"]{color:var(--bone);border-bottom-color:var(--accent)}
.mx2{border-collapse:separate;border-spacing:6px;width:100%;min-width:760px;margin:-6px}
.mx2 th{font-weight:400;padding:0;text-align:center;border:0}
.mx2 thead th{padding-bottom:8px}
.mx2 .tm{display:block;font:800 28px/1 var(--f-disp);letter-spacing:.02em}
.mx2 .ct{display:block;font:500 11px var(--f-mono);color:var(--bone-3);margin-top:3px}
.mx2 tbody th{text-align:left;padding-right:12px;min-width:150px}
.mx2 .en{display:block;font-weight:600;font-size:14.5px;line-height:1.25}
.mx2 .er{display:block;font:500 11px var(--f-mono);color:var(--bone-3);margin-top:3px}
.mx2 td{padding:0;border:0}
.mx2 td.tot{text-align:right;font:500 12px var(--f-mono);color:var(--bone-2);padding-left:10px;width:54px;white-space:nowrap}
.exs{display:flex;flex-wrap:wrap;gap:10px 22px;margin-bottom:18px}
.ex-k{display:inline-flex;align-items:center;gap:9px;font-size:13.5px;color:var(--bone)}
.ex-k b{font-weight:700;color:var(--c)}
.ex-k span{color:var(--bone-3);font:500 12px var(--f-mono)}
.ex-k em{font:600 12px var(--f-mono);font-style:normal;color:var(--c)}
.slots{display:grid;grid-template-columns:repeat(auto-fit,minmax(132px,1fr));gap:12px}
.slot{border:1px solid var(--rule-2);border-radius:6px;padding:12px;display:flex;flex-direction:column;gap:8px;background:linear-gradient(160deg,var(--ink-3),var(--ink-2));min-width:0}
.slot .sh{display:flex;justify-content:space-between;align-items:baseline;padding-bottom:6px;border-bottom:1px solid var(--rule)}
.slot .tm{font:800 30px/1 var(--f-disp);letter-spacing:.02em;color:var(--bone)}
.slot .ct{font:500 11.5px var(--f-mono);color:var(--bone-3)}
.cell{width:100%;border:1px solid var(--rule-2);border-left:4px solid var(--c);background:var(--ink);border-radius:4px;padding:7px 10px;display:flex;flex-direction:column;align-items:flex-start;gap:2px;color:var(--bone);text-align:left}
.cell em{font:500 10px/1.2 var(--f-mono);font-style:normal;letter-spacing:.07em;text-transform:uppercase;color:var(--c)}
.cell b{font:800 26px/1 var(--f-disp)}
.cell b i{font:500 10px var(--f-mono);font-style:normal;letter-spacing:.08em;text-transform:uppercase;margin-left:5px;opacity:.75}
.cell:hover{border-color:var(--c)}
.cell[aria-pressed="true"]{background:var(--c);border-color:var(--c);color:var(--ink)}
.cell[aria-pressed="true"] em{color:var(--ink)}
.prog b{display:block;font:900 92px/.85 var(--f-disp)}
.prog b i{font:700 36px var(--f-disp);font-style:normal;color:var(--bone-3);margin-left:4px}
.pbar{position:relative;height:10px;background:var(--ink-4);border-radius:2px;margin-top:18px}
.pbar i{display:block;height:100%;background:var(--accent);border-radius:2px}
.pbar u{position:absolute;left:50%;top:-5px;bottom:-5px;width:2px;background:var(--t-fract)}
.pxp{display:flex;justify-content:space-between;gap:10px;font:500 12px var(--f-mono);margin-top:12px;color:var(--bone-2)}
.rule-xp{font-size:12.5px;color:var(--bone-3);margin:16px 0 0;padding-top:14px;border-top:1px solid var(--rule)}
.fl{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:14px}
.fl button{padding:11px 8px;border:1px solid var(--rule-2);background:none;border-radius:4px;font-weight:600;color:var(--bone-2)}
.fl button:hover{border-color:var(--bone-2)}
.fl button[aria-pressed="true"]{background:var(--accent-soft);border-color:var(--accent);color:var(--bone)}
.pas .g{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin:14px 0}
.pas .ex{margin:14px 0 0;padding:0;list-style:none;border-top:1px solid var(--rule)}
.pas .ex li{display:flex;justify-content:space-between;gap:10px;padding:8px 0;border-bottom:1px solid var(--rule);font:500 12px var(--f-mono);color:var(--bone-2)}
.proto{border-block:1px solid var(--rule-2)}
.proto summary{display:grid;grid-template-columns:minmax(0,1fr) auto auto;gap:6px 24px;align-items:center;padding:18px 0;font-size:14px;color:var(--bone)}
.proto summary .k{font-weight:600;font-size:15px}
.proto summary .v{font:800 26px/1 var(--f-disp);letter-spacing:.02em}
.proto summary .o{font:500 12px var(--f-mono);color:var(--bone-3)}
.proto .body{padding:0 0 20px;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}
.dose{display:grid;grid-template-columns:repeat(3,minmax(0,1fr))}
.dose>article{padding:22px 22px 22px 0;border-bottom:1px solid var(--rule);min-width:0}
.dose>article+article{padding-left:22px;border-left:1px solid var(--rule)}
.dose .tp{display:flex;justify-content:space-between;gap:10px;align-items:flex-start}
.dose h3{font:800 26px/1 var(--f-disp);text-transform:uppercase;letter-spacing:.02em;margin:0}
.lvl{font:500 10.5px var(--f-mono);letter-spacing:.1em;border:1px solid var(--c);color:var(--c);border-radius:3px;padding:2px 8px;white-space:nowrap}
.dv{display:flex;flex-wrap:wrap;align-items:flex-end;gap:8px 14px;margin-top:18px}
.dv input{width:84px;font:800 44px/1 var(--f-disp);text-align:center;background:var(--ink);border:1px solid var(--rule-2);border-radius:4px;padding:6px 4px;font-variant-numeric:tabular-nums}
.dv .m3{font:500 12.5px var(--f-mono);color:var(--bone-2);padding-bottom:9px}
.gauge{height:6px;background:var(--ink-4);border-radius:2px;margin-top:16px;overflow:hidden}
.gauge i{display:block;height:100%;background:var(--accent)}
.dose .sg{margin-top:16px}
.dose .sg .chips{margin-top:8px}
.dose .sg .chip{padding:3px 10px;font-size:12px}
.cfs{position:relative}
.cfs .ic{position:absolute;left:13px;top:50%;transform:translateY(-50%);color:var(--bone-3)}
.cfs input{width:100%;background:var(--ink);border:1px solid var(--rule-2);border-radius:4px;padding:12px 14px 12px 40px}
.cf{border-top:1px solid var(--rule)}
.cf summary{display:flex;justify-content:space-between;gap:16px;align-items:center;padding:16px 0}
.cf summary .t{flex:1;min-width:0}
.cf summary b{display:block;font:800 22px/1.1 var(--f-disp);text-transform:uppercase;letter-spacing:.02em;color:var(--bone)}
.cf summary span.s{display:block;font-size:12.5px;color:var(--bone-3);margin-top:3px}
.cf summary .c{font:500 12px var(--f-mono);color:var(--bone-2)}
.cf .bd{padding:0 0 16px 24px;color:var(--bone-3);font-size:12.5px}
.meth{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));border-top:1px solid var(--rule-2)}
.meth>div{padding:22px 22px 22px 0;min-width:0}
.meth>div+div{padding-left:22px;border-left:1px solid var(--rule)}
.meth b{display:block;font:900 56px/.9 var(--f-disp);color:var(--accent)}
.meth p{margin:14px 0 0;color:var(--bone-2);font-size:13.5px}
.meth p.fine{color:var(--bone-3)}
 
 
/* nouvelles pages */
.es{display:flex;flex-direction:column;align-items:center;gap:8px;padding:56px 20px;border:1px dashed var(--rule-2);border-radius:6px;background:linear-gradient(160deg,var(--ink-2),var(--ink));text-align:center}
.es .ic{width:48px;height:48px;color:var(--accent);margin-bottom:6px}
.es b{font:800 28px/1 var(--f-disp);text-transform:uppercase;letter-spacing:.03em}
.es span{color:var(--bone-2);font-size:13.5px}
.tplbox{border:1px solid var(--rule-2);border-radius:6px;padding:18px 20px;background:linear-gradient(160deg,var(--ink-3),var(--ink-2));margin-bottom:8px}
.tplbox .chip{border-color:var(--accent);color:var(--bone);background:var(--accent-soft)}
.tplbox .chip:hover{background:var(--accent);color:var(--accent-ink)}
.strip2 .ic{width:26px;height:26px;color:var(--t-fract);flex:none}
.strip2{background:linear-gradient(90deg,var(--accent-soft),transparent)}
.plq3{grid-template-columns:repeat(3,minmax(0,1fr))}
.plq .l{color:var(--bone-2)}
.plq b{color:var(--bone)}
.cbar{display:flex;gap:14px;flex-wrap:wrap;align-items:flex-end}
.cgrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(340px,1fr));gap:18px}
.circ{padding:20px;display:flex;flex-direction:column;gap:12px}
.ct1{display:flex;align-items:center;gap:12px;flex-wrap:wrap}
.ct1 h3{display:flex;gap:10px;align-items:center;margin:0;font:800 26px/1 var(--f-disp);text-transform:uppercase;letter-spacing:.02em;color:var(--bone)}
.ct1 h3 .ic{color:var(--accent)}
.ct1 .sp{flex:1}
.circ .cm{margin:0;color:var(--bone-2);font-size:13px}
.ctd{display:flex;gap:10px;font-size:13.5px;color:var(--bone)}
.link-b{display:inline-flex;align-items:center;gap:8px;border:1px solid var(--t-cl);color:var(--t-cl);border-radius:4px;padding:3px 10px;font-size:12.5px}
.link-b .ic{width:14px;height:14px}
.link-b b{color:var(--bone)}
.sugs{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:18px}
.sug{padding:20px;display:flex;flex-direction:column;gap:10px}
.sug h3{margin:0;font:800 26px/1.05 var(--f-disp);text-transform:uppercase;letter-spacing:.02em;color:var(--bone)}
.pk{display:flex;justify-content:space-between;gap:10px;align-items:baseline;padding-top:6px;border-top:1px solid var(--rule)}
.pk b{font:800 34px/1 var(--f-disp);color:var(--accent)}
.pk span{color:var(--bone-2);font-size:13px}
.seq{font:500 12px/1.6 var(--f-mono);color:var(--t-fract);word-break:break-all}
.sug .pct{margin:0;font-weight:700;font-size:13px;color:var(--t-cl)}
.sug .ra{margin-top:auto;padding-top:8px}
.signals{border:1px solid var(--rule-2);border-radius:6px;padding:16px 20px;margin:16px 0;background:linear-gradient(160deg,var(--ink-3),var(--ink-2))}
.signals dl{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:14px 22px;margin:12px 0 0}
.signals dt{font:500 10px var(--f-mono);letter-spacing:.1em;text-transform:uppercase;color:var(--bone-3)}
.signals dd{margin:4px 0 0;font:800 24px/1.1 var(--f-disp);color:var(--bone)}
.signals dd span{font:400 12px var(--f-body);color:var(--bone-2)}
code{font:500 12px var(--f-mono);color:var(--t-fract);background:var(--accent-soft);padding:1px 6px;border-radius:3px}
.split2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}
.bt{display:flex;gap:10px;align-items:center;margin:0;font:800 20px/1.1 var(--f-disp);text-transform:uppercase;letter-spacing:.04em}
.cm2{display:flex;gap:14px;flex-wrap:wrap;align-items:flex-end;margin-top:14px}
.prev{margin:16px 0 4px;color:var(--bone-2)}
.prev .seq{font-size:14px}
.alert{border:1px solid var(--t-vit);color:var(--t-vit);border-radius:6px;padding:14px 18px;background:color-mix(in srgb,var(--t-vit) 10%,transparent)}
.grid2p{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}
.prf h3{margin:14px 0 4px;font:800 28px/1.05 var(--f-disp);text-transform:uppercase;letter-spacing:.02em}
.prf b{display:block;font:900 64px/.95 var(--f-disp)}
.prf p{margin:6px 0 0;color:var(--bone-2);font-size:13px}
.prf .arrow{margin-top:10px;font:600 14px var(--f-mono);color:var(--bone)}
.prf .lab{display:flex;gap:8px;align-items:center}
.mxl{margin-top:18px;border-top:1px solid var(--rule-2)}
.mxr{display:grid;grid-template-columns:minmax(0,1fr) auto auto;gap:6px 24px;align-items:center;padding:16px 0;border-bottom:1px solid var(--rule)}
.mxr div b{display:block;font:800 24px/1.1 var(--f-disp);text-transform:uppercase;letter-spacing:.02em}
.mxr div span{color:var(--bone-3);font:500 12px var(--f-mono)}
.mxr .rr{font:900 38px/1 var(--f-disp);color:var(--accent)}
@media (max-width:900px){.split2,.grid2p,.plq3{grid-template-columns:minmax(0,1fr)}.mxr{grid-template-columns:minmax(0,1fr) auto}.mxr .btn{grid-column:1/-1;justify-self:start}}
@media (max-width:1180px){
  .dose{grid-template-columns:minmax(0,1fr)}
  .dose>article+article{padding-left:0;border-left:0}
  .proto .body{grid-template-columns:repeat(2,minmax(0,1fr))}
  .meth{grid-template-columns:repeat(2,minmax(0,1fr))}
  .meth>div:nth-child(odd){padding-left:0;border-left:0}
  .meth>div:nth-child(n+3){border-top:1px solid var(--rule)}
  .split{grid-template-columns:minmax(0,1fr)}
  .rail{position:static;order:-1;display:grid;grid-template-columns:repeat(2,minmax(0,1fr))}
  .rail .sync{grid-column:1/-1}
}
@media (max-width:980px){
  .shell{grid-template-columns:minmax(0,1fr);gap:20px}
  .side{position:static;max-height:none;display:none}
  .side.open{display:block}
  .btn.menu{display:inline-flex}
  .mrow{grid-template-columns:minmax(0,1fr) minmax(0,1fr)}
  .mrow .nm,.mrow .mb{grid-column:1/-1}
  .ps{grid-template-columns:104px minmax(0,1fr)}
  .ps .pm,.ps .rt{grid-column:1/-1}
  .ps .ra{grid-column:2;grid-row:1;justify-self:end}
  .thead,.big{grid-template-columns:minmax(0,1fr)}
  .tpl{grid-template-columns:repeat(2,minmax(0,1fr))}
  .tpl>div:nth-child(odd){padding-left:0;border-left:0}
}
@media (max-width:720px){
  .board{grid-template-columns:repeat(2,minmax(0,1fr))}
  .board>div:nth-child(3){border-left:0;padding-left:0}
  .board>div:nth-child(n+3){border-top:1px solid var(--rule)}
  .two,.facts,.perf,.rail{grid-template-columns:minmax(0,1fr)}
  .two>div+div,.facts>div:nth-child(even){padding-left:0;border-left:0}
  .read{grid-template-columns:repeat(2,minmax(0,1fr))}
  .read>div:nth-child(3){border-left:0;padding-left:0}
  .read>div:nth-child(n+3){border-top:1px solid var(--rule)}
  .log{grid-template-columns:62px minmax(0,1fr)}
  .log .mx{grid-column:1/-1;grid-template-columns:repeat(2,minmax(0,1fr));row-gap:10px}
  .log .mx div:nth-child(odd){border-left:0;padding-left:0}
  .log .ra{grid-column:2;grid-row:1;justify-self:end}
  .nums{grid-template-columns:repeat(2,minmax(0,1fr))}
  .zl{grid-template-columns:repeat(2,1fr)}
  .lg div{grid-template-columns:minmax(0,1fr) 60px 80px}
  .lg div span:last-child{display:none}
  .spec>div{grid-template-columns:minmax(0,1fr) auto}
  .spec p{grid-column:1/-1}
  .ticket{grid-template-columns:minmax(0,1fr)}
  .ticket .l{display:none}
  .tgrid{grid-template-columns:minmax(0,1fr)}
  .strip2{flex-direction:column;align-items:flex-start}
  .sync .g{grid-template-columns:1fr}
}
@media (prefers-reduced-motion:reduce){*{transition:none!important}}
 
/* ---------- détail séance ---------- */
.log{cursor:pointer;transition:background .15s}.log:hover{background:color-mix(in oklab,var(--accent) 7%,transparent)}
.log .go{display:inline-flex;align-items:center;gap:6px;font:600 11px var(--f-mono);letter-spacing:.08em;text-transform:uppercase;color:var(--accent);margin-top:8px}
.back{display:inline-flex;align-items:center;gap:8px;font:600 12px var(--f-mono);letter-spacing:.08em;text-transform:uppercase;color:var(--accent);background:none;border:0;padding:6px 0;cursor:pointer;margin-bottom:10px}
.back:hover{text-decoration:underline}
.dh{position:relative;border:1px solid var(--rule-2);border-radius:8px;padding:28px 30px 26px;overflow:hidden;background:linear-gradient(135deg,color-mix(in oklab,var(--c) 22%,var(--ink-2)),var(--ink-2) 60%)}
.dh:before{content:"";position:absolute;inset:0 auto 0 0;width:6px;background:var(--c)}
.dh .bd{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:14px}
.pill{font:600 10.5px var(--f-mono);letter-spacing:.09em;text-transform:uppercase;padding:5px 10px;border-radius:99px;border:1px solid color-mix(in oklab,var(--c,var(--accent)) 55%,transparent);color:var(--c,var(--accent));background:color-mix(in oklab,var(--c,var(--accent)) 12%,transparent)}
.dh h2{font:800 clamp(38px,6vw,72px)/.92 var(--f-disp);text-transform:uppercase;margin:0;color:var(--c)}
.dh .dd{color:var(--bone-2);margin-top:8px;font-size:15px}
.dk{display:grid;grid-template-columns:repeat(4,1fr);margin-top:24px;border-top:1px solid var(--rule-2)}
.dk div{padding:16px 16px 0 0}.dk div+div{padding-left:18px;border-left:1px solid var(--rule)}
.dk dt{font:600 10.5px var(--f-mono);letter-spacing:.1em;text-transform:uppercase;color:var(--c)}
.dk dd{margin:4px 0 0;font:800 clamp(28px,4vw,46px)/1 var(--f-disp);color:var(--bone)}
.dk dd small{font:600 13px var(--f-mono);color:var(--bone-2);margin-left:4px}
.dnote{margin:18px 0 0;padding:14px 18px;border-radius:6px;border:1px dashed color-mix(in oklab,var(--c) 50%,transparent);background:color-mix(in oklab,var(--c) 8%,transparent);color:var(--bone)}
.dnote em{font-style:normal;font:600 10px var(--f-mono);letter-spacing:.1em;text-transform:uppercase;color:var(--c);margin-right:8px}
.dg{display:grid;grid-template-columns:repeat(12,1fr);gap:16px;margin-top:20px}
.dg>.box{padding:20px 22px}.s4{grid-column:span 4}.s6{grid-column:span 6}.s8{grid-column:span 8}.s12{grid-column:span 12}
.dg h3{font:700 11px var(--f-mono);letter-spacing:.12em;text-transform:uppercase;color:var(--accent);margin:0 0 14px}
.kv{display:grid;grid-template-columns:1fr 1fr;gap:14px 18px;margin:0}
.kv dt{font:600 10px var(--f-mono);letter-spacing:.1em;text-transform:uppercase;color:var(--bone-3)}
.kv dd{margin:3px 0 0;font:700 22px/1.1 var(--f-disp);color:var(--bone)}
.kv dd small{font:600 12px var(--f-mono);color:var(--bone-2)}
.zbar{display:flex;height:10px;border-radius:5px;overflow:hidden;margin:16px 0 8px;background:var(--ink-3)}
.zbar i{display:block}.zl{display:flex;flex-wrap:wrap;gap:6px 16px;font:600 11.5px var(--f-mono)}
.pl{display:flex;justify-content:space-between;gap:10px;align-items:center;padding:11px 0;border-top:1px solid var(--rule);color:var(--bone)}
.pl:first-of-type{border-top:0}.pl span{font:600 10px var(--f-mono);letter-spacing:.1em;text-transform:uppercase;color:var(--bone-3);display:block}
.pl a{color:var(--accent);font:600 12px var(--f-mono);text-decoration:none;display:inline-flex;gap:6px;align-items:center;white-space:nowrap}
.kt{width:100%;border-collapse:collapse;font-variant-numeric:tabular-nums}
.kt th{font:600 10px var(--f-mono);letter-spacing:.1em;text-transform:uppercase;color:var(--accent);text-align:right;padding:8px 10px;border-bottom:1px solid var(--rule-2)}
.kt th:first-child,.kt td:first-child{text-align:left}
.kt td{text-align:right;padding:10px;border-bottom:1px solid var(--rule);color:var(--bone);font-weight:600}
.kt tr.tt td{color:var(--c);font-weight:800;border-bottom:0;background:color-mix(in oklab,var(--c) 10%,transparent)}
.kt .pb{display:inline-block;height:8px;border-radius:4px;background:var(--c);vertical-align:middle;margin-right:8px;min-width:6px}
.lapf{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px}
.lapf button{font:600 11px var(--f-mono);letter-spacing:.08em;text-transform:uppercase;padding:7px 14px;border-radius:99px;border:1px solid var(--rule-2);background:none;color:var(--bone-2);cursor:pointer}
.lapf button[aria-pressed=true]{background:var(--accent);color:var(--accent-ink);border-color:var(--accent)}
.laps{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:12px}
.lap{border:1px solid var(--rule-2);border-left:4px solid var(--lc);border-radius:6px;padding:12px 14px;background:color-mix(in oklab,var(--lc) 7%,var(--ink-2))}
.lap b{display:flex;justify-content:space-between;font:700 11px var(--f-mono);letter-spacing:.08em;text-transform:uppercase;color:var(--lc)}
.lap .p{font:800 30px/1.1 var(--f-disp);color:var(--bone);margin:6px 0 2px}.lap .p small{font:600 11px var(--f-mono);color:var(--bone-2)}
.lap dl{display:grid;grid-template-columns:1fr 1fr;gap:2px 10px;margin:8px 0 0;font:600 12px var(--f-mono);color:var(--bone-2)}.lap dl dd{margin:0;color:var(--bone)}
.det{display:flex;flex-wrap:wrap;gap:10px 28px}.det div{font:600 12px var(--f-mono);color:var(--bone-2)}.det b{color:var(--accent);font-size:20px;font-family:var(--f-disp);margin-right:6px}
details.tech{margin-top:16px;border:1px solid var(--rule-2);border-radius:6px;padding:14px 18px}
details.tech summary{cursor:pointer;font:700 11px var(--f-mono);letter-spacing:.12em;text-transform:uppercase;color:var(--accent)}
details.tech pre{margin:12px 0 0;white-space:pre-wrap;font:500 12px/1.6 var(--f-mono);color:var(--bone-2)}
@media(max-width:900px){.s4,.s6,.s8{grid-column:span 12}.dk{grid-template-columns:repeat(2,1fr)}.dk div:nth-child(3){border-left:0;padding-left:0}}
 
/* ---------- calendriers (mois) ---------- */
.pcs{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}
.pcard{padding:18px 20px}.pcard h3{margin:0 0 12px;font:700 11px var(--f-mono);letter-spacing:.12em;text-transform:uppercase;color:var(--accent)}
.pcard .r{display:flex;justify-content:space-between;gap:10px;align-items:baseline;padding:6px 0;color:var(--bone-2);font-size:13.5px}
.pcard .r b{font:800 22px/1 var(--f-disp);color:var(--bone)}
.pcard .si{margin-top:8px;padding-top:10px;border-top:1px solid var(--rule);font:600 11.5px var(--f-mono);color:var(--t-cl)}
.cbar{display:flex;flex-wrap:wrap;gap:12px 20px;justify-content:space-between;align-items:center;margin-bottom:12px}
.cbar .seg{display:flex;gap:6px}.cbar .seg button{font:600 12px var(--f-body);padding:8px 18px;border-radius:8px;border:1px solid var(--rule-2);background:none;color:var(--bone-2);cursor:pointer}
.cbar .seg button[aria-pressed=true]{background:var(--accent);color:var(--accent-ink);border-color:var(--accent)}
.cbar .nv{display:flex;align-items:center;gap:8px}.cbar .nv b{font:800 28px var(--f-disp);min-width:110px;text-align:center;color:var(--bone)}
.cleg{display:flex;flex-wrap:wrap;gap:8px 18px;align-items:center;margin:4px 0 16px;font:600 12px var(--f-mono);color:var(--bone-2)}
.cleg i{display:inline-block;width:18px;height:14px;border-radius:4px;margin-right:6px;vertical-align:middle;border:1px solid var(--rule-2)}
.cmonths{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:16px}
.cm{border:1px solid var(--rule-2);border-radius:10px;padding:16px 16px 18px;background:linear-gradient(160deg,var(--ink-3),var(--ink-2))}
.cm header{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:12px}
.cm h4{margin:0}.cm h4 button{background:none;border:0;padding:0;font:800 20px/1 var(--f-disp);text-transform:uppercase;letter-spacing:.03em;color:var(--bone);cursor:pointer}
.cm h4 button:hover{color:var(--accent)}
.cm .ct{font:600 11px var(--f-mono);color:var(--accent);background:none;border:0;cursor:pointer;padding:0}
.cm .ct.z{color:var(--bone-3);cursor:default}
.cg{display:grid;grid-template-columns:repeat(7,1fr);gap:5px}
.cg .wd{text-align:center;font:700 10px var(--f-mono);color:var(--accent);padding-bottom:4px}
.cd{aspect-ratio:1;border-radius:7px;border:1px solid var(--rule);background:none;color:var(--bone-3);font:600 12px var(--f-mono);padding:0;cursor:pointer;display:flex;align-items:center;justify-content:center;position:relative}
.cd:hover{border-color:var(--accent);color:var(--bone)}
.cd.e{visibility:hidden}
.cd.l1{background:color-mix(in oklab,var(--accent) 45%,var(--ink-2));border-color:var(--accent);color:var(--bone)}
.cd.l2{background:var(--t-fract);border-color:var(--t-fract);color:#2a1a02;font-weight:800}
.cd.l3{background:var(--t-vit);border-color:var(--t-vit);color:#2b0618;font-weight:800}
.cd.today{outline:2px solid var(--bone);outline-offset:1px}
.cd.sel{box-shadow:0 0 0 2px var(--ink),0 0 0 4px var(--accent)}
.cm.big{padding:20px 22px 24px}.cm.big .cg{gap:8px}.cm.big .cd{aspect-ratio:auto;min-height:74px;align-items:flex-start;justify-content:flex-start;padding:9px 11px;font-size:15px}
.cm.big .cd em{position:absolute;right:9px;bottom:7px;font:700 11px var(--f-mono);font-style:normal}
.csel{margin-top:16px;padding:12px 16px;border-radius:8px;border:1px dashed var(--rule-2);color:var(--bone);font:600 13px var(--f-mono);min-height:44px}
.msum{display:flex;gap:10px 28px;flex-wrap:wrap;margin-bottom:16px;font:600 12px var(--f-mono);color:var(--bone-2)}.msum b{font:800 24px var(--f-disp);color:var(--accent);margin-right:6px}
@media(max-width:900px){.pcs{grid-template-columns:1fr}}
</style>
 
<div class="shell">
  <aside class="side" id="side" aria-label="Défis">
    <h2>Défis</h2>
    <p class="sub">Suivez vos défis et vos sessions</p>
    <nav class="nav" id="nav"></nav>
    <div class="pick"><span class="lab">Couleur d'accent</span><div class="sw" id="sw"></div></div>
  </aside>
  <main class="main" id="main"></main>
</div>
 
<script>
(function(){
var MONTHS=['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
var MLOW=MONTHS.map(function(m){return m.toLowerCase()});
var MABBR=['janv.','févr.','mars','avr.','mai','juin','juil.','août','sept.','oct.','nov.','déc.'];
var WD=['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'];
function P(d){return '<svg class="ic" viewBox="0 0 24 24">'+d+'</svg>'}
var I={
 play:P('<path d="M7 5l12 7-12 7V5Z"/>'),
 foot:P('<ellipse cx="8" cy="9" rx="2.6" ry="4"/><ellipse cx="16" cy="14" rx="2.6" ry="4"/><path d="M7 15v2M17 7v2"/>'),
 dumb:P('<path d="M3 9v6M6 6v12M18 6v12M21 9v6M6 12h12"/>'),
 pulse:P('<path d="M3 12h4l2-6 4 12 2-6h6"/>'),
 anchor:P('<circle cx="12" cy="5" r="2"/><path d="M12 7v14M6 12H4a8 8 0 0 0 16 0h-2M8 11h8"/>'),
 box:P('<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3Z"/><path d="M12 12l8-4.5M12 12v9M12 12L4 7.5"/>'),
 waves:P('<path d="M3 8c3 0 3 2 6 2s3-2 6-2 3 2 6 2M3 14c3 0 3 2 6 2s3-2 6-2 3 2 6 2"/>'),
 repeat:P('<path d="M4 11V9a3 3 0 0 1 3-3h12l-3-3M20 13v2a3 3 0 0 1-3 3H5l3 3"/>'),
 clock:P('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
 layers:P('<path d="M12 3l9 5-9 5-9-5 9-5Z"/><path d="M3 13l9 5 9-5"/>'),
 award:P('<circle cx="12" cy="9" r="5"/><path d="M9 13.5L8 21l4-2 4 2-1-7.5"/>'),
 trophy:P('<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4Z"/><path d="M7 6H4v1a3 3 0 0 0 3 3M17 6h3v1a3 3 0 0 1-3 3"/>'),
 cal:P('<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M8 3v4M16 3v4M4 10h16"/>'),
 plus:P('<path d="M12 5v14M5 12h14"/>'),
 sync:P('<path d="M21 12a9 9 0 0 1-15.5 6.2M3 12a9 9 0 0 1 15.5-6.2"/><path d="M18.5 2v4h-4M5.5 22v-4h4"/>'),
 dl:P('<path d="M12 4v11M7 11l5 5 5-5M5 20h14"/>'),
 edit:P('<path d="M4 20h4L19 9l-4-4L4 16v4Z"/><path d="M13 7l4 4"/>'),
 del:P('<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>'),
 flame:P('<path d="M12 3c1 4 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-6 1-9Z"/>'),
 target:P('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>'),
 warn:P('<path d="M12 3l10 18H2L12 3Z"/><path d="M12 10v5M12 18v.5"/>'),
 search:P('<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>'),
 menu:P('<path d="M4 7h16M4 12h16M4 17h16"/>')
};
function $(s,r){return (r||document).querySelector(s)}
function $$(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))}
function pace(p){var a=p.split(':');return +a[0]+(+a[1])/60}
function fdate(iso){var a=iso.split('-');return (+a[2])+' '+MLOW[+a[1]-1]+' '+a[0]}
 
/* ---------- navigation ---------- */
var ACTS=[['course','Course','play'],['marche','Marche','foot'],['pompes','Pompes','dumb',1],['corde','Corde à sauter','pulse'],['gainage','Gainage','anchor'],['boxe','Boxe','box'],['natation','Natation','waves'],['circuits','Circuits','repeat'],['groove','Grease the Groove','clock'],['pyramide','Pyramide','layers'],['-'],['trophees','Tous mes trophées','award'],['perfs','Performances','trophy'],['cal','Calendrier','cal']];
var TABS=[['seances','Séances &amp; défis'],['trophees','Trophées'],['calendrier','Calendrier'],['stats','Statistiques']];
var S={act:'course',tab:'seances'};
 
function renderNav(){
  $('#nav').innerHTML=ACTS.map(function(a){
    if(a[0]==='-')return '<div class="gap"></div>';
    return '<button data-act="'+a[0]+'"'+(S.act===a[0]?' aria-current="page"':'')+'>'+I[a[2]]+'<span>'+a[1]+'</span>'+(a[3]?'<span class="badge">'+a[3]+'</span>':'')+'</button>';
  }).join('');
}
function actName(k){for(var i=0;i<ACTS.length;i++)if(ACTS[i][0]===k)return ACTS[i][1];return k}
function head(title,sub,btns){
  return '<div class="menu-row" style="display:none"></div><header class="head"><div><div class="kicker">Défis / '+title+'</div><h1>'+title+'</h1><p>'+sub+'</p></div><div class="hbtn">'+btns+'</div></header>';
}
function tabsBar(list){
  return '<nav class="tabs" role="tablist">'+(list||TABS).map(function(t){return '<button role="tab" data-tab="'+t[0]+'" aria-selected="'+(S.tab===t[0])+'">'+t[1]+'</button>'}).join('')+'</nav>';
}
function go(act,tab){
  S.act=act;S.tab=tab||'seances';S.det=null;
  try{location.hash=S.act+'-'+S.tab}catch(e){}
  render();window.scrollTo(0,0);
}
 
/* ---------- COURSE ---------- */
var TYPES={ef:{n:'Endurance fondamentale',c:'var(--t-ef)',g:'classique'},seuil:{n:'Seuil',c:'var(--t-seuil)',g:'vitesse'},vitesse:{n:'Vitesse',c:'var(--t-vit)',g:'vitesse'},fract:{n:'Fractionné',c:'var(--t-fract)',g:'fract'}};
var SESS=[
 ['ef','Z2 EF · 68 % FC max','2026-07-27','00:00',4.69,'00:42:14','9:00','6.66'],
 ['ef','Z3 tempo · 70 % FC max','2026-06-24','00:00',4.244,'00:40:30','9:33','6.29'],
 ['vitesse','Z4 seuil · 86 % FC max','2026-06-24','00:00',1.02,'00:04:22','4:17','14.02'],
 ['fract','Z4 seuil · 87 % FC max','2026-06-19','00:00',4.034,'00:23:41','5:52','10.22'],
 ['ef','Z3 tempo · 75 % FC max','2026-06-17','00:00',4.041,'00:39:56','9:53','6.07'],
 ['vitesse','Z5 VMA · 93 % FC max','2026-06-17','00:00',1.02,'00:04:49','4:43','12.71'],
 ['ef','Z3 tempo · 78 % FC max','2026-06-15','19:55',5.831,'00:41:37','7:08','8.41'],
 ['ef','Z2 EF · 69 % FC max','2026-06-05','20:22',4.285,'00:40:34','9:28','6.34'],
 ['seuil','Z4 seuil · 89 % FC max','2026-06-01','19:41',10.032,'01:02:57','6:16','9.56']
];
function board(){
  return '<section class="board" aria-label="Chiffres clés">'+
  '<div><span class="lab">Distance totale</span><b class="num">82,99<i>km</i></b><div class="s">23 séances</div></div>'+
  '<div><span class="lab">Meilleure allure</span><b class="num">4:17<i>/km</i></b><div class="s">24 juin 2026 · 1.02 km</div></div>'+
  '<div><span class="lab">Plus longue distance</span><b class="num">10,03<i>km</i></b><div class="s">1 juin 2026 · 6:16 /km</div></div>'+
  '<div><span class="lab">Plus grosse semaine</span><b class="num">14,93<i>km</i></b><div class="s">15 – 21 juin 2026</div></div></section>';
}
function courseSeances(){
  return '<div class="panel"><div class="split"><section><div class="sec-h" style="margin-bottom:18px"><div><h2>Historique</h2></div><span class="mono dim num" id="count" style="font-size:12px"></span></div>'+
  '<div class="toolbar"><div class="lab">Filtrer l\'historique course</div>'+
  '<div class="chips" id="types">'+
   '<label class="chip"><input type="checkbox" value="classique" checked><i class="dot" style="--c:var(--t-ef)"></i>Course classique</label>'+
   '<label class="chip"><input type="checkbox" value="vitesse" checked><i class="dot" style="--c:var(--t-vit)"></i>Vitesse</label>'+
   '<label class="chip"><input type="checkbox" value="fract" checked><i class="dot" style="--c:var(--t-fract)"></i>Fractionné</label>'+
   '<label class="chip"><input type="checkbox" value="autre" checked><i class="dot" style="--c:var(--bone-3)"></i>Autre type</label></div>'+
  '<div class="nums">'+
   '<div class="fld"><label class="lab" for="f-slow">Allure lente min (min/km ≥)</label><input id="f-slow" inputmode="decimal" placeholder="ex. 5.5"></div>'+
   '<div class="fld"><label class="lab" for="f-fast">Allure rapide max (min/km ≤)</label><input id="f-fast" inputmode="decimal" placeholder="ex. 7.2"></div>'+
   '<div class="fld"><label class="lab" for="f-dur">Durée min (min)</label><input id="f-dur" inputmode="decimal" placeholder="min"></div>'+
   '<div class="fld"><label class="lab" for="f-dist">Distance min (km)</label><input id="f-dist" inputmode="decimal" placeholder="km"></div></div>'+
  '<div class="tiny">Allure en minutes par kilomètre décimales (ex. 6,2 ≈ 6:12/km). Plus grand = plus lent.</div></div>'+
  '<div id="hist"></div><div class="more"><button class="btn">Afficher les 14 séances précédentes</button></div></section>'+
  '<aside class="rail">'+
   '<div class="box pad todo"><span class="lab">À accomplir</span><b class="big num">1</b><h3>Vous avez 1 défi à accomplir</h3><p>Ouvre l\'onglet de chaque activité concernée pour voir le détail de tes défis (sans afficher les noms ici).</p><div class="chips" style="margin-top:14px"><button class="chip" data-goact="pompes">Pompes</button></div></div>'+
   '<div class="empty"><h3>Exercices d\'Endurance depuis vos Séances</h3><p>Aucun exercice d\'endurance trouvé dans vos séances passées.</p></div>'+
   '<div class="box pad sync"><span class="lab">Synchronisation Garmin</span><div class="g"><div class="fld"><label class="lab" for="du">Du</label><input id="du" type="date" value="2026-09-09"></div><div class="fld"><label class="lab" for="au">Au</label><input id="au" type="date" value="2026-10-09"></div></div><div class="b"><button class="btn pri">'+I.sync+'Synchroniser</button><button class="btn">'+I.dl+'Backfill</button></div></div>'+
  '</aside></div></div>';
}
function num(v){v=(v||'').replace(',','.').trim();return v===''?null:parseFloat(v)}
function mins(d){var a=d.split(':');return +a[0]*60+(+a[1])+(+a[2])/60}
function renderHist(){
  var el=$('#hist');if(!el)return;
  var on={};$$('#types input').forEach(function(i){on[i.value]=i.checked});
  var slow=num($('#f-slow').value),fast=num($('#f-fast').value),dur=num($('#f-dur').value),dist=num($('#f-dist').value);
  var rows=SESS.filter(function(s){
    var t=TYPES[s[0]];if(!on[t.g])return false;
    var p=pace(s[6]);
    if(slow!==null&&!(p>=slow))return false;
    if(fast!==null&&!(p<=fast))return false;
    if(dur!==null&&!(mins(s[5])>=dur))return false;
    if(dist!==null&&!(s[4]>=dist))return false;
    return true;
  });
  $('#count').textContent=rows.length+' séance(s) affichée(s) sur 23';
  var g={},o=[];rows.forEach(function(s){var k=s[2].slice(0,7);if(!g[k]){g[k]=[];o.push(k)}g[k].push(s)});
  el.innerHTML=o.length?o.map(function(k){
    var a=k.split('-');
    return '<div class="mh"><h3>'+MONTHS[+a[1]-1]+' '+a[0]+'</h3><span class="tiny num">'+g[k].length+' séance'+(g[k].length>1?'s':'')+'</span></div>'+
    g[k].map(function(s){
      var t=TYPES[s[0]],d=s[2].split('-');
      return '<article class="log" data-det="'+SESS.indexOf(s)+'"><div class="dt"><b class="num">'+(+d[2])+'</b><span>'+MABBR[+d[1]-1]+' '+d[0]+'</span><span>'+s[3]+'</span></div>'+
      '<div><div class="tl"><i class="dot" style="--c:'+t.c+'"></i><span style="color:'+t.c+'">'+t.n+'</span><span class="zone">'+s[1]+'</span></div><div class="nt"><em>Notes</em>Garmin — Pessac Course à pied</div><span class="go">Voir le détail →</span><div class="dbar" style="--c:'+t.c+'"><i style="width:'+(s[4]/10.032*100)+'%"></i></div></div>'+
      '<dl class="mx num"><div><dt>Distance</dt><dd>'+s[4]+' km</dd></div><div><dt>Durée</dt><dd>'+s[5]+'</dd></div><div><dt>Allure</dt><dd>'+s[6]+' /km</dd></div><div><dt>Vitesse</dt><dd>'+s[7]+' km/h</dd></div></dl>'+
      '<div class="ra"><button class="ib" aria-label="Modifier">'+I.edit+'</button><button class="ib del" aria-label="Supprimer">'+I.del+'</button></div></article>';
    }).join('');
  }).join(''):'<p class="dim" style="padding-block:28px">Aucune séance ne correspond à ces filtres.</p>';
}
 
/* trophées */
var TIERS=[['Bronze','var(--tier-1)',120],['Argent','var(--tier-2)',149],['Or','var(--tier-3)',182],['Élite','var(--tier-4)',234]];
var TRO=[
 {t:'Courir 5 km une fois',b:'OR',bc:'var(--tier-3)',cur:'Plus grande sortie : 10,0 km à 6:16/km',lk:1,r:[['5 km',100],['6,8 km',100],['8,8 km',100],['11 km',91]]},
 {t:'Courir 10 km une fois',b:'BRONZE',bc:'var(--tier-1)',cur:'Plus grande sortie : 10,0 km à 6:16/km',lk:1,r:[['10 km',100],['13,5 km',74],['17,5 km',57],['22 km',46]]},
 {t:'Faire 3 runs dans une semaine',b:'BRONZE',bc:'var(--tier-1)',cur:'Pic hebdo : 4 sorties',lk:4,r:[['≥ 3 fois',100],['≥ 5 fois',80],['≥ 6 fois',67],['≥ 7 fois',57]]},
 {t:'Courir 20 km cumulés en une semaine',cur:'Meilleure semaine : 14,9 km',lk:4,r:[['20 km',75],['27 km',55],['35 km',43],['44 km',34]]},
 {t:'Courir 5 km sans s\'arrêter',b:'OR',bc:'var(--tier-3)',cur:'Sorties ≥ 5 km sans pause (Garmin) : 3',lk:3,r:[['≥ 1 fois',100],['≥ 2 fois',100],['≥ 3 fois',100],['≥ 4 fois',75]]},
 {t:'Courir 30 min sans pause',b:'OR',bc:'var(--tier-3)',cur:'Plus longue sortie sans pause (sans arrêt Garmin ou durée manuelle) : 1:03:00',lk:1,r:[['30 min',100],['41 min',100],['53 min',100],['1 h 6 min',95]]}
];
var tfDone=false;
function tro(c){
  var HS=[44,66,88,110];
  return '<article class="box tro"><div class="top"><h3>'+c.t+'</h3>'+(c.b?'<span class="pill" style="--c:'+c.bc+'">'+c.b+'</span>':'')+'</div>'+
  '<div class="cur"><span class="lab">Actuelle</span>'+c.cur+'</div>'+
  '<div class="stairs">'+c.r.map(function(x,i){
    var ok=x[1]===100,T=TIERS[i];
    if(tfDone&&!ok)return '<div class="stc"></div>';
    return '<div class="stc"><div class="stb'+(ok?'':' part')+'" style="--c:'+T[1]+';height:'+HS[i]+'px"><i style="height:'+x[1]+'%"></i><span class="num">'+(ok?'OK':x[1]+'%')+'</span></div>'+
    '<div class="stl'+(ok?'':' lock')+'" style="--c:'+T[1]+'"><b><i class="dot" style="--c:'+T[1]+'"></i>'+T[0]+'</b><div class="th">'+x[0]+'</div><div class="xp2 num">+'+T[2]+' XP<small>'+(ok?'gagnés (ce palier)':'au déblocage')+'</small></div></div></div>';
  }).join('')+'</div>'+
  '<details><summary>Sessions liées ('+c.lk+')</summary><p>Les '+c.lk+' séance'+(c.lk>1?'s':'')+' qui comptent pour ce trophée s\'affichent ici.</p></details></article>';
}
function renderTro(){
  var el=$('#tgrid');if(!el)return;
  el.innerHTML=TRO.filter(function(c){return !tfDone||c.r.some(function(x){return x[1]===100})}).map(tro).join('');
}
function courseTrophees(){
  var tk='';for(var i=0;i<92;i++)tk+='<i'+(i<20?' class="on"':'')+'></i>';
  return '<div class="panel"><section class="thead"><div><h2>Trophées<br><span>Course</span></h2>'+
  '<p>Score composite basé sur tes séances (manuel + Garmin). Chaque palier bronze → élite exige un peu plus (distance, durée, nombre de séances ou allure plus rapide selon le type). L\'XP sport inclut ces trophées.</p>'+
  '<div class="note">Les trophées « allure stable » et « sans arrêt » s\'appuient sur les tours / métadonnées Garmin quand la sync est complète. Les seuils « allure max » (5k / 10k / 1k) restent exigeants mais plafonnés côté élite pour rester crédibles. Cadence et VO₂ : voir « Records &amp; stats course ».</div></div>'+
  '<div><span class="lab">XP trophées course</span><div class="xp num">+13374</div><div class="tiny">comptée dans la barre Sport</div>'+
  '<div class="tstat"><div><span class="lab">Score</span><b class="num">6%</b><div class="meter"><i style="width:6.5%"></i></div><div class="tiny num">282.5 / 4380 pts</div></div>'+
  '<div><span class="lab">Débloqués</span><b class="num">20<i>/92</i></b><div class="ticks" style="grid-template-columns:repeat(46,1fr)">'+tk+'</div><div class="tiny">auto</div></div></div></div></section>'+
  '<section><div class="sec-h"><div><h2>Simples</h2></div><div class="seg" id="tfilter"><button aria-pressed="'+(!tfDone)+'" data-v="all">Tous les trophées</button><button aria-pressed="'+tfDone+'" data-v="done">Mes paliers débloqués</button></div></div><div class="tgrid" id="tgrid"></div>'+
  '<div class="note">Les 86 autres trophées suivent ce même gabarit : titre, palier atteint, valeur actuelle, escalier des quatre paliers, séances liées.</div></section></div>';
}
 
/* calendrier : carte annuelle */
var DAYS_COURSE={'2026-03-07':1,'2026-03-10':1,'2026-03-12':1,'2026-03-17':1,'2026-03-19':1,'2026-03-21':1,'2026-03-23':1,'2026-03-26':2,'2026-03-29':1,'2026-05-20':1,'2026-05-25':1,'2026-05-27':1,'2026-05-29':1,'2026-06-01':1,'2026-06-05':1,'2026-06-15':1,'2026-06-17':2,'2026-06-19':1,'2026-06-24':2,'2026-07-27':1};
function heat(D,unit){
  var j1=new Date(2026,0,1),off=(j1.getDay()+6)%7,cells='',mon='';
  var wl=['L','','M','','V','','D'];
  for(var r=0;r<7;r++)cells+='<div class="hw" style="grid-row:'+(r+2)+'">'+wl[r]+'</div>';
  for(var m=0;m<12;m++){
    var f=new Date(2026,m,1),idx=Math.round((f-j1)/864e5);
    mon+='<button class="hm" data-month="'+m+'" style="grid-column:'+(Math.floor((idx+off)/7)+2)+'/span 3" title="séances">'+MABBR[m].replace('.','')+'</button>';
  }
  for(var i=0;i<365;i++){
    var dt=new Date(2026,0,1+i),k='2026-'+('0'+(dt.getMonth()+1)).slice(-2)+'-'+('0'+dt.getDate()).slice(-2);
    var n=D[k]||0,col=Math.floor((i+off)/7)+2,row=(dt.getDay()+6)%7+2;
    cells+='<button class="hc'+(n?' l'+Math.min(n,3):'')+(k==='2026-10-09'?' today':'')+'" data-d="'+k+'" data-n="'+n+'" style="grid-column:'+col+';grid-row:'+row+'" aria-label="'+fdate(k)+' : '+n+' '+unit+'"></button>';
  }
  return '<div class="heatwrap"><div class="heat">'+mon+cells+'</div></div>'+
  '<div class="hl"><span id="sel" class="mono">Touche un jour pour voir son détail.</span><span style="display:flex;gap:14px;flex-wrap:wrap"><span class="k"><i></i>0</span><span class="k"><i style="background:var(--accent-mid)"></i>1</span><span class="k"><i style="background:var(--accent)"></i>2</span><span class="k"><i style="background:var(--accent);box-shadow:inset 0 0 0 4px color-mix(in srgb,var(--ink) 55%,transparent)"></i>3 et +</span></span></div>';
}
function courseBests(){return '<div class="perf"><article class="box pf"><span class="lab" style="display:flex;gap:8px;align-items:center"><i class="dot" style="--c:var(--accent)"></i>Meilleure allure soutenue (hors fractionné)</span><div class="res">24 juin 2026<br>4:17 /km pendant 4 min<small>(1.02 km)</small></div>'+
  '<details><summary>Méthode de calcul</summary><p>Séances détectées comme fractionné (type ou tours Garmin effort/récup) sont exclues. On prend la plus rapide allure moyenne (min/km), puis la plus longue durée parmi les blocs à allure équivalente (bande ±0,25 min/km). Blocs Garmin = tours consécutifs sans échauffement, récupération ni retour au calme.</p></details>'+
  '<div><button class="link">Modifier cette séance</button></div></article>'+
  '<article class="box pf"><span class="lab" style="display:flex;gap:8px;align-items:center"><i class="dot" style="--c:var(--t-fract)"></i>Meilleur fractionné (score pondéré)</span><div class="res">19 juin 2026<br>12 tours effort<small>effort moy. 4:17 /km · récup. moy. 9:28 /km</small></div>'+
  '<details><summary>Méthode de calcul</summary><p>Uniquement séances fractionné. Score = (vitesse effort + 0,38 × vitesse récup) × (1 + nombre de tours effort)^0,42 (km/h ; tours = répétitions effort sur les tours Garmin). Sans tours détaillés, l\'encart reste vide.</p></details>'+
  '<div><button class="link">Modifier cette séance</button></div></article></div>';}
function courseCalendrier(){return calPage('course')}
 
/* statistiques course */
function mrow(n,c,p,pt,km,s,ideal,d){
  return '<div class="mrow"><div class="nm"><i class="dot" style="--c:'+c+'"></i>'+n+'</div><div class="mb"><div class="bar" style="--c:'+c+'"><i style="width:'+p+'%"></i></div><div class="bar id"><i style="width:'+ideal+'%"></i></div></div><div class="v num"><b>'+pt+'</b><span>'+km+' · '+s+'</span></div><div class="d num">idéal '+ideal+' %<em>'+d+'</em></div></div>';
}
var EF=[['29-03','29 mars 2026','141 bpm','70 %','6:31','3.2 km'],['05-06','5 juin 2026','139 bpm','69 %','9:28','4.3 km'],['17-06','17 juin 2026','151 bpm','75 %','9:53','4 km'],['24-06','24 juin 2026','142 bpm','70 %','9:33','4.2 km'],['27-07','27 juillet 2026','138 bpm','68 %','9:00','4.7 km']];
function efChart(){
  var W=720,H=300,l=70,r=34,t=30,b=38,y0=6.25,y1=10.15;
  var ticks=[['6:15',6.25],['7:13',7.217],['8:12',8.2],['9:11',9.183],['10:09',10.15]];
  function Y(v){return t+(1-(v-y0)/(y1-y0))*(H-t-b)}
  var n=EF.length;function X(i){return l+(W-l-r)*i/(n-1)}
  var s='<svg class="chart" viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Allure des sorties d\'endurance fondamentale">';
  ticks.forEach(function(k){s+='<line class="gr" x1="'+l+'" x2="'+(W-r)+'" y1="'+Y(k[1])+'" y2="'+Y(k[1])+'"/><text x="'+(l-10)+'" y="'+(Y(k[1])+4)+'" text-anchor="end">'+k[0]+' /km</text>'});
  var d=EF.map(function(e,i){return (i?'L':'M')+X(i)+' '+Y(pace(e[4]))}).join(' ');
  s+='<path class="ar" d="'+d+' L'+X(n-1)+' '+(H-b)+' L'+X(0)+' '+(H-b)+'Z"/><path class="ln" d="'+d+'"/>';
  EF.forEach(function(e,i){var yy=Y(pace(e[4]));s+='<circle class="pt" cx="'+X(i)+'" cy="'+yy+'" r="6"/><text class="vl" x="'+X(i)+'" y="'+(yy-14)+'" text-anchor="middle">'+e[4]+'</text><text x="'+X(i)+'" y="'+(H-12)+'" text-anchor="middle">'+e[0]+'</text>'});
  return s+'</svg>';
}
function cardioChart(){
  var W=720,H=240,l=70,r=34,t=20,b=38,ys=[137,139,142,144,146],y0=137,y1=146;
  function Y(v){return t+(1-(v-y0)/(y1-y0))*(H-t-b)}
  var s='<svg class="chart" viewBox="0 0 '+W+' '+H+'" role="img" aria-label="FC moyenne par séance">';
  ys.forEach(function(v){s+='<line class="gr" x1="'+l+'" x2="'+(W-r)+'" y1="'+Y(v)+'" y2="'+Y(v)+'"/><text x="'+(l-10)+'" y="'+(Y(v)+4)+'" text-anchor="end">'+v+' bpm</text>'});
  var x=(l+W-r)/2;
  s+='<circle class="pt" cx="'+x+'" cy="'+Y(138)+'" r="7"/><text class="vl" x="'+x+'" y="'+(Y(138)-16)+'" text-anchor="middle">138 bpm</text><text x="'+x+'" y="'+(H-12)+'" text-anchor="middle">27-07</text></svg>';
  return s;
}
function segs(a,i){return '<div class="seg" data-seg>'+a.map(function(x,k){return '<button aria-pressed="'+(k===i)+'">'+x+'</button>'}).join('')+'</div>'}
function courseStats(){
  var SP=[['07/03',29.4],['04/04',0],['02/05',14.4],['30/05',34.5],['27/06',0],['25/07',4.7],['22/08',0],['19/09',0]],mx=34.5;
  var spark=SP.map(function(x){return '<div><i class="'+(x[1]?'':'z')+'" style="height:'+(x[1]?Math.max(6,x[1]/mx*100):0)+'%" title="'+x[0]+'"></i><span>'+x[0]+'</span></div>'}).join('');
  var zones=[['Zone 1','Récupération','50–60 %','101–121 bpm'],['Zone 2','Endurance fondamentale','60–70 %','121–141 bpm'],['Zone 3','Aérobie / tempo','70–80 %','141–162 bpm'],['Zone 4','Seuil','80–90 %','162–182 bpm'],['Zone 5','VMA / max','90–100 %','182–202 bpm']];
  var det=[['Seuil','var(--t-seuil)',37.7,'31.26 km','7'],['Endurance fondamentale','var(--t-ef)',33.6,'27.89 km','7'],['Vitesse','var(--t-vit)',13.1,'10.87 km','4'],['Fractionné','var(--t-fract)',12.5,'10.35 km','4'],['Course classique','var(--t-cl)',3.1,'2.61 km','1']];
  return '<div class="panel" style="gap:72px">'+
  '<nav class="subnav" aria-label="Sections"><a href="#s-repart" data-go="s-repart">Répartition</a><a href="#s-vol" data-go="s-vol">Volume &amp; zones FC</a><a href="#s-cardio" data-go="s-cardio">Cardio</a><a href="#s-ef" data-go="s-ef">Endurance fondamentale</a><a href="#s-rec" data-go="s-rec">Records</a></nav>'+
 
  '<section id="s-repart" style="margin-top:-28px"><div class="sec-h"><div><h2>Volume &amp; répartition</h2><p>Toutes tes séances course (hors marche), sur l\'historique complet.</p></div><span class="mono dim num" style="font-size:12px">82.99 km cumulés · 23 séance(s)</span></div>'+
  '<div class="two"><div><span class="lab" style="display:flex;gap:8px;align-items:center"><i class="dot" style="--c:var(--t-fract)"></i>Plus grosse semaine</span><b class="num">14.93 km</b><div class="tiny">15 juin 2026 – 21 juin 2026</div></div><div><span class="lab" style="display:flex;gap:8px;align-items:center"><i class="dot" style="--c:var(--t-vit)"></i>Jour le plus chargé</span><b class="num">10.03 km</b><div class="tiny">1 juin 2026</div></div></div>'+
  '<div style="margin-top:40px"><div class="lab" style="margin-bottom:10px">Vue macro (cibles profil)</div><div class="key"><span><i style="background:var(--bone-2)"></i>réel</span><span><i class="id"></i>idéal</span></div>'+
  mrow('Course classique','var(--t-ef)',36.8,'36.8%','30.5 km','8 séance(s)',90,'(-53.2 pts vs idéal)')+
  mrow('Vitesse','var(--t-vit)',50.8,'50.8%','42.13 km','11 séance(s)',8,'(+42.8 pts vs idéal)')+
  mrow('Fractionné','var(--t-fract)',12.5,'12.5%','10.35 km','4 séance(s)',2,'(+10.5 pts vs idéal)')+'</div>'+
  '<div style="margin-top:40px"><div class="lab">Détail par type de sortie</div><div class="strip">'+det.map(function(d){return '<i style="--c:'+d[1]+';width:'+d[2]+'%" title="'+d[0]+'"></i>'}).join('')+'</div>'+
  '<div class="lg">'+det.map(function(d){return '<div><b><i class="dot" style="--c:'+d[1]+'"></i>'+d[0]+'</b><span>'+d[2]+'%</span><span>'+d[3]+'</span><span>'+d[4]+' séance(s)</span></div>'}).join('')+'</div></div>'+
  '<div class="note">Cibles basées sur ton profil course (questionnaire) : <a href="#s-repart">profil retour à la course</a> — règle 80/20 adaptée (endurance fondamentale / vitesse / fractionné).</div></section>'+
 
  '<section id="s-vol"><div class="sec-h"><div><h2>Volume</h2></div>'+segs(['7 j','30 j','90 j','1 an','Toujours'],1)+'</div>'+
  '<div class="warn">Aucune séance sur cette période.</div>'+
  '<div class="read"><div><span class="lab">km sur la période</span><b class="num">0<i>km</i></b><p>0 avec distance</p></div><div><span class="lab">Séances</span><b class="num">0</b></div><div><span class="lab">Jours actifs</span><b class="num">0</b></div><div><span class="lab">FC max estimée</span><b class="num">202<i>bpm</i></b><p>Toutes tes sorties · pics récents + plafond fréquent ajusté</p></div></div>'+
  '<div class="zr"><div class="lab" style="margin-bottom:12px">Tes zones FC (personnalisées)</div><div class="ribbon">'+zones.map(function(z,i){return '<i style="--o:'+(0.22+i*0.195)+'"></i>'}).join('')+'</div><div class="zl">'+zones.map(function(z){return '<div><span class="lab">'+z[0]+'</span><b>'+z[1]+'</b><p>'+z[2]+' · '+z[3]+'</p></div>'}).join('')+'</div></div>'+
  '<p class="dim" style="text-align:center;margin:32px 0 0">Aucune distance enregistrée.</p></section>'+
 
  '<section id="s-cardio"><div class="sec-h"><div><h2>Cardio <span class="dim" style="font:400 15px var(--f-body);text-transform:none;letter-spacing:0">(informatif)</span></h2><p>Les valeurs dépendent fortement du type d\'entraînement. Zones basées sur % FC max, pas sur des plages BPM fixes.</p></div>'+segs(['7 j','30 j','90 j','1 an','Toujours'],2)+'</div>'+
  '<div class="box pad"><div style="display:flex;flex-wrap:wrap;gap:12px;justify-content:space-between;align-items:center;margin-bottom:12px"><span class="tiny num">1 séance(s) · 1 avec distance · 1 avec allure · 1 avec FC · 1 liées Garmin</span>'+segs(['Toutes','Endurance','Fractionné','Compétition'],0)+'</div>'+cardioChart()+
  '<div class="lgd"><span><i></i>FC moyenne</span><span><i class="d"></i>FC max</span></div><div class="tiny" style="margin-top:8px">Graphique : 1 point(s) · 1 séance(s) avec FC moyenne sur la période</div></div></section>'+
 
  '<section id="s-ef"><div class="sec-h"><div><h2>Allure des séances d\'endurance fondamentale</h2><p>Sorties en zone 65–75 % FC max estimée (202 bpm), type endurance, ≥ 2 km et ≥ 15 min.</p></div>'+segs(['7 j','30 j','90 j','1 an','Toujours'],3)+'</div>'+
  '<p class="quote">À ~141 bpm tu courais à 6:31 /km ; maintenant à ~138 bpm tu es à 9:00 /km.</p>'+
  '<div class="box pad"><div class="tiny" style="margin-bottom:8px">5 sortie(s) EF détectée(s) sur 23 séance(s) (zone 65–75 % FC max, endurance, ≥ 2 km, ≥ 15 min).</div>'+efChart()+'<div class="lgd"><span><i></i>Allure</span></div><div class="tiny" style="margin-top:8px">Courbe descendante = tu accélères à effort cardiaque comparable.</div></div>'+
  '<div class="box tw" style="margin-top:20px"><table><thead><tr><th>Date</th><th>FC moy.</th><th>% FC max</th><th>Allure</th><th>Distance</th></tr></thead><tbody>'+EF.map(function(e){return '<tr><td>'+e[1]+'</td><td>'+e[2]+'</td><td class="dim">'+e[3]+'</td><td class="p">'+e[4]+' /km</td><td>'+e[5]+'</td></tr>'}).join('')+'</tbody></table></div>'+
  '<div class="box pad" style="margin-top:20px"><details><summary>Bonus — score vitesse ÷ FC</summary><p>Contenu du bonus affiché ici à l\'ouverture (non visible sur les captures).</p></details></div></section>'+
 
  '<section id="s-rec"><div class="sec-h"><div><h2>Records &amp; stats course</h2><p>Filtrez par période et par moment de la journée (heure de départ de la séance).</p></div>'+
  '<div style="display:flex;gap:12px;flex-wrap:wrap"><div class="fld" style="width:180px"><label class="lab" for="per">Période</label><select id="per"><option>Tout le temps</option><option>7 j</option><option>30 j</option><option>90 j</option><option>1 an</option></select></div><div class="fld" style="width:210px"><label class="lab" for="mom">Moment (heure de départ)</label><select id="mom"><option>Toute la journée</option><option>Matin</option><option>Après-midi</option><option>Soir</option></select></div></div></div>'+
  '<div class="big"><div><span class="lab">Course</span><b class="num">82,99<i>km</i></b><div class="tiny" style="margin-top:8px">↘ 0.0% vs période précédente</div></div><div class="spark" aria-label="Distance par période">'+spark+'</div></div>'+
  '<div class="grp"><h3>Records de séance <span>filtrés par période et moment de la journée</span></h3><div class="plq">'+
   '<div><div class="l">Meilleure allure</div><b class="num">4:17<i>/km</i></b><p>24 juin 2026 · 00:00:00<br>1.02 km · 4 min</p></div>'+
   '<div><div class="l">Plus longue distance</div><b class="num">10,03<i>km</i></b><p>Allure moyenne : 6:16 /km<br>1 juin 2026 · 19:41:20 · 1 h 03 min</p></div>'+
   '<div><div class="l">Plus longue durée</div><b class="num">1 h 03<i>min</i></b><p>10.03 km · 6:16 /km<br>1 juin 2026 · 19:41:20</p></div>'+
   '<div><div class="l">Allure moyenne</div><b class="num">6:58<i>/km</i></b></div></div></div>'+
  '<div class="grp"><h3>Records de distance <span>tous temps</span></h3><div class="plq"><div><div class="l">1 km</div><b class="num">4:17</b><p>4:17 /km</p></div><div><div class="l">5 km</div><b class="num">29:08</b><p>5:50 /km</p></div><div><div class="l">10 km</div><b class="num">1:02:45</b><p>6:16 /km</p></div></div></div>'+
  '<div class="grp"><h3>Garmin <span>cadence, VO₂, endurance, fractionné</span></h3><div class="spec">'+
   '<div><span class="k">Meilleure cadence</span><b class="num">169<i>pas/min</i></b><p>Garmin — moyenne activité</p></div>'+
   '<div><span class="k">Meilleur VO₂ (retenu)</span><b class="num">50.2<i>ml/kg/min</i></b><p>Estimée — allure &amp; durée (ACSM simplifié)</p></div>'+
   '<div><span class="k"><i class="dot" style="--c:var(--t-ef)"></i>Allure d\'endurance fondamentale (Z2)</span><b class="num">9:14<i>/km</i></b><p>Médiane sur 4 activité(s) Garmin (≥2,5 km, ≥18 min, FC Z2, hors fractionné). Zone FC estimée : 127–147 bpm.</p></div>'+
   '<div><span class="k"><i class="dot" style="--c:var(--t-ef)"></i>Cadence EF (moyenne)</span><b class="num">161<i>pas/min</i></b><p>4 sortie(s) Z2</p></div>'+
   '<div><span class="k"><i class="dot" style="--c:var(--t-vit)"></i>Meilleure allure « Vitesse »</span><b class="num">4:17<i>/km</i></b><p>Effort continu soutenu (hors fractionné), allure stable &gt;10 % plus rapide que votre EF.</p></div>'+
   '<div><span class="k"><i class="dot" style="--c:var(--t-vit)"></i>Cadence vitesse (moyenne)</span><b class="num">163<i>pas/min</i></b><p>3 sortie(s) vitesse</p></div>'+
   '<div><span class="k"><i class="dot" style="--c:var(--t-fract)"></i>Meilleure allure fractionné (tour effort)</span><b class="num">3:29<i>/km</i></b><p></p></div>'+
   '<div><span class="k"><i class="dot" style="--c:var(--t-fract)"></i>Pic vitesse fractionné (tour effort)</span><b class="num">17.3<i>km/h</i></b><p></p></div></div></div>'+
  '<div class="grp"><div style="display:flex;flex-wrap:wrap;gap:10px 20px;justify-content:space-between;align-items:flex-end;margin-bottom:6px"><h3 style="margin:0">Records de la période <span>23 séance(s) · 23 avec distance · 23 avec allure · 23 avec FC · 23 liées Garmin</span></h3>'+segs(['7 j','30 j','90 j','1 an','Toujours'],4)+'</div><div class="plq">'+
   '<div><div class="l">Meilleure allure ~5 km</div><b class="num">5:50<i>/km</i></b><p>26 mars 2026</p></div><div><div class="l">Meilleure allure ~10 km</div><b class="num">6:17<i>/km</i></b><p>1 juin 2026</p></div><div><div class="l">Plus longue sortie</div><b class="num">10<i>km</i></b><p>1 juin 2026 · 6:17 /km</p></div><div><div class="l">Plus gros volume hebdo</div><b class="num">14.93<i>km</i></b><p>2026-W25</p></div></div>'+
  '<p class="tiny" style="margin:14px 0 0">5 km et 10 km : distance entre 4,75–5,35 km et 9,5–10,5 km. Volume hebdo : somme des km par semaine ISO.</p>'+
  '<p class="tiny" style="margin:6px 0 0">Le bloc Garmin ci-dessus couvre déjà cadence, VO₂, EF et fractionné. Les cartes « Records de séance » restent focalisées sur les records de séances filtrées (période + moment de journée).</p></div></section></div>';
}
 
/* ---------- POMPES ---------- */
var PSES=[
 ['Mercredi','30','septembre 2026','22:08','5×20','10 min',4,4,4,4],
 ['Samedi','19','septembre 2026','01:31','5×20','10 min',4,3,3,5],
 ['Mardi','15','septembre 2026','22:27','5×20','10 min 30 s',5,3,3,5],
 ['Jeudi','3','septembre 2026','19:02','5×20','10 min',4,4,4,5]
];
function pips(n,cls){var s='<span class="pips '+(cls||'')+'" aria-label="'+n+' sur 5">';for(var i=1;i<=5;i++)s+='<i'+(i<=n?' class="on"':'')+'></i>';return s+'</span>'}
function rate(l,n,cls){return '<div><div class="t"><span>'+l+'</span><b class="num">'+n+'/5</b></div>'+pips(n,cls)+'</div>'}
function pompesSeances(){
  var grp=[['En une séance',['100 en une séance','200 en une séance']],['Par jour',['25 / jour × 14 jours','50 / jour × 30 jours']],['Par séance',['≥ 40 pompes par séance (3 sem.)','≥ 80 pompes / séance (4 sem.)']],['Volume cumulé',['500 pompes / mois','1500 pompes / 60 jours','5000 pompes / 90 jours']]];
  return '<div class="panel" style="gap:56px">'+
  '<section><div class="lab" style="margin-bottom:12px">Modèles de défis (données onglet Pompes uniquement)</div><div class="tpl">'+grp.map(function(g){return '<div><span class="lab" style="color:var(--bone-2)">'+g[0]+'</span><div class="chips">'+g[1].map(function(c){return '<button class="chip">'+c+'</button>'}).join('')+'</div></div>'}).join('')+'</div></section>'+
  '<section class="strip2"><b>1 défi en cours</b><p>Ouvre l\'onglet de chaque activité concernée pour voir le détail de tes défis (sans afficher les noms ici).</p></section>'+
  '<section><div class="sec-h"><div><h2>Défis</h2></div></div>'+
  '<article class="ticket"><div class="l">'+I.award+'</div><div class="m"><h3>100 pompes 3 fois par semaine</h3><div class="row">'+I.repeat+'<span>Hebdomadaire - {{moment}}</span></div><div class="row">'+I.target+'<span>Objectif: 100 pompes en 15 min</span></div></div><div class="r"><span class="st">'+I.flame+'En cours</span><button class="ib" aria-label="Modifier">'+I.edit+'</button><button class="ib del" aria-label="Supprimer">'+I.del+'</button></div></article></section>'+
  '<section><div class="sec-h"><div><h2>Historique</h2><p>Même infos que le formulaire : séries × reps, durée, notes et ressenti.</p></div></div>'+
  '<div class="mh" style="padding-top:0"><h3>Septembre 2026</h3></div>'+
  PSES.map(function(s){
    return '<article class="ps"><div class="pd"><span class="wd">'+s[0]+'</span><b class="num">'+s[1]+'</b><span class="my">'+s[2]+'</span><span class="tm">· '+s[3]+'</span></div>'+
    '<div class="pm"><div><small>Total</small><b class="num">100</b><span>reps</span></div><div><small>Séries × reps</small><b class="num">'+s[4]+'</b><span>5×20 (100 reps)</span><div class="sets"><i></i><i></i><i></i><i></i><i></i></div></div><div><small>Durée</small><b class="num">'+s[5]+'</b></div></div>'+
    '<div class="rt">'+rate('Congestion',s[6])+rate('Motivation',s[7])+rate('Avant',s[8],'avant')+rate('Après',s[9],'apres')+'</div>'+
    '<div class="ra"><button class="ib" aria-label="Modifier">'+I.edit+'</button><button class="ib del" aria-label="Supprimer">'+I.del+'</button></div></article>';
  }).join('')+
  '<div class="mh" style="padding-top:34px;border-top:1px solid var(--rule)"><h3>Août 2026</h3></div><div class="pnote">Les séances d\'août et de juillet suivent le même gabarit (non visibles sur la capture).</div></section></div>';
}
var PDAYS=['2026-07-21','2026-07-24','2026-07-26','2026-07-27','2026-07-29','2026-07-31','2026-08-07','2026-08-10','2026-08-11','2026-08-27','2026-09-03','2026-09-15','2026-09-19','2026-09-30'];
var pmode='bars';
function pChart(){
  var W=980,H=320,l=52,r=18,t=18,b=44,start=new Date(2026,6,21),N=81;
  function X(i){return l+(W-l-r)*i/(N-1)}
  function Y(v){return t+(1-v/100)*(H-t-b)}
  var set={};PDAYS.forEach(function(d){set[d]=1});
  var s='<svg class="chart" viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Pompes, reps par jour">';
  [0,25,50,75,100].forEach(function(v){s+='<line class="gr" x1="'+l+'" x2="'+(W-r)+'" y1="'+Y(v)+'" y2="'+Y(v)+'"/><text x="'+(l-10)+'" y="'+(Y(v)+4)+'" text-anchor="end">'+v+'</text>'});
  var pts=[],bars='';
  for(var i=0;i<N;i++){
    var d=new Date(2026,6,21+i),k='2026-'+('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2),v=set[k]?100:0;
    pts.push([X(i),Y(v)]);
    if(v)bars+='<line class="st" x1="'+X(i)+'" x2="'+X(i)+'" y1="'+Y(0)+'" y2="'+Y(100)+'"><title>'+fdate(k)+' : 100 reps</title></line><circle class="pt" cx="'+X(i)+'" cy="'+Y(100)+'" r="4.5"/>';
    if(i%7===0)s+='<text x="'+X(i)+'" y="'+(H-16)+'" text-anchor="middle">'+('0'+d.getDate()).slice(-2)+'-'+('0'+(d.getMonth()+1)).slice(-2)+'</text>';
  }
  if(pmode==='line'){
    var dd=pts.map(function(p,i){return (i?'L':'M')+p[0]+' '+p[1]}).join(' ');
    s+='<path class="ar" d="'+dd+' L'+X(N-1)+' '+Y(0)+' L'+X(0)+' '+Y(0)+'Z"/><path class="ln" d="'+dd+'"/>';
  }else s+=bars;
  return s+'</svg>';
}
function pompesStats(){
  return '<div class="panel"><section><div class="sec-h"><div><h2>Pompes — reps par jour</h2><p>Un point par jour calendaire depuis la première activité enregistrée jusqu\'à aujourd\'hui. Les jours sans séance sont à 0.</p></div><div class="seg" id="pmode"><button aria-pressed="'+(pmode==='bars')+'" data-v="bars">Barres</button><button aria-pressed="'+(pmode==='line')+'" data-v="line">Courbe</button></div></div><div class="box pad"><div class="tw"><div style="min-width:640px" id="pchart">'+pChart()+'</div></div></div></section></div>';
}
function pompesTrophees(){
  return '<div class="panel"><section class="thead"><div><h2>Trophées<br><span>Pompes</span></h2><p>Même gabarit que Course : score composite, XP, 4 paliers bronze → élite par trophée, valeur actuelle et séances liées.</p></div><div class="empty"><h3>Données Pompes à brancher</h3><p>Envoie la capture de l\'onglet Trophées de Pompes et je remplis ces cartes avec les vraies valeurs.</p></div></section></div>';
}
function pompesCalendrier(){return calPage('pompes')}
 
/* ---------- GREASE THE GROOVE ---------- */
var G={reps:{dips:6,pompes:10,tractions:3},max:{dips:12,pompes:25,tractions:12},rir:{dips:6,pompes:15,tractions:9},done:{},feel:null,extra:[],mode:'pratique'};
var GEX=[['dips','Dips','CLASSIQUE','var(--t-vit)',['Amplitude','RIR','Articulations']],['pompes','Pompes','EXIGEANT','var(--t-fract)',['Reps','RIR','Poignets']],['tractions','Tractions pronation','PRUDENT','var(--t-ef)',['Amplitude','Trajectoire','Vitesse']]];
var GSLOTS=['08:00','10:00','12:00','14:00','16:00','18:00','20:00'];
var GTABS=[['seances','Séances &amp; défis'],['stats','Statistiques'],['calendrier','Calendrier']];
function gStats(){
  var done=0,reps=0;
  GSLOTS.forEach(function(s,i){GEX.forEach(function(e){if(G.done[i+'-'+e[0]]){done++;reps+=G.reps[e[0]]}})});
  G.extra.forEach(function(x){reps+=x.dips+x.pompes+x.tractions});
  var pct=done/(GSLOTS.length*GEX.length),xp=Math.round(reps*0.17)+(pct>=0.5?12:0)+(pct>=1?28:0);
  return {done:done,reps:reps,xp:xp,pct:pct};
}
function gCol(i){var n=0;GEX.forEach(function(e){if(G.done[i+'-'+e[0]])n++});return n}
function gRow(k){var n=0;GSLOTS.forEach(function(s,i){if(G.done[i+'-'+k])n++});return n}
function gtgHead(){
  var st=gStats();
  return '<header class="head"><div><div class="kicker">Défis / Grease the Groove</div><h1 class="long">Grease the Groove</h1><p>Mini-séries faciles réparties dans la journée — force nerveuse sans fatigue musculaire.</p></div>'+
  '<div class="gxp"><span class="lab">XP GTG cumulée</span><b class="num" id="gxp">+'+st.xp+'</b><span class="tiny">comptée dans la barre Sport</span></div></header>'+
  '<div class="modes"><button data-mode="pratique" aria-pressed="'+(G.mode==='pratique')+'">Pratique</button><button data-mode="protocole" aria-pressed="'+(G.mode==='protocole')+'">Protocole</button></div>';
}
function gtgSeances(){
  var st=gStats();
  var NS=GSLOTS.length,NE=GEX.length;
  var legend='<div class="exs">'+GEX.map(function(e){return '<span class="ex-k" style="--c:'+e[3]+'"><i class="dot"></i><b>'+e[1]+'</b><span class="num">'+G.reps[e[0]]+' reps</span><em class="num">'+gRow(e[0])+'/'+NS+'</em></span>'}).join('')+'</div>';
  var grid=legend+'<div class="slots">'+GSLOTS.map(function(s,i){
    return '<div class="slot"><div class="sh"><span class="tm num">'+s+'</span><span class="ct num">'+gCol(i)+'/'+NE+'</span></div>'+
    GEX.map(function(e){var on=!!G.done[i+'-'+e[0]];return '<button class="cell" style="--c:'+e[3]+'" data-slot="'+i+'" data-ex="'+e[0]+'" aria-pressed="'+on+'" aria-label="'+e[1]+' à '+s+'"><em>'+e[1]+'</em><b class="num">'+G.reps[e[0]]+'<i>reps</i></b></button>'}).join('')+'</div>';
  }).join('')+'</div>';
  var dose=GEX.map(function(e){
    var k=e[0],pct=Math.round(G.reps[k]/G.max[k]*100);
    return '<article><div class="tp"><h3>'+e[1]+'</h3><span class="lvl" style="--c:'+e[3]+'">'+e[2]+'</span></div>'+
    '<div class="lab" style="margin-top:16px">Reps / passage</div><div class="dv"><input class="dose-in" data-ex="'+k+'" type="number" min="1" max="'+G.max[k]+'" value="'+G.reps[k]+'" aria-label="Reps par passage, '+e[1]+'"><span class="m3 num">/ '+G.max[k]+' max · '+pct+'% · RIR '+G.rir[k]+'</span></div>'+
    '<div class="gauge"><i style="width:'+pct+'%"></i></div>'+
    '<div class="sg"><span class="lab">Signaux</span><div class="chips">'+e[4].map(function(c){return '<span class="chip">'+c+'</span>'}).join('')+'</div></div></article>';
  }).join('');
  var cfgChips=GEX.map(function(e){return '<span class="chip" style="color:var(--bone);border-color:var(--rule-2)">'+e[1]+' <span class="mono num dim" style="font-size:12px">('+G.reps[e[0]]+'/'+G.max[e[0]]+')</span> <span class="dim" style="font-size:12px">· 08:00–20:00 / 2h</span></span>'}).join('');
  var cfg=GEX.map(function(e){
    return '<details class="cf"><summary><span class="t"><b>'+e[1]+'</b><span class="s">'+G.reps[e[0]]+' reps / créneau · 08:00–20:00, toutes les 2 h (7 créneaux)</span></span><span class="c num">'+gRow(e[0])+'/7</span></summary><div class="bd">Horaires, reps et fréquence de cet exercice se modifient ici.</div></details>';
  }).join('');
  var feel=['Facile','Stable','Dérive','Dur'].map(function(f){return '<button data-feel="'+f+'" aria-pressed="'+(G.feel===f)+'">'+f+'</button>'}).join('');
  var extra=G.extra.length?'<ul class="ex">'+G.extra.map(function(x){return '<li><span>'+x.time+'</span><span class="num">'+x.dips+' dips · '+x.pompes+' pompes · '+x.tractions+' tractions</span></li>'}).join('')+'</ul>':'';
  return '<div class="panel" style="gap:72px"><div class="split"><div style="display:flex;flex-direction:column;gap:64px;min-width:0">'+
  '<section><div class="sec-h"><div><h2>Emploi du temps du jour</h2><p>Coche chaque mini-série quand elle est faite — facile, sans forcer.</p><p style="color:var(--bone-3);margin-top:4px">Les mini-séries cochées alimentent aussi ton journal de reps (Aujourd\'hui) et le modèle 3D du Récap.</p></div></div>'+grid+'</section>'+
  '<section><div class="sec-h"><div><h2>Dose &amp; signaux (protocole)</h2><p>RIR et % du max pour rester frais ; signaux à surveiller selon le mouvement ; ressenti en fin de journée.</p><p style="color:var(--bone-3);margin-top:4px">Les reps saisies ici = créneaux du jour, config exercice, module Protocole et Aujourd\'hui.</p></div></div>'+
  '<details class="proto" style="margin-bottom:8px"><summary><span class="k">Données protocole (ton cas)</span><span class="v num">66.8 kg · 3/3 max</span><span class="o">Ouvrir / mettre à jour</span></summary><div class="body"><div class="fld"><label class="lab" for="pk">Poids (kg)</label><input id="pk" value="66.8"></div><div class="fld"><label class="lab">Max dips</label><input value="12"></div><div class="fld"><label class="lab">Max pompes</label><input value="25"></div><div class="fld"><label class="lab">Max tractions pronation</label><input value="12"></div></div></details>'+
  '<div class="dose">'+dose+'</div><p class="tiny" style="margin-top:14px">Change la dose partout : emploi du temps, config ci-dessous, cartes Protocole.</p></section>'+
  '<section><div class="sec-h"><div><h2>Configuration</h2></div></div>'+
  '<div class="lab" style="margin-bottom:10px">Ajouter depuis la banque d\'exercices</div><div class="cfs">'+I.search+'<input placeholder="Rechercher dans la banque…" aria-label="Rechercher dans la banque d\'exercices"></div>'+
  '<div style="margin-top:34px"><div class="lab" style="color:var(--bone-2)">Exercices suivis</div><p class="tiny" style="margin:6px 0 14px">Clique sur un exercice pour modifier ses horaires, reps et fréquence (chaque exercice peut avoir son propre rythme).</p><div class="chips"><button class="chip">'+I.plus+'Tractions</button>'+cfgChips+'</div></div>'+
  '<div style="margin-top:26px;border-bottom:1px solid var(--rule)">'+cfg+'</div></section></div>'+
 
  '<aside class="rail"><div class="box pad prog"><span class="lab">Avancement du jour</span><b class="num" style="margin-top:12px">'+st.done+'<i>/'+(GSLOTS.length*GEX.length)+'</i></b><div class="pbar"><i style="width:'+(st.pct*100)+'%"></i><u title="50 % du plan du jour"></u></div><div class="pxp num"><span>+'+st.xp+' XP · '+st.reps+' reps</span><span>'+Math.round(st.pct*100)+' %</span></div>'+
   '<p class="rule-xp">XP modeste par rep (~0.17) + bonus paliers : +12 XP à 50 % du plan du jour, +28 XP au complet (plafond journalier anti-abus).</p></div>'+
  '<div class="box pad"><span class="lab">Ressenti du jour</span><p class="tiny" style="margin:8px 0 0">Optionnel — une pastille suffit. Aide à voir si la dose reste « greasy » (proxy récup / qualité).</p><div class="fl">'+feel+'</div></div>'+
  '<div class="empty pas" style="border-color:var(--rule-2)"><h3>Ajouter un passage hors planning</h3><p>Par exemple 23:42, 3 tractions, 6 dips, 10 pompes. Le passage est coché tout de suite et compte comme les mini-séries prévues : journal, XP, calendrier, export et récap.</p>'+
   '<div class="g"><div class="fld"><label class="lab" for="p-h">Heure</label><input id="p-h" type="time" value="23:53"></div><div class="fld"><label class="lab" for="p-d">Dips</label><input id="p-d" inputmode="numeric" placeholder="reps"></div><div class="fld"><label class="lab" for="p-p">Pompes</label><input id="p-p" inputmode="numeric" placeholder="reps"></div><div class="fld"><label class="lab" for="p-t">Tractions pronation</label><input id="p-t" inputmode="numeric" placeholder="reps"></div></div>'+
   '<button class="btn pri" id="addp">'+I.plus+'Enregistrer et cocher</button>'+extra+'</div></aside></div>'+
 
  '<section><div class="sec-h"><div><h2>Comprendre la méthode GTG</h2></div></div><div class="meth">'+
   '<div><b class="num">40–60 %</b><p>Au lieu d\'une grosse séance, tu fais plusieurs petites séries faciles (environ 40 à 60 % de ton max) sans aller à l\'échec. L\'objectif : répéter souvent un geste de qualité.</p></div>'+
   '<div><b class="num">4–8</b><p>Exemple : 4 à 8 mini-séries par jour et par exercice, espacées dans la journée. Chaque série doit sembler facile — tu pourrais en faire beaucoup plus.</p></div>'+
   '<div><b class="num">+1 rep</b><p>Quand les reps deviennent ridiculement faciles pendant plusieurs jours, augmente d\'une rep (même logique pour tractions, dips et pompes). 5 à 6 jours par semaine suffisent.</p></div>'+
   '<div><b class="num">Option</b><p class="fine">C\'est un complément optionnel : utile pour progresser en tractions/dips/pompes tout en courant, mais rien n\'oblige à le faire chaque jour.</p></div></div></section></div>';
}
function gtgRefresh(){
  var p=$('#gtgp');if(!p)return;
  p.innerHTML=gtgSeances();
  var x=$('#gxp');if(x)x.textContent='+'+gStats().xp;
}
function gtgPage(){
  var body;
  if(G.mode==='protocole')body='<div class="panel"><div class="empty"><h3>Protocole</h3><p>Cet onglet est déjà abouti visuellement : je ne le refais pas.</p></div></div>';
  else if(S.tab==='seances')body='<div id="gtgp">'+gtgSeances()+'</div>';
  else if(S.tab==='calendrier')body=calPage('groove');
  else body='<div class="panel"><div class="empty"><h3>'+(S.tab==='stats'?'Statistiques':'Calendrier')+' Grease the Groove</h3><p>Envoie la capture de cet onglet et je le redessine dans ce même système.</p></div></div>';
  return gtgHead()+(G.mode==='pratique'?tabsBar(GTABS):'')+body;
}
 
 
/* ---------- tabs par activité ---------- */
var TABSETS={
 marche:[['seances','Séances &amp; défis'],['trophees','Trophées'],['calendrier','Calendrier'],['quotidienne','Marche quotidienne (manuel)'],['stats','Statistiques']],
 circuits:[['seances','Sessions'],['stats','Statistiques'],['calendrier','Calendrier'],['trophees','Trophées']],
 pyramide:[['seances','Générateur'],['calendrier','Calendrier'],['stats','Statistiques']],
 perfs:[['seances','Vue générale'],['stats','Statistiques'],['exos','Exercices']]
};
function pend(t){return '<div class="panel"><div class="empty"><h3>'+t+'</h3><p>Envoie la capture de cet onglet et je le redessine dans ce même système.</p></div></div>'}
function es(icon,t,sub){return '<div class="es">'+icon+'<b>'+t+'</b><span>'+sub+'</span></div>'}
function selF(id,l,opts,w){return '<div class="fld"'+(w?' style="width:'+w+'px"':'')+'><label class="lab" for="'+id+'">'+l+'</label><select id="'+id+'">'+opts.map(function(o){return '<option>'+o+'</option>'}).join('')+'</select></div>'}
 
/* ---------- MARCHE ---------- */
function marcheSeances(){
  var T=[['Meilleure allure','15:32','/km','17 avril 2026 · 18:07:10'],['Plus longue distance','4.00','km','17 avril 2026 · 18:07:10'],['Plus longue durée','1 h 02','min','4.00 km'],['Distance cumulée','4.0','km',''],['Temps cumulé','1 h 02','min',''],['Meilleure cadence','83','pas/min','']];
  return '<div class="panel"><div class="split"><div style="display:flex;flex-direction:column;gap:56px;min-width:0">'+
  '<section><div class="sec-h"><div><h2>Records &amp; stats marche</h2><p>Filtrez par période et par moment de la journée.</p></div><div style="display:flex;gap:12px;flex-wrap:wrap">'+selF('m-per','Période',['Tout le temps','7 j','30 j','90 j','1 an'],180)+selF('m-mom','Moment (heure de départ)',['Toute la journée','Matin','Après-midi','Soir'],210)+'</div></div>'+
  '<div class="plq plq3">'+T.map(function(t,i){return '<div><div class="l">'+t[0]+'</div><b class="num"'+(i===3?' style="color:var(--accent)"':'')+'>'+t[1]+'<i>'+t[2]+'</i></b>'+(t[3]?'<p>'+t[3]+'</p>':'')+'</div>'}).join('')+'</div></section>'+
  '<section><div class="sec-h"><div><h2>Historique des marches</h2></div></div><div class="toolbar"><div class="lab">Filtrer l\'historique marche</div><div class="nums">'+
  '<div class="fld"><label class="lab" for="w-slow">Allure lente min (min/km ≥)</label><input id="w-slow" placeholder="ex. 5.5"></div><div class="fld"><label class="lab" for="w-fast">Allure rapide max (min/km ≤)</label><input id="w-fast" placeholder="ex. 7.2"></div><div class="fld"><label class="lab" for="w-dur">Durée min (min)</label><input id="w-dur" placeholder="min"></div><div class="fld"><label class="lab" for="w-dist">Distance min (km)</label><input id="w-dist" placeholder="km"></div></div>'+
  '<div class="tiny">Allure en minutes par kilomètre décimales (ex. 6,2 ≈ 6:12/km). Plus grand = plus lent.</div></div>'+
  '<div class="mh"><h3>Avril 2026</h3><span class="tiny num">1 séance</span></div>'+
  '<article class="log"><div class="dt"><b class="num">17</b><span>avr. 2026</span><span>18:07</span></div><div><div class="tl"><i class="dot" style="--c:var(--t-ef)"></i><span style="color:var(--t-ef)">Marche</span></div><div class="nt"><em>Notes</em>Garmin — Pessac Marche à pied</div></div>'+
  '<dl class="mx num"><div><dt>Distance</dt><dd>4.002 km</dd></div><div><dt>Durée</dt><dd>01:02:11</dd></div><div><dt>Allure</dt><dd>15:32 /km</dd></div><div><dt>Vitesse</dt><dd>3.86 km/h</dd></div></dl><div class="ra"><button class="ib" aria-label="Modifier">'+I.edit+'</button><button class="ib del" aria-label="Supprimer">'+I.del+'</button></div></article></section></div>'+
  '<aside class="rail"><div class="box pad sync"><span class="lab">Synchronisation Garmin</span><div class="g"><div class="fld"><label class="lab" for="mdu">Du</label><input id="mdu" type="date" value="2026-09-09"></div><div class="fld"><label class="lab" for="mau">Au</label><input id="mau" type="date" value="2026-10-09"></div></div><div class="b"><button class="btn pri">'+I.sync+'Synchroniser</button><button class="btn">'+I.dl+'Backfill</button></div></div></aside></div></div>';
}
 
/* ---------- activités simples (Corde, Natation, Boxe, Gainage) ---------- */
var SIMPLE={
 corde:{n:'Corde à sauter',sub:'Suivez vos sessions et défis',b:['plus:Nouvelle session','award:Créer un défi'],tt:'Modèles de défis (durée en minutes, sauts = objectif)',t:['800 sauts / 10 j','10 min + 600 sauts','≥ 400 sauts / jour × 30 j','≥ 15 min corde / séance (3 sem.)','12 min + 1200 sauts / 14 j','≥ 600 sauts + 10 min / jour × 21 j','≥ 20 min corde / séance (4 sem.)'],st:['warn','Vous avez 1 défi à accomplir'],ic:'pulse',tabs:1},
 natation:{n:'Natation',sub:'Suivez vos longueurs et performances',b:['plus:Nouvelle session','award:Créer un défi'],st:['award','1 défi en cours'],ic:'waves',endu:1},
 boxe:{n:'Boxe',sub:'Enregistrez vos sessions d\'entraînement',b:['plus:Nouvelle session','cal:Données antérieures'],ic:'box'},
 gainage:{n:'Gainage',sub:'Suivez vos sessions et défis (planche, creux...)',b:['plus:Nouvelle session','cal:Données antérieures','award:Créer un défi'],tt:'Modèles de défis (planche = secondes, durée séance = minutes max si renseigné)',t:['5 min planche / 14 j','≥ 120 s / séance × 21 j','≥ 4 min planche / séance (3 sem.)','≥ 6 min planche / séance (4 sem.)','10 min planche / 21 j','≥ 240 s / séance × 14 j','≥ 7 min planche / séance (4 sem.)'],st:['award','1 défi en cours'],ic:'anchor',tabs:1}
};
function simplePage(k){
  var c=SIMPLE[k],tp='',body;
  if(c.tt)tp='<section class="tplbox"><div class="lab">'+c.tt+'</div><div class="chips" style="margin-top:12px">'+c.t.map(function(x){return '<button class="chip">'+x+'</button>'}).join('')+'</div></section>';
  var st=c.st?'<section class="strip2">'+I[c.st[0]]+'<b>'+c.st[1]+'</b><p>Ouvre l\'onglet de chaque activité concernée pour voir le détail de tes défis (sans afficher les noms ici).</p></section>':'';
  var endu=c.endu?'<section class="empty"><h3>Exercices d\'Endurance depuis vos Séances</h3><p>Aucun exercice d\'endurance trouvé dans vos séances passées.</p></div>'.replace('</div>','</section>'):'';
  if(c.tabs&&S.tab==='calendrier')body=calPage(k);else if(c.tabs&&S.tab!=='seances')body=pend(c.n+' — '+actTab());
  else body='<div class="panel" style="gap:48px">'+endu+st+'<section><div class="sec-h"><div><h2>Historique</h2></div></div>'+es(I[c.ic],'Aucune session enregistrée','Commencez par créer votre première session')+'</section></div>';
  var btns=c.b.map(function(x,i){var a=x.split(':');return '<button class="btn'+(i===c.b.length-1&&a[0]==='award'?' pri':'')+'">'+I[a[0]]+a[1]+'</button>'}).join('');
  return head(c.n,c.sub,btns)+tp+(c.tabs?tabsBar():'')+body;
}
function tabLabel(a){var l=(TABSETS[a]||[]).filter(function(t){return t[0]===S.tab})[0];return l?l[1]:''}
function actTab(){var l=TABS.filter(function(t){return t[0]===S.tab})[0];return l?l[1]:''}
 
 
/* ---------- CIRCUITS ---------- */
var CIRC=[
 {n:'Circuit abdos',tours:3,ex:5,muscles:'Core, Grand droit, Obliques, Carré des lombes, Grand droit de l\'abdomen, Transverse de l\'abdomen',day:'Lundi'},
 {n:'Circuit abdos',tours:3,ex:6,muscles:'abdominaux, core',day:'Vendredi'}
];
function circList(){
  var q=($('#c-q')?$('#c-q').value:'').toLowerCase().trim(),el=$('#clist');if(!el)return;
  var r=CIRC.filter(function(c){return !q||(c.n+' '+c.muscles).toLowerCase().indexOf(q)>-1});
  el.innerHTML=r.length?r.map(function(c){
    return '<article class="box circ"><div class="ct1"><h3>'+I.layers+c.n+'</h3><span class="pill" style="--c:var(--t-fract)">À FAIRE</span><span class="sp"></span><button class="btn sm">'+I.edit+'Modifier</button><button class="ib del" aria-label="Supprimer">'+I.del+'</button></div>'+
    '<p class="cm">'+c.tours+' tours cibles · '+c.ex+' exos · '+c.muscles+'</p>'+
    '<div class="ctd"><span class="num">Aujourd\'hui : <b>0/'+c.tours+'</b></span><span class="num" style="color:var(--t-fract)">(0 XP)</span></div>'+
    '<div><span class="link-b">'+I.repeat+'<b>'+c.day+'</b> · Programme Cycle 3+1</span></div></article>';
  }).join(''):'<p class="dim">Aucun circuit ne correspond.</p>';
}
function circuitsSeances(){
  return '<div class="panel" style="gap:48px"><div class="note" style="margin:0">'+I.flame+' Les circuits sont partagés : un circuit créé ici ou depuis l\'onglet <b>Programme</b> apparaît partout (hub, programme, "Aujourd\'hui"). Une assignation à un jour de programme le fait apparaître automatiquement dans <b>Aujourd\'hui</b> avec un compteur de tours, et ajoute un badge ci-dessous pour visualiser la liaison.</div>'+
  '<section><div class="cbar"><div class="fld" style="flex:1;min-width:220px"><label class="lab" for="c-q">Recherche</label><div class="cfs">'+I.search+'<input id="c-q" placeholder="Nom de circuit, exercice..."></div></div>'+selF('c-m','Muscle ciblé',['Tous','Core','Abdominaux','Obliques'],200)+'<button class="btn pri">'+I.plus+'Nouveau circuit</button></div><div class="cgrid" id="clist" style="margin-top:22px"></div></section></div>';
}
function circuitsHead(){
  return '<header class="head"><div><div class="kicker">Défis / Circuits</div><h1>Circuits</h1><p>Crée tes circuits, suis les tours réalisés et accumule l\'XP. Cible atteinte = <b style="color:var(--bone)">100 XP</b>, chaque tour bonus = <b style="color:var(--bone)">100 XP</b>, palier 3× cible = <b style="color:var(--bone)">250 XP</b> (remplace le bonus standard).</p></div></header>'+
  '<section class="board" style="grid-template-columns:1.4fr 1fr 1fr"><div><span class="lab">XP circuits</span><b class="num">+0</b><div class="s">comptée dans la barre Sport</div></div><div><span class="lab">Cibles atteintes</span><b class="num">0</b><div class="s">0 × 3× cible</div></div><div><span class="lab">Circuits</span><b class="num">2</b><div class="s">en bibliothèque</div></div></section>';
}
 
/* ---------- PYRAMIDE ---------- */
var PY={peak:5,mode:'full'};
function pySeq(n,mode){var a=[],i;for(i=1;i<=n;i++)a.push(i);if(mode==='full')for(i=n-1;i>=1;i--)a.push(i);return a}
function pyPrev(){var n=Math.max(1,Math.min(20,PY.peak||1)),q=pySeq(n,PY.mode),t=q.reduce(function(a,b){return a+b},0);return '<span class="seq">'+q.join('-')+'</span> · <b class="num">'+t+' reps</b>'}
function pyCard(n,d,peak,tot,seq,rest,opt,pct){
  return '<article class="box sug"><h3>'+n+'</h3><p class="tiny" style="color:var(--bone-2)">'+d+'</p><div class="pk"><b class="num">Pic '+peak+'</b><span class="num">'+tot+' reps totales</span></div><div class="seq">'+seq+'</div>'+(rest?'<p class="tiny num">Repos entre paliers ~'+rest+'s</p>':'')+(opt?'<p class="tiny num">Optionnel après pic ~'+opt+'s</p>':'')+'<p class="pct">Environ '+pct+' vs ton volume moyen récent sur cet exercice.</p><div class="ra"><button class="btn sm" style="color:var(--t-fract);border-color:var(--t-fract)">'+I.award+'Jour (variation)</button><button class="btn sm">'+I.edit.replace('M4 20h4L19 9l-4-4L4 16v4Z','M9 9h10v10H9zM5 15V5h10')+'Copier</button></div></article>';
}
function pyramideSeances(){
  var f='1-2-3-4-5-6-7-8-7-6-5-4-3-2-1',m='1-2-3-4-5-6-7-8-9',c='1-2-3-4-5-6-7-8-9-8-7-6-5-4-3-2-1';
  return '<div class="panel" style="gap:48px"><section><div class="sec-h"><div><h2>Pyramides intelligentes (V3)</h2><p>Suggestions calées sur tes <b style="color:var(--bone)">séries × reps</b> du programme (volume cible) + max Performances + fréquence. Tu peux appliquer au <b style="color:var(--bone)">calendrier (variation du jour)</b> ou écrire un <b style="color:var(--bone)">modèle pyramide</b> directement sur un exercice d\'un programme (onglet Programme ou ci-dessous).</p></div></div>'+
  '<div class="nums" style="grid-template-columns:1fr 1fr">'+selF('py-ex','Exercice',['Tractions pronation (id 101)','Dips','Pompes'])+'<div class="fld"><label class="lab" for="py-d">Date cible (variation du jour)</label><input id="py-d" value="10/10/2026"></div></div>'+
  '<div class="signals"><span class="lab">Signaux pour « Tractions pronation »</span><dl class="num"><div><dt>Max enregistré (Performances)</dt><dd>12 reps</dd></div><div><dt>Volume moyen / séance (90 j)</dt><dd>18.4 reps</dd></div><div><dt>Fréquence estimée</dt><dd>~3.2 séances / semaine</dd></div><div><dt>Série programme (texte)</dt><dd>4×5 <span>(ancre volume « auto »)</span></dd></div></dl></div>'+
  '<div class="note" style="margin-top:0">'+I.target+' Modèle sur programme : <code>auto</code> choisit la suggestion la plus proche de ton volume séries×reps ; <code>light / ascending / full</code> fixe le type. La variation du jour (Défis) reste prioritaire sur Aujourd\'hui si elle existe pour cette date.</div></section>'+
  '<section><div class="sec-h"><div><h2>Suggestions</h2></div></div><div class="sugs">'+
   pyCard('Pyramide légère (pic modéré)','Forme complète 1..n..1 avec un pic conservateur (moins dur qu\'une full « challenge »).',8,64,f,99,156,'+248%')+
   pyCard('Pyramide montante','Montée progressive, échauffement naturel, intensité en fin de série.',9,45,m,null,null,'+145%')+
   pyCard('Pyramide complète','Volume plus élevé — à utiliser quand tu dors bien et que la technique reste stricte.',9,81,c,107,168,'+340%')+'</div>'+
  '<p class="tiny" style="margin-top:10px">Repos de la carte « montante » coupés sur la capture : à compléter.</p></section>'+
  '<section class="split2"><div class="box pad"><h3 class="bt" style="color:var(--t-seuil)">Écrire le modèle sur un programme</h3><div class="nums" style="grid-template-columns:1fr 1fr;margin-top:14px">'+selF('py-p','Programme',['— Choisir —'])+selF('py-m','Préréglage modèle',['Auto (proche du volume séries×reps)','Légère','Montante','Complète'])+'</div><div style="margin-top:12px">'+selF('py-e','Exercice dans ce programme',['Aucun exercice dans ce programme'])+'</div><button class="btn" style="margin-top:14px;color:var(--t-seuil);border-color:var(--t-seuil)">Enregistrer le modèle pyramide sur cet exercice</button></div>'+
  '<div class="box pad"><h3 class="bt" style="color:var(--t-cl)">'+I.plus+'Nouveau programme autour de l\'exercice sélectionné (haut)</h3><div class="fld" style="margin-top:14px"><label class="lab" for="py-n">Nom du programme (optionnel)</label><input id="py-n" placeholder="Nom du programme (optionnel)"></div><button class="btn" style="margin-top:14px;color:var(--t-cl);border-color:var(--t-cl)">Créer un programme (lundi pyramide + préréglage ci-dessus)</button></div></section>'+
  '<section class="box pad"><h3 class="bt">Constructeur manuel</h3><div class="cm2"><div class="fld" style="width:120px"><label class="lab" for="py-peak">Pic (1–20)</label><input id="py-peak" type="number" min="1" max="20" value="'+PY.peak+'"></div><div class="fld" style="width:220px"><label class="lab" for="py-mode">Mode</label><select id="py-mode"><option value="full">Complète (1..n..1)</option><option value="asc">Montante (1..n)</option></select></div><button class="btn pri">Appliquer au jour</button></div><p class="prev">Aperçu : <span id="py-prev">'+pyPrev()+'</span></p><p class="tiny">Pic indicatif (max enregistré 12) : 9</p></section>'+
  '<div class="alert">Aucune variation pyramide pour cet exercice à cette date.</div></div>';
}
 
/* ---------- PERFORMANCES ---------- */
var MAXES=[['Pompes','25 reps','06/10/2026',''],['Tractions pronation','12 reps','06/10/2026',''],['Dips','12 reps','02/09/2026',''],['Pompes','25 reps','02/09/2026','street'],['Dips','15 reps','02/09/2026','street']];
function perfsVue(){
  return '<div class="panel" style="gap:56px"><section><div class="sec-h"><div><h2>Défis — Performance (records &amp; progression)</h2></div><button class="btn pri">'+I.plus+'Ajouter un max</button></div>'+
  '<section class="board" style="grid-template-columns:repeat(4,1fr);border-top:0"><div><span class="lab">Max enregistrés</span><b class="num">5</b></div><div><span class="lab">Tests enregistrés</span><b class="num">8</b></div><div><span class="lab">Exos fréquents suivis</span><b class="num">3<i>/103</i></b></div><div><span class="lab">À retester</span><b class="num" style="color:var(--t-fract)">8</b></div></section>'+
  '<p class="tiny" style="margin-top:12px">Retests planifiés : <b style="color:var(--bone)">0</b></p></section>'+
  '<section class="grid2p"><article class="box pad prf"><span class="lab" style="color:var(--t-ef)">'+I.target+' Meilleure progression</span><h3>Pompes déclinées</h3><b class="num" style="color:var(--t-cl)">+25%</b><p>depuis le premier test</p><div class="arrow num">20 reps → 25 reps</div></article>'+
  '<article class="box pad prf"><span class="lab" style="color:var(--t-fract)">'+I.trophy+' Meilleure performance</span><h3>Exercice db_pompes</h3><b class="num" style="color:var(--t-fract)">25 reps</b><p>Dernière maj : 02/09/2026</p></article></section>'+
  '<section><div class="sec-h"><div><h2>Récap complet des max</h2></div></div><div class="nums" style="grid-template-columns:repeat(3,1fr)">'+selF('r-d','Discipline',['Toutes disciplines'])+selF('r-s','Statut',['Tous les statuts'])+selF('r-t','Timeline',['Timeline : sélectionner un exercice'])+'</div>'+
  '<div class="mxl">'+MAXES.map(function(m){return '<div class="mxr"><div><b>'+m[0]+'</b><span class="num">'+m[2]+(m[3]?' · '+m[3]:' ·')+'</span></div><b class="num rr">'+m[1]+'</b><button class="btn sm" style="color:var(--t-vit);border-color:var(--t-vit)">Supprimer</button></div>'}).join('')+'</div></section></div>';
}
 
/* ---------- autres ---------- */
function placeholder(name){
  return head(name,'Suivez vos performances et défis','')+'<div class="panel"><div class="empty" style="margin-top:36px"><h3>'+name+'</h3><p>Envoie la capture de ce sous-onglet et je le redessine dans ce même système.</p></div></div>';
}
 
 
/* ---------- détail d'une séance ---------- */
var DETF='all';
function sec(d){var a=d.split(':');return +a[0]*3600+(+a[1])*60+(+a[2])}
function hms(x){x=Math.round(x);var h=Math.floor(x/3600),m=Math.floor(x%3600/60),s=x%60;return (h?h+':'+('0'+m).slice(-2):m)+':'+('0'+s).slice(-2)}
function pcs(p){var a=p.split(':');return +a[0]*60+(+a[1])}
function pfmt(x){x=Math.round(x);return Math.floor(x/60)+':'+('0'+x%60).slice(-2)}
function detData(i){
  var s=SESS[i],t=TYPES[s[0]],km=s[4],T=sec(s[5]),P=pcs(s[6]),pc=parseInt((s[1].match(/(\d+) ?%/)||[0,70])[1],10),fmx=188,hr=Math.round(fmx*pc/100),laps=[],r=i*7+3;
  function w(k){return Math.sin(r+k*1.7)}
  if(s[0]==='fract'||s[0]==='vitesse'){
    var reps=s[0]==='fract'?4:3,pl=[['Échauffement','warm',.2]];
    for(var k=0;k<reps;k++){pl.push(['Effort '+(k+1),'eff',.4/reps]);if(k<reps-1)pl.push(['Récupération '+(k+1),'rec',.25/reps])}
    pl.push(['Retour au calme','cool',.15]);
    var sum=pl.reduce(function(a,b){return a+b[2]},0);
    pl.forEach(function(p,k){var d=T*p[2]/sum,f=p[1]==='eff'?.82:p[1]==='rec'?1.25:p[1]==='warm'?1.1:1.2,pp=P*f;
      laps.push({n:p[0],k:p[1],dur:d,dist:d/pp,pace:pp,hr:Math.round(hr*(p[1]==='eff'?1.06:p[1]==='rec'?.86:.9)),mx:Math.round(hr*(p[1]==='eff'?1.1:.95))})});
    var td=laps.reduce(function(a,b){return a+b.dist},0);laps.forEach(function(l){l.dist=l.dist*km/td;l.pace=l.dur/l.dist});
  }else{
    var n=Math.ceil(km);for(var k=0;k<n;k++){var d=(k===n-1&&km%1)?km%1:1,pp=P+w(k)*6;laps.push({n:'Km '+(k+1),k:'tour',dur:d*pp,dist:d,pace:pp,hr:Math.round(hr+w(k+4)*4),mx:Math.round(hr+8+w(k)*3)})}
    var tt=laps.reduce(function(a,b){return a+b.dur},0);laps.forEach(function(l){l.dur=l.dur*T/tt;l.pace=l.dur/l.dist});
  }
  return {s:s,t:t,km:km,T:T,P:P,hr:hr,mx:Math.round(hr*1.1),laps:laps,pc:pc};
}
var LC={warm:'var(--t-cl)',eff:'var(--t-vit)',rec:'var(--t-ef)',cool:'var(--t-cl)',tour:'var(--c)'};
var LL={warm:'Échauffement',eff:'Effort',rec:'Récupération',cool:'Retour au calme',tour:'Tour'};
function lapsHtml(D){
  return D.laps.filter(function(l){return DETF==='all'||(DETF==='eff'&&l.k==='eff')||(DETF==='rec'&&l.k==='rec')}).map(function(l,k){
    return '<div class="lap" style="--lc:'+LC[l.k]+'"><b><span>'+l.n+'</span><span>'+LL[l.k]+'</span></b><div class="p num">'+pfmt(l.pace)+'<small> /km</small></div><dl class="num"><span>Distance</span><dd>'+l.dist.toFixed(2)+' km</dd><span>Durée</span><dd>'+hms(l.dur)+'</dd><span>FC moy.</span><dd>'+l.hr+' bpm</dd><span>FC max</span><dd>'+l.mx+' bpm</dd></dl></div>'}).join('');
}
function paceChart(D){
  var L=D.laps,mx=Math.max.apply(null,L.map(function(l){return l.pace})),mn=Math.min.apply(null,L.map(function(l){return l.pace})),W=640,H=170,bw=W/L.length;
  return '<svg viewBox="0 0 '+W+' '+(H+26)+'" width="100%" role="img" aria-label="Allure par tour">'+L.map(function(l,k){
    var hh=30+(mx-l.pace)/(mx-mn||1)*(H-40),x=k*bw+bw*.14;
    return '<rect x="'+x+'" y="'+(H-hh)+'" width="'+bw*.72+'" height="'+hh+'" rx="3" fill="'+LC[l.k]+'" opacity=".92"/><text x="'+(x+bw*.36)+'" y="'+(H-hh-6)+'" text-anchor="middle" font-size="11" font-weight="700" fill="'+LC[l.k]+'" font-family="JetBrains Mono,monospace">'+pfmt(l.pace)+'</text><text x="'+(x+bw*.36)+'" y="'+(H+16)+'" text-anchor="middle" font-size="10" fill="var(--bone-2)" font-family="JetBrains Mono,monospace">'+(l.k==='tour'?l.n.replace('Km ',''):l.k==='eff'?'E'+l.n.slice(-1):l.k==='rec'?'R'+l.n.slice(-1):l.k==='warm'?'Éch.':'RC')+'</text>'}).join('')+'</svg>';
}
function altChart(D){
  var W=640,H=90,pts=[],n=24;for(var k=0;k<n;k++)pts.push(40+Math.sin(k/3+D.km)*14+Math.cos(k/5)*8);
  var mn=Math.min.apply(null,pts),mx=Math.max.apply(null,pts),d=pts.map(function(p,k){return (k?'L':'M')+(k*W/(n-1)).toFixed(1)+' '+(H-8-(p-mn)/(mx-mn)*(H-20)).toFixed(1)}).join(' ');
  return {svg:'<svg viewBox="0 0 '+W+' '+H+'" width="100%" aria-label="Profil d\'altitude"><path d="'+d+' L'+W+' '+H+' L0 '+H+'Z" fill="var(--c)" opacity=".18"/><path d="'+d+'" fill="none" stroke="var(--c)" stroke-width="2.5"/></svg>',mn:Math.round(mn),mx:Math.round(mx)};
}
function sessionDetail(i){
  var D=detData(i),s=D.s,t=D.t,d=s[2].split('-'),L=D.laps,al=altChart(D),
  eff=L.filter(function(l){return l.k==='eff'}).length,rec=L.filter(function(l){return l.k==='rec'}).length,
  mod=Math.round(D.T/60*(D.pc>=80?.3:.8)),vig=Math.round(D.T/60)-mod,
  tot=L.reduce(function(a,l){return a+l.dist},0);
  var link='<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M14 4h6v6M20 4l-9 9M18 14v6H4V6h6"/></svg>';
  return '<div style="--c:'+t.c+'"><button class="back" data-back>← Retour à l\'historique</button>'+
  '<section class="dh"><div class="bd"><span class="pill">'+t.n+'</span><span class="pill" style="--c:var(--accent)">'+s[1]+'</span><span class="pill" style="--c:var(--t-cl)">Garmin</span></div>'+
  '<h2>'+t.n+'</h2><div class="dd">'+(+d[2])+' '+MONTHS[+d[1]-1]+' '+d[0]+' · '+s[3]+'</div>'+
  '<dl class="dk num"><div><dt>Distance</dt><dd>'+s[4]+'<small>km</small></dd></div><div><dt>Durée</dt><dd>'+s[5]+'</dd></div><div><dt>Allure moy.</dt><dd>'+s[6]+'<small>/km</small></dd></div><div><dt>Vitesse moy.</dt><dd>'+s[7]+'<small>km/h</small></dd></div></dl>'+
  '<p class="dnote"><em>Notes</em>Garmin — Pessac Course à pied</p></section>'+
  '<div class="dg">'+
  '<div class="box s8"><h3>'+(eff?'Allure par tour · efforts &amp; récupérations':'Allure par kilomètre')+'</h3>'+paceChart(D)+'</div>'+
  '<div class="box s4"><h3>Physiologie &amp; intensité</h3><dl class="kv num"><div><dt>FC moyenne</dt><dd>'+D.hr+' <small>bpm</small></dd></div><div><dt>FC max</dt><dd>'+D.mx+' <small>bpm</small></dd></div><div><dt>Minutes modérée</dt><dd>'+mod+' <small>min</small></dd></div><div><dt>Minutes vigoureuse</dt><dd>'+vig+' <small>min</small></dd></div><div><dt>Total d\'intensité</dt><dd>'+(mod+vig*2)+' <small>min</small></dd></div><div><dt>Hydratation</dt><dd>'+Math.round(D.T/60*11)+' <small>ml</small></dd></div></dl>'+
   '<div class="zbar"><i style="width:'+(100*mod/(mod+vig))+'%;background:var(--t-ef)"></i><i style="width:'+(100*vig/(mod+vig))+'%;background:var(--t-vit)"></i></div><div class="zl"><span style="color:var(--t-ef)">● Modérée '+mod+' min</span><span style="color:var(--t-vit)">● Vigoureuse '+vig+' min</span></div></div>'+
  '<div class="box s6"><h3>Cadence</h3><dl class="kv num"><div><dt>Cadence moyenne</dt><dd>'+(158+(i%5)*4)+' <small>spm</small></dd></div><div><dt>Cadence max</dt><dd>'+(176+(i%4)*3)+' <small>spm</small></dd></div></dl></div>'+
  '<div class="box s6"><h3>Altitude</h3>'+al.svg+'<dl class="kv num" style="margin-top:10px"><div><dt>Min.</dt><dd>'+al.mn+' <small>m</small></dd></div><div><dt>Max.</dt><dd>'+al.mx+' <small>m</small></dd></div></dl></div>'+
  '<div class="box s12"><h3>Parcours</h3><div class="pl"><div><span>Départ</span>Pessac · 44.8056, −0.6311</div><a href="#" onclick="return false">Ouvrir '+link+'</a></div><div class="pl"><div><span>Arrivée</span>Pessac · 44.8061, −0.6304</div><a href="#" onclick="return false">Ouvrir '+link+'</a></div></div>'+
  '<div class="box s12"><h3>'+(eff?'Tableau des tours':'Kilomètres')+'</h3><div style="overflow-x:auto"><table class="kt num"><thead><tr><th>Tour</th><th>Distance</th><th>Durée</th><th>Allure</th><th>FC moy.</th><th>FC max</th></tr></thead><tbody>'+
   L.map(function(l){return '<tr><td>'+l.n+'</td><td>'+l.dist.toFixed(2)+' km</td><td>'+hms(l.dur)+'</td><td><i class="pb" style="width:'+Math.round(150*D.P/l.pace)+'px"></i>'+pfmt(l.pace)+'</td><td>'+l.hr+'</td><td>'+l.mx+'</td></tr>'}).join('')+
   '<tr class="tt"><td>TOTAL</td><td>'+s[4]+' km</td><td>'+s[5]+'</td><td>'+s[6]+'</td><td>'+D.hr+'</td><td>'+D.mx+'</td></tr></tbody></table></div></div>'+
  '<div class="box s12"><h3>Tours Garmin &amp; intervalles</h3><div class="lapf" id="lapf"><button data-lf="all" aria-pressed="'+(DETF==='all')+'">Tous ('+L.length+')</button><button data-lf="eff" aria-pressed="'+(DETF==='eff')+'">Effort ('+eff+')</button><button data-lf="rec" aria-pressed="'+(DETF==='rec')+'">Récupération ('+rec+')</button></div><div class="laps" id="laps">'+lapsHtml(D)+'</div>'+
   '<div class="det" style="margin-top:18px"><div><b>'+L.length+'</b>tours détectés</div><div><b>'+eff+'</b>efforts</div><div><b>'+rec+'</b>récupérations</div></div></div>'+
  '<div class="box s12"><h3>Appareil</h3><div class="pl"><div><span>Source</span>Garmin …8277</div></div><details class="tech"><summary>Données techniques (diagnostic)</summary><pre>source: garmin\ndevice: …8277\nsession: '+s[2]+' '+s[3]+'\ntype: '+s[0]+'\ntours: '+L.length+'\ndistance_totale: '+tot.toFixed(3)+' km</pre></details></div>'+
  '</div><p class="dnote" style="margin-top:22px"><em>Maquette</em>Les valeurs de ce détail (FC, cadence, tours, altitude, coordonnées) sont des exemples calculés pour illustrer la mise en page ; seules distance, durée, allure, vitesse, zone et date viennent de la séance.</p></div>';
}
 
/* ---------- calendriers : composant commun ---------- */
var CAL={mode:'annee',y:2026,m:9},CALK='course',TODAY='2026-10-09';
function iso(d){return d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2)}
function calCfg(k){
  var c={course:{u:'séance',days:DAYS_COURSE,tab:'seances',
      hard:[['Séances / jour','0.00','0.00','0.06'],['km cumulés / jour','0.00 km','0.00 km','0.23 km']],si:['0.00 séances/jour actif · 0.00 km','0.00 séances/jour actif · 0.00 km','1.15 séances/jour actif · 4.15 km'],
      recs:[['Meilleure journée (cumul)','1 juin 2026','(10.03 km)']],bests:1},
    pompes:{u:'séance',days:(function(){var D={};PDAYS.forEach(function(d){D[d]=1});return D})(),val:(function(){var V={};PDAYS.forEach(function(d){V[d]=100});return V})(),vl:'reps',tab:'seances',note:'Chaque séance compte 100 reps (5×20) ; les « reps cumulées » additionnent toutes les séries du jour.'},
    marche:{u:'marche',days:{'2026-04-17':1},val:{'2026-04-17':4},vl:'km',tab:'seances',note:'Les km cumulés viennent des marches synchronisées Garmin.'},
    corde:{u:'session',days:{},vl:'sauts',note:'Les sauts cumulés additionnent toutes les séries de corde du jour.'},
    gainage:{u:'session',days:{},vl:'min',note:'Les minutes cumulées additionnent le temps de gainage tenu dans la journée.'},
    boxe:{u:'session',days:{},vl:'rounds',note:'Les rounds cumulés additionnent tous les rounds de boxe de la journée.'},
    natation:{u:'session',days:{},vl:'m',note:'Les mètres cumulés additionnent la distance nagée dans la journée.'},
    circuits:{u:'session',days:{},vl:'circuits',tab:'seances',note:'Les circuits cumulés comptent chaque circuit terminé dans la journée.'},
    pyramide:{u:'séance',days:{},vl:'reps',tab:'seances',note:'Les reps cumulées additionnent toutes les marches de la pyramide.'},
    groove:{u:'journée',days:{},vl:'reps',tab:'seances',note:'Une journée de GTG compte dès qu\'au moins un passage est coché ; les reps cumulées additionnent tous les passages.'}}[k];
  if(k==='cal'){var D={};['course','pompes','marche'].forEach(function(a){var x=calCfg(a).days;for(var d in x)D[d]=(D[d]||0)+x[d]});c={u:'séance',days:D,glob:1}}
  return c;
}
function calStats(c){
  var D=c.days,ks=Object.keys(D).sort(),best=null,streak=0,bs=0,bsd='',run=0,prev=null,start='';
  ks.forEach(function(k){if(!best||D[k]>D[best])best=k;var d=new Date(k+'T12:00');
    if(prev&&Math.round((d-prev)/864e5)===1)run++;else{run=1;start=k}
    if(run>bs){bs=run;bsd=start}prev=d});
  var cur=0,t=new Date(TODAY+'T12:00');while(D[iso(t)]){cur++;t.setDate(t.getDate()-1)}
  return {best:best,bs:bs,bsd:bsd,cur:cur};
}
function periodAgg(c){
  var D=c.days,t=new Date(TODAY+'T12:00'),wd=(t.getDay()+6)%7,ws=new Date(t);ws.setDate(t.getDate()-wd);
  function agg(from,to,days){var n=0,a=0,v=0;for(var d=new Date(from);d<=to;d.setDate(d.getDate()+1)){var k=iso(d);if(D[k]){n+=D[k];a++;v+=(c.val&&c.val[k])||0}}return {n:n,a:a,v:v,days:days}}
  var we=new Date(ws);we.setDate(ws.getDate()+6);
  return [agg(ws,we,7),agg(new Date(2026,9,1),new Date(2026,9,31),31),agg(new Date(2026,0,1),new Date(2026,11,31),365)];
}
function f2(x){return x.toFixed(2)}
function calRecap(k,c){
  var P=periodAgg(c),st=calStats(c),tt=['Semaine en cours','Mois en cours','Année 2026'],u=c.u;
  var cards=P.map(function(p,i){
    var rows,si;
    if(c.hard){rows=c.hard.map(function(r){return '<div class="r"><span>'+r[0]+'</span><b class="num">'+r[i+1]+'</b></div>'}).join('');si=c.si[i]}
    else{rows='<div class="r"><span>'+u.charAt(0).toUpperCase()+u.slice(1)+'s / jour</span><b class="num">'+f2(p.n/p.days)+'</b></div>'+(c.vl?'<div class="r"><span>Total '+c.vl+' / jour</span><b class="num">'+f2(p.v/p.days)+' '+c.vl+'</b></div>':'');
      si=(p.a?f2(p.n/p.a):'0.00')+' '+u+'s/jour actif'+(c.vl?' · '+f2(p.a?p.v/p.a:0)+' '+c.vl:'')}
    return '<article class="box pcard"><h3>'+tt[i]+'</h3>'+rows+'<div class="si">Si actif : '+si+'</div></article>'}).join('');
  var fx=[['Jour avec le plus de '+u+'s',st.best?fdate(st.best)+' <span>('+c.days[st.best]+')</span>':'—'],
    ['Meilleure journée (cumul)',c.recs?c.recs[0][1]+' <span>'+c.recs[0][2]+'</span>':(c.vl&&st.best?fdate(st.best)+' <span>('+f2(c.val[st.best]||0)+' '+c.vl+')</span>':st.best?fdate(st.best)+' <span>('+c.days[st.best]+' '+u+(c.days[st.best]>1?'s':'')+')</span>':'—')],
    ['Plus longue série (jours consécutifs avec ≥1 '+u+')',st.bs?st.bs+' jours <span>('+fdate(st.bsd)+')</span>':'0 <span>(aucune série)</span>'],
    ['Série en cours (depuis aujourd\'hui)',st.cur+' <span>'+(st.cur?'(jours consécutifs)':'(aucune '+u+' aujourd\'hui)')+'</span>']];
  return '<section><div class="sec-h"><div><h2>Récapitulatif</h2><p>Moyennes = total sur la période ÷ nombre de jours calendaires (semaine = lun–dim, mois = mois civil, année = année affichée sous le calendrier). La ligne « si actif » divise par les jours où tu as au moins une '+u+'.'+(c.note?' <b style="color:var(--accent)">'+c.note+'</b>':'')+'</p></div></div><div class="pcs">'+cards+'</div></section>'+
  '<section><div class="sec-h"><div><h2>Records et séries</h2></div></div><div class="facts">'+fx.map(function(x){return '<div><span class="lab">'+x[0]+'</span><b class="num">'+x[1]+'</b></div>'}).join('')+'</div>'+(c.bests?courseBests():'')+'</section>';
}
var MN=['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
function monthGrid(c,y,m,big){
  var D=c.days,first=new Date(y,m,1),off=(first.getDay()+6)%7,n=new Date(y,m+1,0).getDate(),h='',tot=0,act=0;
  ['L','M','M','J','V','S','D'].forEach(function(w){h+='<span class="wd">'+w+'</span>'});
  for(var i=0;i<off;i++)h+='<span class="cd e"></span>';
  for(var d=1;d<=n;d++){var k=y+'-'+('0'+(m+1)).slice(-2)+'-'+('0'+d).slice(-2),v=D[k]||0;if(v){tot+=v;act++}
    h+='<button class="cd'+(v?' l'+Math.min(v,3):'')+(k===TODAY?' today':'')+'" data-cday="'+k+'" data-n="'+v+'" aria-label="'+fdate(k)+' : '+v+' '+c.u+'(s)">'+d+(big&&v?'<em>'+v+'×</em>':'')+'</button>'}
  return {h:h,tot:tot,act:act};
}
function calBody(k){
  var c=calCfg(k),y=CAL.y,out='',tab=c.tab;
  var bar='<div class="cbar"><div class="seg"><button data-cmode="mois" aria-pressed="'+(CAL.mode==='mois')+'">Mois</button><button data-cmode="annee" aria-pressed="'+(CAL.mode==='annee')+'">Année</button></div>'+
   '<div class="nv"><button class="ib" data-cnav="-1" aria-label="Précédent">‹</button><b class="num">'+(CAL.mode==='mois'?MN[CAL.m]+' '+y:y)+'</b><button class="ib" data-cnav="1" aria-label="Suivant">›</button></div></div>';
  var leg='<div class="cleg"><span>Intensité = nombre de '+c.u+'s enregistrées ce jour-là ('+(CAL.mode==='mois'?'mois':'année')+' affiché'+(CAL.mode==='mois'?'':'e')+').</span><span><i></i>0</span><span><i style="background:color-mix(in oklab,var(--accent) 45%,var(--ink-2));border-color:var(--accent)"></i>1</span><span><i style="background:var(--t-fract)"></i>2</span><span><i style="background:var(--t-vit)"></i>3 et +</span></div>';
  if(CAL.mode==='annee'){
    out='<div class="cmonths">'+MN.map(function(nm,m){var g=monthGrid(c,y,m,0);
      return '<div class="cm"><header><h4><button data-cmonth="'+m+'">'+nm+'</button></h4>'+(g.tot&&tab?'<button class="ct" data-gotab="'+tab+'">'+g.tot+' '+c.u+(g.tot>1?'s':'')+'</button>':'<span class="ct z">'+g.tot+' '+c.u+(g.tot>1?'s':'')+'</span>')+'</header><div class="cg">'+g.h+'</div></div>'}).join('')+'</div>';
  }else{
    var g=monthGrid(c,y,CAL.m,1),vs='';
    if(c.vl){var v=0;for(var d in c.val)if(d.indexOf(y+'-'+('0'+(CAL.m+1)).slice(-2))===0)v+=c.val[d];vs='<span><b>'+f2(v)+'</b>'+c.vl+'</span>'}
    out='<div class="msum"><span><b>'+g.tot+'</b>'+c.u+(g.tot>1?'s':'')+'</span><span><b>'+g.act+'</b>jour'+(g.act>1?'s':'')+' actif'+(g.act>1?'s':'')+'</span>'+vs+'</div><div class="cm big"><div class="cg">'+g.h+'</div></div>';
  }
  return bar+leg+out+'<div class="csel" id="csel">Touche un jour pour voir son détail.</div>';
}
function calPage(k){
  CALK=k;
  return '<div class="panel" style="gap:48px">'+calRecap(k,calCfg(k))+'<section><div class="sec-h"><div><h2>'+(CAL.mode==='mois'?'Mois':'Année')+'</h2></div></div><div id="calx">'+calBody(k)+'</div></section></div>';
}
function calRefresh(){var e=$('#calx');if(e)e.innerHTML=calBody(CALK)}
function calDayInfo(k,n){
  var s=fdate(k)+' : '+(n?n+' '+calCfg(CALK).u+(n>1?'s':''):'aucune '+calCfg(CALK).u);
  if(CALK==='course'||CALK==='cal'){var r=SESS.filter(function(x){return x[2]===k});if(r.length)s+=' — '+r.map(function(x){return TYPES[x[0]].n+' '+x[4]+' km'}).join(' · ')}
  return s;
}
/* ---------- rendu ---------- */
function render(){
  renderNav();
  var m=$('#main'),h='';
  if(S.act==='course'){
    if(S.det!=null){h=head('Course','Suivez vos performances et défis','')+sessionDetail(S.det)}else h=head('Course','Suivez vos performances et défis','<button class="btn">'+I.plus+'Nouvelle session</button><button class="btn pri">'+I.award+'Créer un défi</button>')+board()+tabsBar()+
      (S.tab==='seances'?courseSeances():S.tab==='trophees'?courseTrophees():S.tab==='calendrier'?courseCalendrier():courseStats());
  }else if(S.act==='pompes'){
    h=head('Pompes','Gérez vos sessions et défis','<button class="btn">'+I.plus+'Nouvelle session</button><button class="btn">'+I.cal+'Données antérieures</button><button class="btn pri">'+I.award+'Créer un défi</button>')+tabsBar()+
      (S.tab==='seances'?pompesSeances():S.tab==='trophees'?pompesTrophees():S.tab==='calendrier'?pompesCalendrier():pompesStats());
  }else if(S.act==='groove'){
    h=gtgPage();
  }else if(S.act==='marche'){
    h=head('Marche','Historique, statistiques et trophées de marche','<button class="btn">'+I.plus+'Nouvelle session</button>')+tabsBar(TABSETS.marche)+(S.tab==='seances'?marcheSeances():S.tab==='calendrier'?calPage('marche'):pend('Marche — '+tabLabel('marche')));
  }else if(SIMPLE[S.act]){
    h=simplePage(S.act);
  }else if(S.act==='circuits'){
    h=circuitsHead()+tabsBar(TABSETS.circuits)+(S.tab==='seances'?circuitsSeances():S.tab==='calendrier'?calPage('circuits'):pend('Circuits — '+tabLabel('circuits')));
  }else if(S.act==='pyramide'){
    h='<header class="head"><div><div class="kicker">Défis / Pyramide</div><h1>Pyramide</h1></div></header>'+tabsBar(TABSETS.pyramide)+(S.tab==='seances'?pyramideSeances():S.tab==='calendrier'?calPage('pyramide'):pend('Pyramide — '+tabLabel('pyramide')));
  }else if(S.act==='perfs'){
    h='<header class="head"><div><div class="kicker">Défis / Performances</div><h1 class="long">Performances</h1></div></header>'+tabsBar(TABSETS.perfs)+(S.tab==='seances'?perfsVue():pend('Performances — '+tabLabel('perfs')));
  }else if(S.act==='cal'){
    h=head('Calendrier','Toutes tes activités au même endroit','')+calPage('cal');
  }else h=placeholder(actName(S.act));
  m.innerHTML='<button class="btn menu" id="menu" style="margin-bottom:18px">'+I.menu+'Menu des défis</button>'+h;
  renderHist();renderTro();circList();
}
 
/* ---------- événements ---------- */
document.addEventListener('click',function(e){
  var t=e.target;
  var c0=t.closest('[data-cmode]');if(c0){CAL.mode=c0.dataset.cmode;calRefresh();return}
  c0=t.closest('[data-cnav]');if(c0){var dl=+c0.dataset.cnav;if(CAL.mode==='annee')CAL.y+=dl;else{CAL.m+=dl;if(CAL.m<0){CAL.m=11;CAL.y--}if(CAL.m>11){CAL.m=0;CAL.y++}}calRefresh();return}
  c0=t.closest('[data-cmonth]');if(c0){CAL.m=+c0.dataset.cmonth;CAL.mode='mois';calRefresh();return}
  c0=t.closest('[data-cday]');if(c0){$$('.cd.sel').forEach(function(x){x.classList.remove('sel')});c0.classList.add('sel');$('#csel').textContent=calDayInfo(c0.dataset.cday,+c0.dataset.n);return}
  c0=t.closest('[data-gotab]');if(c0){S.tab=c0.dataset.gotab;render();return}
  var b0=t.closest('[data-back]');if(b0){S.det=null;render();return}
  b0=t.closest('[data-lf]');if(b0){DETF=b0.dataset.lf;render();return}
  b0=t.closest('.log[data-det]');if(b0&&!t.closest('.ra')){S.det=+b0.dataset.det;DETF='all';render();window.scrollTo(0,0);return}
  var b=t.closest('[data-act]');if(b&&b.closest('#nav')){go(b.dataset.act,'seances');$('#side').classList.remove('open');return}
  b=t.closest('[data-goact]');if(b){go(b.dataset.goact,'seances');return}
  b=t.closest('[data-tab]');if(b){S.tab=b.dataset.tab;S.det=null;try{location.hash=S.act+'-'+S.tab}catch(x){}render();return}
  b=t.closest('#menu');if(b){$('#side').classList.toggle('open');return}
  b=t.closest('[data-mode]');if(b){G.mode=b.dataset.mode;render();return}
  b=t.closest('.cell');if(b){var key=b.dataset.slot+'-'+b.dataset.ex;G.done[key]=!G.done[key];gtgRefresh();return}
  b=t.closest('[data-feel]');if(b){G.feel=G.feel===b.dataset.feel?null:b.dataset.feel;gtgRefresh();return}
  b=t.closest('#addp');if(b){
    var d=parseInt($('#p-d').value,10)||0,p=parseInt($('#p-p').value,10)||0,tr=parseInt($('#p-t').value,10)||0;
    if(d+p+tr>0){G.extra.push({time:$('#p-h').value||'--:--',dips:d,pompes:p,tractions:tr});gtgRefresh()}
    return}
  b=t.closest('#sw button');if(b){setAccent(+b.dataset.i);return}
  b=t.closest('[data-seg] button');if(b){$$('button',b.parentNode).forEach(function(x){x.setAttribute('aria-pressed',x===b)});return}
  b=t.closest('#tfilter button');if(b){tfDone=b.dataset.v==='done';$$('#tfilter button').forEach(function(x){x.setAttribute('aria-pressed',x===b)});renderTro();return}
  b=t.closest('#pmode button');if(b){pmode=b.dataset.v;$$('#pmode button').forEach(function(x){x.setAttribute('aria-pressed',x===b)});$('#pchart').innerHTML=pChart();return}
  b=t.closest('[data-go]');if(b){e.preventDefault();var el=document.getElementById(b.dataset.go);if(el)el.scrollIntoView({behavior:'smooth',block:'start'});return}
  b=t.closest('.hc');if(b){$$('.hc.sel').forEach(function(x){x.classList.remove('sel')});b.classList.add('sel');var n=+b.dataset.n;$('#sel').textContent=fdate(b.dataset.d)+' : '+(n?n+' séance'+(n>1?'s':''):'aucune séance');return}
  b=t.closest('.hm');if(b){S.tab='seances';render();return}
});
document.addEventListener('input',function(e){if(e.target.id==='c-q')circList();if(e.target.id==='py-peak'){PY.peak=parseInt(e.target.value,10)||1;$('#py-prev').innerHTML=pyPrev()}if(e.target.closest&&(e.target.closest('#types')||/^f-/.test(e.target.id||'')))renderHist()});
document.addEventListener('change',function(e){
  var t=e.target;
  if(t.id==='py-mode'){PY.mode=t.value;$('#py-prev').innerHTML=pyPrev()}
  if(t.closest&&t.closest('#types'))renderHist();
  if(t.classList&&t.classList.contains('dose-in')){
    var k=t.dataset.ex,v=Math.max(1,Math.min(G.max[k],parseInt(t.value,10)||G.reps[k]));
    G.reps[k]=v;gtgRefresh();
  }
});
 
/* couleur d'accent */
var ACC=[['Violet','#a46bff','#13062b'],['Magenta','#ff4fa3','#2b0618'],['Ambre','#ffb22e','#2a1a02'],['Cyan','#2fd3ff','#021d27'],['Orange','#ff7a33','#2a0f02'],['Rouge','#ff5560','#2b0509']];
function setAccent(i){
  var a=ACC[i]||ACC[0];
  document.body.style.setProperty('--accent',a[1]);
  document.body.style.setProperty('--accent-ink',a[2]);
  $$('#sw button').forEach(function(b,k){b.setAttribute('aria-pressed',k===i)});
  try{localStorage.setItem('defis-accent',String(i))}catch(e){}
}
$('#sw').innerHTML=ACC.map(function(a,i){return '<button data-i="'+i+'" style="--c:'+a[1]+'" title="'+a[0]+'" aria-label="Accent '+a[0]+'" aria-pressed="false"></button>'}).join('');
var ai=0;try{ai=parseInt(localStorage.getItem('defis-accent'),10)||0}catch(e){}
setAccent(ai);
 
try{var h=location.hash.slice(1).split('-');if(h[0]&&ACTS.some(function(a){return a[0]===h[0]}))S.act=h[0];if(['seances','trophees','calendrier','stats'].indexOf(h[1])>-1)S.tab=h[1]}catch(e){}
render();
})();
</script>