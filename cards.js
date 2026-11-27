/* 로컬피드 카드뉴스 그리기: 기획의 장별 문구를 1080×1350 JPEG 여러 장으로 만든다. (브라우저 캔버스) */
(function(){
  var W=1080,H=1350,F="'Gothic A1','Noto Sans KR',sans-serif";
  function parse(pages){ return String(pages||'').split(/\s+\/\s+/).map(function(x){ x=x.trim(); var m=x.match(/^\d+\s*([^:：]{1,16})[:：]\s*([\s\S]+)$/); return m?{label:m[1].trim(),text:m[2].trim()}:{label:'',text:x.replace(/^\d+\s*/,'')}; }).filter(function(p){return p.text;}); }
  function wrap(ctx,text,maxW){ var out=[]; String(text).split(/\n/).forEach(function(par){ var words=par.split(/\s+/), line='';
      words.forEach(function(w){ var t=line?line+' '+w:w; if(ctx.measureText(t).width<=maxW){ line=t; return; }
        if(line){ out.push(line); line=''; }
        if(ctx.measureText(w).width<=maxW){ line=w; return; }
        var cur=''; w.split('').forEach(function(ch){ if(ctx.measureText(cur+ch).width>maxW){ out.push(cur); cur=ch; } else cur+=ch; }); line=cur; });
      if(line) out.push(line); }); return out; }
  function balance(ctx,text,maxW){ var L=wrap(ctx,text,maxW), n=L.length; if(n<2) return L;
    // 두 줄이면 쉼표나 물음표 뒤에서 끊는 쪽을 먼저 본다 ("SNS 5개, / 다 할 필요 없어요")
    if(n===2){ var m=text.match(/^(.+?[,?!]) (.+)$/); if(m&&ctx.measureText(m[1]).width<=maxW&&ctx.measureText(m[2]).width<=maxW) return [m[1],m[2]]; } var lo=maxW*0.45, hi=maxW, best=L;
    for(var k=0;k<14;k++){ var mid=(lo+hi)/2, T=wrap(ctx,text,mid); if(T.length<=n){ best=T; hi=mid; } else lo=mid; } return best; }
  function fit(ctx,text,maxW,maxLines,sizes,weight){ for(var i=0;i<sizes.length;i++){ ctx.font=weight+' '+sizes[i]+'px '+F; var L0=wrap(ctx,text,maxW); if(L0.length<=maxLines) return {size:sizes[i],lines:balance(ctx,text,maxW)}; } ctx.font=weight+' '+sizes[sizes.length-1]+'px '+F; return {size:sizes[sizes.length-1],lines:wrap(ctx,text,maxW).slice(0,maxLines)}; }
  function fitOld(ctx,text,maxW,maxLines,sizes,weight){ for(var i=0;i<sizes.length;i++){ ctx.font=weight+' '+sizes[i]+'px '+F; var L=wrap(ctx,text,maxW); if(L.length<=maxLines) return {size:sizes[i],lines:L}; } ctx.font=weight+' '+sizes[sizes.length-1]+'px '+F; return {size:sizes[sizes.length-1],lines:wrap(ctx,text,maxW).slice(0,maxLines)}; }
  function rr(ctx,x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
  function hex(c){ return /^#[0-9a-f]{6}$/i.test(String(c||'').trim())?String(c).trim():'#2B64F5'; }
  function soft(c){ var n=parseInt(c.slice(1),16),r=n>>16,g=(n>>8)&255,b=n&255,m=function(v){return Math.round(v+(255-v)*0.9);}; return 'rgb('+m(r)+','+m(g)+','+m(b)+')'; }
  // 사진 깔기: 화면에 꽉 차게 자르고, 밝기·대비·채도를 같은 값으로 맞춘 뒤 대표색을 옅게 덮어 매장마다 한 톤으로 보이게 한다
  function photo(ctx,img,col,mode){ var s=Math.max(W/img.width,H/img.height), w=img.width*s, h=img.height*s;
    ctx.save(); ctx.filter='contrast(1.08) saturate(1.06) brightness(1.03)'; ctx.drawImage(img,(W-w)/2,(H-h)/2,w,h); ctx.restore();
    ctx.save(); ctx.globalAlpha=mode==='last'?0.80:0.16; ctx.fillStyle=col; ctx.fillRect(0,0,W,H); ctx.restore();
    if(mode!=='last'){ var g=ctx.createLinearGradient(0,0,0,H); g.addColorStop(0,'rgba(0,0,0,.34)'); g.addColorStop(0.3,'rgba(0,0,0,.04)'); g.addColorStop(0.55,'rgba(0,0,0,.30)'); g.addColorStop(1,'rgba(0,0,0,.80)'); ctx.fillStyle=g; ctx.fillRect(0,0,W,H); } }
  var CH=[[/인스타/,'instagram.png'],[/스레드/,'threads.svg'],[/당근/,'daangn.png'],[/틱톡/,'tiktok.svg'],[/블로그/,'naver-blog.png']];
  function logosFor(label,L){ return CH.filter(function(x){return x[0].test(label)&&L[x[1]];}).map(function(x){return L[x[1]];}).slice(0,3); }
  function lines(ctx,L,x,y,lh){ L.forEach(function(t,i){ ctx.fillText(t,x,y+i*lh); }); }
  function draw(p,i,n,o){
    var cv=document.createElement('canvas'); cv.width=W; cv.height=H; var ctx=cv.getContext('2d'), col=hex(o.color), first=i===0, last=i===n-1&&n>1, M=96;
    ctx.textBaseline='top';
    if(first||last){
      var pic=first?o.cover:(o.last||null);
      ctx.fillStyle=col; ctx.fillRect(0,0,W,H);
      if(pic) photo(ctx,pic,col,first?'cover':'last');
      else { ctx.fillStyle='rgba(255,255,255,.14)'; ctx.beginPath(); ctx.arc(W-40,H-80,330,0,7); ctx.fill(); ctx.beginPath(); ctx.arc(W-250,H+90,230,0,7); ctx.fill(); }
      if(!pic){ ctx.fillStyle='rgba(255,255,255,.10)'; ctx.beginPath(); ctx.arc(120,-60,300,0,7); ctx.fill(); }
      ctx.fillStyle='#fff'; rr(ctx,M,M+6,10,40,5); ctx.fill();
      ctx.fillStyle='rgba(255,255,255,.95)'; ctx.font='700 38px '+F; ctx.fillText(o.name||'',M+28,M);
      if(first&&o.kicker&&!pic){ ctx.font='700 34px '+F; var kw=ctx.measureText(o.kicker).width+52; ctx.fillStyle='rgba(255,255,255,.18)'; rr(ctx,M,226,kw,64,32); ctx.fill(); ctx.fillStyle='#fff'; ctx.fillText(o.kicker,M+26,241); }
      ctx.fillStyle='#fff';
      if(first){ var t=fit(ctx,p.text.split(/\s*\|\s*/)[0],W-M*2,5,[128,112,98,84,72],'800'), lh=Math.round(t.size*1.28); lines(ctx,t.lines,M,pic?H-M-110-lh*t.lines.length:Math.max(240,Math.round((H-lh*t.lines.length)/2)-60),lh);
        ctx.font='600 36px '+F; ctx.fillStyle='rgba(255,255,255,.9)'; ctx.fillText('옆으로 넘겨 보세요  →',M,H-M-40); }
      else { var pp=p.text.split(/\s*\|\s*/), t2=fit(ctx,pp[0],W-M*2,5,[104,92,80,68,58],'800'), lh2=Math.round(t2.size*1.32), y2=Math.max(260,Math.round((H-lh2*t2.lines.length)/2)-120); lines(ctx,t2.lines,M,y2,lh2);
        if(pp[1]){ ctx.fillStyle='rgba(255,255,255,.92)'; var s2=fit(ctx,pp.slice(1).join(' '),W-M*2,3,[50,44,40],'500'); lines(ctx,s2.lines,M,y2+lh2*t2.lines.length+36,Math.round(s2.size*1.5)); ctx.fillStyle='#fff'; }
        if(o.insta){ ctx.font='600 36px '+F; ctx.fillStyle='rgba(255,255,255,.9)'; ctx.fillText('@'+String(o.insta).replace(/^@/,''),M,H-M-40); } }
    } else {
      // 가운데 장: 이름표(채널 로고와 이름)를 크게, 그 아래 큰 글과 작은 글
      ctx.fillStyle='#F2F4F6'; ctx.fillRect(0,0,W,H);
      ctx.fillStyle='#fff'; rr(ctx,56,56,W-112,H-112,56); ctx.fill();
      var X=M+24, y=150, icons=(o.logos&&p.label)?logosFor(p.label,o.logos):[];
      if(icons.length){ icons.forEach(function(im,k){ ctx.fillStyle='#F2F4F6'; rr(ctx,X+k*184,y,160,160,40); ctx.fill(); var s=Math.min(104/im.width,104/im.height), w=im.width*s, h=im.height*s; ctx.drawImage(im,X+k*184+(160-w)/2,y+(160-h)/2,w,h); }); y+=200; }
      if(p.label){ var lb=fit(ctx,p.label,W-X*2,1,[88,76,64,54],'800'); ctx.fillStyle=col; lines(ctx,lb.lines,X,y,lb.size); y+=Math.round(lb.size*1.25); ctx.fillStyle=col; rr(ctx,X,y+6,88,10,5); ctx.fill(); y+=64; }
      else y+=60;
      var parts=p.text.split(/\s*\|\s*/), head=parts[0], sub=parts.slice(1).join(' ');
      ctx.fillStyle='#191F28'; var b=fit(ctx,head,W-X*2,4,[104,92,82,72,62,54],'800'), lh3=Math.round(b.size*1.3); lines(ctx,b.lines,X,y,lh3); y+=lh3*b.lines.length+34;
      if(sub){ ctx.fillStyle='#4E5968'; var sb=fit(ctx,sub,W-X*2,4,[52,46,42,38],'500'), lh4=Math.round(sb.size*1.5); lines(ctx,sb.lines,X,y,lh4); }
      ctx.font='600 32px '+F; ctx.fillStyle='#8B95A1'; ctx.fillText(o.name||'',X,H-M-76);
      ctx.textAlign='right'; ctx.fillText((i+1)+' / '+n,W-M-24,H-M-76); ctx.textAlign='left';
    }
    return cv;
  }
  // 규칙: 무료 체험 중인 매장의 카드뉴스 맨 끝에 로컬피드 로고와 이름이 들어간 장을 한 장 붙인다. 유료 매장에는 붙이지 않는다.
  function credit(o){ var cv=document.createElement('canvas'); cv.width=W; cv.height=H; var ctx=cv.getContext('2d'); ctx.textBaseline='top'; ctx.textAlign='center';
    ctx.fillStyle='#F2F4F6'; ctx.fillRect(0,0,W,H); ctx.fillStyle='#fff'; rr(ctx,56,56,W-112,H-112,56); ctx.fill();
    var lg=o.logos&&o.logos['logo.svg'], y=360;
    if(lg){ ctx.drawImage(lg,(W-220)/2,y,220,220); } else { ctx.fillStyle='#2B64F5'; rr(ctx,(W-220)/2,y,220,220,56); ctx.fill(); }
    ctx.fillStyle='#191F28'; ctx.font='800 104px '+F; ctx.fillText('로컬피드',W/2,y+280);
    ctx.fillStyle='#191F28'; ctx.font='700 50px '+F; ctx.fillText('매출로 이어지는 통합 SNS 관리',W/2,y+430);
    ctx.fillStyle='#6B7684'; ctx.font='500 36px '+F; ctx.fillText('인스타 · 스레드 · 당근 · 틱톡 · 블로그',W/2,y+510);
    ctx.fillStyle='#2B64F5'; ctx.font='700 44px '+F; ctx.fillText('localfeed.co.kr',W/2,y+590);
    ctx.fillStyle='#8B95A1'; ctx.font='500 32px '+F; ctx.fillText('이 카드뉴스는 로컬피드가 만들었어요',W/2,H-186);
    return cv; }
  // 프로필 이미지 1080×1080. 채널들이 동그랗게 자르므로 중요한 것은 가운데 70% 안에 둔다.
  // o.logo(대표님이 준 로고 파일) → 흰 바탕에 로고 그대로 / o.photo → 매장 사진을 보정해 정사각형으로 / 둘 다 없으면 대표색 바탕에 가게 이름
  function profile(o){ var S=1080, cv=document.createElement('canvas'); cv.width=S; cv.height=S; var ctx=cv.getContext('2d'), col=o.color||'#2B64F5';
    if(o.logo){ ctx.fillStyle='#fff'; ctx.fillRect(0,0,S,S); var w=S*0.52, h=w*(o.logo.height/o.logo.width||1); ctx.drawImage(o.logo,(S-w)/2,(S-h)/2,w,h); return cv; }
    if(o.photo){ var im=o.photo, s=Math.max(S/im.width,S/im.height), pw=im.width*s, ph=im.height*s;
      ctx.save(); ctx.filter='contrast(1.08) saturate(1.06) brightness(1.03)'; ctx.drawImage(im,(S-pw)/2,(S-ph)/2,pw,ph); ctx.restore();
      ctx.save(); ctx.globalAlpha=0.10; ctx.fillStyle=col; ctx.fillRect(0,0,S,S); ctx.restore(); return cv; }
    ctx.fillStyle=col; ctx.fillRect(0,0,S,S);
    var name=String(o.name||'').trim()||'우리 가게', f=null; [210,180,150].some(function(z){ ctx.font='800 '+z+'px '+F; if(ctx.measureText(name).width<=S*0.64){ f={size:z,lines:[name]}; return true; } return false; }); if(!f) f=fit(ctx,name,S*0.62,2,[190,160,130,104,84],'800');
    ctx.fillStyle='#fff'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.font='800 '+f.size+'px '+F;
    var lh=f.size*1.16, y=S/2-(f.lines.length-1)*lh/2; f.lines.forEach(function(t,i){ ctx.fillText(t,S/2,y+i*lh); });
    if(o.sub){ ctx.font='600 44px '+F; ctx.globalAlpha=0.85; ctx.fillText(String(o.sub).slice(0,14),S/2,y+(f.lines.length-1)*lh+f.size*0.62+44); ctx.globalAlpha=1; }
    return cv; }
  // 블로그용 그림: 대표 이미지 1장(1080×1080, 제목) + 본문 그림(1200×800, 가운데 장 내용을 가로로) 최대 4장
  function blogThumb(P,o){ var S=1080, cv=document.createElement('canvas'); cv.width=S; cv.height=S; var ctx=cv.getContext('2d'), col=hex(o.color), M=96;
    ctx.fillStyle=col; ctx.fillRect(0,0,S,S);
    if(o.cover){ var im=o.cover, s=Math.max(S/im.width,S/im.height), w=im.width*s, h=im.height*s; ctx.save(); ctx.filter='contrast(1.08) saturate(1.06) brightness(1.03)'; ctx.drawImage(im,(S-w)/2,(S-h)/2,w,h); ctx.restore();
      var g=ctx.createLinearGradient(0,0,0,S); g.addColorStop(0,'rgba(0,0,0,.30)'); g.addColorStop(0.4,'rgba(0,0,0,.25)'); g.addColorStop(1,'rgba(0,0,0,.78)'); ctx.fillStyle=g; ctx.fillRect(0,0,S,S); }
    else { ctx.fillStyle='rgba(255,255,255,.12)'; ctx.beginPath(); ctx.arc(S-60,S-40,320,0,7); ctx.fill(); ctx.beginPath(); ctx.arc(110,-70,280,0,7); ctx.fill(); }
    ctx.textBaseline='top'; ctx.fillStyle='rgba(255,255,255,.95)'; ctx.font='700 40px '+F; ctx.fillText(o.name||'',M,M);
    var t=fit(ctx,o.title||P[0].text.split(/\s*\|\s*/)[0],S-M*2,4,[120,104,92,80,68],'800'), lh=Math.round(t.size*1.26), y=S-M-60-lh*t.lines.length;
    ctx.fillStyle='#fff'; ctx.font='800 '+t.size+'px '+F; lines(ctx,t.lines,M,y,lh);
    if(o.kicker){ ctx.font='600 38px '+F; ctx.fillStyle='rgba(255,255,255,.88)'; ctx.fillText(o.kicker,M,S-M-34); }
    return cv; }
  function blogBody(p,i,o){ var BW=1200, BH=800, cv=document.createElement('canvas'); cv.width=BW; cv.height=BH; var ctx=cv.getContext('2d'), col=hex(o.color), X=96, y=92;
    ctx.fillStyle='#F2F4F6'; ctx.fillRect(0,0,BW,BH); ctx.fillStyle='#fff'; rr(ctx,36,36,BW-72,BH-72,44); ctx.fill(); ctx.textBaseline='top';
    var icons=(o.logos&&p.label)?logosFor(p.label,o.logos):[], lx=X;
    icons.forEach(function(im){ ctx.fillStyle='#F2F4F6'; rr(ctx,lx,y,96,96,26); ctx.fill(); var s=Math.min(62/im.width,62/im.height), w=im.width*s, h=im.height*s; ctx.drawImage(im,lx+(96-w)/2,y+(96-h)/2,w,h); lx+=112; });
    if(p.label){ ctx.fillStyle=col; ctx.font='800 56px '+F; ctx.fillText(p.label,lx+(icons.length?12:0),y+(icons.length?18:6)); }
    else { ctx.fillStyle=col; ctx.font='800 56px '+F; ctx.fillText(String(i+1),X,y+6); }
    y+=icons.length?136:96; ctx.fillStyle=col; rr(ctx,X,y,72,8,4); ctx.fill(); y+=44;
    var parts=p.text.split(/\s*\|\s*/), head=parts[0], sub=parts.slice(1).join(' ');
    ctx.fillStyle='#191F28'; var b=fit(ctx,head,BW-X*2,3,[92,82,72,62,54],'800'), lh=Math.round(b.size*1.28); ctx.font='800 '+b.size+'px '+F; lines(ctx,b.lines,X,y,lh); y+=lh*b.lines.length+26;
    if(sub){ ctx.fillStyle='#4E5968'; var sb=fit(ctx,sub,BW-X*2,3,[46,42,38,34],'500'); ctx.font='500 '+sb.size+'px '+F; lines(ctx,sb.lines,X,y,Math.round(sb.size*1.5)); }
    ctx.font='600 28px '+F; ctx.fillStyle='#8B95A1'; ctx.fillText(o.name||'',X,BH-104);
    return cv; }
  // 틱톡용: 카드들을 세로 영상(1080×1920)으로 묶는다. 한 장에 약 3초, 장 사이는 짧게 겹쳐 넘긴다. 브라우저가 실시간으로 녹화한다.
  function video(L,o){ return new Promise(function(res,rej){
    if(!window.MediaRecorder||!HTMLCanvasElement.prototype.captureStream) return rej(new Error('이 브라우저는 영상을 만들지 못해요. 크롬에서 해 주세요.'));
    var mime=['video/mp4;codecs=avc1.42E01E','video/mp4','video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm'].filter(function(m){ try{ return MediaRecorder.isTypeSupported(m); }catch(e){ return false; } })[0];
    if(!mime) return rej(new Error('이 브라우저는 영상을 만들지 못해요.'));
    var VW=1080,VH=1920, cv=document.createElement('canvas'); cv.width=VW; cv.height=VH; var ctx=cv.getContext('2d'), col=hex(o&&o.color), per=(o&&o.per)||3000, fade=350, total=L.length*per+400;
    function slide(i,alpha){ var im=L[i]; if(!im) return; var h=VW*im.height/im.width, y=(VH-h)/2; ctx.globalAlpha=alpha; ctx.drawImage(im,0,y,VW,h); ctx.globalAlpha=1; }
    function frame(t){ ctx.fillStyle=col; ctx.fillRect(0,0,VW,VH); ctx.fillStyle='rgba(0,0,0,.28)'; ctx.fillRect(0,0,VW,VH);
      var i=Math.min(L.length-1,Math.floor(t/per)), into=t-i*per; slide(i,1); if(i>0&&into<fade){ slide(i-1,1-into/fade); }
      ctx.fillStyle='rgba(255,255,255,'+(0.9+0.1*Math.sin(t/200))+')'; ctx.fillRect(0,VH-6,VW*Math.min(1,t/(L.length*per)),6); }   // 아래 진행 줄(매 프레임 화면이 바뀌어 녹화가 끊기지 않게도 한다)
    frame(0);
    var rec=new MediaRecorder(cv.captureStream(30),{mimeType:mime,videoBitsPerSecond:3500000}), chunks=[], t0=0, timer=null;
    rec.ondataavailable=function(e){ if(e.data&&e.data.size) chunks.push(e.data); };
    rec.onerror=function(){ clearInterval(timer); rej(new Error('영상을 만들다 멈췄어요.')); };
    rec.onstop=function(){ res(new Blob(chunks,{type:mime.split(';')[0]})); };
    rec.start(500); t0=performance.now();
    timer=setInterval(function(){ var t=performance.now()-t0; if(t>=total){ clearInterval(timer); frame(L.length*per-1); setTimeout(function(){ rec.stop(); },150); return; } frame(t); },33); }); }
  window.lfCards={ parse:parse,
    video:video,
    blog:function(pages,o){ o=o||{}; var P=parse(pages); if(P.length<2) return Promise.resolve([]); var mid=P.slice(1,P.length>2?P.length-1:P.length).slice(0,4);
      return [blogThumb(P,o)].concat(mid.map(function(p,i){ return blogBody(p,i,o); })); },
    profile:function(o){ var ready=document.fonts&&document.fonts.load?document.fonts.load("800 160px 'Gothic A1'").catch(function(){}):Promise.resolve(); return ready.then(function(){ return profile(o||{}); }); },
    // 채널 로고(대표님이 준 파일 그대로)를 한 번 읽어 둔다. 못 읽은 것은 빼고 글자만 쓴다.
    logos:function(base){ var out={}; return Promise.all(CH.concat([[null,'logo.svg']]).map(function(x){ return new Promise(function(res){ var im=new Image(); im.onload=function(){ out[x[1]]=im; res(); }; im.onerror=function(){ res(); }; im.src=(base||'icons/')+x[1]; }); })).then(function(){ return out; }); },
    load:function(mime,b64){ return new Promise(function(res,rej){ var im=new Image(); im.onload=function(){res(im);}; im.onerror=function(){rej(new Error('사진을 읽지 못했어요.'));}; im.src='data:'+(mime||'image/jpeg')+';base64,'+b64; }); },
    render:function(pages,o){ var P=parse(pages); if(P.length<2) return Promise.reject(new Error('장별 문구가 없어 카드를 만들 수 없어요.'));
      var ready=document.fonts&&document.fonts.load?Promise.all([document.fonts.load("800 80px 'Gothic A1'"),document.fonts.load("600 36px 'Gothic A1'"),document.fonts.load("700 38px 'Gothic A1'")]).catch(function(){}):Promise.resolve();
      return ready.then(function(){ var L=P.slice(0,9).map(function(p,i){ return draw(p,i,Math.min(P.length,9),o||{}); }); if(!o||o.credit!==false) L.push(credit(o||{})); return L; }); } };
})();
