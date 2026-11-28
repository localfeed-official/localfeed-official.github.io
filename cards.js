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
  // 틱톡용: 카드들을 세로 영상(1080×1920, 초당 30장 고정)으로 묶는다. 한 장에 약 3초, 장 사이는 짧게 겹쳐 넘긴다.
  // 틱톡은 초당 장 수가 일정한 영상만 받는다. 그래서 화면 녹화가 아니라 한 장씩 직접 인코딩해 MP4로 만든다(mp4-muxer.js 필요).
  function loadMuxer(){ if(window.Mp4Muxer) return Promise.resolve(); return new Promise(function(res,rej){ var s=document.createElement('script'); s.src='mp4-muxer.js?v=5'; s.onload=function(){ res(); }; s.onerror=function(){ rej(new Error('영상 도구를 불러오지 못했어요.')); }; document.head.appendChild(s); }); }
  function video(L,o){ o=o||{};
    if(!window.VideoEncoder||!window.VideoFrame) return Promise.reject(new Error('이 브라우저는 영상을 만들지 못해요. 크롬에서 해 주세요.'));
    var VW=1080,VH=1920,FPS=30, cv=document.createElement('canvas'); cv.width=VW; cv.height=VH; var ctx=cv.getContext('2d'), col=hex(o.color), per=o.per||3000, fade=350, N=Math.round((L.length*per+400)/1000*FPS);
    // 장면마다 아주 천천히 커지게 해서 멈춘 그림이 아니라 영상으로 보이게 한다(멈춘 그림만 이어 붙인 파일은 틱톡이 알림을 만들지 않는 일이 있었다)
    function slide(i,alpha,z){ var im=L[i]; if(!im) return; var h=VW*im.height/im.width, s=1+0.05*(z||0), w2=VW*s, h2=h*s; ctx.globalAlpha=alpha; ctx.drawImage(im,(VW-w2)/2,(VH-h2)/2,w2,h2); ctx.globalAlpha=1; }
    function frame(t){ ctx.fillStyle=col; ctx.fillRect(0,0,VW,VH); ctx.fillStyle='rgba(0,0,0,.28)'; ctx.fillRect(0,0,VW,VH);
      var i=Math.min(L.length-1,Math.floor(t/per)), into=t-i*per; slide(i,1,into/per); if(i>0&&into<fade) slide(i-1,1-into/fade,1);
      ctx.fillStyle='rgba(255,255,255,.9)'; ctx.fillRect(0,VH-6,VW*Math.min(1,t/(L.length*per)),6); }
    return loadMuxer().then(function(){ var codecs=['avc1.640028','avc1.4D4028','avc1.42E028'];
      return codecs.reduce(function(p,c){ return p.then(function(ok){ if(ok) return ok; return VideoEncoder.isConfigSupported({codec:c,width:VW,height:VH,bitrate:4000000,framerate:FPS}).then(function(r){ return r.supported?c:''; },function(){ return ''; }); }); },Promise.resolve(''));
    }).then(function(codec){ if(!codec) throw new Error('이 컴퓨터는 영상 인코딩을 지원하지 않아요.');
      return new Promise(function(res,rej){
        var mux=new Mp4Muxer.Muxer({target:new Mp4Muxer.ArrayBufferTarget(),video:{codec:'avc',width:VW,height:VH,frameRate:FPS},fastStart:'in-memory'}), dead=false;
        var enc=new VideoEncoder({output:function(ch,meta){ mux.addVideoChunk(ch,meta); },error:function(e){ dead=true; rej(new Error('영상을 만들다 멈췄어요: '+e.message)); }});
        enc.configure({codec:codec,width:VW,height:VH,bitrate:5000000,framerate:FPS});
        var n=0; (function step(){ if(dead) return;
          while(n<N&&enc.encodeQueueSize<4){ frame(Math.min(n*1000/FPS,L.length*per-1)); var vf=new VideoFrame(cv,{timestamp:Math.round(n*1e6/FPS),duration:Math.round(1e6/FPS)}); enc.encode(vf,{keyFrame:n%FPS===0}); vf.close(); n++; }
          if(n<N) return setTimeout(step,0);
          enc.flush().then(function(){ mux.finalize(); res(new Blob([mux.target.buffer],{type:'video/mp4'})); },rej); })(); }); }); }
  // 완성된 쇼츠 영상에 대본의 자막을 얹는다: 영상은 풀어서 한 장씩 다시 그리고(글자는 여기서 그리므로 깨지지 않는다), 소리는 손대지 않고 그대로 옮긴다
  function loadMp4box(){ if(window.MP4Box) return Promise.resolve(); return new Promise(function(res,rej){ var s=document.createElement('script'); s.src='mp4box.js?v=1'; s.onload=function(){ res(); }; s.onerror=function(){ rej(new Error('영상 읽는 도구를 불러오지 못했어요.')); }; document.head.appendChild(s); }); }
  function capTimes(script,dur){ var S=shScenes(script), T=S.map(function(x){ var m=String(x.time).match(/(\d+(?:\.\d+)?)\s*[~\-–]\s*(\d+(?:\.\d+)?)/); return m?[+m[1],+m[2]]:null; }), end=0;
    T.forEach(function(t){ if(t) end=Math.max(end,t[1]); });
    if(!end||T.some(function(t){return !t||t[1]<=t[0];})) return S.map(function(x,i){ return {a:dur*i/S.length,b:dur*(i+1)/S.length,cap:x.cap,hi:x.hi,chips:x.chips}; });
    var k=dur/end; return S.map(function(x,i){ return {a:T[i][0]*k,b:T[i][1]*k,cap:x.cap,hi:x.hi,chips:x.chips}; }); }
  function caption(buf,script,o){ o=o||{};
    if(!window.VideoEncoder||!window.VideoDecoder) return Promise.reject(new Error('이 브라우저는 영상을 다시 만들지 못해요. 크롬에서 해 주세요.'));
    var fonts=document.fonts&&document.fonts.load?document.fonts.load("800 60px 'Gothic A1'").catch(function(){}):Promise.resolve();
    return Promise.all([loadMuxer(),loadMp4box(),fonts]).then(function(){ return new Promise(function(res,rej){
      var f=MP4Box.createFile(), V=[], A=[], vt=null, at=null; buf.fileStart=0;
      f.onError=function(e){ rej(new Error('영상 파일을 읽지 못했어요: '+e)); };
      f.onReady=function(info){ vt=info.videoTracks[0]; at=info.audioTracks[0]||null; if(!vt) return rej(new Error('영상 파일에 화면이 없어요.'));
        f.onSamples=function(id,user,smp){ (user==='v'?V:A).push.apply(user==='v'?V:A,smp); };
        f.setExtractionOptions(vt.id,'v',{nbSamples:100000}); if(at) f.setExtractionOptions(at.id,'a',{nbSamples:100000}); f.start(); };
      f.appendBuffer(buf); f.flush();
      var tries=0; (function wait(){ if(!vt){ if(++tries>100) return rej(new Error('영상 파일을 읽지 못했어요. MP4 파일인지 봐 주세요.')); return setTimeout(wait,50); }
        if(V.length<vt.nb_samples||(at&&A.length<at.nb_samples)){ if(++tries>200) return rej(new Error('영상 파일을 끝까지 읽지 못했어요.')); return setTimeout(wait,50); }
        res({f:f,vt:vt,at:at,V:V,A:A}); })(); }); })
    .then(function(m){ var vt=m.vt, at=m.at, e=m.f.getTrackById(vt.id).mdia.minf.stbl.stsd.entries[0], box=e.avcC||e.hvcC||e.vpcC||e.av1C, desc;
      if(box){ var ds=new DataStream(undefined,0,DataStream.BIG_ENDIAN); box.write(ds); desc=new Uint8Array(ds.buffer,8); }
      var SW=vt.video.width, SH=vt.video.height, k=SW<720?720/SW:1, W=Math.round(SW*k/2)*2, H=Math.round(SH*k/2)*2, dur=vt.duration/vt.timescale||m.V.length/24, fps=Math.max(1,Math.round(m.V.length/dur));
      var cfg={codec:vt.codec,codedWidth:SW,codedHeight:SH}; if(desc) cfg.description=desc;
      var asc=null, aOk=false; if(at&&/^mp4a/.test(at.codec)){ aOk=true; try{ var es=m.f.getTrackById(at.id).mdia.minf.stbl.stsd.entries[0].esds.esd; (es.descs||[]).forEach(function(d){ if(d.tag===4) (d.descs||[]).forEach(function(x){ if(x.tag===5&&x.data) asc=new Uint8Array(x.data); }); }); }catch(err){}
        if(!asc){ var fi=[96000,88200,64000,48000,44100,32000,24000,22050,16000,12000,11025,8000].indexOf(at.audio.sample_rate); if(fi<0) aOk=false; else asc=new Uint8Array([(2<<3)|(fi>>1),((fi&1)<<7)|(at.audio.channel_count<<3)]); } }
      return VideoDecoder.isConfigSupported(cfg).then(function(r){ if(!r.supported) throw new Error('이 컴퓨터는 이 영상('+vt.codec+')을 풀지 못해요.');
        var codecs=['avc1.640028','avc1.4D4028','avc1.42E028']; return codecs.reduce(function(p,c){ return p.then(function(ok){ if(ok) return ok; return VideoEncoder.isConfigSupported({codec:c,width:W,height:H,bitrate:4000000,framerate:fps}).then(function(q){ return q.supported?c:''; },function(){ return ''; }); }); },Promise.resolve('')); })
      .then(function(codec){ if(!codec) throw new Error('이 컴퓨터는 영상 인코딩을 지원하지 않아요.');
        // 배경음악: 원래 소리(말)를 풀어 음악과 섞은 뒤 다시 압축한다. 이 컴퓨터가 소리 압축을 못 하면 음악 없이 원래 소리를 그대로 옮긴다
        var mixP=Promise.resolve(null);
        if(o.bgm&&aOk&&window.AudioEncoder&&window.OfflineAudioContext){ var acodec=o.testOpus?'opus':'mp4a.40.2', SR=o.testOpus?48000:44100;
          mixP=AudioEncoder.isConfigSupported({codec:acodec,sampleRate:SR,numberOfChannels:2,bitrate:128000}).then(function(q){ if(!q.supported) return null;
            var dc=new OfflineAudioContext(2,1,SR); return Promise.all([dc.decodeAudioData(buf.slice(0)),dc.decodeAudioData(o.bgm.slice(0))]).then(function(ab){
              var n=Math.ceil(dur*SR), oc=new OfflineAudioContext(2,n,SR), v=oc.createBufferSource(); v.buffer=ab[0]; v.connect(oc.destination); v.start(0);
              var b=oc.createBufferSource(), g=oc.createGain(), vol=o.bgmVol||0.14; b.buffer=ab[1]; b.loop=true; g.gain.setValueAtTime(0,0); g.gain.linearRampToValueAtTime(vol,0.4); g.gain.setValueAtTime(vol,Math.max(0.5,dur-1.2)); g.gain.linearRampToValueAtTime(0,dur); b.connect(g); g.connect(oc.destination); b.start(0);
              return oc.startRendering().then(function(out){ return {buf:out,codec:acodec,sr:SR}; }); }); }).catch(function(){ return null; }); }
        return mixP.then(function(mix){
        return new Promise(function(res,rej){ var caps=capTimes(script,dur), cv=document.createElement('canvas'); cv.width=W; cv.height=H; var ctx=cv.getContext('2d'), lay={}, dead=false, t0=null, nOut=0, nIn=0, N=m.V.length;
          var mo={target:new Mp4Muxer.ArrayBufferTarget(),video:{codec:'avc',width:W,height:H,frameRate:fps},fastStart:'in-memory',firstTimestampBehavior:'offset'}; if(mix) mo.audio={codec:mix.codec==='opus'?'opus':'aac',numberOfChannels:2,sampleRate:mix.sr}; else if(aOk) mo.audio={codec:'aac',numberOfChannels:at.audio.channel_count,sampleRate:at.audio.sample_rate};
          var mux=new Mp4Muxer.Muxer(mo), fail=function(msg){ if(dead) return; dead=true; rej(new Error(msg)); };
          var enc=new VideoEncoder({output:function(ch,meta){ mux.addVideoChunk(ch,meta); },error:function(e){ fail('영상을 만들다 멈췄어요: '+e.message); }});
          enc.configure({codec:codec,width:W,height:H,bitrate:W>=1080?7000000:4500000,framerate:fps});
          var st=capStyle(script);
          var OV={}; (o.overlays||[]).forEach(function(v){ OV[v.n]=v; });   // 일러스트·단색 장면: 그 구간은 영상 위를 그림으로 덮는다(소리는 그대로)
          function drawCap(t){ var c=null, ci=-1; for(var i=0;i<caps.length;i++) if(t>=caps[i].a&&t<caps[i].b){ c=caps[i]; ci=i; break; } if(!c) return;
            var ov=OV[ci]; if(ov){ var p=(t-c.a)/Math.max(0.1,c.b-c.a), al=Math.min(1,(t-c.a)/0.15,(c.b-t)/0.15+0.001); ctx.save(); ctx.globalAlpha=Math.max(0,Math.min(1,al)); ctx.fillStyle='#16203a'; ctx.fillRect(0,0,W,H);
              if(ov.kind==='art'&&ov.img){ var im=ov.img, k=Math.max(W/im.width,H/im.height)*(1+0.05*p), w2=im.width*k, h2=im.height*k; ctx.drawImage(im,(W-w2)/2,(H-h2)/2,w2,h2); } ctx.restore(); } if(c.chips&&c.chips.length) chipsDraw(ctx,W,H,c.chips,(t-c.a)/Math.max(0.1,c.b-c.a),!ov); if(!c.cap) return;
            capDraw(ctx,W,H*0.77,c.cap,c.hi,st,Math.min(1,(t-c.a)/0.12),lay); }
          var dec=new VideoDecoder({output:function(fr){ if(dead){ fr.close(); return; } if(t0===null) t0=fr.timestamp; var ts=fr.timestamp-t0;
              ctx.drawImage(fr,0,0,W,H); drawCap(ts/1e6); var vf=new VideoFrame(cv,{timestamp:ts,duration:fr.duration||Math.round(1e6/fps)}); fr.close();
              enc.encode(vf,{keyFrame:nOut%fps===0}); vf.close(); nOut++; if(o.progress&&nOut%12===0) o.progress(nOut/N); },
            error:function(e){ fail('영상을 풀다 멈췄어요: '+e.message); }});
          dec.configure(cfg);
          (function feed(){ if(dead) return;
            while(nIn<N&&dec.decodeQueueSize<8&&enc.encodeQueueSize<8&&nIn-nOut<24){ var sm=m.V[nIn++]; dec.decode(new EncodedVideoChunk({type:sm.is_sync?'key':'delta',timestamp:Math.round(sm.cts*1e6/sm.timescale),duration:Math.round(sm.duration*1e6/sm.timescale),data:sm.data})); }
            if(nIn<N) return setTimeout(feed,4);
            dec.flush().then(function(){ return enc.flush(); }).then(function(){ if(dead) return;
              var done=function(){ mux.finalize(); res({blob:new Blob([mux.target.buffer],{type:'video/mp4'}),w:W,h:H,dur:dur,audio:aOk,bgm:!!mix,frames:nOut,caps:caps.filter(function(c){return c.cap||(c.chips&&c.chips.length);}).length}); };
              if(mix){ var ae=new AudioEncoder({output:function(ch,meta){ mux.addAudioChunk(ch,meta); },error:function(e){ fail('소리를 섞다 멈췄어요: '+e.message); }}); ae.configure({codec:mix.codec,sampleRate:mix.sr,numberOfChannels:2,bitrate:128000});
                var L=mix.buf.getChannelData(0), R=mix.buf.getChannelData(1), N2=mix.buf.length, step=4096;
                for(var p0=0;p0<N2;p0+=step){ var k=Math.min(step,N2-p0), d=new Float32Array(k*2); d.set(L.subarray(p0,p0+k),0); d.set(R.subarray(p0,p0+k),k); var ad=new AudioData({format:'f32-planar',sampleRate:mix.sr,numberOfFrames:k,numberOfChannels:2,timestamp:Math.round(p0*1e6/mix.sr),data:d}); ae.encode(ad); ad.close(); }
                return ae.flush().then(function(){ if(!dead) done(); }); }
              if(aOk) m.A.forEach(function(sm,i){ mux.addAudioChunkRaw(new Uint8Array(sm.data),'key',Math.round(sm.cts*1e6/sm.timescale),Math.round(sm.duration*1e6/sm.timescale),i===0?{decoderConfig:{codec:at.codec,numberOfChannels:at.audio.channel_count,sampleRate:at.audio.sample_rate,description:asc}}:undefined); });
              done(); }).catch(function(e){ fail('영상을 마무리하지 못했어요: '+(e&&e.message||e)); }); })(); }); }); }); }); }
  // 당근 글 나누기: 맨 위 "제목: …", "배너: 큰 글 | 강조 | 혜택 · 혜택" 두 줄과 본문
  function dgParts(text,fallbackTitle){ var L=String(text||'').replace(/\r/g,'').split('\n'), title='', ban=null, rest=[];
    L.forEach(function(l){ var m=l.match(/^\s*제목\s*[:：]\s*(.+)$/), b=l.match(/^\s*배너\s*[:：]\s*(.+)$/);
      if(m&&!title&&!rest.join('').trim()) title=m[1].trim(); else if(b&&!ban&&!rest.join('').trim()){ var p=b[1].split(/\s*\|\s*/); ban={big:(p[0]||'').trim(),em:(p[1]||'').trim(),chips:(p[2]||'').split(/\s*[·,]\s*/).map(function(x){return x.trim();}).filter(Boolean).slice(0,3)}; } else rest.push(l); });
    return {title:title||fallbackTitle||'',banner:ban,body:rest.join('\n').replace(/^\n+|\n+$/g,'')}; }
  // 당근 소식 대표 이미지 1080×1080: 위 이름표, 큰 글, 강조 한마디(흰 상자), 혜택 조각들, 아래 문의 띠
  function dgBanner(P,o){ o=o||{}; var S=1080, cv=document.createElement('canvas'); cv.width=S; cv.height=S; var ctx=cv.getContext('2d'), col=hex(o.color), M=84, B=P.banner||{big:P.title,em:'',chips:[]};
    ctx.fillStyle=col; ctx.fillRect(0,0,S,S);
    if(o.cover){ var im=o.cover, s=Math.max(S/im.width,S/im.height), w=im.width*s, h=im.height*s; ctx.save(); ctx.filter='contrast(1.06) saturate(1.05)'; ctx.drawImage(im,(S-w)/2,(S-h)/2,w,h); ctx.restore(); ctx.save(); ctx.globalAlpha=0.82; ctx.fillStyle=col; ctx.fillRect(0,0,S,S); ctx.restore(); }
    else { ctx.fillStyle='rgba(255,255,255,.10)'; ctx.beginPath(); ctx.arc(S-70,150,300,0,7); ctx.fill(); ctx.beginPath(); ctx.arc(60,S-260,220,0,7); ctx.fill(); }
    ctx.textBaseline='top'; var y=M;
    var kick=[o.dong,o.kicker].filter(Boolean).join(' · ')||o.name||''; if(kick){ ctx.font='700 40px '+F; var kw=ctx.measureText(kick).width+64; ctx.fillStyle='rgba(255,255,255,.2)'; rr(ctx,M,y,kw,76,38); ctx.fill(); ctx.fillStyle='#fff'; ctx.fillText(kick,M+32,y+18); }
    y+=130;
    var big=niceFit(ctx,B.big||P.title,S-M*2,[132,116,100,88,76,66],'800',100), lh=Math.round(big.size*1.2); ctx.fillStyle='#fff'; ctx.font='800 '+big.size+'px '+F; lines(ctx,big.lines,M,y,lh); y+=lh*big.lines.length+36;
    if(B.em){ var em=fit(ctx,B.em,S-M*2-88,1,[92,80,68,58,50],'800'); ctx.font='800 '+em.size+'px '+F; var ew=Math.min(S-M*2,ctx.measureText(em.lines[0]).width+88), eh=em.size+56; ctx.fillStyle='#fff'; rr(ctx,M,y,ew,eh,28); ctx.fill(); ctx.fillStyle=col; ctx.fillText(em.lines[0],M+44,y+26); y+=eh+34; }
    var x=M; ctx.font='700 38px '+F; (B.chips||[]).forEach(function(t){ var w2=ctx.measureText('✓ '+t).width+56; if(x+w2>S-M){ x=M; y+=88; } ctx.fillStyle='rgba(255,255,255,.18)'; rr(ctx,x,y,w2,72,36); ctx.fill(); ctx.fillStyle='#fff'; ctx.fillText('✓ '+t,x+28,y+17); x+=w2+16; });
    ctx.fillStyle='rgba(0,0,0,.28)'; ctx.fillRect(0,S-150,S,150); ctx.fillStyle='#fff'; ctx.font='800 50px '+F; ctx.fillText('당근 채팅으로 문의하기',M,S-112);
    ctx.font='600 34px '+F; ctx.textAlign='right'; ctx.fillStyle='rgba(255,255,255,.9)'; ctx.fillText(o.name||'',S-M,S-102); ctx.textAlign='left';
    return cv; }
  // 틱톡 전용 영상 장면: 틱톡 글의 "장면:" 아래 "1. 큰 자막 | 작은 자막" 줄들. 세로 1080×1920, 위아래는 틱톡 버튼에 가리므로 비워 둔다.
  function ttScenes(text){ var t=String(text||''), i=t.search(/(^|\n)\s*장면\s*[:：]/); if(i<0) return []; return t.slice(i).split('\n').map(function(l){ var m=l.match(/^\s*\d+\s*[.)]\s*(.+)$/); if(!m) return null; var p=m[1].split(/\s*\|\s*/); return {big:(p[0]||'').trim(),sub:p.slice(1).join(' ').trim()}; }).filter(function(x){return x&&x.big;}).slice(0,7); }
  // 낱말 중간에서 끊지 않는 줄 나눔: 낱말 단위로만 나누고, 안 들어가면 글자를 줄인다
  function wordFit(ctx,text,maxW,maxLines,sizes,weight){ var words=String(text).split(/\s+/).filter(Boolean);
    for(var k=0;k<sizes.length;k++){ ctx.font=weight+' '+sizes[k]+'px '+F; var L=[], cur='', ok=true;
      words.forEach(function(w){ if(ctx.measureText(w).width>maxW) ok=false; var t=cur?cur+' '+w:w; if(ctx.measureText(t).width<=maxW) cur=t; else { if(cur) L.push(cur); cur=w; } }); if(cur) L.push(cur);
      if(ok&&L.length<=maxLines) return {size:sizes[k],lines:L}; }
    return fit(ctx,text,maxW,maxLines,sizes,weight); }
  // 세로 화면용 줄 나눔: 짧으면 한 줄로(글자를 조금 줄여서라도), 길면 두 줄을 비슷한 길이로 나눈다. 낱말 중간에서는 끊지 않는다.
  function niceFit(ctx,text,maxW,sizes,weight,oneMin){ var words=String(text).split(/\s+/).filter(Boolean), n=words.length;
    function splits(k){ var out=[]; (function rec(start,left,acc){ if(left===1){ out.push(acc.concat([words.slice(start).join(' ')])); return; } for(var e=start+1;e<=n-left+1;e++) rec(e,left-1,acc.concat([words.slice(start,e).join(' ')])); })(0,k,[]); return out; }
    function best(k,size){ ctx.font=weight+' '+size+'px '+F; var pick=null; splits(k).forEach(function(L){ var w=L.map(function(t){return ctx.measureText(t).width;}), mx=Math.max.apply(null,w), mn=Math.min.apply(null,w); if(mx>maxW) return; var score=mx-mn; if(!pick||score<pick.score) pick={lines:L,score:score}; }); return pick; }
    var k,i,b;
    for(i=0;i<sizes.length&&sizes[i]>=oneMin;i++){ b=best(1,sizes[i]); if(b) return {size:sizes[i],lines:b.lines}; }
    for(k=2;k<=3;k++){ if(n<k) break; for(i=0;i<sizes.length;i++){ b=best(k,sizes[i]); if(b) return {size:sizes[i],lines:b.lines}; } }
    for(i=0;i<sizes.length;i++){ b=best(1,sizes[i]); if(b) return {size:sizes[i],lines:b.lines}; }
    return wordFit(ctx,text,maxW,3,sizes,weight); }
  function ttDraw(sc,i,n,o){ var VW=1080,VH=1920, cv=document.createElement('canvas'); cv.width=VW; cv.height=VH; var ctx=cv.getContext('2d'), col=hex(o.color), M=90, first=i===0, lastS=i===n-1, dark=first||lastS;
    ctx.fillStyle=dark?col:'#F7F8FA'; ctx.fillRect(0,0,VW,VH);
    if(first&&o.cover){ var im=o.cover, s=Math.max(VW/im.width,VH/im.height), w=im.width*s, h=im.height*s; ctx.save(); ctx.filter='contrast(1.06) saturate(1.05)'; ctx.drawImage(im,(VW-w)/2,(VH-h)/2,w,h); ctx.restore(); ctx.fillStyle='rgba(0,0,0,.52)'; ctx.fillRect(0,0,VW,VH); }
    else if(dark){ ctx.fillStyle='rgba(255,255,255,.10)'; ctx.beginPath(); ctx.arc(VW-60,420,360,0,7); ctx.fill(); ctx.beginPath(); ctx.arc(80,VH-560,280,0,7); ctx.fill(); }
    
    ctx.textBaseline='top'; ctx.fillStyle=dark?'rgba(255,255,255,.92)':'#8B95A1'; ctx.font='700 44px '+F; ctx.fillText(o.name||'',M,250);
    if(!dark){ ctx.textAlign='right'; ctx.fillText(i+' / '+(n-2),VW-M,250); ctx.textAlign='left'; }
    var b=niceFit(ctx,sc.big,VW-M*2,[156,140,124,110,96,84,72],'800',110), lh=Math.round(b.size*1.22), sb=sc.sub?niceFit(ctx,sc.sub,VW-M*2,[64,58,52,46,42],'600',46):null, lh2=sb?Math.round(sb.size*1.45):0;
    var total=lh*b.lines.length+(sb?44+lh2*sb.lines.length:0), y=Math.max(600,Math.round((VH-total)/2)-60);
    if(!dark){ ctx.fillStyle=col; ctx.fillRect(M,y-70,120,14); }
    ctx.fillStyle=dark?'#fff':'#191F28'; ctx.font='800 '+b.size+'px '+F; lines(ctx,b.lines,M,y,lh); y+=lh*b.lines.length+44;
    if(sb){ ctx.fillStyle=dark?'rgba(255,255,255,.9)':'#4E5968'; ctx.font='600 '+sb.size+'px '+F; lines(ctx,sb.lines,M,y,lh2); }
    return cv; }
  // 쇼츠 대본("1. (0~3초) 화면: … | 말: … | 자막: …")을 장면으로 나누고, 장면마다 스토리보드 그림(세로)을 그린다
  // 쇼츠 대본 읽기. 두 가지 꼴을 다 받는다: 한 줄 꼴 "1. (0~3초) 화면: … | 말: … | 자막: …" 과, 번호 줄 아래에 "화면: / 디자인: / 말: / 자막:" 을 한 줄씩 적은 꼴.
  // 자막 안의 <노란색>단어</노란색> 는 그 단어만 강조색으로 그린다
  function shScenes(script){ var out=[], cur=null, K={'화면':'shot','디자인':'design','말':'say','자막':'cap','글자':'words'};
    function feed(t,head){ String(t||'').split(/\s*\|\s*/).forEach(function(p){ var q=p.match(/^\s*(화면|디자인|말|자막|글자)\s*[:：]\s*(.*)$/); if(q) cur[K[q[1]]]=q[2].trim(); else if(head&&!cur.shot&&p.trim()) cur.shot=p.trim(); }); }
    String(script||'').replace(/\r/g,'').split('\n').forEach(function(l){ var m=l.match(/^\s*(\d+)\s*[.)]\s*(?:\(([^)]*)\))?\s*(.*)$/);
      if(m&&(m[2]||/(화면|말|자막)\s*[:：]/.test(m[3]))){ cur={n:m[1],time:(m[2]||'').trim(),shot:'',design:'',say:'',cap:'',words:''}; out.push(cur); feed(m[3],true); return; }
      if(cur&&/^\s*(화면|디자인|말|자막|글자)\s*[:：]/.test(l)) feed(l,false); });
    out.forEach(function(o){ var h=o.cap.match(/<\s*(노란색|강조)\s*>([^<]*)<\s*\/\s*(노란색|강조)\s*>/); o.hi=h?h[2].trim():''; o.cap=o.cap.replace(/<[^>]*>/g,'').replace(/\s+/g,' ').trim(); o.chips=chipList(o); });
    return out.filter(function(o){ return o.shot||o.say||o.cap; }).slice(0,10); }
  // 채널 글자 칩: 앱 로고는 그리지 않고, 채널 이름을 그 채널 색 칩으로 띄운다. "글자: 인스타 · 스레드 · 틱톡" 줄이 있으면 그대로, 없으면 화면 설명에 채널 이름이 셋 이상 나올 때 나온 순서대로 만든다
  var CHIPC=[['인스타그램','#E1306C'],['인스타','#E1306C'],['스레드','#000000'],['틱톡','#010101'],['네이버 블로그','#03C75A'],['블로그','#03C75A'],['당근','#FF6F0F'],['유튜브','#FF0000'],['카카오톡','#FEE500'],['카카오','#FEE500'],['페이스북','#1877F2'],['네이버','#03C75A']];
  function chColor(t){ for(var i=0;i<CHIPC.length;i++) if(t.indexOf(CHIPC[i][0])>=0) return CHIPC[i][1]; return ''; }
  function chipList(o){ var L=[]; if(o.words){ L=o.words.split(/\s*[·,，、\/]\s*/).map(function(t){return t.replace(/<[^>]*>/g,'').trim();}).filter(Boolean).slice(0,6); }
    else { var t=o.shot||'', hit=[]; CHIPC.forEach(function(c){ var i=t.indexOf(c[0]); if(i>=0&&!hit.some(function(h){ return h.i===i||h.c===c[1]; })) hit.push({i:i,t:c[0],c:c[1]}); }); if(hit.length>=3) L=hit.sort(function(a,b){return a.i-b.i;}).map(function(h){return h.t;}).slice(0,6); }
    return L.map(function(t){ return {t:t,c:chColor(t)}; }); }
  // 칩을 화면 가운데 위쪽에 세로로 쌓는다. p(0~1)는 장면 안에서 흐른 정도: 하나씩 차례로 나타난다. p 가 없으면 전부 보인다
  function chipsDraw(ctx,W,H,chips,p,top){ if(!chips||!chips.length) return;   // top: 출연자가 보이는 장면에서는 얼굴을 가리지 않게 화면 맨 위쪽에 작게 둔다
    var n=chips.length, z=Math.round(W*(top?0.058:n>4?0.07:0.08)); ctx.save(); ctx.font='800 '+z+'px '+F; var mw=0; chips.forEach(function(c){ mw=Math.max(mw,ctx.measureText(c.t).width+z*1.5); }); ctx.restore(); if(mw>W*0.88) z=Math.max(Math.round(W*0.04),Math.floor(z*W*0.88/mw));   // 긴 글자는 화면 폭에 맞게 줄인다
    var ph=Math.round(z*1.75), gap=Math.round(z*0.42), total=n*ph+(n-1)*gap, y0=top?H*0.075:H*0.36-total/2;
    ctx.save(); ctx.font='800 '+z+'px '+F; ctx.textAlign='center'; ctx.textBaseline='middle';
    chips.forEach(function(c,i){ var k=p==null?1:Math.max(0,Math.min(1,(p-(i*0.7/n))/0.06)); if(k<=0) return; var w=ctx.measureText(c.t).width+z*1.5, sc=0.82+0.18*k, cy=y0+i*(ph+gap)+ph/2, dark=c.c==='#FEE500';
      ctx.save(); ctx.globalAlpha=k; ctx.translate(W/2,cy); ctx.scale(sc,sc); ctx.shadowColor='rgba(0,0,0,.35)'; ctx.shadowBlur=z*0.3; ctx.shadowOffsetY=z*0.08; ctx.fillStyle=c.c||'rgba(255,255,255,.96)'; rr(ctx,-w/2,-ph/2,w,ph,ph/2); ctx.fill(); ctx.shadowColor='transparent';
      if(c.c==='#000000'||c.c==='#010101'){ ctx.strokeStyle='rgba(255,255,255,.85)'; ctx.lineWidth=Math.max(2,z*0.05); rr(ctx,-w/2,-ph/2,w,ph,ph/2); ctx.stroke(); }
      if(c.c==='#010101'){ var d=Math.max(2,z*0.045); ctx.fillStyle='#25F4EE'; ctx.fillText(c.t,-d,z*0.04-d*0.5); ctx.fillStyle='#FE2C55'; ctx.fillText(c.t,d,z*0.04+d*0.5); }   // 틱톡: 검은 바탕에 청록·빨강이 살짝 어긋난 흰 글씨
      ctx.fillStyle=(!c.c||dark)?'#191F28':'#fff'; ctx.fillText(c.t,0,z*0.04); ctx.restore(); });
    ctx.restore(); }
  // 자막 모양: 대본이 "검은 … 바"를 말하면 검은 반투명 바 위 흰 글씨, 아니면 검은 테두리 흰 글씨. 강조색은 대본에 적힌 #색, 없으면 노랑
  function capStyle(script){ var t=String(script||''), c=t.match(/#([0-9a-fA-F]{6})\b/); return {bar:/검은[^.\n]{0,14}(바|띠|바탕)/.test(t), hi:c?'#'+c[1]:'#FFD600'}; }
  function capLine(ctx,text,hi,cx,y,st,stroke){ var i=hi?text.indexOf(hi):-1, parts=i<0?[[text,0]]:[[text.slice(0,i),0],[hi,1],[text.slice(i+hi.length),0]], w=ctx.measureText(text).width, x=cx-w/2; ctx.textAlign='left';
    parts.forEach(function(p){ if(!p[0]) return; if(stroke) ctx.strokeText(p[0],x,y); x+=ctx.measureText(p[0]).width; }); x=cx-w/2;
    parts.forEach(function(p){ if(!p[0]) return; ctx.fillStyle=p[1]?st.hi:'#fff'; ctx.fillText(p[0],x,y); x+=ctx.measureText(p[0]).width; }); }
  // 화면 폭 W, 가운데 높이 cy 에 자막을 그린다(완성 영상과 스토리보드가 같은 함수를 쓴다)
  function capDraw(ctx,W,cy,cap,hi,st,alpha,cache){ if(!cap) return; var L=cache&&cache[cap]; if(!L){ var z=Math.round(W*(st.bar?0.074:0.088)); L=niceFit(ctx,cap,W*(st.bar?0.8:0.84),[z,Math.round(z*0.9),Math.round(z*0.8),Math.round(z*0.7),Math.round(z*0.6)],'800',Math.round(z*0.8)); if(cache) cache[cap]=L; }
    var lh=Math.round(L.size*1.3), y=cy-(L.lines.length-1)*lh/2; ctx.save(); ctx.globalAlpha=alpha==null?1:alpha; ctx.font='800 '+L.size+'px '+F; ctx.textBaseline='middle';
    if(st.bar){ var bh=lh*L.lines.length+Math.round(L.size*0.7); ctx.fillStyle='rgba(0,0,0,.62)'; ctx.fillRect(0,cy-bh/2,W,bh); L.lines.forEach(function(t,i){ capLine(ctx,t,hi,W/2,y+i*lh,st,false); }); }
    else { ctx.lineJoin='round'; ctx.lineWidth=Math.max(6,L.size*0.2); ctx.strokeStyle='rgba(0,0,0,.92)'; L.lines.forEach(function(t,i){ capLine(ctx,t,hi,W/2,y+i*lh,st,true); }); }
    ctx.restore(); }
  // 글자 스토리보드 한 장: 휴대폰 화면처럼 그린다. 화면·디자인 메모는 가운데, 자막은 완성 영상과 같은 자리·같은 모양으로, 말은 맨 아래
  function shDraw(sc,i,n,o){ var VW=1080,VH=1920, cv=document.createElement('canvas'); cv.width=VW; cv.height=VH; var ctx=cv.getContext('2d'), col=hex(o.color), M=80, st=o.style||{bar:false,hi:'#FFD600'};
    ctx.fillStyle='#14171C'; ctx.fillRect(0,0,VW,VH); ctx.textBaseline='top';
    ctx.fillStyle=col; rr(ctx,M,110,150,84,42); ctx.fill(); ctx.fillStyle='#fff'; ctx.font='800 46px '+F; ctx.textAlign='center'; ctx.fillText((i+1)+' / '+n,M+75,128); ctx.textAlign='left';
    if(sc.time){ ctx.fillStyle='rgba(255,255,255,.7)'; ctx.font='600 42px '+F; ctx.fillText(sc.time,M+180,130); }
    ctx.strokeStyle='rgba(255,255,255,.22)'; ctx.lineWidth=4; ctx.setLineDash([18,14]); rr(ctx,M,240,VW-M*2,900,36); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle='rgba(255,255,255,.55)'; ctx.font='700 34px '+F; ctx.fillText('화면',M+40,272);
    var w=wordFit(ctx,sc.shot||'(화면 설명 없음)',VW-M*2-80,7,[54,48,44,40,36],'600'), lh=Math.round(w.size*1.42), y=330; ctx.fillStyle='#fff'; ctx.font='600 '+w.size+'px '+F; lines(ctx,w.lines.slice(0,7),M+40,y,lh); y+=lh*Math.min(7,w.lines.length)+34;
    if(sc.design&&y<960){ ctx.fillStyle=st.hi; ctx.font='700 34px '+F; ctx.fillText('디자인',M+40,y); y+=52; var d=wordFit(ctx,sc.design,VW-M*2-80,5,[40,36,32],'500'), dl=Math.round(d.size*1.45), mx=Math.max(1,Math.floor((1120-y)/dl)); ctx.fillStyle='rgba(255,255,255,.82)'; ctx.font='500 '+d.size+'px '+F; lines(ctx,d.lines.slice(0,mx),M+40,y,dl); }
    if(sc.chips&&sc.chips.length){ ctx.fillStyle='rgba(20,23,28,.86)'; rr(ctx,M+6,246,VW-M*2-12,888,32); ctx.fill(); chipsDraw(ctx,VW,VH,sc.chips,null); }
    capDraw(ctx,VW,VH*0.77,sc.cap,sc.hi,st,1,null); ctx.textAlign='left'; ctx.textBaseline='top';
    if(sc.say){ ctx.fillStyle='rgba(255,255,255,.55)'; ctx.font='700 34px '+F; ctx.fillText('말',M,1610); var sy=wordFit(ctx,'“'+sc.say+'”',VW-M*2,5,[50,46,42,38],'500'); ctx.fillStyle='rgba(255,255,255,.92)'; ctx.font='500 '+sy.size+'px '+F; lines(ctx,sy.lines.slice(0,4),M,1660,Math.round(sy.size*1.45)); }
    return cv; }
  window.lfCards={ parse:parse,
    caption:caption, capTimes:capTimes,
    shScenes:shScenes, capStyle:capStyle, shBoard:function(script,o){ var S=shScenes(script), st=capStyle(script); o=o||{}; o.style=st; return S.map(function(s,i){ return shDraw(s,i,S.length,o); }); },
    ttScenes:ttScenes, ttFrames:function(text,o){ var S=ttScenes(text); if(S.length<3) return []; return S.map(function(s,i){ return ttDraw(s,i,S.length,o||{}); }); },
    daangn:dgParts, daangnBanner:dgBanner,
    video:video,
    // 블로그 글 안의 "[그림1: 큰 글 | 작은 글]" 줄이 있으면 그 줄대로 블로그 전용 그림을 만든다. 없으면 카드 가운데 장으로 대신한다.
    blog:function(pages,o){ o=o||{}; var P=parse(pages); if(P.length<2) return Promise.resolve([]); var mid=P.slice(1,P.length>2?P.length-1:P.length).slice(0,4);
      var bt=String(o.blogText||''), own=[], re=/\[그림\s*\d+\s*[:：]\s*([^\]\n]+)\]/g, mm; while((mm=re.exec(bt))&&own.length<4){ own.push({label:'',text:mm[1].trim()}); }
      if(own.length>=2) mid=own; var tm=bt.match(/^\s*제목\s*[:：]\s*(.+)$/m); if(tm) o=Object.assign({},o,{title:tm[1].trim()});
      return [blogThumb(P,o)].concat(mid.map(function(p,i){ return blogBody(p,i,o); })); },
    profile:function(o){ var ready=document.fonts&&document.fonts.load?document.fonts.load("800 160px 'Gothic A1'").catch(function(){}):Promise.resolve(); return ready.then(function(){ return profile(o||{}); }); },
    // 채널 로고(대표님이 준 파일 그대로)를 한 번 읽어 둔다. 못 읽은 것은 빼고 글자만 쓴다.
    logos:function(base){ var out={}; return Promise.all(CH.concat([[null,'logo.svg']]).map(function(x){ return new Promise(function(res){ var im=new Image(); im.onload=function(){ out[x[1]]=im; res(); }; im.onerror=function(){ res(); }; im.src=(base||'icons/')+x[1]; }); })).then(function(){ return out; }); },
    load:function(mime,b64){ return new Promise(function(res,rej){ var im=new Image(); im.onload=function(){res(im);}; im.onerror=function(){rej(new Error('사진을 읽지 못했어요.'));}; im.src='data:'+(mime||'image/jpeg')+';base64,'+b64; }); },
    render:function(pages,o){ var P=parse(pages); if(P.length<2) return Promise.reject(new Error('장별 문구가 없어 카드를 만들 수 없어요.'));
      var ready=document.fonts&&document.fonts.load?Promise.all([document.fonts.load("800 80px 'Gothic A1'"),document.fonts.load("600 36px 'Gothic A1'"),document.fonts.load("700 38px 'Gothic A1'")]).catch(function(){}):Promise.resolve();
      return ready.then(function(){ var L=P.slice(0,9).map(function(p,i){ return draw(p,i,Math.min(P.length,9),o||{}); }); if(!o||o.credit!==false) L.push(credit(o||{})); return L; }); } };
})();
