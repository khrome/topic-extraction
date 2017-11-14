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
        schema: '[:bar.yellow] :current/:total :percent :elapseds :etas',
        total : 10
    });
})

Topics.on('topics-start', function(event){
    topicCount = event.topics.length;
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

Topics.extract(fs.readFileSync(process.argv[2] || 'us_history.corpus'), function(err, result){
    console.log('COMPLETE', arguments);
});
