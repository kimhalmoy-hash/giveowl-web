/* GiveOwl page-view counter: anonymous, aggregated, no cookies, no storage, no identifiers. See /privacy/. */
(function(){try{var n=navigator,l=location,d=document;
if(n.webdriver||l.hostname!=='giveowl.com'||l.protocol!=='https:'||/bot|crawl|spider|headless|lighthouse|preview/i.test(n.userAgent||''))return;
var s=d.currentScript,e404=s&&s.getAttribute('data-s')==='404';
function send(){var r='';try{r=d.referrer?new URL(d.referrer).hostname:'';}catch(x){}
var b=JSON.stringify({p:(e404?'/404':'')+l.pathname,r:r}),u="https://giveowl-teller.kimhalmoy-6c0526.workers.dev/hit";
if(n.sendBeacon&&n.sendBeacon(u,new Blob([b],{type:'text/plain'})))return;
if(window.fetch)fetch(u,{method:'POST',body:b,keepalive:true,mode:'no-cors',credentials:'omit'}).catch(function(){});}
if(d.prerendering)d.addEventListener('prerenderingchange',send,{once:true});else send();}catch(x){}})();
