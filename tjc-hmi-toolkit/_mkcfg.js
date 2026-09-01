var fs=require('fs');
var cfg=require('./C4F7N/config_c4f7n.json');
// build single-control test configs: text / btn53 / num / prog / wave / slider
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
mk('_t1','text','p0t',{x:20,y:18,w:200,h:30,font:0,txt:'C4F7N 便携式检漏仪',bco:2212,pco:59230});
mk('_t2','btn53','p0b',{x:20,y:18,w:108,h:28,font:0,txt:'按钮测试',bco:4359,pco:9771});
mk('_t3','num','p0n',{x:40,y:168,w:440,h:130,font:0,bco:2212,pco:59230,vvs:2,val:0});
mk('_t4','prog','p0s',{x:40,y:470,w:440,h:8,bco:2212,pco:9771,val:0});
console.log('all single-control cfgs written');