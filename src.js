// Dynamic Niconico-like status image. No dependencies beyond Cloudflare Workers Assets.
// The large base.svg contains already embedded fonts and is served as a static asset.
const XML = value => String(value ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&apos;');
const cut = (value,max=200) => Array.from(String(value ?? '')).slice(0,max).join('');
const num = (s,def) => s===null || s==='' ? def : (Number.isFinite(Number(s)) ? Math.round(Math.min(100,Math.max(0,Number(s)))) : def);
// Approximate glyph widths (Korean full-width, Latin roughly half width), no browser DOM in Worker.
function wrap(value,width){
  let result=[],line='',units=0;
  for(const ch of Array.from(String(value))){
    if(ch==='\n'){result.push(line);line='';units=0;continue;}
    const advance=/[\x00-\x7f]/.test(ch)?0.53:1;
    if(line&&units+advance>width){result.push(line);line='';units=0;}
    line+=ch;units+=advance;
  }
  result.push(line);
  return result;
}
function fillStat(x,y,label,value,color){
 let s=`<rect x="${x}" y="${y}" width="154" height="46" fill="#d7d7d7"/><text x="${x+77}" y="${y+34}" class="stateLabel" text-anchor="middle">${XML(label)}</text>`;
 const bx=x+178, by=y+13,bw=295,bh=20;
 s+=`<rect x="${bx}" y="${by}" width="${bw}" height="${bh}" fill="#161616" stroke="#999"/>`;
 if(value!==null)s+=`<rect x="${bx+1}" y="${by+1}" width="${Math.max(0,bw*value/100-2)}" height="${bh-2}" fill="${color}"/><text x="${bx+bw+24}" y="${y+35}" class="statValue">${value}</text>`;
 for(let i=1;i<10;i++)s+=`<path d="M${bx+bw*i/10} ${by}v${bh}" stroke="#575757"/>`;
 return s;
}
function render(p){
 const blank=p.get('blank')==='1';
 // Blank by default: values appear only when supplied in the URL.
 const get=(key,def='',max=200)=>blank?'':cut(p.get(key)??def,max);
 const date=get('date','',30),time=get('time','',15);
 const fields=[
  ['장소',get('loc','',200)],
  ['진행',get('stage','',180)],
  ['선배 의상',get('outfit','',200)],
  ['현 상황',get('situation','',350)],
  ['겉태도',get('mood','',200)]
 ];
 const stats=[['기세',blank?null:(p.has('heat')?num(p.get('heat'),0):null),'#d65252'],['평정',blank?null:(p.has('calm')?num(p.get('calm'),0):null),'#4f7dd8'],['의미심장',blank?null:(p.has('mystery')?num(p.get('mystery'),0):null),'#8a61d6']];
 const mind=get('mind','',1400);
 const options=blank?[]:Array.from({length:10},(_,i)=>p.get('c'+(i+1))).filter(s=>s!==null&&s.trim()!=='').map(s=>cut(s,400));
 // No fabricated default options.
 const vx=38,vy=112,vw=630,cx=684,cw=398,cardX=64,cardW=578;
 let fieldMarkup='',y=178;
 for(const [label,value] of fields){
   const lines=value?wrap(value,17):[];
   const h=56+Math.max(1,lines.length)*43;
   fieldMarkup+=`<rect x="${cardX}" y="${y}" width="${cardW}" height="${h}" fill="#0d0d0d" stroke="#999"/><rect x="${cardX}" y="${y}" width="157" height="45" fill="#d7d7d7"/><text x="${cardX+78}" y="${y+33}" class="stateLabel" text-anchor="middle">${XML(label)}</text>`;
   lines.forEach((line,i)=>{fieldMarkup+=`<text x="${cardX+18}" y="${y+84+i*43}" class="bodyValue">${XML(line)}</text>`;});
   y+=h+13;
 }
 let statMarkup='';
 y+=10;
 stats.forEach(([label,val,color])=>{statMarkup+=fillStat(cardX,y,label,val,color);y+=63;});
 const videoRequired=y+30;
 let choiceMarkup='',choiceY=185;
 options.forEach((choice,i)=>{
   const lines=wrap(choice,10.1);
   choiceMarkup+=`<path d="M696 ${choiceY-13}H1070" stroke="#ddd"/><text x="700" y="${choiceY+25}" class="optText">${i+1}.</text>`;
   lines.forEach((line,j)=>{choiceMarkup+=`<text x="744" y="${choiceY+25+j*43}" class="optText">${XML(line)}</text>`;});
   choiceY+=38+lines.length*43+17;
 });
 // Extend BOTH sides and shift controls/description down, rather than cropping long text.
 const videoBottom=Math.max(985,videoRequired,choiceY+30);
 const controlsY=videoBottom+17;
 const mindY=controlsY+66;
 const mindLines=mind?wrap(mind,30.5):[];
 const mindH=Math.max(220,100+mindLines.length*46);
 const totalH=mindY+mindH+26;
 let s=`<rect width="1120" height="${totalH}" fill="#f2f2f2"/><rect width="1120" height="82" fill="#e6e6e6" stroke="#bbb"/><text x="24" y="54" class="titleJp">真夏の夜の記録</text>`;
 s+=`<text x="762" y="27" class="uiJP">投稿日</text><text x="762" y="67" class="mainNumber">${XML(date)}</text><text x="954" y="27" class="uiJP">時刻</text><text x="954" y="67" class="mainNumber">${XML(time)}</text>`;
 s+=`<rect x="24" y="98" width="1072" height="${videoBottom-98+13}" fill="#f9f9f9" stroke="#aaa"/><rect x="38" y="112" width="630" height="${videoBottom-112}" fill="#090909"/><rect x="684" y="112" width="398" height="${videoBottom-112}" fill="#fff" stroke="#bbb"/>`;
 s+=`<rect x="38" y="112" width="630" height="38" fill="#111"/><text x="52" y="139" class="videoID">sm114514</text>`;
 // The translucent niconico danmaku text is behind the cards.
 s+=`<text x="220" y="270" style="font-family:MabiEmbed,sans-serif;font-size:83px;fill:white;opacity:.12">114514</text>`;
 s+=fieldMarkup+statMarkup;
 s+=`<rect x="684" y="112" width="398" height="54" fill="#ececec" stroke="#bbb"/><text x="701" y="148" class="uiJP" style="font-size:24px;fill:#333">コメント</text>`+choiceMarkup;
 s+=`<rect x="0" y="${controlsY}" width="1120" height="52" fill="#e8e8e8" stroke="#bbb"/><circle cx="50" cy="${controlsY+26}" r="12" fill="#fff" stroke="#999"/><path d="M46 ${controlsY+18}v16l13 -8z" fill="#888"/><rect x="84" y="${controlsY+22}" width="746" height="10" fill="#ccc"/><rect x="84" y="${controlsY+22}" width="220" height="10" fill="#888"/><circle cx="304" cy="${controlsY+27}" r="7" fill="#fff" stroke="#888"/>`;
 s+=`<text x="847" y="${controlsY+34}" class="tinyInput">コメント入力</text><rect x="962" y="${controlsY+13}" width="133" height="26" fill="#fff" stroke="#aaa"/>`;
 s+=`<rect x="24" y="${mindY}" width="1072" height="${mindH}" fill="#f9f9f9" stroke="#ccc"/><text x="48" y="${mindY+47}" class="mindTitle">속마음</text><path d="M44 ${mindY+61}H1075" stroke="#d6d6d6"/>`;
 mindLines.forEach((line,i)=>s+=`<text x="48" y="${mindY+105+i*46}" class="mindBody">${XML(line)}</text>`);
 return {markup:s,height:totalH};
}
export default {
 async fetch(request,env){
  const url=new URL(request.url);
  if(url.pathname==='/' )return new Response('야수선배 상태창: /status?heat=72&loc=옥상', {headers:{'content-type':'text/plain;charset=utf-8'}});
  if(url.pathname!=='/status')return new Response('Not found',{status:404});
  try{
   const assetURL=new URL('/base.svg',url.origin);
   const baseResponse=await env.ASSETS.fetch(new Request(assetURL.toString()));
   if(!baseResponse.ok)throw Error('base.svg asset missing: '+baseResponse.status);
   const base=await baseResponse.text();
   const {markup,height}=render(url.searchParams);
   const svg=base.replace('width="1120" height="1360" viewBox="0 0 1120 1360"',`width="1120" height="${height}" viewBox="0 0 1120 ${height}"`).replace('<!--DYNAMIC-->',markup);
   return new Response(svg,{headers:{'content-type':'image/svg+xml;charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'}});
  }catch(err){return new Response('SVG render error: '+String(err),{status:500});}
 }
};
