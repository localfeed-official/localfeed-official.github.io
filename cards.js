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
  function shScenes(script){ return String(script||'').split('\n').map(function(l){ var m=l.match(/^\s*(\d+)\s*[.)]\s*(?:\(([^)]*)\))?\s*(.+)$/); if(!m) return null; var o={n:m[1],time:(m[2]||'').trim(),shot:'',say:'',cap:''};
      m[3].split(/\s*\|\s*/).forEach(function(p){ var q=p.match(/^(화면|말|자막)\s*[:：]\s*(.*)$/); if(q) o[{'화면':'shot','말':'say','자막':'cap'}[q[1]]]=q[2].trim(); else if(!o.shot) o.shot=p.trim(); }); return (o.shot||o.say||o.cap)?o:null; }).filter(Boolean).slice(0,10); }
  function shDraw(sc,i,n,o){ var VW=1080,VH=1920, cv=document.createElement('canvas'); cv.width=VW; cv.height=VH; var ctx=cv.getContext('2d'), col=hex(o.color), M=80;
    ctx.fillStyle='#14171C'; ctx.fillRect(0,0,VW,VH); ctx.textBaseline='top';
    // 위: 장면 번호와 시간
    ctx.fillStyle=col; rr(ctx,M,150,150,84,42); ctx.fill(); ctx.fillStyle='#fff'; ctx.font='800 46px '+F; ctx.textAlign='center'; ctx.fillText((i+1)+' / '+n,M+75,168); ctx.textAlign='left';
    if(sc.time){ ctx.fillStyle='rgba(255,255,255,.7)'; ctx.font='600 42px '+F; ctx.fillText(sc.time,M+180,170); }
    // 가운데: 화면 설명(촬영 메모)
    ctx.strokeStyle='rgba(255,255,255,.22)'; ctx.lineWidth=4; ctx.setLineDash([18,14]); rr(ctx,M,300,VW-M*2,760,36); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle='rgba(255,255,255,.55)'; ctx.font='700 36px '+F; ctx.fillText('화면',M+40,336);
    var w=wordFit(ctx,sc.shot||'(화면 설명 없음)',VW-M*2-80,8,[60,54,48,42],'600'); ctx.fillStyle='#fff'; ctx.font='600 '+w.size+'px '+F; lines(ctx,w.lines,M+40,410,Math.round(w.size*1.45));
    // 아래: 자막(크게)과 말
    var y=1130; if(sc.cap){ var cp=niceFit(ctx,sc.cap,VW-M*2-60,[104,92,80,70,60],'800',80), lh=Math.round(cp.size*1.22), bh=lh*cp.lines.length+56; ctx.fillStyle=col; rr(ctx,M,y,VW-M*2,bh,30); ctx.fill(); ctx.fillStyle='#fff'; ctx.font='800 '+cp.size+'px '+F; lines(ctx,cp.lines,M+30,y+30,lh); y+=bh+40; }
    if(sc.say){ ctx.fillStyle='rgba(255,255,255,.55)'; ctx.font='700 36px '+F; ctx.fillText('말',M,y); y+=58; var sy=wordFit(ctx,'“'+sc.say+'”',VW-M*2,7,[54,48,44,40],'500'); ctx.fillStyle='rgba(255,255,255,.92)'; ctx.font='500 '+sy.size+'px '+F; lines(ctx,sy.lines.slice(0,7),M,y,Math.round(sy.size*1.5)); }
    return cv; }
  window.lfCards={ parse:parse,
    shScenes:shScenes, shBoard:function(script,o){ var S=shScenes(script); return S.map(function(s,i){ return shDraw(s,i,S.length,o||{}); }); },
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
