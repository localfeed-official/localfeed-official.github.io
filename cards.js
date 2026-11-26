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
  function fit(ctx,text,maxW,maxLines,sizes,weight){ for(var i=0;i<sizes.length;i++){ ctx.font=weight+' '+sizes[i]+'px '+F; var L=wrap(ctx,text,maxW); if(L.length<=maxLines) return {size:sizes[i],lines:L}; } ctx.font=weight+' '+sizes[sizes.length-1]+'px '+F; return {size:sizes[sizes.length-1],lines:wrap(ctx,text,maxW).slice(0,maxLines)}; }
  function rr(ctx,x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
  function hex(c){ return /^#[0-9a-f]{6}$/i.test(String(c||'').trim())?String(c).trim():'#2B64F5'; }
  function soft(c){ var n=parseInt(c.slice(1),16),r=n>>16,g=(n>>8)&255,b=n&255,m=function(v){return Math.round(v+(255-v)*0.9);}; return 'rgb('+m(r)+','+m(g)+','+m(b)+')'; }
  function lines(ctx,L,x,y,lh){ L.forEach(function(t,i){ ctx.fillText(t,x,y+i*lh); }); }
  function draw(p,i,n,o){
    var cv=document.createElement('canvas'); cv.width=W; cv.height=H; var ctx=cv.getContext('2d'), col=hex(o.color), first=i===0, last=i===n-1&&n>1, M=96;
    ctx.textBaseline='top';
    if(first||last){
      ctx.fillStyle=col; ctx.fillRect(0,0,W,H);
      ctx.fillStyle='rgba(255,255,255,.14)'; ctx.beginPath(); ctx.arc(W-40,H-80,330,0,7); ctx.fill(); ctx.beginPath(); ctx.arc(W-250,H+90,230,0,7); ctx.fill();
      ctx.fillStyle='rgba(255,255,255,.92)'; ctx.font='700 38px '+F; ctx.fillText(o.name||'',M,M);
      ctx.fillStyle='#fff';
      if(first){ var t=fit(ctx,p.text,W-M*2,5,[120,106,94,82,70],'800'), lh=Math.round(t.size*1.3); lines(ctx,t.lines,M,Math.max(240,Math.round((H-lh*t.lines.length)/2)-60),lh);
        ctx.font='600 36px '+F; ctx.fillStyle='rgba(255,255,255,.9)'; ctx.fillText('옆으로 넘겨 보세요  →',M,H-M-40); }
      else { var t2=fit(ctx,p.text,W-M*2,7,[84,74,64,56,48],'800'), lh2=Math.round(t2.size*1.4); lines(ctx,t2.lines,M,Math.max(240,Math.round((H-lh2*t2.lines.length)/2)-60),lh2);
        if(o.insta){ ctx.font='600 36px '+F; ctx.fillStyle='rgba(255,255,255,.9)'; ctx.fillText('@'+String(o.insta).replace(/^@/,''),M,H-M-40); } }
    } else {
      ctx.fillStyle='#F2F4F6'; ctx.fillRect(0,0,W,H);
      ctx.fillStyle='#fff'; rr(ctx,56,56,W-112,H-112,56); ctx.fill();
      ctx.font='800 300px '+F; ctx.fillStyle=soft(col); ctx.textAlign='right'; ctx.fillText(('0'+(i+1)).slice(-2),W-M-10,H-M-380); ctx.textAlign='left';
      var y=150;
      if(p.label){ ctx.font='800 40px '+F; var lw=ctx.measureText(p.label).width+56; ctx.fillStyle=soft(col); rr(ctx,M+20,y,lw,78,24); ctx.fill(); ctx.fillStyle=col; ctx.fillText(p.label,M+48,y+18); y+=150; }
      else y+=40;
      ctx.fillStyle='#191F28'; var b=fit(ctx,p.text,W-(M+20)*2,8,[92,82,72,64,56,48],'800'), lh3=Math.round(b.size*1.42), top=Math.max(y,Math.round((H-lh3*b.lines.length)/2)-70); lines(ctx,b.lines,M+20,top,lh3);
      ctx.font='600 32px '+F; ctx.fillStyle='#8B95A1'; ctx.fillText(o.name||'',M+20,H-M-76);
      ctx.textAlign='right'; ctx.fillText((i+1)+' / '+n,W-M-20,H-M-76); ctx.textAlign='left';
    }
    return cv;
  }
  window.lfCards={ parse:parse,
    render:function(pages,o){ var P=parse(pages); if(P.length<2) return Promise.reject(new Error('장별 문구가 없어 카드를 만들 수 없어요.'));
      var ready=document.fonts&&document.fonts.load?Promise.all([document.fonts.load("800 80px 'Gothic A1'"),document.fonts.load("600 36px 'Gothic A1'"),document.fonts.load("700 38px 'Gothic A1'")]).catch(function(){}):Promise.resolve();
      return ready.then(function(){ return P.slice(0,10).map(function(p,i){ return draw(p,i,Math.min(P.length,10),o||{}); }); }); } };
})();
