db.products.find({}, { title: 1, description: 1 }).forEach(function(p) {
  if (!p.description || p.description.includes('<')) return;

  var lines = p.description.split('\n').filter(function(l) { return l.trim() !== ''; });
  var html = '';
  var inList = false;

  lines.forEach(function(line) {
    line = line.trim();
    if (!line) return;

    var isBullet = /^(Finish:|Build:|Geometry:|Lifestyle:|Capacity:|Weight:|Includes?:|Contents?:|Features?:|Note:|Dimensions:|Material:|Care:|Type:)/i.test(line);
    var isHeader = line.endsWith(':') || /^(Key Highlights|Inside the Bundle|What.s Included|Description|The Full)/i.test(line);

    if (isHeader) {
      if (inList) { html += '</ul>'; inList = false; }
      html += '<p><strong>' + line + '</strong></p>';
    } else if (isBullet) {
      if (!inList) { html += '<ul>'; inList = true; }
      var colonIdx = line.indexOf(':');
      if (colonIdx > 0 && colonIdx < 25) {
        var label = line.substring(0, colonIdx + 1);
        var rest = line.substring(colonIdx + 1).trim();
        html += '<li><strong>' + label + '</strong> ' + rest + '</li>';
      } else {
        html += '<li>' + line + '</li>';
      }
    } else {
      if (inList) { html += '</ul>'; inList = false; }
      html += '<p>' + line + '</p>';
    }
  });

  if (inList) html += '</ul>';

  db.products.updateOne({ _id: p._id }, { $set: { description: html } });
  print('Updated: ' + p.title);
});
print('All done.');
