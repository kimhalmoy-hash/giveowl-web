/* GiveOwl page-view counter: anonymous, aggregated, no cookies, no storage, no identifiers. See /privacy/. */
(function(){try{var n=navigator,l=location,d=document;
if(n.webdriver||l.hostname!=='giveowl.com'||l.protocol!=='https:'||/bot|crawl|spider|headless|lighthouse|preview/i.test(n.userAgent||''))return;
var s=d.currentScript,e404=s&&s.getAttribute('data-s')==='404';
var u="https://giveowl-teller.kimhalmoy-6c0526.workers.dev/hit";
function send(t){var r='';try{r=d.referrer?new URL(d.referrer).hostname:'';}catch(x){}
var b=JSON.stringify({p:(e404?'/404':'')+l.pathname,r:r,t:t});
if(n.sendBeacon&&n.sendBeacon(u,new Blob([b],{type:'text/plain'})))return;
if(window.fetch)fetch(u,{method:'POST',body:b,keepalive:true,mode:'no-cors',credentials:'omit'}).catch(function(){});}
function start(){send('load');var acc=0,t0=0,sent=false,iv;
function vis(){return d.visibilityState==='visible'}
function now(){return Date.now()}
function elapsed(){return acc+(t0&&vis()?now()-t0:0)}
function mark(){t0=vis()?now():0}
function pause(){if(t0){acc+=now()-t0;t0=0}}
function done(){if(sent||!vis())return;sent=true;clearInterval(iv);d.removeEventListener('visibilitychange',onV);send('engasjert')}
function onV(){if(vis())mark();else pause();if(elapsed()>=3000)done()}
function onA(e){if(e&&e.isTrusted===false)return;done()}
if(vis())mark();
iv=setInterval(function(){if(elapsed()>=3000)done();if(sent)clearInterval(iv)},500);
d.addEventListener('visibilitychange',onV);
d.addEventListener('scroll',onA,{passive:true,once:true});
d.addEventListener('click',onA,{once:true});
d.addEventListener('touchstart',onA,{passive:true,once:true});
d.addEventListener('keydown',onA,{once:true});}
if(d.prerendering)d.addEventListener('prerenderingchange',start,{once:true});else start();}catch(x){}})();
