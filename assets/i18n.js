// Small i18n helper for the giveowl.com pages. English default, Norwegian if the browser prefers it or the user chose it.
(function(){
  function hent(){try{return localStorage.getItem('giveowl.lang');}catch(e){return null;}}
  function lagre(v){try{localStorage.setItem('giveowl.lang',JSON.stringify(v));}catch(e){}}
  var q=new URLSearchParams(location.search);
  var lagret=null; try{lagret=JSON.parse(hent());}catch(e){}
  var l=(navigator.languages&&navigator.languages.length?navigator.languages:[navigator.language||'en']);
  var enhet='en'; for(var i=0;i<l.length;i++){if(/^(nb|nn|no)\b/i.test(l[i])){enhet='nb';break;} if(/^en\b/i.test(l[i])) break;}
  var lang=(q.get('lang')==='nb'||q.get('lang')==='en')?q.get('lang'):(lagret||enhet);
  window.GiveOwlI18n=function(T){
    function tegn(){
      document.documentElement.lang=lang==='nb'?'nb':'en';
      document.querySelectorAll('[data-t]').forEach(function(n){if(n.dataset.en==null)n.dataset.en=n.innerHTML;var k=n.getAttribute('data-t');var v=lang==='en'?null:(T[lang]||{})[k];if(v==null)v=(T.en||{})[k];n.innerHTML=v!=null?v:n.dataset.en;});
      document.querySelectorAll('[data-tp]').forEach(function(n){if(n.dataset.enp==null)n.dataset.enp=n.getAttribute('placeholder')||'';var k=n.getAttribute('data-tp');var v=lang==='en'?null:(T[lang]||{})[k];n.setAttribute('placeholder',v||n.dataset.enp);});
      var b=document.getElementById('sprak'); if(b){b.textContent=lang==='nb'?'EN':'NO';b.setAttribute('aria-label',lang==='nb'?'Switch to English':'Bytt til norsk');}
      if(window.__enTitle==null)window.__enTitle=document.title;document.title=(lang!=='en'&&T[lang]&&T[lang]._title)||window.__enTitle;
      document.dispatchEvent(new CustomEvent('giveowl:lang',{detail:lang}));
    }
    var b=document.getElementById('sprak'); if(b) b.onclick=function(){lang=lang==='nb'?'en':'nb';lagre(lang);tegn();};
    tegn(); return function(){return lang;};
  };
})();
