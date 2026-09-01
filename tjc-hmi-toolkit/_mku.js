var fs=require('fs');
var cfg=require('./C4F7N/config_c4f7n.json');
function mk(f, seed, objname, set, codes){
  var w={seed:seed,objname:objname,set:set};
  if(codes) w.codes=codes;
  var t={template:'C4F7N\\base.HMI',pageSeed:'C4F7N/base_pas/0.pa',seeds:cfg.seeds,pages:[]};
  var p0=JSON.parse(JSON.stringify(cfg.pages[0]));
  p0.widgets=[w];
  t.pages=[p0].concat(cfg.pages.slice(1).map(function(p){return {file:p.file,name:p.name,pageObj:p.pageObj,widgets:[]}}));
  fs.mkdirSync('C4F7N/'+f,{recursive:true});
  fs.writeFileSync('C4F7N/'+f+'_cfg.json',JSON.stringify(t,null,2));
  console.log('wrote '+f);
}
// num WITHOUT vvs
mk('_u1','num','p0n',{x:40,y:168,w:440,h:130,font:0,bco:2212,pco:59230,val:0});
// num WITH vvs but also with txt (like original cc had no txt but config uses vvs2)
mk('_u2','num','p0n',{x:40,y:168,w:440,h:130,font:0,bco:2212,pco:59230,vvs:2,val:0,txt:" "});
// text WITH vvs to isolate
console.log('written u1 num-no-vvs, u2 num-with-vvs');