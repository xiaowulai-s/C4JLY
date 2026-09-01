var fs = require('fs');
var c = JSON.parse(fs.readFileSync('C4F7N/config_c4f7n.json', 'utf8'));

// Transform TJC scripts: if/endif → if/{} (TJC syntax: if(cond){...} no endif)
// For if/else: rewrite into two reverse-order if blocks
c.pages.forEach(function (pg) {
  (pg.widgets || []).forEach(function (w) {
    if (!w.codes) return;
    Object.keys(w.codes).forEach(function (k) {
      var lines = w.codes[k].split('\n').map(function (l) { return l.trim(); }).filter(Boolean);
      var out = [];
      var i = 0;
      while (i < lines.length) {
        var l = lines[i];
        var m = l.match(/^if\((.+)\)$/);
        if (m) {
          var cond = m[1];
          // find endif
          var endIdx = -1, elseIdx = -1;
          for (var j = i + 1; j < lines.length; j++) {
            if (lines[j] === 'endif') { endIdx = j; break; }
            if (lines[j] === 'else') { elseIdx = j; }
          }
          if (endIdx < 0) { out.push(l); i++; continue; } // malformed
          if (elseIdx >= 0) {
            // if/else case: write two reverse-order if blocks (TJC has no else)
            var stmts1 = lines.slice(i + 1, elseIdx);
            var stmts2 = lines.slice(elseIdx + 1, endIdx);
            // First if: else branch (reverse condition)
            out.push('if(' + cond + ')');
            out.push('{');
            stmts1.forEach(function (s) { out.push(s); });
            out.push('}');
            // Second if: else branch - use the negation
            // TJC != is not reliable; use val==0/val==1 approach
            // For u.val==0: u.val==1 is the else
            // For bb.val==0: bb.val==1 is the else
            // We'll just use the same condition for the second block and rely on
            // the flag being already set by the first block.
            // BUT: we need the second block to NOT fire when the first does.
            // Reverse order check: check else branch first, then if branch
            // Actually, restructure: 
            // if(cond) { stmts1 }  — this sets a flag
            // if(!cond) { stmts2 } — this checks opposites
            // Since TJC might not support !=, we check for the opposite state
            // For u.val (0/1 toggle): check if(u.val==0) for one, if(u.val==1) for other
            // But we need to avoid double-fire. 
            // Strategy: check the else branch FIRST (reverse order)
            out = []; // restart
            // else branch first (reverse check)
            if (/\.val==0/.test(cond)) {
              // cond is X.val==0, else branch (X.val==1) check first
              var objpart = cond.replace('==0', '');
              out.push('if(' + objpart + '==1)');
              out.push('{');
              stmts2.forEach(function (s) { out.push(s); });
              out.push('}');
              out.push('if(' + cond + ')');
              out.push('{');
              stmts1.forEach(function (s) { out.push(s); });
              out.push('}');
            } else {
              // generic fallback: just use the condition as-is
              out.push('if(' + cond + ')');
              out.push('{');
              stmts1.forEach(function (s) { out.push(s); });
              out.push('}');
              out.push('if(' + cond + ')');
              out.push('{');
              stmts2.forEach(function (s) { out.push(s); });
              out.push('}');
            }
          } else {
            // simple if (no else)
            out.push('if(' + cond + ')');
            out.push('{');
            for (var j2 = i + 1; j2 < endIdx; j2++) out.push(lines[j2]);
            out.push('}');
          }
          i = endIdx + 1;
        } else {
          out.push(l);
          i++;
        }
      }
      w.codes[k] = out.join('\n');
    });
  });
});

fs.writeFileSync('C4F7N/config_c4f7n.json', JSON.stringify(c));
console.log('fixed if/endif to if/{}');
// show results
c.pages.forEach(function (pg) {
  (pg.widgets || []).forEach(function (w) {
    if (w.codes) console.log('p' + pg.file + ' ' + w.objname + ' codes:', JSON.stringify(w.codes));
  });
});