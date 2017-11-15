Topics = require('./topics');
var fs = require('fs');
var ProgressBar = require('ascii-progress');

var topicCount;
var sentanceCount;

var topicBar;
var sentanceBar;

Topics.on('start', function(event){
    sentanceCount = event.sentances.length;
    sentanceBar = new ProgressBar({
        schema: '[:bar.white] :current/:total :percent :elapseds :etas',
        total : sentanceCount
    });
    topicBar = new ProgressBar({
        schema: '[:bar.yellow] :current/:total :percent',
        total : 10
    });
})

Topics.on('topics-start', function(event){
    topicCount = event.topics.length;
    var focus = event.topics.join(' ');
    if(focus.length > 40) focus = focus.substring(0, 37)+'...';
    topicBar.setSchema('[:bar.yellow] :current/:total :percent '+focus);
    topicBar.total = topicCount || 1;
    topicBar.current = 0;
    topicBar.completed = false;
});

Topics.on('topic-stop', function(event){
    topicBar.current++;
})

Topics.on('sentance-stop', function(event){
    sentanceBar.current = event.index;
})

var iv = setInterval(function(){
  if(sentanceBar) sentanceBar.tick(0);
  if(topicBar) topicBar.tick(0, {
      blah: 'something'
  });
}, 100);

Topics.on('stop', function(event){
    clearInterval(iv);
    sentanceBar.clear();
    topicBar.clear();
})

var omit = [
    'individual',
    'kmf3owlinstance',
    'objecttype',
    'nonabduciblecollection',
    'kbdependentcollection',
    'conventionalclassificationtype',
    'temporalstufftype',
    'analyst-pertinentconcept',
    'cycsubjectclump',
    'collection',
    'list',
    'existingobjecttype'
];

Topics.extract(fs.readFileSync(
    process.argv[2] || 'us_history.corpus'
), function(err, result){
    if(err) throw err;
    var keys = Object.keys(result);
    var min;
    var max;
    var avg;
    var sum = 0;
    keys.forEach(function(name){
        if(omit.indexOf(name.toLowerCase()) !== -1) return;
        var count = result[name];
        sum += count;
        if ((!min) || count < min) min = count;
        if ((!max) || count < min) min = count;
    });
    avg = Math.floor(sum/keys.length);
    var res = [];
    keys.forEach(function(name){
        if(omit.indexOf(name.toLowerCase()) !== -1) return;
        var count = result[name];
        if(count > avg){
            res.push({
                name : name,
                count : count
            });
        }
    });
    var output = res.sort(function(a, b){
        return a.count <= b.count;
    }).map(function(a){
        return a.name+'('+a.count+')';
    }).join(', ');
    console.log(output);
});
