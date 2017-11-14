(function(root, factory){
    if (typeof define === 'function' && define.amd){
        define([
            'cycada',
            'stopword',
            'strangler',
            'metaphone',
            'concepts-parser',
            'async-arrays',
            'extended-emitter'
        ], factory);
    }else if(typeof exports === 'object'){
        module.exports = factory(
            require('cycada'),
            require('stopword'),
            require('strangler'),
            require('metaphone'),
            require('concepts-parser'),
            require('async-arrays'),
            require('extended-emitter')
        );
    }else{
        //todo: shim things to work in a browser
        root.TopicExtraction = factory({});
    }
}(this, function(CycServer, stopwords, strings, metaphone, concepts, arrays, ExtendedEmitter){
    var cyc = new CycServer();
    var emitter = new ExtendedEmitter();
    var control = {
        extract : function(str, cb){
            var index = {};
            var cache = {};
            control.preprocessText(str, function(err, text, sentances, sentanceMeta){
                emitter.emit('start', {
                    sentances : sentances
                });
                arrays.forEachEmission(sentances, function(sentance, sentanceNumber, completeSentance){
                    var meta = sentanceMeta[sentanceNumber];
                    emitter.emit('sentance-start', {
                        words : sentance.split(' ').length,
                        body : sentance
                    });
                    var topics = meta.concepts.map(function(c){ return c.value; })
                    emitter.emit('topics-start', {
                        topics : topics,
                        body : sentance
                    });
                    arrays.forEachEmission(meta.concepts, function(concept, key, completeConcept){
                        /*console.log('    SCORING WORD ('+
                            (key+1)+'/'+meta.concepts.length+
                            ') from sentance ('+
                            (sentanceNumber+1)+'/'+sentances.length+')');*/
                        var handleResults = function(err, results){
                            emitter.emit('topic-start', {
                                name : concept.value
                            });
                            if(!err) cache[concept.value] = results;
                            results.matched.forEach(function(match){
                                match.relations.forEach(function(item){
                                    if(item.relation == 'isa'){
                                       item.concepts.forEach(function(concept){
                                           if(index[concept.name] === undefined) index[concept.name] = 0;
                                           index[concept.name]++;
                                       });
                                    }
                                    //todo: other relations
                                });
                            });
                            emitter.emit('topic-stop', {
                                name : concept.value
                            });
                            completeConcept();
                        };
                        if(cache[concept.value]) return handleResults(undefined, cache[concept.value]);
                        cyc.concepts(concept.value, handleResults);
                    }, function(){
                        emitter.emit('topics-stop', {
                        });
                        emitter.emit('sentance-stop', {
                            body : sentance,
                            index: sentanceNumber

                            //, indexAt : JSON.parse(JSON.stringify(index))
                        });
                        completeSentance();
                    });
                }, function(){
                    emitter.emit('stop', {
                        sentances : sentances
                    });
                    cb(undefined, index);
                })
            });

            /*
            cyc.find('<query>', function(err, results){
                results.
            });

            */
        },
        preprocessText : function(str, cb){
            var text = str.toString();
            var sentances = strings.splitHonoringQuotes(text, '.');
            var index = {};
            var sentanceMeta = [];
            var simpleSentances = sentances.map(function(sentance, position){
                var ideas = concepts.parse({text: sentance, lang: 'en', country: 'us'}).map(function(concept){
                    return concept['_fields'];
                });
                sentanceMeta[position] = {concepts : ideas};
                var words = strings.splitHonoringQuotes(sentance, ' ');
                var simple = stopwords.removeStopwords(words);
                words.forEach(function(word){
                    if(word.indexOf(' ') !== -1) return;
                    var meta = metaphone(word);
                    if(!index[meta]){
                        index[meta] = [];
                    }
                    if(index[meta].indexOf(word) === -1) index[meta].push(word);
                });
                return simple.join(' ');
            });
            //compute simplest replacement words for final sentances
            var replacements = {}
            Object.keys(index).forEach(function(meta){
                var values = index[meta];
                //console.log(values);
                var smallest = values.reduce(function(a, b){
                    return a.length < b.length?a:b;
                });
                replacements[meta] = smallest;
            });
            var finalSentances = simpleSentances.map(function(simple){
                var words = strings.splitHonoringQuotes(simple, ' ');
                words.forEach(function(word, index){
                    words[index] = replacements[metaphone(word)] || word;
                });
                return words.join(' ');
            });
            cb(undefined, finalSentances.join('. '), sentances, sentanceMeta);
            /*
            cyc.find('<query>', function(err, results){
                results.
            });

            */
        }
    }
    emitter.onto(control);
    return control;
}));
