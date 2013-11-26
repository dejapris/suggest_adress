(function($) {
  var defaultIndexName = 'france';
  var map;


  var streetNumberFilter = '\\d*(?:\\s(?:bis|ter|quarter|quinquies))?';
  var streetNumberSeparator = '\\s*(?:,|;)?\\s*';
  var leftStreetNumber = '(' + streetNumberFilter + ')' + streetNumberSeparator;
  var rightStreetNumber = streetNumberSeparator + '(' + streetNumberFilter + ')';

  var streetNumber = null;
  var streetTypeahead = $('#street').typeahead(
      {
        name : 'streets',
        remote : {
          url : 'http://localhost:9200/' + defaultIndexName + '/adresse/_search?source=',
          replace : function(url, uriEncodedQuery) {
            var uriTokenizer = new RegExp(leftStreetNumber + '(.*)' + rightStreetNumber, 'ig');
            uriDecodedQuery = decodeURIComponent(uriEncodedQuery);
            var matcher = uriTokenizer.exec(uriDecodedQuery);
            var jsonTokenizedURI = '{"firstStreetNumber": "' + matcher[1] + '", "streetName": "' + matcher[2] + '", "lastStreetNumber": "' + matcher[3] + '"}';
            var tokenizedURI = JSON.parse(jsonTokenizedURI);
            streetNumber = tokenizedURI.firstStreetNumber;

            var town = $("#town").val();
            var query;
            if (town) {
              query = {
                query : {
                  bool : {
                    must : [ {
                      match : {
                        'VOIE' : {
                          query : tokenizedURI.streetName,
                          operator : 'and'
                        }
                      }
                    }, {
                      text : {
                        'adresse.L_TOWNNAME' : town
                      }
                    } ]
                  }
                }
              };
            } else {
              query = {
                query : {
                  match : {
                    'VOIE' : {
                      query : tokenizedURI.streetName,
                      operator : 'and'
                    }
                  }
                }
              };
            }
            return url + JSON.stringify(query);
          },
          filter : function(parsedResponse) {
            var datums = [];
            var hitsArray = parsedResponse.hits.hits;
            for ( var i = 0; i < hitsArray.length; i++) {
              var hit = hitsArray[i];
              var datum = {
                value : (streetNumber + ' ' + hit._source.ST_NAME).trim(),
                tokens : hit._source.ST_NAME.split(' '),
                streetNumber : streetNumber,
                streetName : hit._source.ST_NAME,
                townName : hit._source.L_TOWNNAME,
                postalCode : hit._source.L_POSTCODE,
                score : hit._score,
                type : hit._type,
                rank : (i + 1) + '/' + hitsArray.length
              };
              datums.push(datum);
            }
            return datums;
          }
        },
        engine : Hogan,
        template : '<div class="proposal iconized {{type}}">' + '<p class="value">{{#streetNumber}}{{streetNumber}} {{/streetNumber}}{{streetName}}</p>'
            + '<p class="details">{{townName}}, {{postalCode}}</p>' + '<p class="score">Score&nbsp;: {{score}}, Rang : {{rank}}</p>' + '</div>',
        limit : 10,
        minLength : 2,
        allowDuplicates : true
      });

  var townTypeahead = $('#town').typeahead(
      {
        name : 'towns',
        remote : {
          url : 'http://localhost:9200/' + defaultIndexName + '/ville/_search?source=',
          replace : function(url, uriEncodedQuery) {
            var query = {
              query : {
                match : {
                  'TOWNNAME' : {
                    query : decodeURIComponent(uriEncodedQuery),
                    operator : 'and'
                  }
                }
              }
            };
            return url + JSON.stringify(query);
          },
          filter : function(parsedResponse) {
            var datums = [];
            var hitsArray = parsedResponse.hits.hits;
            for ( var i = 0; i < hitsArray.length; i++) {
              var hit = hitsArray[i];
              var datum = {
                value : hit._source.TOWNNAME,
                tokens : hit._source.TOWNNAME.split(' '),
                townName : hit._source.TOWNNAME,
                postalCode : hit._source.POSTCODE,
                score : hit._score,
                rank : (i + 1) + '/' + hitsArray.length
              };
              datums.push(datum);
            }
            return datums;
          }
        },
        engine : Hogan,
        template : '<div class="proposal iconized city">' + '<p class="value">{{townName}}</p>' + '<p class="details">{{townName}}, {{postalCode}}</p>'
            + '<p class="score">Score&nbsp;: {{score}}, Rang : {{rank}}</p>' + '</div>',
        limit : 10,
        minLength : 2
      });



})(jQuery);
